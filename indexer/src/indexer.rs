use anyhow::{Context, Result};
use starknet_core::types::{BlockId, BlockTag, EmittedEvent, EventFilter, Felt};
use starknet_providers::jsonrpc::{HttpTransport, JsonRpcClient};
use starknet_providers::Provider;
use std::sync::Arc;

use crate::db::Database;

pub struct Indexer {
    rpc_client: Arc<JsonRpcClient<HttpTransport>>,
    contract_address: Felt,
    db: Arc<Database>,
}

impl Indexer {
    pub fn new(rpc_url: &str, contract_address: &str, db: Arc<Database>) -> Result<Self> {
        let url: url::Url = rpc_url.parse().context("Invalid RPC URL")?;
        let rpc_client = Arc::new(JsonRpcClient::new(HttpTransport::new(url)));
        
        let contract_address = if contract_address.starts_with("0x") {
            Felt::from_hex(contract_address)
        } else {
            Felt::from_hex(&format!("0x{}", contract_address))
        }
        .context("Invalid contract address")?;

        Ok(Indexer {
            rpc_client,
            contract_address,
            db,
        })
    }

    pub async fn fetch_contract_abi(&self) -> Result<serde_json::Value> {
        let block_id = BlockId::Tag(BlockTag::Latest);
        let class = self.rpc_client
            .get_class_at(block_id, self.contract_address)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to fetch contract ABI: {:?}", e))?;

        Ok(serde_json::to_value(class)?)
    }

    pub async fn get_latest_block(&self) -> Result<u64> {
        let block = self.rpc_client
            .block_number()
            .await
            .map_err(|e| anyhow::anyhow!("Failed to fetch latest block number: {:?}", e))?;

        Ok(block)
    }

    pub async fn find_contract_deployment_block(&self) -> Result<Option<u64>> {
        // Find the first block where the contract has events
        // We'll search in large chunks from the beginning
        let latest = self.get_latest_block().await?;
        
        println!("Searching for contract deployment block (first event)...");
        
        // Search in large chunks to find the first chunk with events
        let chunk_size = 100000u64; // Search 100k blocks at a time
        let mut current = 0u64;
        let mut found_chunk: Option<(u64, u64)> = None;
        
        // First pass: find which chunk contains the first event
        while current <= latest {
            let end = (current + chunk_size - 1).min(latest);
            
            match self.fetch_events_in_range(current, end).await {
                Ok(events) => {
                    if !events.is_empty() {
                        // Found events in this chunk!
                        found_chunk = Some((current, end));
                        println!("Found events in block range {} to {}", current, end);
                        break;
                    }
                }
                Err(e) => {
                    // Log error but continue searching
                    eprintln!("Error searching blocks {} to {}: {}", current, end, e);
                }
            }
            
            current = end + 1;
            
            // Progress indicator
            if current % 500000 == 0 {
                println!("Searched up to block {}...", current);
            }
        }
        
        // Second pass: narrow down to find the exact first event block
        if let Some((chunk_start, chunk_end)) = found_chunk {
            println!("Narrowing down to find exact deployment block...");
            
            // Search backwards in smaller chunks within the found range
            let narrow_start = chunk_start;
            let mut narrow_end = chunk_end;
            let mut earliest_block: Option<u64> = None;
            
            // Search in 10k block chunks within the found range
            let narrow_chunk = 10000u64;
            let mut search_from = narrow_start;
            
            while search_from <= narrow_end {
                let search_to = (search_from + narrow_chunk - 1).min(narrow_end);
                
                match self.fetch_events_in_range(search_from, search_to).await {
                    Ok(events) => {
                        if !events.is_empty() {
                            // Find the earliest block number in these events
                            let min_block = events.iter()
                                .filter_map(|e| e.block_number)
                                .min();
                            
                            if let Some(block) = min_block {
                                earliest_block = Some(block.min(earliest_block.unwrap_or(block)));
                                // Continue searching earlier to find the absolute first
                                if search_from > 0 {
                                    narrow_end = search_from - 1;
                                    search_from = narrow_start.max(narrow_end.saturating_sub(narrow_chunk));
                                } else {
                                    break;
                                }
                            } else {
                                search_from = search_to + 1;
                            }
                        } else {
                            search_from = search_to + 1;
                        }
                    }
                    Err(_) => {
                        search_from = search_to + 1;
                    }
                }
            }
            
            if let Some(block) = earliest_block {
                println!("Found contract deployment block: {}", block);
                return Ok(Some(block));
            }
        }
        
        Ok(None)
    }

