import Image from "next/image";
import moment from "moment";
import { useAccount, useExplorer, useProvider } from "@starknet-react/core";
import { useState, useCallback, useMemo, useEffect } from "react";
import MyListingsSkeleton from "./my-listings-skeleton";
import AddressDisplay from "./address-display";
import { FormattedListing, FormattedOffer } from "../hooks/use-my-listings";
import {
  AUCTION_CONTRACT_ADDRESS,
  USDC_ADDRESS,
  SUPPORTED_TOKENS,
  DEFAULT_PAGE_SIZE,
} from "../lib/constants";
import {
  formatUSDCompact,
  truncateAuctionName,
} from "../lib/utils";
import { normalizeContractAddress } from "../lib/utils/normalization";
import { uint256, num } from "starknet";
import { getQuotes, quoteToCalls } from "@avnu/avnu-sdk";
import Pagination from "./pagination";

const formatTimeAgo = (timestamp: string): string => {
  if (!timestamp) return "Unknown";

  try {
    let timestampNum: number;

    if (timestamp.startsWith("0x") || timestamp.startsWith("0X")) {
      timestampNum = parseInt(timestamp, 16);
    } else {
      timestampNum = parseInt(timestamp, 10);
    }

    if (timestampNum === 0) return "";

    if (isNaN(timestampNum)) return "Unknown";

    const dateObj = new Date(timestampNum * 1000);
    const year = dateObj.getFullYear();
    const month = String(dateObj.getMonth() + 1).padStart(2, "0");
    const day = String(dateObj.getDate()).padStart(2, "0");
    const hours = String(dateObj.getHours()).padStart(2, "0");
    const minutes = String(dateObj.getMinutes()).padStart(2, "0");
    const seconds = String(dateObj.getSeconds()).padStart(2, "0");
    const dateString = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

    const date = moment(dateString, "YYYY-MM-DD HH:mm:ss");
    const fromNow = date.fromNow();

    return fromNow;
  } catch {
    return "Unknown";
  }
};

const getStatusStyle = (status: string): string => {
  const statusNum = parseInt(status);

  if (statusNum === 0) {
    return "bg-white/10 text-white/50 border border-white/20";
  }
  if (statusNum === 1) {
    return "bg-yellow-400/10 text-yellow-300 border border-yellow-300/30";
  }
  if (statusNum === 2) {
    return "bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] border border-[rgb(50,255,52)]/40";
  }
  if (statusNum === 3) {
    return "bg-white/10 text-white border border-white/20";
  }
  if (statusNum === 4) {
    return "bg-blue-400/10 text-blue-300 border border-blue-300/30";
  }
  if (statusNum === 5) {
    return "bg-red-400/10 text-red-300 border border-red-300/30";
  }

  if (status === "pending" || status === "queued") {
    return "bg-yellow-400/10 text-yellow-300 border border-yellow-300/30";
  }
  return "bg-white/10 text-white border border-white/20";
};

const getStatusLabel = (status: string): string => {
  const statusNum = parseInt(status);

  if (statusNum === 0) return "None";
  if (statusNum === 1) return "Draft";
  if (statusNum === 2) return "Active";
  if (statusNum === 3) return "Ended";
  if (statusNum === 4) return "Settled";
  if (statusNum === 5) return "Canceled";

  return status;
};

interface MyListingsProps {
  listings: FormattedListing[];
  loading: boolean;
  error: Error | null;
}

