# Contributing to Survivor Exchange

Thank you for your interest in contributing to Survivor Exchange! This document provides guidelines and instructions for contributing.

## Table of Contents

- [Code of Conduct](#code-of-conduct)
- [Getting Started](#getting-started)
- [Development Setup](#development-setup)
- [Making Changes](#making-changes)
- [Pull Request Process](#pull-request-process)
- [Coding Standards](#coding-standards)
- [Testing](#testing)

## Code of Conduct

This project adheres to the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md). By participating, you are expected to uphold this code.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Set up the development environment (see below)
4. Create a branch for your changes

## Development Setup

### Prerequisites

- Rust (latest stable)
- [Scarb 2.13.1](https://docs.scarb.rs/)
- [Dojo 1.8.0](https://book.dojoengine.org/getting-started)
- Node.js 18+ (for frontend)
- Docker (optional, for local dev environment)

### Smart Contracts (Cairo/Dojo)

```bash
# Install Dojo toolchain
curl -L https://install.dojoengine.org | bash
dojoup

# Build contracts
sozo build

# Run tests
sozo test
```

### Frontend (Next.js)

```bash
cd client
npm install
npm run dev
```

### Full Stack (Docker)

```bash
docker compose up
```

This starts Katana (local Starknet), Torii (indexer), and migrates the world.

## Making Changes

### Branch Naming

Use descriptive branch names:
- `feature/add-auction-filters`
- `fix/bid-withdrawal-bug`
- `docs/update-readme`

### Commit Messages

Write clear, concise commit messages:
- Use present tense ("Add feature" not "Added feature")
- Use imperative mood ("Fix bug" not "Fixes bug")
- Reference issues when applicable ("Fix #123")

## Pull Request Process

1. **Update your branch** with the latest `main`:
   ```bash
   git fetch origin
   git rebase origin/main
   ```

2. **Run all checks locally**:
   ```bash
   sozo build
   sozo test
   cd client && npm run lint
   ```

3. **Create the PR** with:
   - Clear title describing the change
   - Description of what and why
   - Link to any related issues
   - Screenshots for UI changes

4. **Address review feedback** promptly

5. **Squash commits** if requested before merge

## Coding Standards

### Cairo (Smart Contracts)

- **Indentation**: 4 spaces
- **Naming**:
  - Functions: `snake_case`
  - Structs/Enums: `PascalCase`
  - Constants: `UPPER_SNAKE_CASE`
- **Imports**: Use absolute paths
  ```cairo
  use survivor_exchange::models::auction::Auction;
  ```
- **Error handling**: Use constants from `constants::Errors`
  ```cairo
  assert(condition, Errors::AUCTION_NOT_ACTIVE);
  ```
- **Storage access**: Always use `StoreTrait`, not raw world calls
  ```cairo
  let store = StoreTrait::new(world);
  let auction = store.auction(auction_id);
  ```

### TypeScript (Frontend)

- Follow existing patterns in the codebase
- Use TypeScript strict mode
- Use constants from `lib/constants.ts`
- Run `npm run lint` before committing

## Testing

### Smart Contract Tests

All contract changes must include tests:

```bash
# Run all tests
sozo test

# Run specific test
snforge test --match test_name
```

Test files are in `src/tests/`. See existing tests for patterns.

### Frontend

```bash
cd client
npm run lint
npm run build  # Catches type errors
```

## Questions?

- Open a [GitHub Discussion](../../discussions) for general questions
- Join the [Dojo Discord](https://discord.gg/dojoengine) for ecosystem help
- Tag `@sudo_okhai` for project-specific questions

Thank you for contributing!
