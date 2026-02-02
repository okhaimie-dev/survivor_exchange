import Image from "next/image";
import moment from "moment";
import { MonsterCard, AdventurerCard } from "./cards";
import { AdventurerDetailModal } from "./modals";
import { ADVENTURER_NFT_CONTRACT_ADDRESS } from "../lib/constants";
import { useQuery } from "@apollo/client/react";
import { useAccount, useExplorer, useProvider } from "@starknet-react/core";
import { useState, useCallback, useMemo, useEffect } from "react";
import { MyListingsSkeleton } from "./skeletons";
import { AUCTION_ITEMS_BY_ID_QUERY } from "../lib/queries/auctions";
import type { AuctionItemNode } from "../lib/types/auction";
import { AddressDisplay, ReservePriceDisplay, CustomDropdown } from "./ui";
import { type FormattedListing, type FormattedOffer, useMyAdventurerNFTs } from "../hooks";
import { useToast } from "../providers/toast-provider";
import {
  AUCTION_CONTRACT_ADDRESS,
  USDC_ADDRESS,
  SUPPORTED_TOKENS,
  DEFAULT_PAGE_SIZE,
} from "../lib/constants";
import {
  formatUSDSmart,
  truncateAuctionName,
} from "../lib/utils";
import { normalizeContractAddress, normalizeTokenId, toDecimalTokenId } from "../lib/utils/normalization";
import type { FormattedNFT, AuctionItem } from "../lib/types";
import { uint256, num } from "starknet";
import { getQuotes, quoteToCalls } from "@avnu/avnu-sdk";
import { Pagination } from "./ui";

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

function formatEndTime(endTime: string): string {
  if (!endTime || endTime === "0") return "—";
  try {
    let n: number;
    if (endTime.startsWith("0x") || endTime.startsWith("0X")) {
      n = parseInt(endTime, 16);
    } else {
      n = parseInt(endTime, 10);
    }
    if (isNaN(n) || n === 0) return "—";
    return new Date(n * 1000).toLocaleString();
  } catch {
    return "—";
  }
}

interface ListingDetailModalProps {
  listing: FormattedListing;
  items: AuctionItem[];
  itemsLoading?: boolean;
  nfts?: FormattedNFT[];
  onClose: () => void;
  inBattleByTokenId?: Record<string, boolean>;
  /** When user clicks an adventurer card, open adventurer detail modal (view-only: stats, inventory, level, xp, score) */
  onAdventurerCardClick?: (nft: FormattedNFT, index: number, nfts: FormattedNFT[]) => void;
}

