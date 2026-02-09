"use client";

import { useState } from "react";
import Image from "next/image";
import type { FormattedNFT } from "../../lib/types";
import type { CollectionType } from "../../lib/constants";
import { SUPPORTED_TOKENS, LORDS_ADDRESS, IMAGE_BASE_URL } from "../../lib/constants";
import { getCurrencyInfo } from "../../hooks/data/use-marketplace-listings";
import { useMarketplaceList } from "../../hooks/auction/use-marketplace-list";
import { CustomDropdown } from "../ui";
import { getAdventurerImageUrl } from "../../lib/utils";

interface ListForSaleModalProps {
  isOpen: boolean;
  onClose: () => void;
  nft: FormattedNFT;
  collectionAddress: string;
  collectionType: CollectionType;
}

const EXPIRATION_OPTIONS = [
  { value: "7", label: "7 days" },
  { value: "14", label: "14 days" },
  { value: "30", label: "30 days" },
  { value: "90", label: "90 days" },
];

const CURRENCY_OPTIONS = SUPPORTED_TOKENS.map((t) => ({
  value: t.address,
  label: t.symbol,
}));

export default function ListForSaleModal({
  isOpen,
  onClose,
  nft,
  collectionAddress,
  collectionType,
}: ListForSaleModalProps) {
  const [price, setPrice] = useState("");
  const [currency, setCurrency] = useState(LORDS_ADDRESS);
  const [expirationDays, setExpirationDays] = useState("30");
  const { listNFT, isListing, txnHash } = useMarketplaceList();

  if (!isOpen) return null;

  const imageSrc =
    collectionType === "adventurers"
      ? getAdventurerImageUrl(
          nft.tokenId.startsWith("0x")
            ? parseInt(nft.tokenId, 16)
            : parseInt(nft.tokenId, 10),
        )
      : nft.metadata?.image
        ? nft.metadata.image
        : nft.imagePath
          ? `${IMAGE_BASE_URL}/${nft.imagePath}`
          : "/logo.png";

  const handleConfirm = async () => {
    const { decimals } = getCurrencyInfo(currency);
    const tokenIdDecimal = nft.tokenId.startsWith("0x")
      ? BigInt(nft.tokenId).toString()
      : nft.tokenId;

    await listNFT({
      collection: collectionAddress,
      tokenId: tokenIdDecimal,
      price,
      currency,
      currencyDecimals: decimals,
      expirationDays: parseInt(expirationDays, 10),
    });

    if (!isListing) {
      setTimeout(() => onClose(), 1500);
    }
  };

  const selectedCurrencySymbol =
    SUPPORTED_TOKENS.find((t) => t.address === currency)?.symbol ?? "TOKEN";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="list-modal-title"
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-[rgb(50,255,52)]/80 bg-black/90 shadow-[0_16px_40px_rgba(5,20,5,0.5)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[rgb(50,255,52)]/30">
          <h2
            id="list-modal-title"
            className="text-sm font-orbitron uppercase tracking-[0.14em] text-white"
          >
            List for Sale
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[rgb(186,255,188)]/70 hover:text-white hover:bg-white/10 transition"
            aria-label="Close"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="w-5 h-5"
            >
              <path d="M18 6 6 18" />
              <path d="m6 6 12 12" />
            </svg>
          </button>
        </div>

        {/* Body */}
        <div className="p-4 space-y-4">
          {/* NFT Preview */}
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-lg overflow-hidden border border-white/10 flex-shrink-0">
              <Image
                src={imageSrc}
                alt={nft.metadataName}
                width={64}
                height={64}
                className="w-full h-full object-contain"
                unoptimized
              />
            </div>
            <div className="min-w-0">
              <p className="text-sm font-orbitron uppercase text-white truncate">
                {nft.metadataName}
              </p>
              <p className="text-[11px] text-[rgb(186,255,188)]/50">
                #{nft.tokenId.startsWith("0x") ? parseInt(nft.tokenId, 16) : nft.tokenId}
              </p>
            </div>
          </div>

          {/* Price Input */}
          <div>
            <label className="block text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/70 mb-1.5">
              Price
            </label>
            <input
              type="number"
              min="0"
              step="any"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder={`0.00 ${selectedCurrencySymbol}`}
              className="w-full rounded-lg bg-white/5 border border-white/10 px-3 py-2.5 text-sm text-white placeholder-white/30 font-orbitron focus:outline-none focus:border-[rgb(50,255,52)]/50 focus:ring-1 focus:ring-[rgb(50,255,52)]/30"
            />
          </div>

          {/* Currency Dropdown */}
          <div>
            <label className="block text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/70 mb-1.5">
              Currency
            </label>
            <CustomDropdown
              options={CURRENCY_OPTIONS}
              value={currency}
              onChange={setCurrency}
              variant="compact"
            />
          </div>

          {/* Expiration Dropdown */}
          <div>
            <label className="block text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/70 mb-1.5">
              Expiration
            </label>
            <CustomDropdown
              options={EXPIRATION_OPTIONS}
              value={expirationDays}
              onChange={setExpirationDays}
              variant="compact"
            />
          </div>

          {/* Transaction Hash */}
          {txnHash && (
            <div className="rounded-lg bg-[rgb(50,255,52)]/10 border border-[rgb(50,255,52)]/30 px-3 py-2">
              <p className="text-[10px] font-orbitron uppercase text-[rgb(50,255,52)] mb-0.5">
                Transaction Submitted
              </p>
              <p className="text-[11px] text-white/70 break-all font-mono">
                {txnHash}
              </p>
            </div>
          )}

          {/* Confirm Button */}
          <button
            type="button"
            onClick={handleConfirm}
            disabled={isListing || !price || parseFloat(price) <= 0}
            className="w-full rounded-lg bg-[rgb(50,255,52)]/20 border border-[rgb(50,255,52)]/60 px-4 py-3 text-sm font-orbitron uppercase tracking-wider text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/30 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {isListing ? "Listing..." : "List for Sale"}
          </button>
        </div>
      </div>
    </div>
  );
}
