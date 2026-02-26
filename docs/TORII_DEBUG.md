# Torii Debug Guide

How Torii is used in the app, what is called, and how to test adventurer data.

## Overview

The app uses **two Torii interfaces**:

1. **Torii GraphQL** – Apollo Client; marketplace (auctions) and beasts/adventurer token metadata.
2. **Torii SQL** – Raw HTTP GET `?query=...`; adventurer balances and `token_attributes` only (via API routes).

Adventurer **stats** (Health, Level, Game Over, etc.) are also fetched **on-chain** via RPC `get_adventurer` and override Torii when present.

---

## Loot Survivor world (Torii pg-mainnet-10)

The **pg-mainnet-10** Torii instance indexes multiple Dojo worlds/namespaces. The **Loot Survivor** game world is exposed under the **`ls_0_0_8`** and **`ls_0_0_9`** namespaces (two versions; the app uses **ls_0_0_9**).

### Namespaces

- **ls_0_0_8** – Loot Survivor (older version).
- **ls_0_0_9** – Loot Survivor (current; `LOOT_SURVIVOR_NAMESPACE` in `client/app/lib/constants.ts`).

Entity ids in responses use a world prefix (e.g. `0x02ef591697f0fd9adc0ba9dbe0ca04dabad80cf95f08ba02e435d9cb6698a28a:...`); the part after the colon is the entity key hash for that model.

### ls009 GraphQL query roots (models)

| Query root | Purpose |
|------------|---------|
| `ls009AdventurerPackedModels` | Adventurer state by token id (`adventurer_id`); packed level/XP/HP/stats. |
| `ls009AdventurerEntropyModels` | Entropy (e.g. randomness) per adventurer. |
| `ls009AdventurerKilledModels` | Kill/death records. |
| `ls009GameSettingsModels` | Per-session game state: **`in_battle`**, bag, seeds, etc. Keyed by `settings_id`. |
| `ls009GameSettingsMetadataModels` | Metadata for settings (name, description, `created_by`, `created_at`). |
| `ls009SettingsCounterModels` | Counter by id (`id`, `count`). |
| `ls009BagPackedModels` | Packed bag state. |
| `ls009CollectableCountModels`, `ls009CollectableEntityModels` | Collectables. |
| `ls009DroppedItemModels` | Dropped items. |
| `ls009EntityStatsModels` | Entity stats. |
| `ls009GameEventModels` | Game events (attack, discovery, level up, etc.). **Has `adventurer_id`** (u64) per event. |
| `ls009ScoreObjectiveModels`, `ls009ScoreObjectiveCountModels` | Score/objectives. |

Other namespaces on the same Torii: **summit*** (leaderboard, beasts, rewards), **dsV120** / **dsV121** (another game with GameSettings/Battle), **budokan***, **relayer***.

### Core Loot Survivor types (ls_0_0_9, introspected)

- **`ls_0_0_9_AdventurerPacked`** – `adventurer_id` (u64 = token id), `packed`, `entity`, `eventMessage`.
- **`ls_0_0_9_GameSettings`** – `settings_id` (u32), `vrf_address`, `adventurer` (nested ls_0_0_9_Adventurer), `bag`, `game_seed`, `game_seed_until_xp`, **`in_battle`** (bool), `stats_mode`, `base_damage_reduction`, `market_size`, `entity`, `eventMessage`.
- **`ls_0_0_9_Adventurer`** – Nested under GameSettings; `health`, `xp`, `gold`, `beast_health`, `stat_upgrades_available`, `stats`, `equipment`, `item_specials_seed`, `action_count`. No `entity`, no `id`, no `adventurer_id`.
- **`ls_0_0_9_GameSettingsMetadata`** – `settings_id`, `name`, `description`, `created_by`, `created_at`, `entity`, `eventMessage`. No adventurer token id.
- **`ls_0_0_9_SettingsCounter`** – `id` (felt252), `count` (u32), `entity`, `eventMessage`. No adventurer token id.

### ls009GameEventModels / ls_0_0_9_GameEvent (checked)

**`ls_0_0_9_GameEvent`** – Event log per game action. Fields:

