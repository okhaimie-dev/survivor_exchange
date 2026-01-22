import { useState, useEffect, useCallback } from "react";
import {
  SUMMIT_TORII_URL,
  SUMMIT_NAMESPACE,
  BEASTS_NFT_CONTRACT_ADDRESS,
} from "../lib/constants";

export interface SummitBeast {
  tokenId: number;
  blocksHeld: number;
  prefix: string;
  suffix: string;
  beastName: string;
  fullName: string;
  rank: number;
}

interface UseSummitLeaderboardResult {
  loading: boolean;
  error: Error | null;
  topBeasts: SummitBeast[];
  refetch: () => void;
}

/**
 * Hook to fetch top beasts from the Summit leaderboard by blocks held
 */
export function useSummitLeaderboard(limit: number = 5): UseSummitLeaderboardResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [topBeasts, setTopBeasts] = useState<SummitBeast[]>([]);

  const fetchTopBeasts = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // Step 1: Get top beasts by blocks_held from LiveBeastStatsEvent
      const statsQuery = `
        SELECT
          token_id,
          "live_stats.blocks_held" as blocks_held
        FROM "${SUMMIT_NAMESPACE}-LiveBeastStatsEvent"
        WHERE "live_stats.blocks_held" > 0
        ORDER BY "live_stats.blocks_held" DESC
        LIMIT ${limit}
      `;

      const statsUrl = `${SUMMIT_TORII_URL}/sql?query=${encodeURIComponent(statsQuery)}`;
      const statsResponse = await fetch(statsUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      if (!statsResponse.ok) {
        throw new Error("Failed to fetch summit leaderboard");
      }

      const statsData = await statsResponse.json();

      if (!Array.isArray(statsData) || statsData.length === 0) {
        setTopBeasts([]);
        return;
      }

      // Parse token IDs and blocks held
      // API can return numbers or hex strings depending on the data
      const beastStats = statsData.map((row: { token_id: string | number; blocks_held: string | number }) => {
        let tokenId: number;
        let blocksHeld: number;

        // Handle token_id (could be number or hex string)
        if (typeof row.token_id === "number") {
          tokenId = row.token_id;
        } else if (typeof row.token_id === "string" && row.token_id.startsWith("0x")) {
          tokenId = parseInt(row.token_id, 16);
        } else {
          tokenId = parseInt(String(row.token_id));
        }

        // Handle blocks_held (could be number or hex string)
        if (typeof row.blocks_held === "number") {
          blocksHeld = row.blocks_held;
        } else if (typeof row.blocks_held === "string" && row.blocks_held.startsWith("0x")) {
          blocksHeld = parseInt(row.blocks_held, 16);
        } else {
          blocksHeld = parseInt(String(row.blocks_held));
        }

        return { tokenId, blocksHeld };
      });

      // Step 2: Get metadata for these beasts from tokens table
      // Pad token IDs to 64-char hex for the tokens table query
      const paddedHexIds = beastStats.map((b: { tokenId: number }) =>
        "0x" + b.tokenId.toString(16).padStart(64, "0")
      );

      const metadataQuery = `
        SELECT token_id, metadata
        FROM tokens
        WHERE contract_address = '${BEASTS_NFT_CONTRACT_ADDRESS}'
          AND token_id IN (${paddedHexIds.map((hex: string) => `'${hex}'`).join(",")})
      `;

      const metadataUrl = `${SUMMIT_TORII_URL}/sql?query=${encodeURIComponent(metadataQuery)}`;
      const metadataResponse = await fetch(metadataUrl, {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      });

      // Build metadata map
      const metadataMap = new Map<number, { prefix: string; suffix: string; beastName: string }>();

      if (metadataResponse.ok) {
        const metadataData = await metadataResponse.json();

        for (const row of metadataData) {
          // Parse token_id from padded hex
          const tokenId = parseInt(row.token_id, 16);

          // Parse metadata JSON
          let metadata;
          try {
            metadata = typeof row.metadata === "string"
              ? JSON.parse(row.metadata)
              : row.metadata;
          } catch {
            continue;
          }

          // Extract attributes
          const attributes = metadata?.attributes || [];
          const prefix = attributes.find((a: { trait_type: string }) => a.trait_type === "Prefix")?.value || "";
          const suffix = attributes.find((a: { trait_type: string }) => a.trait_type === "Suffix")?.value || "";
          const beastName = attributes.find((a: { trait_type: string }) => a.trait_type === "Beast")?.value || "";

          metadataMap.set(tokenId, { prefix, suffix, beastName });
        }
      }

      // Step 3: Combine stats with metadata
      const results: SummitBeast[] = beastStats.map((beast: { tokenId: number; blocksHeld: number }, index: number) => {
        const meta = metadataMap.get(beast.tokenId) || { prefix: "", suffix: "", beastName: "Unknown" };
        const fullName = meta.prefix && meta.suffix
          ? `"${meta.prefix} ${meta.suffix}" ${meta.beastName}`
          : meta.beastName;

        return {
          tokenId: beast.tokenId,
          blocksHeld: beast.blocksHeld,
          prefix: meta.prefix,
          suffix: meta.suffix,
          beastName: meta.beastName,
          fullName,
          rank: index + 1,
        };
      });

      setTopBeasts(results);
    } catch (err) {
      console.error("[Summit Hook] Error fetching summit leaderboard:", err);
      setError(err instanceof Error ? err : new Error("Failed to fetch summit leaderboard"));
    } finally {
      setLoading(false);
    }
  }, [limit]);

  useEffect(() => {
    fetchTopBeasts();
  }, [fetchTopBeasts]);

  return {
    loading,
    error,
    topBeasts,
    refetch: fetchTopBeasts,
  };
}

/**
 * Check if an NFT matches any of the top summit beasts
 * Returns the matching beast data if found, null otherwise
 * Matches by token ID or by prefix + suffix (beast species is ignored)
 */
export function findMatchingSummitBeast(
  nftPrefix: string | undefined,
  nftSuffix: string | undefined,
  nftBeastName: string | undefined,
  nftTokenId: number | undefined,
  topBeasts: SummitBeast[]
): SummitBeast | null {
  if (!topBeasts.length) return null;

  // First try exact token ID match
  if (nftTokenId) {
    const exactMatch = topBeasts.find(b => b.tokenId === nftTokenId);
    if (exactMatch) return exactMatch;
  }

  // Then try name match (prefix + suffix only, beast species is ignored)
  if (nftPrefix && nftSuffix) {
    const nameMatch = topBeasts.find(
      b => b.prefix === nftPrefix && b.suffix === nftSuffix
    );
    if (nameMatch) return nameMatch;
  }

  return null;
}
