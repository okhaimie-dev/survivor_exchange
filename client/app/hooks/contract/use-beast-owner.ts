/**
 * Hook to fetch the owner of a beast NFT by calling ownerOf on the contract
 */

import { useState, useEffect } from 'react';
import { useProvider } from '@starknet-react/core';
import { BEASTS_NFT_CONTRACT_ADDRESS } from '../../lib/constants';
import { uint256 } from 'starknet';

interface UseBeastOwnerOptions {
  tokenId: string | null;
  skip?: boolean;
}

/**
 * Hook to fetch the owner of a beast NFT
 * Returns the owner address if found, otherwise returns null
 */
export function useBeastOwner({ tokenId, skip = false }: UseBeastOwnerOptions) {
  const [owner, setOwner] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const provider = useProvider();

  useEffect(() => {
    if (skip || !tokenId || !provider?.provider) {
      setOwner(null);
      setIsLoading(false);
      return;
    }

    const fetchOwner = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Convert tokenId to uint256 format for the contract call
        let tokenIdBigInt: bigint;
        if (tokenId.startsWith('0x') || tokenId.startsWith('0X')) {
          tokenIdBigInt = BigInt(tokenId);
        } else {
          tokenIdBigInt = BigInt(tokenId);
        }

        const tokenIdUint256 = uint256.bnToUint256(tokenIdBigInt);

        // Call ownerOf on the BEASTS NFT contract
        const result = await provider.provider.callContract({
          contractAddress: BEASTS_NFT_CONTRACT_ADDRESS,
          entrypoint: 'owner_of',
          calldata: [tokenIdUint256.low.toString(), tokenIdUint256.high.toString()],
        });

        // The result should contain the owner address
        if (result && result.length > 0) {
          // Owner address is returned as a felt252
          const ownerAddress = result[0];
          // Format as hex address
          const formattedAddress = '0x' + BigInt(ownerAddress).toString(16);
          setOwner(formattedAddress);
        } else {
          setOwner(null);
        }
      } catch (err) {
        console.error('Error fetching beast owner:', err);
        setError(err instanceof Error ? err : new Error('Failed to fetch owner'));
        setOwner(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchOwner();
  }, [tokenId, skip, provider?.provider]);

  return { owner, isLoading, error };
}