- **`adventurer_id`** (u64) – Adventurer token id for this event.
- `action_count` (u16).
- `details` (ls_0_0_9_GameEventDetails) – Event payload (attack, ambush, discovery, level_up, defeated_beast, fled_beast, etc.).
- `entity`, `eventMessage`.

**`ls_0_0_9_GameEventDetails`** – Nested event payload; one of: `adventurer`, `bag`, `beast`, `discovery`, `obstacle`, `defeated_beast`, `fled_beast`, `stat_upgrade`, `buy_items`, `equip`, `drop`, `level_up`, `market_items`, `ambush`, `attack`, `beast_attack`, `flee`, `option`.

So: **GameEvent has `adventurer_id`** – it links events to adventurer token id. Sample query returns rows like `{ adventurer_id: "0x2a89d", action_count: 197 }`. GameEvent does **not** have `in_battle`; battle status would require either correlating with GameSettings (no shared key) or inferring from event stream (e.g. latest event type per adventurer_id).

### GameSettings: what it shows and how it is queried

**Query root:** `ls009GameSettingsModels`. Each row is one “game session” state, keyed by `settings_id`. Battle status is the **`in_battle`** (bool) field.

**Typical query (all settings, with battle status and nested adventurer):**

```graphql
query {
  ls009GameSettingsModels(limit: 3000) {
    edges {
      node {
        settings_id
        in_battle
        entity { id }
        game_seed
        game_seed_until_xp
        stats_mode
        base_damage_reduction
        market_size
        adventurer { health xp gold action_count }
      }
    }
  }
}
```

**Filter to “in battle” only:** use `where: { in_battle: true }` (Torii WhereInput has `in_battle` as a bool, not `in_battleEQ`):

```graphql
query {
  ls009GameSettingsModels(limit: 100, where: { in_battle: true }) {
    edges {
      node {
        settings_id
        in_battle
        entity { id }
        adventurer { health action_count }
      }
    }
  }
}
```

**Example response (one node):**

- `settings_id`: 23  
- `in_battle`: false  
- `entity.id`: `"0x02ef59...a28a:0x00ffb67209646c1b2a78ee5b917b31c7013eaf46b9c2432215118c5bd79e18de"`  
- `game_seed`: `"0x0"`  
- `game_seed_until_xp`: 0  
- `stats_mode`: `"Dodge"`  
- `base_damage_reduction`: 50  
- `market_size`: 25  
- `adventurer`: `{ health: 100, xp: 64, gold: 0, action_count: 0 }`  

**Example “in battle” rows:** `where: { in_battle: true }` returns nodes with `in_battle: true`, `settings_id` (e.g. 16, 15, 14), `entity.id` (settings entity), and `adventurer { health, action_count }`. There is **no `adventurer_id`** on the node, so you cannot map these rows to adventurer token id; the battle-status API joins on `entity.id` with AdventurerPacked, but those entity ids differ (settings vs adventurer), so the join yields no rows.

So: **GameSettings and related types do not expose adventurer token id** in the Torii schema; battle status (`in_battle`) cannot be joined to `adventurer_id` via GraphQL with the current schema. **GameEvent** does expose `adventurer_id` but not `in_battle`.

**Re-inspect:** `GET /api/torii-battle-schema` returns introspected types for GameSettings, Adventurer, AdventurerPacked. To list all ls* types and query roots, run a GraphQL introspection query against `BEASTS_GRAPHQL_ENDPOINT` (e.g. `__schema { types { name } }` or `__schema { queryType { fields { name } } }`).

---

## 1. Torii GraphQL

### Endpoints (from `client/app/lib/constants.ts`)

| Constant | URL | Used for |
|----------|-----|----------|
| `MARKETPLACE_GRAPHQL_ENDPOINT` | `https://api.cartridge.gg/x/lax/torii/graphql` | Auctions, auction items, bids, offers (`bm021*` models) |
| `BEASTS_GRAPHQL_ENDPOINT` | `https://api.cartridge.gg/x/pg-mainnet-10/torii/graphql` | `tokenBalances`, `token(id:)` (ERC721 metadata for Beasts and Adventurers) |

