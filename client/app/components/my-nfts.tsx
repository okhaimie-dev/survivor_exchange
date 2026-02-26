"use client";

import { useMyNFTs } from '../hooks';

export default function MyNFTs() {
  const { nfts, loading, error, address } = useMyNFTs();

  if (!address) {
    return (
      <div className="text-center text-[rgb(186,255,188)]/70">
        Please connect your wallet to view your NFTs
      </div>
    );
  }

  if (loading) {
    return (
      <div className="text-center text-[rgb(186,255,188)]/70">
        Loading your NFTs...
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center text-red-400">
        Error loading NFTs: {error.message}
      </div>
    );
  }

  if (nfts.length === 0) {
    return (
      <div className="text-center text-[rgb(186,255,188)]/70">
        No NFTs found for this address
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4 w-full">
      <h2 className="text-2xl font-orbitron uppercase tracking-[0.4em] text-white">
        My NFTs ({nfts.length})
      </h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {nfts.map((nft, index) => (
          <div
            key={`${nft.contractAddress}-${nft.tokenId}-${index}`}
            className="rounded-2xl border border-[rgb(50,255,52)]/25 bg-black/40 p-5 shadow-[0_0_25px_rgba(50,255,52,0.12)]"
          >
            {nft.imagePath && (
              <div className="mb-4 aspect-square w-full overflow-hidden rounded-xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10">
                <img
                  src={nft.imagePath}
                  alt={nft.metadataName || nft.name || 'NFT'}
                  className="h-full w-full object-cover"
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <h3 className="text-lg font-orbitron uppercase tracking-[0.2em] text-white">
                {nft.metadataName || nft.name || `Token #${nft.tokenId}`}
              </h3>
              {nft.metadataDescription && (
                <p className="text-sm text-[rgb(186,255,188)]/70 line-clamp-2">
                  {nft.metadataDescription}
                </p>
              )}
              <div className="flex flex-col gap-1 text-xs text-[rgb(186,255,188)]/70">
                {nft.contractAddress && (
                  <p className="truncate">
                    Contract: {nft.contractAddress.slice(0, 10)}...
                  </p>
                )}
                {nft.tokenId && (
                  <p>Token ID: {nft.tokenId}</p>
                )}
                {nft.symbol && (
                  <p>Symbol: {nft.symbol}</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

