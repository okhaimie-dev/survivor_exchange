use async_graphql::*;
use futures::Stream;
use std::sync::Arc;

use crate::db::{Database, Event};

// Normalize contract address to match database format (0x-prefixed, 64 hex chars, lowercase)
// Database stores addresses using format!("{:#064x}", ...) which produces: 0x followed by 64 hex chars
fn normalize_contract_address(addr: &str) -> String {
    let addr = addr.trim();
    let hex_part = if addr.starts_with("0x") || addr.starts_with("0X") {
        &addr[2..]
    } else {
        addr
    };
    // Ensure it's exactly 64 hex characters (32 bytes), pad with leading zeros if needed
    // Format as 0x followed by 64 hex chars (padded with zeros on the left)
    format!("0x{:0>64}", hex_part.to_lowercase())
}

pub struct QueryRoot;

#[Object]
impl QueryRoot {
    async fn events(
        &self,
        ctx: &Context<'_>,
        contract_address: Option<String>,
        limit: Option<i32>,
        offset: Option<i32>,
        event_name: Option<String>,
        event_selector: Option<String>, // Filter by first key (event selector) - works even if not decoded
        from_block: Option<u64>,
        to_block: Option<u64>,
    ) -> Result<Vec<EventObject>> {
        let db = ctx.data::<Arc<Database>>()?;
        
        // Normalize contract address format (ensure it matches database format)
        let normalized_addr = contract_address.as_ref().map(|addr| {
            normalize_contract_address(addr)
        });
        
        // If event_selector is provided, filter by first key instead of event_name
        let events = if let Some(selector) = event_selector {
            db.get_events_by_selector(
                normalized_addr.as_deref(),
                &selector,
                limit.map(|l| l as i64),
                offset.map(|o| o as i64),
                from_block,
                to_block,
            )?
        } else {
            db.get_events(
                normalized_addr.as_deref(),
                limit.map(|l| l as i64),
                offset.map(|o| o as i64),
                event_name.as_deref(),
                from_block,
                to_block,
            )?
        };

        Ok(events.into_iter().map(|e| e.into()).collect())
    }

    async fn event_count(
        &self,
        ctx: &Context<'_>,
        contract_address: Option<String>,
        event_name: Option<String>,
    ) -> Result<i64> {
        let db = ctx.data::<Arc<Database>>()?;
        
        // Normalize contract address format
        let normalized_addr = contract_address.as_ref().map(|addr| {
            normalize_contract_address(addr)
        });
        
        db.get_event_count(normalized_addr.as_deref(), event_name.as_deref())
            .map_err(|e| Error::new(e.to_string()))
    }

    /// Get all unique event selectors (first key) - useful to see what event types you have
    async fn event_selectors(
        &self,
        ctx: &Context<'_>,
        contract_address: Option<String>,
    ) -> Result<Vec<String>> {
        let db = ctx.data::<Arc<Database>>()?;
        let normalized_addr = contract_address.as_ref().map(|addr| {
            normalize_contract_address(addr)
        });
        db.get_event_selectors(normalized_addr.as_deref())
            .map_err(|e| Error::new(e.to_string()))
    }

    async fn event_by_id(&self, ctx: &Context<'_>, id: i64) -> Result<Option<EventObject>> {
        let db = ctx.data::<Arc<Database>>()?;
        let events = db.get_events(None, Some(1), Some(0), None, None, None)?;
        
        // Find event by id
        let event = events.into_iter().find(|e| e.id == id);
        Ok(event.map(|e| e.into()))
    }
}

pub struct SubscriptionRoot;

#[Subscription]
impl SubscriptionRoot {
    async fn events(
        &self,
        ctx: &Context<'_>,
        event_name: Option<String>,
    ) -> Result<impl Stream<Item = Result<EventObject>>> {
        use tokio::time::{interval, Duration};
        
        let db = ctx.data::<Arc<Database>>()?.clone();
        let event_name_clone = event_name.clone();
        
        let mut last_id = 0i64;
        let mut ticker = interval(Duration::from_secs(2));

        Ok(async_stream::stream! {
            loop {
                ticker.tick().await;
                
                match db.get_events(None, Some(100), Some(0), event_name_clone.as_deref(), None, None) {
                    Ok(events) => {
                        for event in events {
                            if event.id > last_id {
                                last_id = event.id;
                                yield Ok(event.into());
                            }
                        }
                    }
                    Err(e) => {
                        yield Err(Error::new(format!("Database error: {:?}", e)));
                    }
                }
            }
        })
    }

    async fn new_events(
        &self,
        ctx: &Context<'_>,
    ) -> Result<impl Stream<Item = Result<EventObject>>> {
        use tokio::time::{interval, Duration};
        
        let db = ctx.data::<Arc<Database>>()?.clone();
        let mut last_id = 0i64;
        let mut ticker = interval(Duration::from_secs(1));

        Ok(async_stream::stream! {
            loop {
                ticker.tick().await;
                
                match db.get_events(None, Some(10), Some(0), None, None, None) {
                    Ok(events) => {
                        for event in events {
                            if event.id > last_id {
                                last_id = event.id;
                                yield Ok(event.into());
                            }
                        }
                    }
                    Err(e) => {
                        yield Err(Error::new(format!("Database error: {:?}", e)));
                    }
                }
            }
        })
    }
}

#[derive(SimpleObject, Clone)]
pub struct EventObject {
    pub id: i64,
    pub block_number: u64,
    pub block_hash: String,
    pub transaction_hash: String,
    pub event_index: u64,
    pub from_address: Option<String>,
    pub keys: Vec<String>,
    pub data: Vec<String>,
    pub event_name: Option<String>,
    pub timestamp: i64,
}

impl From<Event> for EventObject {
    fn from(event: Event) -> Self {
        EventObject {
            id: event.id,
            block_number: event.block_number,
            block_hash: event.block_hash,
            transaction_hash: event.transaction_hash,
            event_index: event.event_index,
            from_address: event.from_address,
            keys: event.keys,
            data: event.data,
            event_name: event.event_name,
            timestamp: event.timestamp,
        }
    }
}

pub type Schema = async_graphql::Schema<QueryRoot, EmptyMutation, SubscriptionRoot>;

pub fn create_schema(db: Arc<Database>) -> Schema {
    Schema::build(QueryRoot, EmptyMutation, SubscriptionRoot)
        .data(db)
        .finish()
}