Apollo split link (`client/app/providers/apollo-provider.tsx`) sends:

- **To BEASTS** (pg-mainnet-10): queries containing `tokenBalances`, `tokenMetadata`, `token(id:)`, `ERC721`, or operations `MyNFTS`, `BeastByTokenId`, `ConsolidatedQuery` (with myNFTs).
- **To MARKETPLACE** (lax): everything else (e.g. `bm021AuctionModels`, `bm021AuctionItemModels`, `bm021BidModels`, `bm021OfferModels`).

### Main GraphQL operations

- **Auctions (Buy tab)**  
  - Query: `AUCTIONS_QUERY` (see `client/app/lib/queries/auctions.ts`).  
  - Fetches: `bm021AuctionItemModels`, `bm021AuctionModels`, `bm021BidModels`, `bm021OfferModels`.  
  - Used by: `useAuctions()` → marketplace endpoint.

- **My NFTs (Beasts)**  
  - Query: `MY_NFTS_QUERY` – `tokenBalances(accountAddress)`.  
  - Used by: `useMyNFTs()` with `BEASTS_NFT_CONTRACT_ADDRESS` → beasts endpoint.  
  - Returns: ERC721 metadata (name, imagePath, metadata, metadataAttributes, tokenId, contractAddress).

- **My Adventurers (Sell tab)**  
  - **Not** from GraphQL.  
  - Fetched via **Torii SQL** through `/api/adventurer-nfts?address=...` (see below).

- **Single Beast by token ID**  
  - Query: `BEAST_BY_TOKEN_ID_QUERY` – `token(id: $id)`.  
  - Used for beast detail; id format: `contractAddress:tokenId` (e.g. `0x046d...e4:0x...1234`).

So: **GraphQL is used for marketplace data and for Beasts (and any ERC721 metadata from pg-mainnet-10 Torii). Adventurer list for “My Adventurers” comes from Torii SQL.**

---

## 2. Torii SQL

### Endpoint

- **Base:** `https://api.cartridge.gg/x/pg-mainnet-10/torii/sql`
- **Call:** HTTP GET with `query=<URL-encoded SQL>`.

Used only in **API routes** (server-side), not directly from the browser (avoids CORS and keeps queries server-side).

### Torii GraphQL (pg-mainnet-10) – LootSurvivor models

The same endpoint exposes **LootSurvivor** Dojo models (ls_0_0_9). For adventurer state:

- **`ls009AdventurerPackedModels`** – query by `adventurer_id` (token ID); returns `packed` (felt252) with level, XP, HP, stats. The app decodes this into attributes and uses it **first** before falling back to SQL.
- Used in: `/api/adventurer-attributes/[tokenId]` – primary Torii source when available; falls back to `token_attributes` SQL if GraphQL returns empty.

### Torii GraphQL models for adventurers (pg-mainnet-10, introspected)

**Query roots (adventurer-related):**  
`ls008AdventurerEntropyModels`, `ls008AdventurerKilledModels`, `ls008AdventurerPackedModels`, `ls009AdventurerKilledModels`, `ls009AdventurerEntropyModels`, `ls009AdventurerPackedModels`, plus `summit*AdventurerConsumedModels`.

**`ls_0_0_9_Adventurer`** (unpacked; not queried directly by this app – we use Packed):
- Fields: `health`, `xp`, `gold`, `beast_health`, `stat_upgrades_available`, `stats`, `equipment`, `item_specials_seed`, `action_count`.
- **No `entity`, no `id`, no `adventurer_id`** – cannot link this nested type to a token id.

**`ls_0_0_9_AdventurerPacked`** (what we use):
- Fields: `adventurer_id` (u64 = token id), `packed` (felt252), `entity` (World__Entity with `id`), `eventMessage`.

**`ls_0_0_9_GameSettings`** (per-session state; keyed by `settings_id`):
- Fields: `settings_id` (u32), `vrf_address`, `adventurer` (nested ls_0_0_9_Adventurer), `bag`, `game_seed`, `game_seed_until_xp`, **`in_battle`** (bool), `stats_mode`, `base_damage_reduction`, `market_size`, `entity` (World__Entity), `eventMessage`.
- **No `adventurer_id`** – GameSettings does not expose adventurer token id in the schema.
- **“In a fight”** is **`in_battle`** on GameSettings.