    pub async fn index_events(&self) -> Result<u64> {
        let contract_addr_str = format!("{:#064x}", self.contract_address);
        
        // Get last indexed block
        let start_block = self.db
            .get_last_block(&contract_addr_str)?
            .map(|b| b + 1);

        // Get latest block
        let latest_block = self.get_latest_block().await?;

        // If we haven't indexed before, find the contract deployment block
        let start_block = if let Some(block) = start_block {
            block
        } else {
            // Find when the contract was first deployed
            match self.find_contract_deployment_block().await {
                Ok(Some(deployment_block)) => {
                    println!("Starting from contract deployment block: {}", deployment_block);
                    deployment_block
                }
                Ok(None) => {
                    println!("Could not find deployment block, starting from block 0");
                    0
                }
                Err(e) => {
                    eprintln!("Error finding deployment block: {}, starting from block 0", e);
                    0
                }
            }
        };

        if start_block > latest_block {
            return Ok(0);
        }

        println!("Checking for events from contract {} (blocks {} to {})", 
                 contract_addr_str, start_block, latest_block);

        // Fetch events in larger chunks to avoid RPC limits and reduce scanning
        let chunk_size = 10000u64; // Larger chunks since we're filtering by address
        let mut indexed_count = 0u64;
        let mut current_block = start_block;
        let mut blocks_with_events = 0u64;

        while current_block <= latest_block {
            let end_block = std::cmp::min(current_block + chunk_size - 1, latest_block);
            
            match self.fetch_events_in_range(current_block, end_block).await {
                Ok(events) => {
                    let event_count = events.len();
                    if event_count > 0 {
                        let mut events_in_chunk = 0u64;
                        // Process and store events, verifying they're from our contract
                        for event in events {
                            // Double-check the event is from our contract
                            if event.from_address == self.contract_address {
                                self.process_event(&event).await?;
                                indexed_count += 1;
                                events_in_chunk += 1;
                            } else {
                                eprintln!("Warning: Skipping event from different contract: {}", 
                                         format!("{:#064x}", event.from_address));
                            }
                        }
                        
                        if events_in_chunk > 0 {
                            println!("Found {} events from contract {} in blocks {} to {}", 
                                    events_in_chunk, contract_addr_str, current_block, end_block);
                            blocks_with_events += 1;
                        }
                    }
                    // Always update last indexed block to avoid re-scanning
                    self.db.update_last_block(&contract_addr_str, end_block)?;
                }
                Err(e) => {
                    eprintln!("Error fetching events for blocks {} to {}: {}", 
                              current_block, end_block, e);
                    // Don't update the block on error, will retry next time
                    break;
                }
            }
            
            current_block = end_block + 1;
        }

        if indexed_count > 0 {
            println!("Total: {} events indexed from {} block ranges", indexed_count, blocks_with_events);
            
            // Debug: Verify events were stored
            let stored_count = self.db.get_event_count(Some(&contract_addr_str), None)?;
            println!("Verified: {} events stored in database for contract {}", stored_count, contract_addr_str);
        } else {
            println!("No new events found from contract {}", contract_addr_str);
            
            // Debug: Check what's in the database
            let total_count = self.db.get_total_event_count()?;
            let contract_count = self.db.get_event_count(Some(&contract_addr_str), None)?;
            let addresses = self.db.get_contract_addresses().unwrap_or_default();
            println!("Debug: Total events in DB: {}, Events for this contract: {}, Contract addresses in DB: {:?}", 
                    total_count, contract_count, addresses);
        }

        Ok(indexed_count)
    }

    async fn fetch_events_in_range(&self, from_block: u64, to_block: u64) -> Result<Vec<EmittedEvent>> {
        // Only fetch events from the specific contract address
        let filter = EventFilter {
            from_block: Some(BlockId::Number(from_block)),
            to_block: Some(BlockId::Number(to_block)),
            address: Some(self.contract_address), // This filters to only our contract
            keys: None,
        };

        let result = self.rpc_client
            .get_events(filter, None, 1000u64)
            .await
            .map_err(|e| anyhow::anyhow!("Failed to fetch events for contract {}: {:?}", 
                                         format!("{:#064x}", self.contract_address), e))?;

        Ok(result.events)
    }

    async fn process_event(&self, event: &EmittedEvent) -> Result<()> {
        // Verify this event is from our contract (should already be filtered, but double-check)
        if event.from_address != self.contract_address {
            return Err(anyhow::anyhow!(
                "Event from wrong contract: expected {}, got {}", 
                format!("{:#064x}", self.contract_address),
                format!("{:#064x}", event.from_address)
            ));
        }

        // Try to identify event name from keys (this is a simplified approach)
        // In a real implementation, you'd parse the ABI to match event signatures
        let event_name = self.identify_event_name(&event.keys).await?;

        // Convert keys and data to strings
        let keys: Vec<String> = event.keys.iter().map(|k| format!("{:#064x}", k)).collect();
        let data: Vec<String> = event.data.iter().map(|d| format!("{:#064x}", d)).collect();

        // Get index from event - it might be in a different field
        let event_index = 0u64; // Default if not available
        let block_number = event.block_number.unwrap_or(0);
        let block_hash_str = event.block_hash.map(|h| format!("{:#064x}", h)).unwrap_or_default();
        let tx_hash_str = format!("{:#064x}", event.transaction_hash);
        let from_addr_str = Some(format!("{:#064x}", event.from_address));

        let contract_addr_str = format!("{:#064x}", self.contract_address);
        self.db.insert_event(
            &contract_addr_str,
            block_number,
            &block_hash_str,
            &tx_hash_str,
            event_index,
            from_addr_str,
            &keys,
            &data,
            event_name.as_deref(),
        )?;

        Ok(())
    }

    async fn identify_event_name(&self, keys: &[Felt]) -> Result<Option<String>> {
        // This is a simplified event identification
        // In practice, you'd parse the ABI and match against event selectors
        // For now, we'll use the first key as a potential selector
        if keys.is_empty() {
            return Ok(None);
        }

        // Try to fetch ABI and match event selectors
        // For now, return None and let the user query by keys
        Ok(None)
    }

    pub async fn start_indexing_loop(&self, interval_seconds: u64) {
        loop {
            match self.index_events().await {
                Ok(count) => {
                    if count > 0 {
                        println!("Indexed {} new events", count);
                    }
                }
                Err(e) => {
                    eprintln!("Error indexing events: {}", e);
                }
            }

            tokio::time::sleep(tokio::time::Duration::from_secs(interval_seconds)).await;
        }
    }
}
