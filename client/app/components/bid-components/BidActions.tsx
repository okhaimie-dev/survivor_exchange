"use client";

import { useExplorer } from "@starknet-react/core";
import { InfoTooltip } from "../ui";
import { isAuctionExpired } from "../../lib/utils/auction-status";
import type { UserOffer } from "../../lib/types";

interface BidActionsProps {
  // Bid state
  isBidValid: boolean;
  account: boolean;
  isSubmitting: boolean;
  isSubmittingOffer: boolean;
  isWithdrawingOffer: boolean;
  isSettling: boolean;
  isUserSeller: boolean;
  endTime: string;
  status: string;
  userOffer: UserOffer | null;

  // Transaction hashes
  txnHash?: string;
  offerTxnHash?: string;
  settleTxnHash?: string;
  withdrawOfferTxnHash?: string;
  isRefunded: boolean;

  // Actions
  onPlaceBid: () => void;
  onMakeOffer: () => void;
  onWithdrawOffer: () => void;
  onSettleAuction: () => void;
  onOpenWalletModal: () => void;
}

export default function BidActions({
  isBidValid,
  account,
  isSubmitting,
  isSubmittingOffer,
  isWithdrawingOffer,
  isSettling,
  isUserSeller,
  endTime,
  status,
  userOffer,
  txnHash,
  offerTxnHash,
  settleTxnHash,
  withdrawOfferTxnHash,
  isRefunded,
  onPlaceBid,
  onMakeOffer,
  onWithdrawOffer,
  onSettleAuction,
  onOpenWalletModal,
}: BidActionsProps) {
  const explorer = useExplorer();
  const auctionExpired = isAuctionExpired(endTime, status);

  return (
    <>
      <div className="flex flex-col gap-2 w-full max-w-full md:max-w-[550px]">
        <div className="flex flex-row gap-2 md:gap-3 w-full">
          <button
            type="button"
            onClick={onPlaceBid}
            disabled={!isBidValid || !account || isSubmitting || isUserSeller}
            className={`inline-flex items-center justify-center gap-1.5 rounded-full flex-1 px-3 md:px-4 h-9 text-[10px] md:text-xs font-orbitron uppercase tracking-[0.1em] md:tracking-[0.12em] transition whitespace-nowrap ${
              isBidValid && account && !isSubmitting && !isUserSeller
                ? "bg-[rgb(50,255,52)] text-black font-bold hover:cursor-pointer hover:bg-[rgb(40,220,42)] shadow-[0_0_12px_rgba(50,255,52,0.4)]"
                : "border border-white/12 text-[rgb(186,255,188)]/45"
            }`}
          >
            <span>{isSubmitting ? "..." : "Place Bid"}</span>
            {!isSubmitting && (
              <InfoTooltip content="Compete in the auction. Your bid must be higher than the current highest bid. Winner is determined when the auction ends." />
            )}
          </button>
          {!userOffer && (
            <button
              type="button"
              onClick={onMakeOffer}
              disabled={!isBidValid || !account || isSubmittingOffer || isUserSeller}
              className={`inline-flex items-center justify-center gap-1.5 rounded-full flex-1 px-3 md:px-4 h-9 text-[10px] md:text-xs font-orbitron uppercase tracking-[0.1em] md:tracking-[0.12em] transition whitespace-nowrap ${
                isBidValid && account && !isSubmittingOffer && !isUserSeller
                  ? "border border-blue-500 bg-blue-500/10 text-blue-500 hover:cursor-pointer hover:bg-blue-500 hover:text-black"
                  : "border border-white/12 text-[rgb(186,255,188)]/45"
              }`}
            >
              <span>{isSubmittingOffer ? "..." : "Make Offer"}</span>
              {!isSubmittingOffer && (
                <InfoTooltip content="Make a direct buyout offer to the seller. If accepted, the auction ends immediately and you get the NFTs. Your funds are held in escrow until accepted or auction ends." />
              )}
            </button>
          )}
          <button
            type="button"
            onClick={onSettleAuction}
            disabled={!account || isSettling || !auctionExpired}
            className={`inline-flex items-center justify-center rounded-full flex-1 px-3 md:px-4 h-9 text-[10px] md:text-xs font-orbitron uppercase tracking-[0.1em] md:tracking-[0.12em] transition whitespace-nowrap ${
              account && !isSettling && auctionExpired
                ? "border border-orange-500 bg-orange-500/10 text-orange-500 hover:cursor-pointer hover:bg-orange-500 hover:text-black"
                : "border border-white/12 text-[rgb(186,255,188)]/45"
            }`}
          >
            {isSettling ? "..." : "Settle"}
          </button>
        </div>
        {!account && (
          <button
            type="button"
            onClick={onOpenWalletModal}
            className="text-[10px] md:text-xs text-center text-[rgb(50,255,52)]/80 font-orbitron animate-pulse hover:text-[rgb(50,255,52)] hover:underline cursor-pointer transition-colors"
          >
            Connect wallet to place a bid →
          </button>
        )}
      </div>

      {/* User's active offer */}
      {userOffer && (
        <div className="mt-4 rounded-xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-4 py-3 w-full max-w-full md:max-w-[550px]">
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <svg
                  className="w-4 h-4 text-[rgb(50,255,52)]"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-[10px] md:text-xs font-orbitron uppercase tracking-[0.12em] md:tracking-[0.16em] text-[rgb(50,255,52)]">
                  Your Active Offer
                </span>
              </div>
              <div className="text-base md:text-lg font-orbitron font-bold text-white">
                {userOffer.amount.toFixed(2)} USDC
              </div>
              <div className="text-[10px] font-orbitron text-[rgb(186,255,188)]/70 mt-1">
                Created{" "}
                {new Date(parseInt(userOffer.createdAt) * 1000).toLocaleDateString()}
              </div>
            </div>

            <button
              onClick={onWithdrawOffer}
              disabled={isWithdrawingOffer}
              className={`px-3 md:px-4 py-2 rounded-full font-orbitron text-[10px] md:text-xs uppercase tracking-[0.1em] md:tracking-[0.12em] transition whitespace-nowrap ${
                isWithdrawingOffer
                  ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/12"
                  : "bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-black border border-red-500/40 hover:cursor-pointer"
              }`}
            >
              {isWithdrawingOffer ? (
                <div className="flex items-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  <span>Withdrawing...</span>
                </div>
              ) : (
                "Withdraw Offer"
              )}
            </button>
          </div>

          {withdrawOfferTxnHash && (
            <div className="mt-3 pt-3 border-t border-[rgb(50,255,52)]/20">
              <p className="text-[10px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70 mb-1">
                Withdrawal Transaction
              </p>
              <a
                href={explorer.transaction(withdrawOfferTxnHash)}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs font-orbitron text-[rgb(50,255,52)] hover:underline break-all flex items-center gap-1"
              >
                {withdrawOfferTxnHash}
                <svg
                  className="w-3 h-3 flex-shrink-0"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                  />
                </svg>
              </a>
            </div>
          )}
        </div>
      )}

      {/* Transaction hash displays */}
      {txnHash && (
        <div className="rounded-xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-4 py-3 w-full">
          <p className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70 mb-2">
            Bid Transaction Submitted
          </p>
          <a
            href={explorer.transaction(txnHash)}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-orbitron text-[rgb(50,255,52)] hover:underline break-all w-full"
          >
            {txnHash}
          </a>
        </div>
      )}
      {offerTxnHash && (
        <div className="rounded-xl border border-blue-500/40 bg-blue-500/10 px-4 py-3 w-full">
          <p className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70 mb-2">
            Offer Transaction Submitted
          </p>
          <a
            href={explorer.transaction(offerTxnHash)}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-orbitron text-blue-500 hover:underline break-all w-full"
          >
            {offerTxnHash}
          </a>
        </div>
      )}
      {settleTxnHash && (
        <div className="rounded-xl border border-orange-500/40 bg-orange-500/10 px-4 py-3 w-full">
          <p className="text-[11px] font-orbitron uppercase tracking-[0.16em] text-[rgb(186,255,188)]/70 mb-2">
            {isRefunded ? "Auction Refunded" : "Settle Transaction Submitted"}
          </p>
          {isRefunded && (
            <p className="text-xs text-[rgb(186,255,188)]/70 mb-2">
              All parties have been refunded
            </p>
          )}
          <a
            href={explorer.transaction(settleTxnHash)}
            target="_blank"
            rel="noreferrer"
            className="text-sm font-orbitron text-orange-500 hover:underline break-all w-full"
          >
            {settleTxnHash}
          </a>
        </div>
      )}
    </>
  );
}