**`World__Entity`** (Torii entity wrapper):
- Fields: `id`, `keys`, `eventId`, `executedAt`, `createdAt`, `updatedAt`, `models`.

---

### Battle status for a given adventurer (verified)

**Can we get battle status for a given adventurer token id from Torii GraphQL today?**  
**No.** Here is why.

1. **Where `in_battle` lives**  
   `in_battle` is on **`ls_0_0_9_GameSettings`** only. Each row has `entity.id` (the entity id of that **GameSettings** row, derived from the world key that includes **`settings_id`**).

2. **Where token id lives**  
   Adventurer token id is **`adventurer_id`** on **`ls_0_0_9_AdventurerPacked`**. Each row has `entity.id` (the entity id of that **AdventurerPacked** row, derived from the world key that includes **`adventurer_id`**).

3. **Entity ids do not match**  
   Sampled data shows:
   - GameSettings `entity.id` values look like `...:0x00ffb672...`, `...:0x04a665f5...`, etc. (one per settings row).
   - AdventurerPacked `entity.id` values look like `...:0x0646c379...`, `...:0x0216c05d...`, etc. (one per adventurer token).
   - **None of the GameSettings entity ids equal any AdventurerPacked entity ids** – they are different component types with different keys (`settings_id` vs `adventurer_id`), so joining on `entity.id` yields no rows.

4. **No direct link from GameSettings to token id**  
   - GameSettings has **no `adventurer_id`** (or similar) field in the introspected schema.
   - The nested **`adventurer`** (ls_0_0_9_Adventurer) has **no `entity`, no `id`, no `adventurer_id`**, so we cannot get a token id from it.

**Conclusion:** With the current Torii GraphQL schema we **cannot** map `in_battle` to adventurer token id. The battle-status API join (GameSettings.entity.id === AdventurerPacked.entity.id) will always return no matches.

**Ways to get battle status per adventurer later:**

1. **Schema change**  
   If the Loot Survivor Dojo world stores an adventurer reference on GameSettings (e.g. as part of the key), Cartridge could expose it in Torii (e.g. `adventurer_id` or a relation that resolves to token id). Then we could map `in_battle` → token id directly.

2. **Torii SQL**  
   If Torii SQL exposes a table for game settings (e.g. `ls_0_0_9_game_settings`) with a column that identifies the adventurer (e.g. `adventurer_id` or `entity_id` that we can join to AdventurerPacked), we could query it. The app currently only uses `token_balances` and `token_attributes`; other table names/columns would need to be discovered (e.g. via Torii/Cartridge docs or SQL introspection).

3. **RPC / contract**  
   If the Loot Survivor game contract exposes a view like `get_game_settings(adventurer_id)` or `is_in_battle(adventurer_id)`, we could call it per token (with the same tradeoffs as other per-token RPC).

**Introspection:**  
To re-check the schema, call `GET /api/torii-battle-schema` (or run the introspection query against `BEASTS_GRAPHQL_ENDPOINT`) to get `ls_0_0_9_GameSettings`, `ls_0_0_9_Adventurer`, and `ls_0_0_9_AdventurerPacked` types and their fields.

### Torii schema investigation (live introspection)

A full introspection was run against `BEASTS_GRAPHQL_ENDPOINT`. Summary:

**ls009 query roots** (all take `first`, `last`, `before`, `after`, `offset`, `limit`, `where`, `order`):

- `ls009AdventurerPackedModels` (where: `ls_0_0_9_AdventurerPackedWhereInput` – has `adventurer_id` / `adventurer_idEQ`)
- `ls009AdventurerEntropyModels`, `ls009AdventurerKilledModels`
- `ls009GameSettingsModels` (where: `ls_0_0_9_GameSettingsWhereInput`)
- `ls009GameSettingsMetadataModels`, `ls009SettingsCounterModels`
- `ls009BagPackedModels`, `ls009CollectableCountModels`, `ls009CollectableEntityModels`
- `ls009DroppedItemModels`, `ls009EntityStatsModels`
- `ls009GameEventModels` (where: `ls_0_0_9_GameEventWhereInput` – has **`adventurer_id`** / `adventurer_idEQ`)
- `ls009ScoreObjectiveModels`, `ls009ScoreObjectiveCountModels`

