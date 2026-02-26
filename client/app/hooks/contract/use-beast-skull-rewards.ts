import { useState, useEffect, useCallback } from "react";
import {
  SUMMIT_TORII_URL,
  SUMMIT_NAMESPACE,
} from "../../lib/constants";

interface BeastSkullData {
  tokenId: number;
  skullsClaimed: number;
  adventurersKilled: number;
  unclaimedSkulls: number;
}

interface UseSkullRewardsResult {
  loading: boolean;
  error: Error | null;
  skullData: BeastSkullData[];
  totalUnclaimedSkulls: number;
  refetch: () => void;
}

interface BeastMetadata {
  tokenId: number;
  adventurersKilled: number; // From NFT "Adventurers Killed" attribute
}

/**
 * Hook to fetch unclaimed SKULL tokens for beasts in an auction
 *
 * Uses:
 * - "Adventurers Killed" from NFT metadata (passed in via beasts array)
 * - "skulls" (claimed) from Summit's SkullEvent table
 *
 * Unclaimed = Adventurers Killed - Skulls Claimed
 */
export function useBeastSkullRewards(
  beasts: BeastMetadata[]
): UseSkullRewardsResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [skullData, setSkullData] = useState<BeastSkullData[]>([]);

  const fetchSkullRewards = useCallback(async () => {
    if (!beasts || beasts.length === 0) {
      setSkullData([]);
      return;
    }

    // Filter out beasts with no kills
    const beastsWithKills = beasts.filter((b) => b.adventurersKilled > 0);

    if (beastsWithKills.length === 0) {
      // No beasts have killed adventurers, so no unclaimed skulls
      setSkullData(beasts.map((b) => ({
        tokenId: b.tokenId,
        skullsClaimed: 0,
        adventurersKilled: b.adventurersKilled,
        unclaimedSkulls: 0,
      })));
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const tokenIds = beastsWithKills.map((b) => b.tokenId);
      const tokenIdsList = tokenIds.join(",");

      // Query skulls already claimed per beast from Summit's SkullEvent table
      const skullsQuery = `
        SELECT beast_token_id, skulls
        FROM "${SUMMIT_NAMESPACE}-SkullEvent"
        WHERE beast_token_id IN (${tokenIdsList})
      `;

      const skullsUrl = `${SUMMIT_TORII_URL}/sql?query=${encodeURIComponent(skullsQuery)}`;
      const skullsResponse = await fetch(skullsUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      // Build skulls claimed map
      const skullsClaimedMap = new Map<number, number>();

      if (skullsResponse.ok) {
        const result = await skullsResponse.json();
        const skullsData = Array.isArray(result) ? result : [];

        for (const row of skullsData) {
          const tokenId = Number(row.beast_token_id);
          // skulls is stored as hex string
          const skulls = row.skulls?.startsWith?.("0x")
            ? parseInt(row.skulls, 16)
            : parseInt(row.skulls || "0");
          skullsClaimedMap.set(tokenId, skulls);
        }
      }

      // Calculate unclaimed skulls for each beast
      const result: BeastSkullData[] = beasts.map((beast) => {
        const skullsClaimed = skullsClaimedMap.get(beast.tokenId) || 0;
        const adventurersKilled = beast.adventurersKilled;
        const unclaimedSkulls = Math.max(0, adventurersKilled - skullsClaimed);

        return {
          tokenId: beast.tokenId,
          skullsClaimed,
          adventurersKilled,
          unclaimedSkulls,
        };
      });

      setSkullData(result);
    } catch (err) {
      console.error("Error fetching skull rewards:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch skull rewards"));
    } finally {
      setLoading(false);
    }
  }, [beasts]);

  useEffect(() => {
    fetchSkullRewards();
  }, [fetchSkullRewards]);

  const totalUnclaimedSkulls = skullData.reduce(
    (sum, data) => sum + data.unclaimedSkulls,
    0
  );

  return {
    loading,
    error,
    skullData,
    totalUnclaimedSkulls,
    refetch: fetchSkullRewards,
  };
}
