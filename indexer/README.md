# Starknet Event Indexer

A Rust-based indexer for Starknet smart contract events with GraphQL API support.

## Features

- 🔍 Indexes events from a Starknet smart contract
- 📊 Stores events in SQLite database
- 🔄 Tracks last indexed block for efficient incremental indexing
- 🚀 GraphQL API with queries and subscriptions
- 📡 Real-time event subscriptions
- 🎯 Fetches contract ABI for type information

## Setup

1. **Install Rust** (if not already installed):
   ```bash
   curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh
   ```

2. **Configure environment variables**:
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Build the project**:
   ```bash
   cargo build --release
   ```

4. **Run the indexer**:
   ```bash
   cargo run --release
   ```

## Environment Variables

- `RPC_URL`: Starknet RPC endpoint URL
- `CONTRACT_ADDRESS`: Address of the contract to index (hex format)
- `DB_PATH`: Path to SQLite database file (default: `indexer.db`)
- `INDEX_INTERVAL`: Seconds between indexing runs (default: `10`)
- `PORT`: GraphQL server port (default: `8080`)

## GraphQL API

The indexer exposes a GraphQL API at `http://localhost:8080/graphql`.

### Queries

#### Get Events
```graphql
query {
  events(limit: 10, offset: 0, eventName: "Transfer", fromBlock: 0, toBlock: 1000) {
    id
    blockNumber
    blockHash
    transactionHash
    eventIndex
    fromAddress
    keys
    data
    eventName
    timestamp
  }
}
```

#### Get Event Count
```graphql
query {
  eventCount(eventName: "Transfer")
}
```

#### Get Event by ID
```graphql
query {
  eventById(id: 1) {
    id
    blockNumber
    transactionHash
    keys
    data
  }
}
```

### Subscriptions

#### Subscribe to New Events
```graphql
subscription {
  newEvents {
    id
    blockNumber
    transactionHash
    keys
    data
    eventName
  }
}
```

#### Subscribe to Events by Name
```graphql
subscription {
  events(eventName: "Transfer") {
    id
    blockNumber
    transactionHash
    keys
    data
  }
}
```

## GraphQL Playground

Access the GraphQL Playground at `http://localhost:8080/graphql` to interactively explore the API.

## Database Schema

The indexer uses SQLite with the following schema:

- **events**: Stores all indexed events
- **index_state**: Tracks the last indexed block per contract

## Architecture

- `db.rs`: Database operations and schema
- `indexer.rs`: Event fetching and indexing logic
- `graphql.rs`: GraphQL schema and resolvers
- `main.rs`: Application entry point and server setup

## Notes

- The indexer automatically resumes from the last indexed block
- Events are stored with full type information from the contract ABI
- The GraphQL API supports filtering, pagination, and real-time subscriptions