function ListingDetailModal({ listing, items, itemsLoading = false, nfts = [], onClose, inBattleByTokenId = {}, onAdventurerCardClick }: ListingDetailModalProps) {
  const findNft = useCallback(
    (item: AuctionItem): FormattedNFT | undefined => {
      const contractNorm = normalizeContractAddress(item.contract_address).toLowerCase();
      const tokenNorm = normalizeTokenId(item.token_id);
      return nfts.find(
        (nft) =>
          normalizeContractAddress(nft.contractAddress).toLowerCase() === contractNorm &&
          normalizeTokenId(nft.tokenId) === tokenNorm
      );
    },
    [nfts]
  );

  const adventurerNftsFromListing = useMemo(() => {
    const adventurerContract = normalizeContractAddress(ADVENTURER_NFT_CONTRACT_ADDRESS).toLowerCase();
    return items
      .filter((item) => normalizeContractAddress(item.contract_address).toLowerCase() === adventurerContract)
      .map((item) => findNft(item))
      .filter((n): n is FormattedNFT => n != null);
  }, [items, findNft]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="listing-detail-title"
    >
      <div
        className="flex max-h-[90vh] w-full max-w-6xl flex-col rounded-xl border border-[rgb(50,255,52)]/30 bg-black shadow-xl overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-4 py-3 shrink-0">
          <h2 id="listing-detail-title" className="text-sm font-orbitron uppercase tracking-wider text-white">
            {truncateAuctionName(listing.name)}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded p-1 text-white/60 hover:text-white hover:bg-white/10 transition"
            aria-label="Close"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-[10px]">
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-[rgb(186,255,188)]/50 uppercase tracking-wider">ID</p>
              <p className="font-orbitron text-white">{listing.id}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-[rgb(186,255,188)]/50 uppercase tracking-wider">Status</p>
              <p className={`font-orbitron ${getStatusStyle(listing.status)} rounded px-1 py-0.5 inline-block`}>
                {getStatusLabel(listing.status)}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-[rgb(186,255,188)]/50 uppercase tracking-wider">Reserve</p>
              <p className="font-orbitron text-[rgb(50,255,52)]">
                <ReservePriceDisplay value={listing.startingPrice} symbol={listing.reserveTokenSymbol} symbolClassName="text-[0.9em] opacity-90" />
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-[rgb(186,255,188)]/50 uppercase tracking-wider">Top bid</p>
              <p className="font-orbitron text-white">
                {listing.currentBid != null && listing.currentBid > 0 ? (
                  <ReservePriceDisplay value={listing.currentBid} symbol={listing.reserveTokenSymbol} symbolClassName="text-[0.9em] opacity-90" />
                ) : "—"}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-[rgb(186,255,188)]/50 uppercase tracking-wider">End time</p>
              <p className="font-orbitron text-white/90">{formatEndTime(listing.endTime)}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2">
              <p className="text-[rgb(186,255,188)]/50 uppercase tracking-wider">Tokens</p>
              <p className="font-orbitron text-white">{items.length}</p>
            </div>
          </div>

          <div>
            <p className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/70 mb-3">
              Tokens in this listing
            </p>
            {itemsLoading ? (
              <p className="text-[10px] text-[rgb(186,255,188)]/60 py-4 flex items-center gap-2">
                <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[rgb(50,255,52)] border-t-transparent" />
                Loading tokens…
              </p>
            ) : items.length === 0 ? (
              <p className="text-[10px] text-[rgb(186,255,188)]/50 py-2">No token data for this auction.</p>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 w-full">
                {items.map((item, idx) => {
                  const nft = findNft(item);
                  const isAdventurer =
                    normalizeContractAddress(item.contract_address).toLowerCase() ===
                    normalizeContractAddress(ADVENTURER_NFT_CONTRACT_ADDRESS).toLowerCase();
                  if (nft) {
                    const CardComponent = isAdventurer ? AdventurerCard : MonsterCard;
                    const dec = toDecimalTokenId(item.token_id ?? nft.tokenId);
                    const norm = normalizeTokenId(item.token_id ?? nft.tokenId);
                    const inBattle = isAdventurer && (inBattleByTokenId[dec] === true || inBattleByTokenId[norm] === true);
                    return (
                      <div key={`${item.auction_id}-${item.token_id}-${item.item_index}-${idx}`}>
                        <CardComponent
                          nft={nft}
                          selected={false}
                          onToggle={() => {}}
                          onInfoClick={
                            isAdventurer && onAdventurerCardClick
                              ? () => {
                                  const index = adventurerNftsFromListing.findIndex(
                                    (a) => normalizeTokenId(a.tokenId) === normalizeTokenId(nft.tokenId)
                                  );
                                  onAdventurerCardClick(nft, index >= 0 ? index : 0, adventurerNftsFromListing);
                                }
                              : undefined
                          }
                          price={listing.startingPrice}
                          auctionName={listing.name}
                          listed={true}
                          inBattle={isAdventurer ? inBattle : undefined}
                          {...(isAdventurer ? { priceLabel: "Price" as const } : {})}
                        />
                      </div>
                    );
                  }
                  return (
                    <div
                      key={`${item.auction_id}-${item.token_id}-${item.item_index}-${idx}`}
                      className="flex flex-col gap-2 md:gap-4 overflow-hidden rounded-xl md:rounded-2xl border border-[rgb(50,255,52)]/15 bg-black/70 p-3 md:p-4 min-h-[200px] justify-center items-center"
                    >
                      <div className="aspect-square w-full max-w-[120px] rounded-lg border border-[rgb(50,255,52)]/20 bg-black/40 flex items-center justify-center">
                        <Image src="/logo.png" alt="" width={40} height={40} className="opacity-50" />
                      </div>
                      <p className="text-xs font-orbitron text-white">Token #{item.token_id}</p>
                      <p className="text-[10px] text-[rgb(186,255,188)]/50">No metadata</p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

interface MyListingsProps {
  listings: FormattedListing[];
  loading: boolean;
  error: Error | null;
  getAuctionItems?: (auctionId: string) => AuctionItem[];
  nfts?: FormattedNFT[];
  onRefresh?: () => Promise<unknown>;
}

export default function MyListings({
  listings,
  loading,
  error,
  getAuctionItems,
  nfts = [],
  onRefresh,
}: MyListingsProps) {
  const { account, address } = useAccount();
  const explorer = useExplorer();
  const provider = useProvider();
  const toast = useToast();
  const { nfts: adventurerNfts } = useMyAdventurerNFTs();
  const allNftsForModal = useMemo(
    () => [...(nfts || []), ...(adventurerNfts || [])],
    [nfts, adventurerNfts]
  );
  const [selectedListing, setSelectedListing] = useState<FormattedListing | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
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
  const [inBattleByTokenId, setInBattleByTokenId] = useState<Record<string, boolean>>({});
  const [listingsSort, setListingsSort] = useState<string>("time-ending-soon");
  const [listingsFilter, setListingsFilter] = useState<"all" | "active" | "inactive">("all");
  const [adventurerModalOpen, setAdventurerModalOpen] = useState(false);
  const [adventurerModalNfts, setAdventurerModalNfts] = useState<FormattedNFT[]>([]);
  const [adventurerModalIndex, setAdventurerModalIndex] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const handleRefresh = useCallback(async () => {
    if (!onRefresh) return;
    setIsRefreshing(true);
    try {
      await onRefresh();
    } finally {
      setIsRefreshing(false);
    }
  }, [onRefresh]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/adventurer-attributes", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : {}))
      .then((data: Record<string, boolean>) => {
        if (!cancelled) setInBattleByTokenId(data ?? {});
      })
      .catch(() => {
        if (!cancelled) setInBattleByTokenId({});
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const openListingDetail = useCallback((listing: FormattedListing) => {
    setSelectedListing(listing);
    setIsDetailModalOpen(true);
  }, []);

  const closeListingDetail = useCallback(() => {
    setIsDetailModalOpen(false);
    setSelectedListing(null);
  }, []);

  const handleAdventurerCardClick = useCallback((nft: FormattedNFT, index: number, nfts: FormattedNFT[]) => {
    setAdventurerModalNfts(nfts);
    setAdventurerModalIndex(index);
    setAdventurerModalOpen(true);
  }, []);

  const closeAdventurerModal = useCallback(() => {
    setAdventurerModalOpen(false);
    setAdventurerModalNfts([]);
    setAdventurerModalIndex(0);
  }, []);

  const auctionIdInt = selectedListing ? parseInt(selectedListing.auctionId, 10) : 0;
  const { data: auctionItemsData, loading: auctionItemsLoading } = useQuery<{ bm021AuctionItemModels: { edges: AuctionItemNode[] } }>(
    AUCTION_ITEMS_BY_ID_QUERY,
    {
      variables: { auctionId: isNaN(auctionIdInt) ? 0 : auctionIdInt },
      skip: !selectedListing || !isDetailModalOpen,
      fetchPolicy: "cache-and-network",
    }
  );

  const selectedListingItems = useMemo((): AuctionItem[] => {
    if (!auctionItemsData?.bm021AuctionItemModels?.edges?.length) {
      return [];
    }
    return auctionItemsData.bm021AuctionItemModels.edges.map((e) => e.node);
  }, [auctionItemsData]);

  useEffect(() => {
    setCurrentPage(1);
  }, [listings]);

  useEffect(() => {
    setCurrentPage(1);
  }, [listingsSort]);

  useEffect(() => {
    setCurrentPage(1);
  }, [listingsFilter]);

  const parseEndTimeNum = useCallback((endTime: string): number => {
    if (!endTime || endTime === "0") return 0;
    if (endTime.startsWith("0x") || endTime.startsWith("0X")) return parseInt(endTime, 16);
    return parseInt(endTime, 10);
  }, []);

  const filteredListings = useMemo(() => {
    if (listingsFilter === "all") return listings;
    if (listingsFilter === "active") return listings.filter((l) => String(l.status) === "2");
    return listings.filter((l) => String(l.status) !== "2");
  }, [listings, listingsFilter]);

  const sortedListings = useMemo(() => {
    const arr = [...filteredListings];
    if (listingsSort === "price-high-low") {
      arr.sort((a, b) => {
        const priceA = a.currentBid ?? a.startingPrice ?? 0;
        const priceB = b.currentBid ?? b.startingPrice ?? 0;
        return priceB - priceA;
      });
    } else if (listingsSort === "price-low-high") {
      arr.sort((a, b) => {
        const priceA = a.currentBid ?? a.startingPrice ?? 0;
        const priceB = b.currentBid ?? b.startingPrice ?? 0;
        return priceA - priceB;
      });
    } else if (listingsSort === "time-ending-soon") {
      arr.sort((a, b) => parseEndTimeNum(a.endTime) - parseEndTimeNum(b.endTime));
    } else if (listingsSort === "time-newest") {
      arr.sort((a, b) => parseEndTimeNum(b.endTime) - parseEndTimeNum(a.endTime));
    }
    return arr;
  }, [filteredListings, listingsSort, parseEndTimeNum]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(sortedListings.length / DEFAULT_PAGE_SIZE)),
    [sortedListings.length],
  );

  const visibleListings = useMemo(() => {
    const startIndex = (currentPage - 1) * DEFAULT_PAGE_SIZE;
    return sortedListings.slice(startIndex, startIndex + DEFAULT_PAGE_SIZE);
  }, [currentPage, sortedListings]);

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

        toast.success("Auction ended", "Transaction submitted successfully");
      } catch (err) {
        console.error("Error ending auction - contract call failed:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        toast.error("Failed to end auction", errorMessage);
      } finally {
        setIsEndingAuction(null);
      }
    },
    [account, toast],
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

          toast.success("Auction settled", "NFTs have been returned");

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
          const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
          toast.error("Failed to settle auction", errorMessage);
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

        toast.success("Auction settled", "Transaction submitted successfully");

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
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        toast.error("Failed to settle auction", errorMessage);
      } finally {
        setIsSettling(null);
      }
    },
    [account, address, listings, provider, toast],
  );

  const handleAcceptOffer = useCallback(
    async (auctionId: string, buyerAddress: string) => {
      if (!account) {
        toast.warning("Wallet not connected", "Please connect your wallet to accept offers");
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

        toast.success("Offer accepted", "Transaction submitted successfully");
      } catch (err) {
        console.error("Error accepting offer:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        toast.error("Failed to accept offer", errorMessage);
      } finally {
        setIsAcceptingOffer(null);
      }
    },
    [account, toast],
  );

  const handleRejectOffer = useCallback(
    async (auctionId: string, buyerAddress: string) => {
      if (!account) {
        toast.warning("Wallet not connected", "Please connect your wallet to reject offers");
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

        toast.success("Offer rejected", "Transaction submitted successfully");
      } catch (err) {
        console.error("Error rejecting offer:", err);
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        toast.error("Failed to reject offer", errorMessage);
      } finally {
        setIsRejectingOffer(null);
      }
    },
    [account, toast],
  );

  const toggleOffers = useCallback((auctionId: string) => {
    setExpandedOffers((prev) => ({ ...prev, [auctionId]: !prev[auctionId] }));
  }, []);

  if (loading) {
    return (
      <section className="flex w-full flex-col gap-4">
        <header className="flex items-baseline justify-between gap-2 border-b border-white/10 pb-2">
          <h2 className="text-sm font-orbitron uppercase tracking-widest text-white">
            My Listings
          </h2>
        </header>
        <MyListingsSkeleton />
      </section>
    );
  }

  if (error) {
    return (
      <section className="flex w-full flex-col gap-4">
        <header className="flex items-baseline justify-between gap-2 border-b border-white/10 pb-2">
          <h2 className="text-sm font-orbitron uppercase tracking-widest text-white">
            My Listings
          </h2>
        </header>
        <p className="text-xs text-red-400 py-4">
          Error loading listings: {error.message}
        </p>
      </section>
    );
  }

  if (listings.length === 0) {
    return (
      <section className="flex w-full flex-col gap-4">
        <header className="flex items-baseline justify-between gap-2 border-b border-white/10 pb-2">
          <h2 className="text-sm font-orbitron uppercase tracking-widest text-white">
            My Listings
          </h2>
        </header>
        <div className="flex flex-col items-center justify-center py-8 gap-3 text-center">
          <p className="text-xs text-[rgb(186,255,188)]/70">
            No listings yet. Switch to Sell to list your first collection.
          </p>
        </div>
      </section>
    );
  }

  return (
    <section className="flex w-full flex-col gap-3">
      <header className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-2">
        <h2 className="text-sm font-orbitron uppercase tracking-widest text-white">
          My Listings
        </h2>
        <div className="flex flex-wrap items-center gap-2 md:gap-3">
          <div className="flex items-center rounded-lg border border-[rgb(50,255,52)]/20 overflow-hidden shrink-0">
            <button
              type="button"
              onClick={() => setListingsFilter("all")}
              className={`px-2.5 py-1.5 text-[10px] font-orbitron uppercase tracking-wider transition ${
                listingsFilter === "all"
                  ? "bg-[rgb(50,255,52)]/20 text-[rgb(50,255,52)]"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              All
            </button>
            <button
              type="button"
              onClick={() => setListingsFilter("active")}
              className={`px-2.5 py-1.5 text-[10px] font-orbitron uppercase tracking-wider transition border-l border-[rgb(50,255,52)]/20 ${
                listingsFilter === "active"
                  ? "bg-[rgb(50,255,52)]/20 text-[rgb(50,255,52)]"
                  : "text-white/70 hover:text-white hover:bg-white/5"
              }`}
            >
              Active
            </button>
            <button
              type="button"
              onClick={() => setListingsFilter("inactive")}
              className={`px-2.5 py-1.5 text-[10px] font-orbitron uppercase tracking-wider transition border-l border-blue-400/30 ${
                listingsFilter === "inactive"
                  ? "bg-blue-400/20 text-blue-300 border-blue-400/50 ring-1 ring-blue-400/40"
                  : "text-white/70 hover:text-blue-300 hover:bg-blue-400/10"
              }`}
            >
              Settled
            </button>
          </div>
          <CustomDropdown
            id="sort-my-listings"
            value={listingsSort}
            onChange={setListingsSort}
            options={[
              { value: "time-ending-soon", label: "Ending soon" },
              { value: "time-newest", label: "Newest" },
              { value: "price-high-low", label: "Price ↓" },
              { value: "price-low-high", label: "Price ↑" },
            ]}
            variant="bar"
          />
          {onRefresh && (
            <button
              type="button"
              onClick={handleRefresh}
              disabled={loading || isRefreshing}
              className="inline-flex items-center justify-center gap-2 rounded-full border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-4 py-2 text-xs font-orbitron uppercase tracking-[0.14em] text-[rgb(50,255,52)] transition hover:bg-[rgb(50,255,52)]/20 hover:cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
              title="Reload listings"
            >
              {(loading || isRefreshing) ? (
                <>
                  <span className="inline-block h-3 w-3 animate-spin rounded-full border-2 border-[rgb(50,255,52)] border-t-transparent" />
                  Refreshing...
                </>
              ) : (
                <>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="h-3.5 w-3.5">
                    <path d="M21 12a9 9 0 0 0-9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                    <path d="M3 12a9 9 0 0 0 9 9 9.75 9.75 0 0 0 6.74-2.74L21 16" />
                    <path d="M16 21h5v-5" />
                  </svg>
                  Refresh
                </>
              )}
            </button>
          )}
          <span className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/60 shrink-0">
            {filteredListings.length} listing{filteredListings.length !== 1 ? "s" : ""}
          </span>
        </div>
      </header>

      <div className="flex flex-col gap-2">
        {visibleListings.map((listing) => (
          <article
            key={listing.id}
            onClick={() => openListingDetail(listing)}
            className="flex flex-col rounded-xl border border-[rgb(50,255,52)]/20 bg-white/[0.02] p-3 transition hover:border-[rgb(50,255,52)]/40 cursor-pointer"
          >
            <div className="flex flex-wrap items-center gap-3 gap-y-2">
              <div className="flex items-center gap-2 min-w-0 flex-1">
                <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-lg border border-[rgb(50,255,52)]/30 bg-[rgb(50,255,52)]/5">
                  <Image
                    src="/logo.png"
                    alt=""
                    width={40}
                    height={40}
                    draggable={false}
                    className="h-full w-full object-cover p-1"
                  />
                </div>
                <div className="min-w-0">
                  <p className="text-[10px] font-orbitron uppercase tracking-wider text-[rgb(186,255,188)]/60 truncate">
                    {listing.id}
                  </p>
                  <p className="text-xs font-orbitron text-white truncate">
                    {truncateAuctionName(listing.name)}
                  </p>
                  {formatTimeAgo(listing.endTime) && (
                    <p className="text-[10px] text-[rgb(186,255,188)]/50">
                      {formatTimeAgo(listing.endTime)}
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-center gap-4 text-[10px]">
                <div className="text-center">
                  <p className="text-[rgb(186,255,188)]/50 uppercase tracking-wider">Tokens</p>
                  <p className="font-orbitron text-white">{listing.tokenCount}</p>
                </div>
                <div className="text-center">
                  <p className="text-[rgb(186,255,188)]/50 uppercase tracking-wider">Reserve</p>
                  <p className="font-orbitron text-[rgb(50,255,52)]">
                    <ReservePriceDisplay value={listing.startingPrice} symbol={listing.reserveTokenSymbol} symbolClassName="text-[0.9em] opacity-90" />
                  </p>
                </div>
                <div className="text-center">
                  <p className="text-[rgb(186,255,188)]/50 uppercase tracking-wider">Top bid</p>
                  <p className="font-orbitron text-white">
                    {listing.currentBid != null && listing.currentBid > 0 ? (
                      <ReservePriceDisplay value={listing.currentBid} symbol={listing.reserveTokenSymbol} symbolClassName="text-[0.9em] opacity-90" />
                    ) : "—"}
                  </p>
                </div>
              </div>

              <span
                className={`shrink-0 rounded px-2 py-0.5 text-[10px] font-orbitron uppercase ${getStatusStyle(listing.status)}`}
              >
                {getStatusLabel(listing.status)}
              </span>

              <div className="flex items-center gap-1.5 shrink-0" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => handleEndAuction(listing.auctionId)}
                  disabled={
                    !account ||
                    isEndingAuction === listing.auctionId ||
                    Number(listing.status) !== 2
                  }
                  className="rounded border border-red-500/60 px-2 py-1 text-[10px] font-orbitron uppercase text-red-400 hover:bg-red-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isEndingAuction === listing.auctionId ? "…" : "End"}
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
                  className="rounded border border-orange-500/60 px-2 py-1 text-[10px] font-orbitron uppercase text-orange-400 hover:bg-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSettling === listing.auctionId ? "…" : "Settle"}
                </button>
              </div>
            </div>

            <div onClick={(e) => e.stopPropagation()}>
            {(txnHashes[listing.auctionId] || settleTxnHashes[listing.auctionId] || offerTxnHashes[`${listing.auctionId}-accept`] || offerTxnHashes[`${listing.auctionId}-reject`]) && (
              <div className="mt-2 flex flex-wrap gap-2 border-t border-white/5 pt-2">
                {txnHashes[listing.auctionId] && (
                  <a
                    href={explorer.transaction(txnHashes[listing.auctionId])}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-orbitron text-[rgb(50,255,52)] hover:underline"
                  >
                    End tx
                  </a>
                )}
                {settleTxnHashes[listing.auctionId] && (
                  <>
                    {refundedAuctions[listing.auctionId] && (
                      <span className="text-[10px] text-[rgb(186,255,188)]/70">Refunded</span>
                    )}
                    <a
                      href={explorer.transaction(settleTxnHashes[listing.auctionId])}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[10px] font-orbitron text-orange-400 hover:underline"
                    >
                      Settle tx
                    </a>
                  </>
                )}
                {offerTxnHashes[`${listing.auctionId}-accept`] && (
                  <a
                    href={explorer.transaction(offerTxnHashes[`${listing.auctionId}-accept`])}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-orbitron text-blue-400 hover:underline"
                  >
                    Accept tx
                  </a>
                )}
                {offerTxnHashes[`${listing.auctionId}-reject`] && (
                  <a
                    href={explorer.transaction(offerTxnHashes[`${listing.auctionId}-reject`])}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[10px] font-orbitron text-red-400 hover:underline"
                  >
                    Reject tx
                  </a>
                )}
              </div>
            )}

            </div>
            {listing.offers && listing.offers.length > 0 && (
              <div className="mt-2 border-t border-white/5 pt-2" onClick={(e) => e.stopPropagation()}>
                <button
                  type="button"
                  onClick={() => toggleOffers(listing.auctionId)}
                  className="flex items-center gap-1.5 text-[10px] font-orbitron uppercase tracking-wider text-blue-400 hover:text-blue-300"
                >
                  <svg className="w-3 h-3 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                  </svg>
                  {listing.offers.length} offer{listing.offers.length > 1 ? "s" : ""}
                  <svg
                    className={`w-3 h-3 transition-transform ${expandedOffers[listing.auctionId] ? "rotate-180" : ""}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {expandedOffers[listing.auctionId] && (
                  <div className="mt-2 flex flex-col gap-1.5">
                    {listing.offers.map((offer, idx) => (
                      <div
                        key={`${offer.buyer}-${idx}`}
                        className="flex items-center justify-between gap-2 rounded-lg border border-blue-500/20 bg-blue-500/5 px-2 py-1.5"
                      >
                        <div className="min-w-0 flex-1">
                          <span className="text-[10px] font-orbitron text-blue-400">
                            {formatUSDSmart(offer.amount)}
                          </span>
                          <span className="ml-1.5 text-[10px] text-[rgb(186,255,188)]/50 truncate block">
                            <AddressDisplay address={offer.buyer} />
                          </span>
                        </div>
                        <div className="flex gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => handleAcceptOffer(listing.auctionId, offer.buyer)}
                            disabled={isAcceptingOffer === `${listing.auctionId}-${offer.buyer}`}
                            className="rounded border border-green-500/60 px-1.5 py-0.5 text-[10px] font-orbitron text-green-400 hover:bg-green-500/20 disabled:opacity-50"
                          >
                            {isAcceptingOffer === `${listing.auctionId}-${offer.buyer}` ? "…" : "Accept"}
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectOffer(listing.auctionId, offer.buyer)}
                            disabled={isRejectingOffer === `${listing.auctionId}-${offer.buyer}`}
                            className="rounded border border-red-500/60 px-1.5 py-0.5 text-[10px] font-orbitron text-red-400 hover:bg-red-500/20 disabled:opacity-50"
                          >
                            {isRejectingOffer === `${listing.auctionId}-${offer.buyer}` ? "…" : "Reject"}
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

      {totalPages > 1 && (
        <div className="flex justify-center pt-2">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
          />
        </div>
      )}

      {isDetailModalOpen && selectedListing && (
        <ListingDetailModal
          listing={selectedListing}
          items={selectedListingItems}
          itemsLoading={auctionItemsLoading}
          nfts={allNftsForModal}
          onClose={closeListingDetail}
          inBattleByTokenId={inBattleByTokenId}
          onAdventurerCardClick={handleAdventurerCardClick}
        />
      )}

      {adventurerModalOpen && adventurerModalNfts.length > 0 && (
        <AdventurerDetailModal
          isOpen={adventurerModalOpen}
          onClose={closeAdventurerModal}
          nfts={adventurerModalNfts}
          currentIndex={adventurerModalIndex}
          onNavigate={setAdventurerModalIndex}
          viewOnly
        />
      )}
    </section>
  );
}
