mod db;
mod graphql;
mod indexer;

use anyhow::Result;
use axum::{
    extract::State,
    http::Method,
    response::IntoResponse,
    routing::get,
    Router,
};
use std::sync::Arc;
use tower_http::cors::{CorsLayer, Any};

use crate::db::Database;
use crate::graphql::{create_schema, Schema};
use crate::indexer::Indexer;

#[tokio::main]
async fn main() -> Result<()> {
    dotenv::dotenv().ok();

    // Load environment variables
    let rpc_url = std::env::var("RPC_URL")
        .expect("RPC_URL environment variable must be set");
    let contract_address = std::env::var("CONTRACT_ADDRESS")
        .expect("CONTRACT_ADDRESS environment variable must be set");
    let db_path = std::env::var("DB_PATH").unwrap_or_else(|_| "indexer.db".to_string());
    let index_interval = std::env::var("INDEX_INTERVAL")
        .unwrap_or_else(|_| "10".to_string())
        .parse::<u64>()
        .unwrap_or(10);

    println!("Starting Starknet Indexer");
    println!("RPC URL: {}", rpc_url);
    println!("Contract Address: {}", contract_address);
    println!("Database: {}", db_path);

    // Initialize database
    let db = Arc::new(Database::new(&db_path)?);
    println!("Database initialized");

    // Initialize indexer
    let indexer = Indexer::new(&rpc_url, &contract_address, db.clone())?;
    
    // Fetch ABI on startup
    println!("Fetching contract ABI...");
    match indexer.fetch_contract_abi().await {
        Ok(abi) => {
            println!("Contract ABI fetched successfully");
            // You could store the ABI for event name resolution
            println!("ABI keys: {:?}", abi.as_object().map(|o| o.keys().collect::<Vec<_>>()));
        }
        Err(e) => {
            eprintln!("Warning: Failed to fetch ABI: {}", e);
        }
    }

    // Start indexing loop in background
    let indexer = Arc::new(indexer);
    let indexer_clone = indexer.clone();
    tokio::spawn(async move {
        println!("Starting indexing loop (interval: {}s)", index_interval);
        indexer_clone.start_indexing_loop(index_interval).await;
    });

    // Create GraphQL schema
    let schema = create_schema(db.clone());

    // Build Axum router
    let app = Router::new()
        .route("/graphql", get(graphql_playground).post(graphql_handler))
        .route("/health", get(health_check))
        .layer(
            CorsLayer::new()
                .allow_origin(Any)
                .allow_methods([Method::GET, Method::POST])
                .allow_headers(Any),
        )
        .with_state(schema);

    // Start server
    let port = std::env::var("PORT")
        .unwrap_or_else(|_| "8080".to_string())
        .parse::<u16>()
        .unwrap_or(8080);

    println!("GraphQL server starting on http://localhost:{}", port);
    println!("GraphQL Playground: http://localhost:{}/graphql", port);

    let listener = tokio::net::TcpListener::bind(format!("0.0.0.0:{}", port)).await?;
    axum::serve(listener, app).await?;

    Ok(())
}

async fn graphql_handler(
    State(schema): State<Schema>,
    req: async_graphql_axum::GraphQLRequest,
) -> async_graphql_axum::GraphQLResponse {
    schema.execute(req.into_inner()).await.into()
}

async fn graphql_playground() -> impl IntoResponse {
    axum::response::Html(
        async_graphql::http::playground_source(
            async_graphql::http::GraphQLPlaygroundConfig::new("/graphql"),
        ),
    )
}

async fn health_check() -> impl IntoResponse {
    "OK"
}
