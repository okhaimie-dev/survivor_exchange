"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useBeastByTokenId } from "../hooks/use-beast-by-token-id";
import BeastDetailModal from "./beast-detail-modal";

/**
 * Component that handles the ?beast=tokenId URL parameter.
 * When a beast tokenId is present in the URL, it fetches the beast data
 * and displays it in the BeastDetailModal.
 */
export default function BeastUrlHandler() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const beastTokenId = searchParams.get("beast");

  const [isModalOpen, setIsModalOpen] = useState(false);

  const { nft, loading, error } = useBeastByTokenId({
    tokenId: beastTokenId,
    skip: !beastTokenId,
  });

  // Open modal when beast param is present and data is loaded
  useEffect(() => {
    if (beastTokenId && nft) {
      setIsModalOpen(true);
    }
  }, [beastTokenId, nft]);

  // Close modal and remove beast param from URL
  const handleClose = () => {
    setIsModalOpen(false);
    // Remove beast param from URL
    const params = new URLSearchParams(searchParams.toString());
    params.delete("beast");
    const newUrl = params.toString() ? `?${params.toString()}` : window.location.pathname;
    router.push(newUrl, { scroll: false });
  };

  // Show loading state while fetching
  if (beastTokenId && loading) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4">
          <div className="h-12 w-12 animate-spin rounded-full border-4 border-[rgb(50,255,52)] border-t-transparent" />
          <p className="font-orbitron text-sm text-[rgb(50,255,52)]">Loading Beast...</p>
        </div>
      </div>
    );
  }

  // Show error state
  if (beastTokenId && error) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
        <div className="flex flex-col items-center gap-4 rounded-xl border border-red-500/40 bg-black/95 p-8">
          <p className="font-orbitron text-lg text-red-400">Beast Not Found</p>
          <p className="text-sm text-white/60">
            Could not find beast with ID: {beastTokenId}
          </p>
          <button
            onClick={handleClose}
            className="mt-2 rounded-lg border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-4 py-2 text-sm text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/20"
          >
            Close
          </button>
        </div>
      </div>
    );
  }

  // Render modal with the beast
  if (!nft || !isModalOpen) return null;

  return (
    <BeastDetailModal
      isOpen={isModalOpen}
      onClose={handleClose}
      nfts={[nft]}
      currentIndex={0}
      onNavigate={() => {}}
    />
  );
}
