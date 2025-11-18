use anyhow::Result;
use starknet_core::types::Felt;
use sha3::{Keccak256, Digest};

/// Calculate event selector from event name
/// In Starknet, event selector is the low 250 bits of the Keccak-256 hash of the event name
pub fn calculate_event_selector(event_name: &str) -> Result<Felt> {
    let mut hasher = Keccak256::new();
    hasher.update(event_name.as_bytes());
    let hash = hasher.finalize();
    
    // Convert to Felt (250 bits, so we mask the top 6 bits)
    // Take all 32 bytes but mask the top 6 bits to ensure it fits in 250 bits
    let mut felt_bytes = [0u8; 32];
    felt_bytes.copy_from_slice(&hash);
    // Mask top 6 bits: clear bits 250-255 (top 6 bits of the 32-byte value)
    // This is done by masking the first byte to keep only bottom 2 bits
    felt_bytes[0] &= 0x03; // Keep only bottom 2 bits (bits 248-249), clear bits 250-255
    
    Ok(Felt::from_bytes_be(&felt_bytes))
}

/// Format selector as hex string (0x-prefixed, no leading zeros)
pub fn format_selector(selector: &Felt) -> String {
    format!("{:#x}", selector)
}

/// Format selector to match database format (0x-prefixed, 64 hex chars, lowercase)
/// Database stores using format!("{:#064x}", ...) which pads the hex part to 64 chars
pub fn format_selector_for_db(selector: &Felt) -> String {
    format!("{:#064x}", selector)
}