**`ls_0_0_9_GameSettingsWhereInput`** (filter for `ls009GameSettingsModels`):

- Filter fields: `settings_id`, `vrf_address`, `adventurer` (nested WhereInput), `bag`, `game_seed`, `game_seed_until_xp`, **`in_battle`**, `stats_mode`, `base_damage_reduction`, `market_size`.
- **No `adventurer_id`** – you cannot filter GameSettings by adventurer token id. You can only filter by `in_battle`, `settings_id`, etc.

**`ls_0_0_9_GameEventWhereInput`** (filter for `ls009GameEventModels`):

- Has **`adventurer_id`**, `adventurer_idEQ`, `adventurer_idIN`, etc., and `action_count`, `details`.
- So you can query `ls009GameEventModels(where: { adventurer_idEQ: "131359" })` to get events for a token, but **GameEvent has no `in_battle`** – only event details (attack, flee, etc.).

**Conclusion from schema:** Battle status (`in_battle`) lives only on GameSettings; GameSettings cannot be filtered or joined by `adventurer_id` in GraphQL. GameEvent gives `adventurer_id` but not `in_battle`. So **with the current Torii GraphQL schema you cannot get “in_battle for this adventurer_id”** without a schema change, Torii SQL, or RPC.

**ls009 models: can we link battle status to adventurer_id?**

All 15 ls009 types were introspected. Summary:

| Model (ls009*Models) | Type | Has `adventurer_id`? | Has `in_battle`? | Has `settings_id`? | Link possible? |
|---------------------|------|----------------------|------------------|--------------------|----------------|
| AdventurerEntropyModels | ls_0_0_9_AdventurerEntropy | **Yes** | No | No | No – no battle |
| AdventurerKilledModels | ls_0_0_9_AdventurerKilled | **Yes** | No | No | No – no battle |
| AdventurerPackedModels | ls_0_0_9_AdventurerPacked | **Yes** | No | No | No – no battle |
| BagPackedModels | ls_0_0_9_BagPacked | **Yes** | No | No | No – no battle |
| CollectableCountModels | ls_0_0_9_CollectableCount | No (dungeon, entity_hash) | No | No | No |
| CollectableEntityModels | ls_0_0_9_CollectableEntity | No | No | No | No |
| DroppedItemModels | ls_0_0_9_DroppedItem | **Yes** | No | No | No – no battle |
| EntityStatsModels | ls_0_0_9_EntityStats | No (entity_hash) | No | No | No |
| GameEventModels | ls_0_0_9_GameEvent | **Yes** | No | No | No – no battle |
| GameSettingsMetadataModels | ls_0_0_9_GameSettingsMetadata | No | No | **Yes** | No – no adventurer_id |
| GameSettingsModels | ls_0_0_9_GameSettings | No | **Yes** | **Yes** | No – no adventurer_id |
| ScoreObjectiveCountModels | ls_0_0_9_ScoreObjectiveCount | No (key) | No | No | No |
| ScoreObjectiveModels | ls_0_0_9_ScoreObjective | No (id, score) | No | No | No |
| SettingsCounterModels | ls_0_0_9_SettingsCounter | No (id) | No | No | No |

- **adventurer_id** appears in: AdventurerEntropy, AdventurerKilled, AdventurerPacked, BagPacked, DroppedItem, GameEvent. **None have `in_battle`.**
- **in_battle** appears only in **GameSettings**. GameSettings has **no `adventurer_id`** (only nested `adventurer` with no id/entity).
- **settings_id** appears in GameSettings and GameSettingsMetadata; neither has adventurer_id, so we cannot join settings → adventurer token id via another ls009 model.

**Verdict:** No ls009 model has both `adventurer_id` and `in_battle`, and no model exposes a join key (e.g. settings_id + adventurer_id on the same type) to connect GameSettings to adventurer_id. You cannot bake the link between battle status and adventurer_id using the current ls009 Torii schema alone.

