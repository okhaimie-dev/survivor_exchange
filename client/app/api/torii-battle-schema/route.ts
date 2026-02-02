import { NextResponse } from "next/server";
import { BEASTS_GRAPHQL_ENDPOINT } from "../../lib/constants";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const INTROSPECTION_QUERY = `
  query IntrospectBattleTypes {
    gameSettings: __type(name: "ls_0_0_9_GameSettings") {
      name
      kind
      fields {
        name
        type { name kind ofType { name kind } }
      }
    }
    adventurer: __type(name: "ls_0_0_9_Adventurer") {
      name
      kind
      fields {
        name
        type { name kind ofType { name kind } }
      }
    }
    adventurerPacked: __type(name: "ls_0_0_9_AdventurerPacked") {
      name
      kind
      fields {
        name
        type { name kind ofType { name kind } }
      }
    }
    gameSettingsModel: __type(name: "ls009GameSettingsModel") {
      name
      kind
      fields {
        name
        type { name kind ofType { name kind } }
      }
    }
    adventurerPackedModel: __type(name: "ls009AdventurerPackedModel") {
      name
      kind
      fields {
        name
        type { name kind ofType { name kind } }
      }
    }
  }
`;

/**
 * GET /api/torii-battle-schema
 * Introspects Torii GraphQL (pg-mainnet-10) for battle-status–related types.
 * Use to verify ls_0_0_9_GameSettings, ls_0_0_9_Adventurer, ls_0_0_9_AdventurerPacked
 * and see if we can link GameSettings -> adventurer token id.
 */
export async function GET() {
  try {
    const res = await fetch(BEASTS_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: INTROSPECTION_QUERY }),
      next: { revalidate: 0 },
    });
    const json = await res.json();
    if (json.errors?.length) {
      return NextResponse.json({ error: "GraphQL errors", details: json.errors }, { status: 400 });
    }
    return NextResponse.json(json.data ?? {});
  } catch (e) {
    console.error("[torii-battle-schema]", e);
    return NextResponse.json({ error: "Introspection failed" }, { status: 500 });
  }
}
