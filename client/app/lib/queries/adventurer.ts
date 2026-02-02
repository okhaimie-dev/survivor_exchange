/**
 * LootSurvivor adventurer data from Torii GraphQL (pg-mainnet-10).
 * Uses ls_0_0_9 models for current game state.
 */

/** Query adventurer packed state by token/adventurer ID (u64). Torii WhereInput uses adventurer_idEQ (u64). */
export const LS009_ADVENTURER_PACKED_QUERY = `
  query Ls009AdventurerPacked($adventurerId: String!) {
    ls009AdventurerPackedModels(
      where: { adventurer_idEQ: $adventurerId }
      limit: 1
    ) {
      edges {
        node {
          adventurer_id
          packed
        }
      }
    }
  }
`;

export type Ls009AdventurerPackedNode = {
  adventurer_id: string;
  packed: string | null;
};

export type Ls009AdventurerPackedResponse = {
  data?: {
    ls009AdventurerPackedModels?: {
      edges: Array<{ node: Ls009AdventurerPackedNode }>;
    };
  };
  errors?: Array<{ message: string }>;
};

/** Fetch AdventurerPacked with packed field to derive in_battle from beast_health. Canonical rule: in_battle = (beast_health > 0). */
export const LS009_BATTLE_STATUS_BY_BEAST_HEALTH_QUERY = `
  query Ls009BattleStatusByBeastHealth {
    adventurers: ls009AdventurerPackedModels(limit: 5000) {
      edges {
        node {
          adventurer_id
          packed
        }
      }
    }
  }
`;