**Artifacts:**

- **Script:** `client/scripts/introspect-torii-schema.ts` – run with `npx tsx client/scripts/introspect-torii-schema.ts` (writes `client/scripts/torii-schema-introspection.json` and prints a summary). Requires network.
- **Saved introspection:** `client/scripts/torii-schema-introspection.json` – types `gsWhere`, `gs`, `adv`, `advPacked`, `ge`, `geWhere` (GameSettings/Adventurer/GameEvent and their WhereInputs).

### Battle status inference: beast_health > 0

**Canonical rule:** An ls009 adventurer is **in battle** if and only if **beast_health > 0** for that adventurer.

- **Source of beast_health:** **ls009AdventurerPackedModels** – each row has `adventurer_id` and `packed` (felt252). The app decodes `packed` per Death Mountain contracts: `beast_health` is 10 bits in the packed layout (after health, xp, gold). See `client/app/api/adventurer-attributes/[tokenId]/route.ts` and `decodePackedToAttributes()` (and `fetch-one.ts`).
- **How to get in_battle per adventurer:** For each adventurer token id, query `ls009AdventurerPackedModels(where: { adventurer_idEQ: tokenId }, limit: 1)`, decode the node’s `packed` to get `beast_health`, then **in_battle = (Number(beast_health) > 0)**.
- **API:** Battle status is part of the adventurer-attributes API. **GET /api/adventurer-attributes** (no params) returns the battle-status map `{ [adventurerId]: in_battle }`. **GET /api/adventurer-attributes/[tokenId]** and **GET /api/adventurer-attributes?tokenIds=1,2,3** return `in_battle` per token (derived from Beast Health > 0).

So battle status **does not** require GameSettings or events: it follows from **AdventurerPacked + decoded beast_health**.

### Fetch last events for an adventurer (alternative heuristic)

To investigate inferring “in battle” from the **event stream** (alternative to beast_health), query **last N events** for a given adventurer:

**GraphQL query** (order by `action_count` DESC; order field enum is `ACTION_COUNT`):

```graphql
query LastEvents($advId: String!, $limit: Int!) {
  ls009GameEventModels(
    limit: $limit
    where: { adventurer_idEQ: $advId }
    order: [{ field: ACTION_COUNT, direction: DESC }]
  ) {
    edges {
      node {
        adventurer_id
        action_count
        details {
          attack { __typename }
          beast_attack { __typename }
          ambush { __typename }
          flee
          defeated_beast { __typename }
          fled_beast { __typename }
          discovery { __typename }
          level_up { __typename }
        }
      }
    }
  }
}
```

**Test for adventurer 131359:**  
- Variables: `{ "advId": "131359", "limit": 5 }`.  
- Result: **1 event** (action_count 8; adventurer_id `0x2011f`). Details has `attack`, `beast_attack`, `defeated_beast`, `fled_beast` (and `flee: false`). Torii returns all detail branches; the “event kind” is inferred by priority: if `defeated_beast` or `fled_beast` is set → battle ended; if `attack` / `beast_attack` / `ambush` → possibly in battle.

**Event-based inference (best-effort, alternative to beast_health):**

| Latest event kind       | Infer `in_battle` |
|-------------------------|--------------------|
| `defeated_beast`, `fled_beast`, `flee` | **false** (battle ended) |
| `attack`, `beast_attack`, `ambush`    | **true** (likely in battle) |
| `discovery`, `level_up`, etc.        | **unknown** |

For 131359, treating the single event as “defeated_beast” (first in priority) → **in_battle = false**.  
**Canonical rule:** Prefer **in_battle = (beast_health > 0)** from AdventurerPacked (see “Battle status inference: beast_health > 0” above).

**Script:** `client/scripts/fetch-adventurer-events.ts` – run `npx tsx client/scripts/fetch-adventurer-events.ts [adventurerId] [limit]` (default 131359, 5). Fetches last N events and prints event kinds + inferred `in_battle`. Requires network.

### Torii SQL tables / queries used

