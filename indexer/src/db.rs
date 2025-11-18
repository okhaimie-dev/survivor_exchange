use anyhow::Result;
use rusqlite::{Connection, params};
use std::sync::{Arc, Mutex};

pub struct Database {
    conn: Arc<Mutex<Connection>>,
}

impl Database {
    pub fn new(db_path: &str) -> Result<Self> {
        let conn = Connection::open(db_path)?;
        let db = Database {
            conn: Arc::new(Mutex::new(conn)),
        };
        db.init_schema()?;
        Ok(db)
    }

    fn init_schema(&self) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        
        // Table for storing indexed events
        conn.execute(
            "CREATE TABLE IF NOT EXISTS events (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                contract_address TEXT NOT NULL,
                block_number INTEGER NOT NULL,
                block_hash TEXT NOT NULL,
                transaction_hash TEXT NOT NULL,
                event_index INTEGER NOT NULL,
                from_address TEXT,
                keys TEXT NOT NULL,
                data TEXT NOT NULL,
                event_name TEXT,
                timestamp INTEGER NOT NULL,
                UNIQUE(block_number, transaction_hash, event_index)
            )",
            [],
        )?;

        // Migrate existing tables to add contract_address column if it doesn't exist
        let _ = conn.execute(
            "ALTER TABLE events ADD COLUMN contract_address TEXT",
            [],
        );

        // Update existing events to use from_address as contract_address if contract_address is NULL
        let _ = conn.execute(
            "UPDATE events SET contract_address = from_address WHERE contract_address IS NULL",
            [],
        );

        // Table for tracking last indexed block
        conn.execute(
            "CREATE TABLE IF NOT EXISTS index_state (
                id INTEGER PRIMARY KEY,
                contract_address TEXT NOT NULL UNIQUE,
                last_block_number INTEGER NOT NULL,
                last_updated INTEGER NOT NULL
            )",
            [],
        )?;

        // Indexes for faster queries
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_events_block ON events(block_number)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_events_name ON events(event_name)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_events_timestamp ON events(timestamp)",
            [],
        )?;
        conn.execute(
            "CREATE INDEX IF NOT EXISTS idx_events_contract ON events(contract_address)",
            [],
        )?;

        Ok(())
    }

    pub fn get_last_block(&self, contract_address: &str) -> Result<Option<u64>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT last_block_number FROM index_state WHERE contract_address = ?1"
        )?;
        
        let result = stmt.query_row(params![contract_address], |row| {
            Ok(row.get::<_, i64>(0)? as u64)
        });

        match result {
            Ok(block) => Ok(Some(block)),
            Err(rusqlite::Error::QueryReturnedNoRows) => Ok(None),
            Err(e) => Err(anyhow::anyhow!("Database error: {}", e)),
        }
    }

    pub fn update_last_block(&self, contract_address: &str, block_number: u64) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let timestamp = chrono::Utc::now().timestamp();
        
        conn.execute(
            "INSERT INTO index_state (contract_address, last_block_number, last_updated)
             VALUES (?1, ?2, ?3)
             ON CONFLICT(contract_address) DO UPDATE SET
             last_block_number = ?2, last_updated = ?3",
            params![contract_address, block_number as i64, timestamp],
        )?;

        Ok(())
    }

    pub fn insert_event(
        &self,
        contract_address: &str,
        block_number: u64,
        block_hash: &str,
        transaction_hash: &str,
        event_index: u64,
        from_address: Option<String>,
        keys: &[String],
        data: &[String],
        event_name: Option<&str>,
    ) -> Result<()> {
        let conn = self.conn.lock().unwrap();
        let timestamp = chrono::Utc::now().timestamp();
        let keys_json = serde_json::to_string(keys)?;
        let data_json = serde_json::to_string(data)?;

        conn.execute(
            "INSERT OR IGNORE INTO events 
             (contract_address, block_number, block_hash, transaction_hash, event_index, from_address, keys, data, event_name, timestamp)
             VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10)",
            params![
                contract_address,
                block_number as i64,
                block_hash,
                transaction_hash,
                event_index as i64,
                from_address.as_deref(),
                keys_json,
                data_json,
                event_name,
                timestamp
            ],
        )?;

        Ok(())
    }

    pub fn get_events(
        &self,
        contract_address: Option<&str>,
        limit: Option<i64>,
        offset: Option<i64>,
        event_name: Option<&str>,
        from_block: Option<u64>,
        to_block: Option<u64>,
    ) -> Result<Vec<Event>> {
        let conn = self.conn.lock().unwrap();
        let mut query = "SELECT id, block_number, block_hash, transaction_hash, event_index, from_address, keys, data, event_name, timestamp FROM events WHERE 1=1".to_string();
        let mut params_vec: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

        if let Some(addr) = contract_address {
            query.push_str(" AND contract_address = ?");
            params_vec.push(Box::new(addr));
        }

        if let Some(name) = event_name {
            query.push_str(" AND event_name = ?");
            params_vec.push(Box::new(name));
        }

        if let Some(from) = from_block {
            query.push_str(" AND block_number >= ?");
            params_vec.push(Box::new(from as i64));
        }

        if let Some(to) = to_block {
            query.push_str(" AND block_number <= ?");
            params_vec.push(Box::new(to as i64));
        }

        query.push_str(" ORDER BY block_number DESC, event_index DESC");

        if let Some(lim) = limit {
            query.push_str(" LIMIT ?");
            params_vec.push(Box::new(lim));
        }

        if let Some(off) = offset {
            query.push_str(" OFFSET ?");
            params_vec.push(Box::new(off));
        }

        let mut stmt = conn.prepare(&query)?;
        let event_iter = stmt.query_map(
            rusqlite::params_from_iter(params_vec.iter().map(|p| p.as_ref())),
            |row| {
                Ok(Event {
                    id: row.get(0)?,
                    block_number: row.get::<_, i64>(1)? as u64,
                    block_hash: row.get(2)?,
                    transaction_hash: row.get(3)?,
                    event_index: row.get::<_, i64>(4)? as u64,
                    from_address: row.get(5)?,
                    keys: serde_json::from_str(&row.get::<_, String>(6)?).unwrap_or_default(),
                    data: serde_json::from_str(&row.get::<_, String>(7)?).unwrap_or_default(),
                    event_name: row.get(8)?,
                    timestamp: row.get(9)?,
                })
            },
        )?;

        let mut events = Vec::new();
        for event in event_iter {
            events.push(event?);
        }

        Ok(events)
    }

    pub fn get_event_count(&self, contract_address: Option<&str>, event_name: Option<&str>) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        let mut query = "SELECT COUNT(*) FROM events WHERE 1=1".to_string();
        let mut params_vec: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

        if let Some(addr) = contract_address {
            query.push_str(" AND contract_address = ?");
            params_vec.push(Box::new(addr));
        }

        if let Some(name) = event_name {
            query.push_str(" AND event_name = ?");
            params_vec.push(Box::new(name));
        }

        let mut stmt = conn.prepare(&query)?;
        let count = stmt.query_row(
            rusqlite::params_from_iter(params_vec.iter().map(|p| p.as_ref())),
            |row| row.get(0)
        )?;

        Ok(count)
    }

    // Debug function to check what contract addresses are in the database
    pub fn get_contract_addresses(&self) -> Result<Vec<String>> {
        let conn = self.conn.lock().unwrap();
        let mut stmt = conn.prepare(
            "SELECT DISTINCT contract_address FROM events ORDER BY contract_address"
        )?;
        
        let addresses = stmt.query_map([], |row| {
            Ok(row.get::<_, String>(0)?)
        })?;

        let mut result = Vec::new();
        for addr in addresses {
            result.push(addr?);
        }
        Ok(result)
    }

    // Debug function to get total event count
    pub fn get_total_event_count(&self) -> Result<i64> {
        let conn = self.conn.lock().unwrap();
        let count = conn.query_row(
            "SELECT COUNT(*) FROM events",
            [],
            |row| row.get(0)
        )?;
        Ok(count)
    }

    /// Get events by event selector (first key in the keys array)
    pub fn get_events_by_selector(
        &self,
        contract_address: Option<&str>,
        selector: &str,
        limit: Option<i64>,
        offset: Option<i64>,
        from_block: Option<u64>,
        to_block: Option<u64>,
    ) -> Result<Vec<Event>> {
        let conn = self.conn.lock().unwrap();
        let mut query = "SELECT id, block_number, block_hash, transaction_hash, event_index, from_address, keys, data, event_name, timestamp FROM events WHERE json_extract(keys, '$[0]') = ?".to_string();
        let mut params_vec: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();
        
        // Normalize selector format - ensure it's 0x-prefixed and 64 hex chars
        let normalized_selector = {
            let hex_part = if selector.starts_with("0x") || selector.starts_with("0X") {
                &selector[2..]
            } else {
                selector
            };
            format!("0x{:0>64}", hex_part.to_lowercase())
        };
        params_vec.push(Box::new(normalized_selector.clone()));

        if let Some(addr) = contract_address {
            query.push_str(" AND contract_address = ?");
            params_vec.push(Box::new(addr));
        }

        if let Some(from) = from_block {
            query.push_str(" AND block_number >= ?");
            params_vec.push(Box::new(from as i64));
        }

        if let Some(to) = to_block {
            query.push_str(" AND block_number <= ?");
            params_vec.push(Box::new(to as i64));
        }

        query.push_str(" ORDER BY block_number DESC, event_index DESC");

        if let Some(lim) = limit {
            query.push_str(" LIMIT ?");
            params_vec.push(Box::new(lim));
        }

        if let Some(off) = offset {
            query.push_str(" OFFSET ?");
            params_vec.push(Box::new(off));
        }

        let mut stmt = conn.prepare(&query)?;
        let event_iter = stmt.query_map(
            rusqlite::params_from_iter(params_vec.iter().map(|p| p.as_ref())),
            |row| {
                Ok(Event {
                    id: row.get(0)?,
                    block_number: row.get::<_, i64>(1)? as u64,
                    block_hash: row.get(2)?,
                    transaction_hash: row.get(3)?,
                    event_index: row.get::<_, i64>(4)? as u64,
                    from_address: row.get(5)?,
                    keys: serde_json::from_str(&row.get::<_, String>(6)?).unwrap_or_default(),
                    data: serde_json::from_str(&row.get::<_, String>(7)?).unwrap_or_default(),
                    event_name: row.get(8)?,
                    timestamp: row.get(9)?,
                })
            },
        )?;

        let mut events = Vec::new();
        for event in event_iter {
            events.push(event?);
        }

        Ok(events)
    }

    /// Get all unique event selectors (first key) - useful when events aren't decoded
    pub fn get_event_selectors(&self, contract_address: Option<&str>) -> Result<Vec<String>> {
        let conn = self.conn.lock().unwrap();
        let mut query = "SELECT DISTINCT json_extract(keys, '$[0]') as selector FROM events WHERE json_array_length(keys) > 0".to_string();
        let mut params_vec: Vec<Box<dyn rusqlite::types::ToSql>> = Vec::new();

        if let Some(addr) = contract_address {
            query.push_str(" AND contract_address = ?");
            params_vec.push(Box::new(addr));
        }

        query.push_str(" ORDER BY selector");

        let mut stmt = conn.prepare(&query)?;
        let selector_iter = stmt.query_map(
            rusqlite::params_from_iter(params_vec.iter().map(|p| p.as_ref())),
            |row| {
                let selector: Option<String> = row.get(0)?;
                Ok(selector.unwrap_or_default())
            },
        )?;

        let mut selectors = Vec::new();
        for selector in selector_iter {
            let sel = selector?;
            if !sel.is_empty() {
                selectors.push(sel);
            }
        }

        Ok(selectors)
    }
}

#[derive(Clone, Debug)]
pub struct Event {
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