export default function MyListings({
  listings,
  loading,
  error,
}: MyListingsProps) {
  const { account, address } = useAccount();
  const explorer = useExplorer();
  const provider = useProvider();
  const [isEndingAuction, setIsEndingAuction] = useState<string | null>(null);
  const [txnHashes, setTxnHashes] = useState<Record<string, string>>({});
  const [isSettling, setIsSettling] = useState<string | null>(null);
  const [settleTxnHashes, setSettleTxnHashes] = useState<
    Record<string, string>
  >({});
  const [refundedAuctions, setRefundedAuctions] = useState<
    Record<string, boolean>
  >({});
  const [currentPage, setCurrentPage] = useState(1);
  const [isAcceptingOffer, setIsAcceptingOffer] = useState<string | null>(null);
  const [isRejectingOffer, setIsRejectingOffer] = useState<string | null>(null);
  const [offerTxnHashes, setOfferTxnHashes] = useState<Record<string, string>>(
    {},
  );
  const [expandedOffers, setExpandedOffers] = useState<Record<string, boolean>>(
    {},
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [listings]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(listings.length / DEFAULT_PAGE_SIZE)),
    [listings.length],
  );

  const visibleListings = useMemo(() => {
    const startIndex = (currentPage - 1) * DEFAULT_PAGE_SIZE;
    return listings.slice(startIndex, startIndex + DEFAULT_PAGE_SIZE);
  }, [currentPage, listings]);

  const handlePageChange = useCallback(
    (page: number) => {
      const nextPage = Math.min(Math.max(page, 1), totalPages);
      if (nextPage !== currentPage) {
        setCurrentPage(nextPage);
      }
    },
    [currentPage, totalPages],
  );

  const handleEndAuction = useCallback(
    async (auctionId: string) => {
      if (!account) {
        return;
      }

      try {
        setIsEndingAuction(auctionId);

        const response = await account.execute({
          contractAddress: AUCTION_CONTRACT_ADDRESS,
          entrypoint: "end_auction",
          calldata: [auctionId],
        });

        setTxnHashes((prev) => ({
          ...prev,
          [auctionId]: response.transaction_hash,
        }));
      } catch (err) {
        console.error("Error ending auction - contract call failed:", err);
        if (err instanceof Error) {
          console.error("Error message:", err.message);
          console.error("Error stack:", err.stack);
        }
        console.error("Failed call details:", {
          contract: AUCTION_CONTRACT_ADDRESS,
          entrypoint: "end_auction",
          auctionId: auctionId,
        });
      } finally {
        setIsEndingAuction(null);
      }
    },
    [account],
  );

  const isAuctionExpired = (endTime: string, status: string): boolean => {
    if (!endTime || endTime === "0") return false;

    try {
      let endTimeNum: number;
      if (endTime.startsWith("0x") || endTime.startsWith("0x")) {
        endTimeNum = parseInt(endTime, 16);
      } else {
        endTimeNum = parseInt(endTime, 10);
      }

      if (isNaN(endTimeNum) || endTimeNum === 0) return false;

      const now = Math.floor(Date.now() / 1000);
      const statusNum = parseInt(status);

      return endTimeNum <= now || statusNum === 3;
    } catch {
      return false;
    }
  };

  const handleSettleAuction = useCallback(
    async (auctionId: string) => {
      if (!account || !address) {
        return;
      }

      // Find the listing to get seller and feeToken
      const listing = listings.find((l) => l.auctionId === auctionId);
      if (!listing) {
        console.error("Listing not found");
        return;
      }

      // If there's no current bid, just settle without swap
      if (!listing.currentBid || listing.currentBid === 0) {
        try {
          setIsSettling(auctionId);

          const response = await account.execute({
            contractAddress: AUCTION_CONTRACT_ADDRESS,
            entrypoint: "settle_auction",
            calldata: [auctionId],
          });

          setSettleTxnHashes((prev) => ({
            ...prev,
            [auctionId]: response.transaction_hash,
          }));

          try {
            await new Promise((resolve) => setTimeout(resolve, 2000));
            const canSettleResult = await provider.provider.callContract({
              contractAddress: AUCTION_CONTRACT_ADDRESS,
              entrypoint: "can_settle",
              calldata: [auctionId],
            });

            if (canSettleResult && canSettleResult.length > 0) {
              const canSettle = parseInt(canSettleResult[0], 16);
              setRefundedAuctions((prev) => ({
                ...prev,
                [auctionId]: canSettle === 0,
              }));
            }
          } catch (checkError) {
            console.error("Error checking can_settle:", checkError);
          }
        } catch (err) {
          console.error("Error settling auction - contract call failed:", err);
        } finally {
          setIsSettling(null);
        }
        return;
      }

      try {
        setIsSettling(auctionId);

        const calls: Array<{
          contractAddress: string;
          entrypoint: string;
          calldata: string[];
        }> = [];

        // 1. Settle the auction (this transfers USDC from vault to seller)
        calls.push({
          contractAddress: AUCTION_CONTRACT_ADDRESS,
          entrypoint: "settle_auction",
          calldata: [auctionId],
        });

        // 2. Swap USDC to feeToken only if caller is the seller
        // Check if caller is the seller
        const callerAddress = normalizeContractAddress(address).toLowerCase();
        const sellerAddress = normalizeContractAddress(
          listing.seller,
        ).toLowerCase();
        const isSeller = callerAddress === sellerAddress;

        // Only do swap if caller is seller and feeToken is different from USDC
        const feeTokenAddress = normalizeContractAddress(
          listing.feeToken,
        ).toLowerCase();
        const usdcAddress =
          normalizeContractAddress(USDC_ADDRESS).toLowerCase();

        if (isSeller && feeTokenAddress !== usdcAddress) {
          // Calculate USDC amount in wei (USDC has 6 decimals)
          // currentBid is now divided by 1e6 for display, so we need to multiply back for contract calls
          const usdcAmountWei = BigInt(Math.floor(listing.currentBid * 1e6));

          // Use exact amount for swap
          const swapInputAmount = usdcAmountWei;

          // Get Avnu swap quotes
          const quotes = await getQuotes({
            sellTokenAddress: USDC_ADDRESS,
            buyTokenAddress: listing.feeToken,
            sellAmount: swapInputAmount,
            takerAddress: address,
          });

          if (!quotes || quotes.length === 0) {
            throw new Error("No swap quotes available");
          }

          const bestQuote = quotes[0];

          // Build the execute transaction calls from the quote
          const swapCallsResult = await quoteToCalls({
            quoteId: bestQuote.quoteId,
            slippage: 0.01, // 1% slippage
          });

          // Avnu SDK returns an object with a 'calls' array
          const allSwapCalls =
            swapCallsResult.calls ||
            (Array.isArray(swapCallsResult)
              ? swapCallsResult
              : [swapCallsResult]);

          // Filter out approve calls (we'll add our own)
          const swapCalls = allSwapCalls.filter((call) => {
            return call.entrypoint !== "approve";
          });

          if (swapCalls.length === 0) {
            console.error(
              "No swap calls found after filtering. All calls:",
              allSwapCalls,
            );
            throw new Error("No swap calls available from quote");
          }

          // Approve 2% more than the USDC amount needed for the swap
          const usdcApprovalAmount = (swapInputAmount * 102n) / 100n;
          const usdcApproval = uint256.bnToUint256(usdcApprovalAmount);

          // Get the router address from the first swap call (the multi_route_swap call)
          const routerAddress = swapCalls[0]?.contractAddress;
          if (!routerAddress) {
            console.error("Swap calls structure:", swapCalls);
            throw new Error(
              `Unable to determine router address from swap calls. First call: ${JSON.stringify(swapCalls[0])}`,
            );
          }

          calls.push({
            contractAddress: USDC_ADDRESS,
            entrypoint: "approve",
            calldata: [
              routerAddress,
              usdcApproval.low.toString(),
              usdcApproval.high.toString(),
            ],
          });

          // Add the swap transaction calls
          swapCalls.forEach((call) => {
            // Convert calldata to string array (Avnu SDK may return numbers)
            const calldataArray = Array.isArray(call.calldata)
              ? call.calldata.map((arg) =>
                  typeof arg === "string" ? arg : String(arg),
                )
              : [];

            calls.push({
              contractAddress: call.contractAddress,
              entrypoint: call.entrypoint,
              calldata: calldataArray,
            });
          });
        }

        const response = await account.execute(calls);
        setSettleTxnHashes((prev) => ({
          ...prev,
          [auctionId]: response.transaction_hash,
        }));

        try {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const canSettleResult = await provider.provider.callContract({
            contractAddress: AUCTION_CONTRACT_ADDRESS,
            entrypoint: "can_settle",
            calldata: [auctionId],
          });

          if (canSettleResult && canSettleResult.length > 0) {
            const canSettle = parseInt(canSettleResult[0], 16);
            setRefundedAuctions((prev) => ({
              ...prev,
              [auctionId]: canSettle === 0,
            }));
          }
        } catch (checkError) {
          console.error("Error checking can_settle:", checkError);
        }
      } catch (err) {
        console.error("Error settling auction - contract call failed:", err);
        if (err instanceof Error) {
          console.error("Error message:", err.message);
          console.error("Error stack:", err.stack);
        }
        console.error("Failed call details:", {
          contract: AUCTION_CONTRACT_ADDRESS,
          entrypoint: "settle_auction",
          auctionId: auctionId,
        });
      } finally {
        setIsSettling(null);
      }
    },
    [account, address, listings, provider],
  );

  const handleAcceptOffer = useCallback(
    async (auctionId: string, buyerAddress: string) => {
      if (!account) {
        return;
      }

      try {
        setIsAcceptingOffer(`${auctionId}-${buyerAddress}`);

        const response = await account.execute({
          contractAddress: AUCTION_CONTRACT_ADDRESS,
          entrypoint: "accept_offer",
          calldata: [auctionId, buyerAddress],
        });

        setOfferTxnHashes((prev) => ({
          ...prev,
          [`${auctionId}-accept`]: response.transaction_hash,
        }));
      } catch (err) {
        console.error("Error accepting offer:", err);
      } finally {
        setIsAcceptingOffer(null);
      }
    },
    [account],
  );

  const handleRejectOffer = useCallback(
    async (auctionId: string, buyerAddress: string) => {
      if (!account) {
        return;
      }

      try {
        setIsRejectingOffer(`${auctionId}-${buyerAddress}`);

        const response = await account.execute({
          contractAddress: AUCTION_CONTRACT_ADDRESS,
          entrypoint: "reject_offer",
          calldata: [auctionId, buyerAddress],
        });

        setOfferTxnHashes((prev) => ({
          ...prev,
          [`${auctionId}-reject`]: response.transaction_hash,
        }));
      } catch (err) {
        console.error("Error rejecting offer:", err);
      } finally {
        setIsRejectingOffer(null);
      }
    },
    [account],
  );

  const toggleOffers = useCallback((auctionId: string) => {
    setExpandedOffers((prev) => ({ ...prev, [auctionId]: !prev[auctionId] }));
  }, []);

  if (loading) {
    return (
      <section className="flex w-full flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h2 className="text-2xl font-orbitron uppercase tracking-[0.4em] text-white">
            My Listings
          </h2>
          <p className="text-sm text-[rgb(186,255,188)]/70">
            Review and manage every collection you have introduced to the Loot
            Auction habitat.
          </p>
        </header>
        <div className="flex flex-col gap-4">
          <MyListingsSkeleton />
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex w-full flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h2 className="text-2xl font-orbitron uppercase tracking-[0.4em] text-white">
            My Listings
          </h2>
          <p className="text-sm text-[rgb(186,255,188)]/70">
            Review and manage every collection you have introduced to the Loot
            Auction habitat.
          </p>
        </header>
        <div className="flex items-center justify-center py-12">
          <p className="text-red-400">
            Error loading listings: {error.message}
          </p>
        </div>
      </section>
    );
  }

  if (listings.length === 0) {
    return (
      <section className="flex w-full flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h2 className="text-2xl font-orbitron uppercase tracking-[0.4em] text-white">
            My Listings
          </h2>
          <p className="text-sm text-[rgb(186,255,188)]/70">
            Review and manage every collection you have introduced to the Loot
            Auction habitat.
          </p>
        </header>
        <div className="flex items-center justify-center py-12">
          <p className="text-[rgb(186,255,188)]/70">
            No listings found. Create your first auction to get started!
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex w-full flex-col gap-6">
      <header className="flex flex-col gap-2">
        <h2 className="text-2xl font-orbitron uppercase tracking-[0.4em] text-white">
          My Listings
        </h2>
        <p className="text-sm text-[rgb(186,255,188)]/70">
          Review and manage every collection you have introduced to the Loot
          Auction habitat.
        </p>
      </header>

      <div className="flex flex-col gap-4">
        {visibleListings.map((listing) => (
          <article
            key={listing.id}
            className="flex w-full flex-col rounded-2xl border border-[rgb(50,255,52)]/25 bg-black/40 p-5 shadow-[0_0_25px_rgba(50,255,52,0.12)] transition hover:border-[rgb(50,255,52)]/60 hover:shadow-[0_0_40px_rgba(50,255,52,0.18)]"
          >
            {/* Main content row */}
            <div className="flex w-full flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex w-full flex-1 items-center gap-4">
              <div className="relative h-16 w-16 overflow-hidden rounded-xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10">
                <Image
                  src="/logo.png"
                  alt={listing.name}
                  width={64}
                  height={64}
                  draggable={false}
                  className="h-full w-full object-cover p-2"
                />
              </div>
              <div className="flex flex-col">
                <span className="text-xs font-orbitron uppercase tracking-[0.25em] text-[rgb(186,255,188)]/70">
                  {listing.id}
                </span>
                <h3 className="text-lg font-orbitron uppercase tracking-[0.2em] text-white">
                  {truncateAuctionName(listing.name)}
                </h3>
                {(() => {
                  const timeAgo = formatTimeAgo(listing.endTime);
                  return timeAgo ? (
                    <p className="text-xs text-[rgb(186,255,188)]/70">
                      {timeAgo}
                    </p>
                  ) : null;
                })()}
              </div>
            </div>

            <div className="grid w-full max-w-[450px] grid-cols-2 gap-4 text-sm text-white md:grid-cols-3">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center min-w-[120px]">
                <p className="text-[rgb(186,255,188)]/70 text-xs uppercase tracking-[0.2em]">
                  Tokens
                </p>
                <p className="font-orbitron text-xl tracking-[0.3em]">
                  {listing.tokenCount}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center min-w-[120px]">
                <p className="text-[rgb(186,255,188)]/70 text-xs uppercase tracking-[0.2em]">
                  Reserved Price
                </p>
                <p className="font-orbitron text-base tracking-[0.3em]">
                  {formatUSDCompact(listing.startingPrice / 1e6)}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center min-w-[120px]">
                <p className="text-[rgb(186,255,188)]/70 text-xs uppercase tracking-[0.2em]">
                  Top Bid
                </p>
                <p className="font-orbitron text-base tracking-[0.3em]">
                  {listing.currentBid !== null
                    ? formatUSDCompact(listing.currentBid)
                    : "—"}
                </p>
              </div>
            </div>

            <div className="flex w-full flex-col items-stretch gap-3 sm:w-auto sm:items-end">
              <span
                className={`inline-flex items-center justify-center rounded-full px-4 py-2 text-xs font-orbitron uppercase tracking-[0.3em] ${getStatusStyle(listing.status)}`}
              >
                {getStatusLabel(listing.status)}
              </span>
              <div className="flex flex-row gap-2">
                <button
                  type="button"
                  onClick={() => handleEndAuction(listing.auctionId)}
                  disabled={
                    !account ||
                    isEndingAuction === listing.auctionId ||
                    Number(listing.status) !== 2
                  }
                  className="inline-flex items-center justify-center rounded-full border border-red-500/80 px-5 py-2 text-xs font-orbitron uppercase tracking-[0.3em] text-red-400 transition hover:cursor-pointer hover:bg-red-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEndingAuction === listing.auctionId
                    ? "Ending..."
                    : "End Auction"}
                </button>
                <button
                  type="button"
                  onClick={() => handleSettleAuction(listing.auctionId)}
                  disabled={
                    !account ||
                    isSettling === listing.auctionId ||
                    !isAuctionExpired(listing.endTime, listing.status) ||
                    Number(listing.status) === 4
                  }
                  className="inline-flex items-center justify-center rounded-full border border-orange-500/80 px-5 py-2 text-xs font-orbitron uppercase tracking-[0.3em] text-orange-400 transition hover:cursor-pointer hover:bg-orange-500 hover:text-black disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSettling === listing.auctionId
                    ? "Settling..."
                    : "Settle Bid"}
                </button>
              </div>
              {txnHashes[listing.auctionId] && (
                <a
                  href={explorer.transaction(txnHashes[listing.auctionId])}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-orbitron text-[rgb(50,255,52)] hover:underline break-all"
                >
                  View Transaction
                </a>
              )}
              {settleTxnHashes[listing.auctionId] && (
                <div className="flex flex-col gap-1">
                  {refundedAuctions[listing.auctionId] && (
                    <p className="text-xs text-[rgb(186,255,188)]/70">
                      Auction Refunded - All parties have been refunded
                    </p>
                  )}
                  <a
                    href={explorer.transaction(
                      settleTxnHashes[listing.auctionId],
                    )}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-orbitron text-orange-400 hover:underline break-all"
                  >
                    View Settle Transaction
                  </a>
                </div>
              )}
              {offerTxnHashes[`${listing.auctionId}-accept`] && (
                <a
                  href={explorer.transaction(
                    offerTxnHashes[`${listing.auctionId}-accept`],
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-orbitron text-blue-400 hover:underline break-all"
                >
                  View Accept Offer Transaction
                </a>
              )}
              {offerTxnHashes[`${listing.auctionId}-reject`] && (
                <a
                  href={explorer.transaction(
                    offerTxnHashes[`${listing.auctionId}-reject`],
                  )}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs font-orbitron text-red-400 hover:underline break-all"
                >
                  View Reject Offer Transaction
                </a>
              )}
            </div>
            </div>{/* End main content row */}

            {/* Offers section - separate row below main content */}
            {listing.offers && listing.offers.length > 0 && (
              <div className="w-full border-t border-blue-500/20 pt-4 mt-4">
                <button
                  type="button"
                  onClick={() => toggleOffers(listing.auctionId)}
                  className="flex items-center gap-2 text-sm font-orbitron uppercase tracking-[0.2em] text-blue-400 hover:text-blue-300 transition"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
                    />
                  </svg>
                  <span>{listing.offers.length} Pending Offer{listing.offers.length > 1 ? "s" : ""}</span>
                  <svg
                    className={`w-4 h-4 transition-transform ${expandedOffers[listing.auctionId] ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </button>
                {expandedOffers[listing.auctionId] && (
                  <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {listing.offers.map((offer, idx) => (
                      <div
                        key={`${offer.buyer}-${idx}`}
                        className="flex flex-col gap-3 rounded-xl border border-blue-500/30 bg-blue-500/5 p-4"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-[rgb(186,255,188)]/70 uppercase tracking-wider">
                            Offer
                          </span>
                          <span className="text-lg font-orbitron text-blue-400">
                            ${offer.amount.toFixed(2)}
                          </span>
                        </div>
                        <div className="text-xs text-[rgb(186,255,188)]/50">
                          From: <AddressDisplay address={offer.buyer} />
                        </div>
                        <div className="flex gap-2 mt-auto">
                          <button
                            type="button"
                            onClick={() =>
                              handleAcceptOffer(listing.auctionId, offer.buyer)
                            }
                            disabled={
                              isAcceptingOffer ===
                              `${listing.auctionId}-${offer.buyer}`
                            }
                            className="flex-1 inline-flex items-center justify-center rounded-lg border border-green-500/80 px-3 py-2 text-xs font-orbitron uppercase tracking-[0.15em] text-green-400 transition hover:bg-green-500 hover:text-black disabled:opacity-50"
                          >
                            {isAcceptingOffer ===
                            `${listing.auctionId}-${offer.buyer}`
                              ? "..."
                              : "Accept"}
                          </button>
                          <button
                            type="button"
                            onClick={() =>
                              handleRejectOffer(listing.auctionId, offer.buyer)
                            }
                            disabled={
                              isRejectingOffer ===
                              `${listing.auctionId}-${offer.buyer}`
                            }
                            className="flex-1 inline-flex items-center justify-center rounded-lg border border-red-500/80 px-3 py-2 text-xs font-orbitron uppercase tracking-[0.15em] text-red-400 transition hover:bg-red-500 hover:text-black disabled:opacity-50"
                          >
                            {isRejectingOffer ===
                            `${listing.auctionId}-${offer.buyer}`
                              ? "..."
                              : "Reject"}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </article>
        ))}
      </div>

      {listings.length > 0 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}
    </section>
  );
}