1. **`token_balances`**  
   - Columns used: `token_id`, `contract_address`, `account_address`.  
   - Example: “All adventurer tokens for address X.”  
   - Used in: `/api/adventurer-nfts` (list of adventurer NFTs for a wallet).

2. **`token_attributes`**  
   - Columns used: `token_id`, `trait_name`, `trait_value`.  
   - Example: “All attributes for token T” or “attributes for tokens T1,T2,...”.  
   - Used in:  
     - `/api/adventurer-attributes/[tokenId]` – fallback when Torii GraphQL returns no packed data.  
     - `/api/adventurer-nfts` – batch attributes for tokens returned by `token_balances`.

### Adventurer contract (Torii SQL)

- **Adventurer NFT contract:** `0x036017e69d21d6d8c13e266eabb73ef1f1d02722d86bdcabe5f168f8e549d3cd`  
- **Token ID format in Torii:** `{contract_address}:0x{padded_64_hex}`  
  - Example: token ID `126897` → `...contract...:0x0000...000001efb1` (126897 in 64-char hex).  
  - In API routes, `tokenId` is the numeric ID (e.g. `126897`) or hex; the owner’s **wallet address** is different and must not be used as token ID.

---

## 3. API routes that use Torii

| Route | Torii? | What it does |
|-------|--------|----------------|
| `/api/adventurer-nfts` | **Yes (SQL)** | GET `?address=0x...`. Runs `token_balances` for adventurer contract, then `token_attributes` in batches. Returns `{ nfts: [...] }` for “My Adventurers”. |
| `/api/adventurer-attributes/[tokenId]` | **Yes (GraphQL then SQL)** + **RPC** | GET. Tries Torii GraphQL `ls009AdventurerPackedModels` first (decoded packed → attributes); if empty, uses Torii SQL `token_attributes`; then RPC `get_adventurer` **overrides**. Optional: `?toriiOnly=true` (Torii only), `?source=graphql` (GraphQL only when toriiOnly). Returns `{ tokenId, attributes }`. |
| `/api/adventurer-stat-bounds` | **No** | GET `?tokenIds=1,2,3`. Uses **RPC only** (`get_adventurer` per token), no Torii. Returns min/max stats for filter sliders. |
| `/api/adventurer-image/[tokenId]` | No (static URL) | Serves or redirects to adventurer image (arcade-main Torii static URL). |

So: **Torii is used for “list my adventurers” and “attributes for one adventurer”; contract RPC is used to override attributes and to compute stat bounds.**

---

## 4. Is adventurer data coming from Torii?

- **List of adventurers (Sell / My Adventurers):**  
  - **Yes.** `useMyAdventurerNFTs()` → `/api/adventurer-nfts?address=...` → Torii SQL `token_balances` + `token_attributes`.  
  - If the list is empty, either the wallet has no adventurers for that contract, or Torii SQL has no rows for that `account_address` / `contract_address`.

- **Per-token attributes (e.g. card/modal):**  
  - **Yes, then overridden.** `/api/adventurer-attributes/[tokenId]` tries Torii **GraphQL** `ls009AdventurerPackedModels` first (decoded packed → attributes); if empty, uses Torii SQL `token_attributes`; then RPC `get_adventurer` overrides. Contract data is the source of truth; Torii (GraphQL or SQL) is the indexed view.  
  - Use `?toriiOnly=true` to skip RPC; add `?source=graphql` to return only Torii GraphQL decoded data.

- **Stat bounds (filter sliders):**  
  - **No Torii.** `/api/adventurer-stat-bounds` uses only RPC `get_adventurer`; Torii is not involved.

---

## 5. How to test Torii

### Torii SQL (adventurer list + attributes)

1. **Token balances for an address**  
   Replace `ACCOUNT_ADDRESS` and ensure `ADVENTURER_CONTRACT` matches your app.

   ```bash
   ADVENTURER_CONTRACT="0x036017e69d21d6d8c13e266eabb73ef1f1d02722d86bdcabe5f168f8e549d3cd"
   TORII_SQL="https://api.cartridge.gg/x/pg-mainnet-10/torii/sql"
   # Use lowercase for account_address if your Torii stores it that way
   QUERY="SELECT token_id, contract_address FROM token_balances WHERE LOWER(account_address) = 'ACCOUNT_ADDRESS' AND contract_address = '$ADVENTURER_CONTRACT' LIMIT 10"
   curl -s -G "$TORII_SQL" --data-urlencode "query=$QUERY" | jq .
   ```

