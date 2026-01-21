# AGENTS.md - Guidelines for Agentic Coding in Survivor Exchange

## Build, Lint, and Test Commands

- **Build**: `sozo build` (compiles contracts and generates artifacts; uses dev profile by default).
- **Lint/Check**: `sozo build` (implicitly checks syntax and types via Scarb); no separate linter, but run `scarb check` for quick validation.
- **Test All**: `sozo test` (runs all Cairo tests via snforge; equivalent to `snforge test`).
- **Single Test**: `snforge test --match test_create_auction` (filter by test name; use `--exact` for precise match; run in src/tests/).
- **Clean**: `sozo clean` (removes build artifacts).

## Code Style Guidelines

- **Imports**: Use `pub mod` in lib.cairo for hierarchical organization (e.g., `pub mod systems { pub mod auction; }`); targeted `use` statements with absolute paths (e.g., `use survivor_exchange::models::auction::Auction;`) or `super::` for locals.
- **Formatting**: 4-space indentation; lines <100 chars (break long signatures); no trailing whitespace; use consistent spacing around operators.
- **Types**: Primitives: `u32` (IDs), `u64` (prices/durations), `felt252` (strings/errors), `ContractAddress`, `Span<T>`, `Option<T>`, `ByteArray`; annotate all params/returns.
- **Naming**: snake_case for functions/variables (e.g., `create_auction`, `auction_id`); PascalCase for structs/traits (e.g., `Auction`, `IAuctionMarketplace`); UPPER_SNAKE_CASE for constants (e.g., `AUCTION_NOT_ACTIVE`).
- **Error Handling**: Define custom errors as `felt252` consts in `constants::Errors` (e.g., `'Auction not active'`); use `assert(condition, error)` or `panic` in systems; validate inputs early (e.g., status checks).
- **Dojo Patterns**: Use `#[dojo::contract]` for systems; components via `component!(path: ..., storage: ...)`; delegate to traits/impls; access world via `StoreTrait`.
- **Comments**: Doc comments (`///`) for public traits/functions; minimal inline comments; no TODOs in production code.
- **General**: Follow Dojo 1.8.0 conventions; mimic existing patterns in src/systems/; ensure gas efficiency with bounded loops; no external libs beyond dependencies (Dojo, OpenZeppelin, Starknet).

## Browser Automation

Use `agent-browser` for web automation. Run `agent-browser --help` for all commands.

Core workflow:
1. `agent-browser open <url>` - Navigate to page
2. `agent-browser snapshot -i` - Get interactive elements with refs (@e1, @e2)
3. `agent-browser click @e1` / `fill @e2 "text"` - Interact using refs
4. Re-snapshot after page changes

*Last updated: Analyze codebase for Cairo/Dojo standards.*
