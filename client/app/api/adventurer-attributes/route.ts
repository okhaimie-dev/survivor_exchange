import { NextRequest, NextResponse } from "next/server";
import { BEASTS_GRAPHQL_ENDPOINT } from "../../lib/constants";
import { LS009_BATTLE_STATUS_BY_BEAST_HEALTH_QUERY } from "../../lib/queries/adventurer";
import { decodeBeastHealthFromPacked, getInBattleFromAttributes } from "../../lib/utils/packed-adventurer";
import { fetchAttributesForToken, runWithConcurrency } from "./fetch-one";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const MAX_TOKENS = 100;
const CONCURRENCY = 6;

export type BattleStatusResponse = Record<string, boolean>;

/**
 * GET /api/adventurer-attributes
 * - No query params: returns battle status map { [adventurerId]: in_battle } (beast_health > 0).
 *   Optional: ?debug=1 (raw sample), ?test=id1,id2 (force true for given ids).
 * - ?tokenIds=1,2,3: returns attributes (and in_battle) for each token.
 */
export async function GET(request: NextRequest) {
  const tokenIdsParam = request.nextUrl.searchParams.get("tokenIds");

  if (!tokenIdsParam) {
    return getBattleStatusMap(request);
  }

  const tokenIds = Array.from(
    new Set(
      tokenIdsParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)
    )
  ).slice(0, MAX_TOKENS);

  if (tokenIds.length === 0) {
    return NextResponse.json({ results: [] });
  }

  try {
    const results = await runWithConcurrency(tokenIds, CONCURRENCY, async (tokenId) => {
      const { attributes, source } = await fetchAttributesForToken(tokenId);
      const in_battle = getInBattleFromAttributes(attributes);
      return { tokenId, attributes, source, in_battle };
    });
    return NextResponse.json({ results });
  } catch (error) {
    console.warn("[Adventurer Attributes Batch] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Batch fetch failed", results: [] },
      { status: 500 }
    );
  }
}

async function getBattleStatusMap(request: NextRequest): Promise<NextResponse<BattleStatusResponse | { error: string } | { debug: unknown }>> {
  const debug = request.nextUrl.searchParams.get("debug") === "1";
  try {
    const res = await fetch(BEASTS_GRAPHQL_ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query: LS009_BATTLE_STATUS_BY_BEAST_HEALTH_QUERY }),
      next: { revalidate: 0 },
    });
    const json = (await res.json()) as {
      data?: { adventurers?: { edges?: Array<{ node: { adventurer_id: string; packed?: string | null } }> } };
      errors?: { message: string }[];
    };
    if (json.errors?.length) {
      console.warn("[adventurer-attributes] GraphQL errors (battle status):", json.errors);
      return NextResponse.json({});
    }

    const adventurersEdges = json.data?.adventurers?.edges ?? [];

    if (debug) {
      return NextResponse.json({
        debug: true,
        adventurersCount: adventurersEdges.length,
        adventurersSample: adventurersEdges.slice(0, 5).map((e) => ({
          ...e.node,
          beast_health: decodeBeastHealthFromPacked(e.node.packed),
          in_battle: decodeBeastHealthFromPacked(e.node.packed) > 0,
        })),
      });
    }

    const result: BattleStatusResponse = {};
    for (const edge of adventurersEdges) {
      const node = edge.node;
      const adventurerId = node?.adventurer_id;
      if (adventurerId == null) continue;
      const beastHealth = decodeBeastHealthFromPacked(node.packed);
      const inBattle = beastHealth > 0;
      const decimalId =
        adventurerId.startsWith("0x") || adventurerId.startsWith("0X")
          ? BigInt(adventurerId).toString(10)
          : String(adventurerId);
      result[decimalId] = inBattle;
      result["0x" + BigInt(adventurerId).toString(16).toLowerCase().padStart(64, "0")] = inBattle;
    }

    const testParam = request.nextUrl.searchParams.get("test");
    if (testParam) {
      for (const id of testParam
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean)) {
        const dec = id.startsWith("0x") || id.startsWith("0X") ? BigInt(id).toString(10) : id;
        result[dec] = true;
        result["0x" + BigInt(dec).toString(16).toLowerCase().padStart(64, "0")] = true;
      }
    }

    return NextResponse.json(result);
  } catch (e) {
    console.error("[adventurer-attributes] battle status:", e);
    return NextResponse.json({ error: "Failed to fetch battle status" }, { status: 500 });
  }
}