2. **Attributes for one token**  
   Token ID in Torii is `contract:0x{padded_64_hex}`. Example for token id `1`:

   ```bash
   TOKEN_FULL="${ADVENTURER_CONTRACT}:0x0000000000000000000000000000000000000000000000000000000000000001"
   QUERY="SELECT trait_name, trait_value FROM token_attributes WHERE token_id = '$TOKEN_FULL'"
   curl -s -G "$TORII_SQL" --data-urlencode "query=$QUERY" | jq .
   ```

3. **Run the project’s test script**  
   From repo root:

   ```bash
   ./scripts/test-torii.sh
   ```

   Optional env vars: `TORII_SQL_URL`, `ADVENTURER_CONTRACT`, `TEST_ADDRESS`, `TEST_TOKEN_ID`, `BASE_URL`.  
   To test “my adventurers” and GraphQL, set `TEST_ADDRESS` to a wallet that holds adventurers, e.g.:

   ```bash
   TEST_ADDRESS=0x79fdfdf5db57b6e1afc91553b21160b9ff126d59ed014299ba5b85fb1ddaa17 ./scripts/test-torii.sh
   ```

   To test the local API route (adventurer-attributes), run the Next.js app and use default `BASE_URL=http://localhost:3000` or set `BASE_URL` to your app URL.

### Torii GraphQL (auctions + beasts)

- **Auctions:**  
  Send `AUCTIONS_QUERY` to `MARKETPLACE_GRAPHQL_ENDPOINT` (POST, `application/json` body with `query` and `variables` if any).

- **Token balances (Beasts / same world as adventurers):**  
  Send `MY_NFTS_QUERY` with `accountAddress` to `BEASTS_GRAPHQL_ENDPOINT`.

Example (replace `YOUR_ADDRESS`):

```bash
BEASTS_GQL="https://api.cartridge.gg/x/pg-mainnet-10/torii/graphql"
curl -s -X POST "$BEASTS_GQL" \
  -H "Content-Type: application/json" \
  -d '{"query":"query MyNFTS($accountAddress: String!) { tokenBalances(limit: 10, accountAddress: $accountAddress) { edges { node { tokenMetadata { ... on ERC721__Token { metadataName contractAddress tokenId metadataAttributes } } } } } }","variables":{"accountAddress":"YOUR_ADDRESS"}}' | jq .
```

---

## 6. Checklist when adventurer data is wrong

- [ ] **Torii SQL base URL** – Correct env / constant for `pg-mainnet-10` (e.g. `https://api.cartridge.gg/x/pg-mainnet-10/torii/sql`).
- [ ] **Adventurer contract** – Matches deployed NFT contract (`0x036017e69d21d6d8c13e266eabb73ef1f1d02722d86bdcabe5f168f8e549d3cd` in constants).
- [ ] **Token ID format** – In SQL, full id is `contract:0x{64-char hex}`; in API routes, tokenId is normalized (e.g. decimal or hex) and then padded when building the full id.
- [ ] **Account address** – Normalized (e.g. lowercase) in both Torii query and frontend; same format when calling `/api/adventurer-nfts?address=...`.
- [ ] **Torii indexing** – If Torii has not indexed the adventurer contract or recent txs, `token_balances` / `token_attributes` can be empty; contract `get_adventurer` will still work for stats.
- [ ] **CORS / network** – Torii SQL is only called from API routes; if the **client** ever called Torii directly, CORS could block it. Our flow uses Next.js API routes, so no client CORS for SQL.
- [ ] **Errors** – Check server logs for `/api/adventurer-nfts` and `/api/adventurer-attributes/[tokenId]` (e.g. Torii 4xx/5xx or empty arrays).

Use `scripts/test-torii.sh` (and the curl examples above) to confirm Torii SQL and GraphQL responses for your environment and a known wallet/token.
