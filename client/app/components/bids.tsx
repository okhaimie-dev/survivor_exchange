import React, { useCallback, useMemo, useState, useEffect, useRef } from "react";
import { useAccount, useExplorer, useProvider } from "@starknet-react/core";
import Image from "next/image";
import MonsterCollectionCard from "./monster-collection-card";
import Pagination from "./pagination";
import Filters, { FilterState } from "./filters";
import BidPriceChart from "./bid-price-chart";
import BidsSkeleton from "./bids-skeleton";
import CustomDropdown from "./custom-dropdown";
import InfoTooltip from "./info-tooltip";
import BeastDetailModal from "./beast-detail-modal";
import AddressDisplay from "./address-display";
import { useWalletModal } from "../providers/wallet-modal-provider";
import type { AuctionItem } from "../lib/types";
import { AuctionWithNFTs } from "../hooks/use-auctions";
import { useBeastSkullRewards } from "../hooks/use-beast-skull-rewards";
import { useSummitLeaderboard, findMatchingSummitBeast, SummitBeast } from "../hooks/use-summit-leaderboard";
import { uint256 } from "starknet";
import {
  formatUSD,
  formatUSDSmart,
  formatTokenAmount,
  truncateAuctionName,
} from "../lib/utils";
import { applyFiltersToAuctions } from "../lib/filter-utils";
import {
  AUCTION_CONTRACT_ADDRESS,
  VAULT_CONTRACT_ADDRESS,
  DEFAULT_PAGE_SIZE,
  IMAGE_BASE_URL,
  SUPPORTED_TOKENS,
  USDC_ADDRESS,
} from "../lib/constants";
import { fetchTokens, getQuotes, quoteToCalls } from "@avnu/avnu-sdk";
import { normalizeContractAddress } from "../lib/utils/normalization";
import {
  getTokenPriceInUSDC,
  shouldRefetchPrice,
} from "../lib/utils/token-price-cache";

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

type Collection = {
  id: string;
  name: string;
  totalMonsters: number;
  startingPrice: number;
  highestBid?: number;
  image: string;
  status: string;
  endTime: string;
  sellerFull: string;
  highestBidderFull: string;
  executedAt?: string;
};

interface BidsProps {
  auctions: AuctionWithNFTs[];
  loading: boolean;
  error: Error | null;
  currentPage: number;
  totalPages: number;
  setCurrentPage: (page: number) => void;
  getAuctionItems: (auctionId: string) => AuctionItem[];
  token: string | null;
}

export default function Bids({
  auctions,
  loading,
  error,
  currentPage,
  setCurrentPage,
  token,
}: BidsProps) {
  const { account, address } = useAccount();
  const explorer = useExplorer();
  const provider = useProvider();
  const { openWalletModal } = useWalletModal();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txnHash, setTxnHash] = useState<string | undefined>();
  const [insufficientFundsError, setInsufficientFundsError] = useState<
    string | null
  >(null);
  const [isSettling, setIsSettling] = useState(false);
  const [settleTxnHash, setSettleTxnHash] = useState<string | undefined>();
  const [isRefunded, setIsRefunded] = useState(false);
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [offerTxnHash, setOfferTxnHash] = useState<string | undefined>();
  const [userOffer, setUserOffer] = useState<{
    buyer: string;
    amount: number;
    status: string;
    createdAt: string;
    expiresAt: string;
  } | null>(null);
  const [isWithdrawingOffer, setIsWithdrawingOffer] = useState(false);
  const [withdrawOfferTxnHash, setWithdrawOfferTxnHash] = useState("");
  const [filters, setFilters] = useState<FilterState>({
    id: "",
    search: "",
    beast: "",
    type: "",
    tier: "",
    levelMin: "",
    levelMax: "",
    powerMin: "",
    powerMax: "",
    rankMin: "",
    rankMax: "",
    shiny: "",
    animated: "",
    priceSort: "",
    tokenIdSort: "",
    summitTop15: "",
  });

  const [localCurrentPage, setLocalCurrentPage] = useState(currentPage);

  // Fetch top 15 summit beasts by blocks held (must be before filteredAuctions)
  const { topBeasts: summitTopBeasts, error: summitError } = useSummitLeaderboard(15);

  // Helper to check if auction contains any summit beasts (by token ID or prefix+suffix)
  const auctionHasSummitBeast = useCallback((auction: AuctionWithNFTs) => {
    if (!summitTopBeasts.length || !auction.nfts?.length) {
      return false;
    }

    return auction.nfts.some(nft => {
      const tokenId = nft.tokenId.startsWith("0x")
        ? parseInt(nft.tokenId, 16)
        : parseInt(nft.tokenId);
      const prefixAttr = nft.attributes?.find(a => a.trait_type === "Prefix")?.value;
      const suffixAttr = nft.attributes?.find(a => a.trait_type === "Suffix")?.value;
      const prefix = prefixAttr !== undefined ? String(prefixAttr) : undefined;
      const suffix = suffixAttr !== undefined ? String(suffixAttr) : undefined;
      const beastName = nft.beastName;

      return findMatchingSummitBeast(prefix, suffix, beastName, tokenId, summitTopBeasts) !== null;
    });
  }, [summitTopBeasts]);

  // Count auctions containing summit beasts (for the button badge)
  // Returns 0 if summit API failed to hide the feature gracefully
  const summitListedCount = useMemo(() => {
    if (summitError) return 0;
    return auctions.filter(auction => auctionHasSummitBeast(auction)).length;
  }, [auctions, auctionHasSummitBeast, summitError]);

  const filteredAuctions = useMemo(() => {
    let result = applyFiltersToAuctions(auctions, filters);

    // Apply summit filter if active - show ONLY auctions with top 15 beasts
    if (filters.summitTop15) {
      // If summit data not loaded yet, show nothing
      if (summitTopBeasts.length === 0) {
        return [];
      }
      // Filter to only auctions containing summit beasts (by token ID or prefix+suffix)
      result = result.filter(auction => auctionHasSummitBeast(auction));
    }

    return result;
  }, [auctions, filters, summitTopBeasts, auctionHasSummitBeast]);

  const totalFilteredPages = useMemo(() => {
    return Math.max(1, Math.ceil(filteredAuctions.length / DEFAULT_PAGE_SIZE));
  }, [filteredAuctions.length]);

  const paginatedFilteredAuctions = useMemo(() => {
    const startIndex = (localCurrentPage - 1) * DEFAULT_PAGE_SIZE;
    return filteredAuctions.slice(startIndex, startIndex + DEFAULT_PAGE_SIZE);
  }, [filteredAuctions, localCurrentPage]);

  useEffect(() => {
    setLocalCurrentPage(1);
  }, [filters]);

  useEffect(() => {
    setLocalCurrentPage(currentPage);
  }, [currentPage]);

  useEffect(() => {
    const loadLogos = async () => {
      try {
        const page = await fetchTokens({ page: 0, size: 100 });
        const logos: Record<string, string> = {};
        SUPPORTED_TOKENS.forEach((token) => {
          const normalizedSupported = normalizeContractAddress(token.address);
          const match = page.content.find(
            (t) => normalizeContractAddress(t.address) === normalizedSupported,
          );
          if (match && match.logoUri) {
            logos[token.address] = match.logoUri;
          }
        });
        setTokenLogos(logos);
      } catch (error) {
        console.error("Failed to fetch token logos:", error);
      }
    };
    loadLogos();
  }, []);

  const collections: Collection[] = useMemo(() => {
    return paginatedFilteredAuctions.map((auction) => {
      // Parse starting_price - handle both decimal and hex strings
      const startingPriceStr = auction.starting_price || "0";
      const startingPrice =
        startingPriceStr.startsWith("0x") || startingPriceStr.startsWith("0X")
          ? parseInt(startingPriceStr, 16)
          : parseFloat(startingPriceStr);

      // Parse current_bid - handle both decimal and hex strings, then divide by 1e6
      const highestBid = auction.current_bid
        ? (() => {
            const bidStr = auction.current_bid;
            const parsed =
              bidStr.startsWith("0x") || bidStr.startsWith("0X")
                ? parseInt(bidStr, 16)
                : parseFloat(bidStr);
            return parsed / 1e6;
          })()
        : undefined;

      return {
        id: auction.auction_id,
        name: truncateAuctionName(auction.name),
        totalMonsters: parseInt(auction.item_count) || 0,
        startingPrice,
        highestBid,
        image: "/logo.png",
        status: auction.status,
        endTime: auction.end_time,
        sellerFull: auction.seller,
        highestBidderFull: auction.highest_bidder,
        executedAt: auction.executedAt,
      };
    });
  }, [paginatedFilteredAuctions]);

  const [selectedCollectionId, setSelectedCollectionId] = useState<string>(
    collections[0]?.id ?? "",
  );
  const [bidAmountToken, setBidAmountToken] = useState<string>("");
  const [bidInputHighlight, setBidInputHighlight] = useState(false);
  const [paymentToken, setPaymentToken] = useState(USDC_ADDRESS);
  const [tokenLogos, setTokenLogos] = useState<Record<string, string>>({});
  const [, setConvertedStartingPrice] = useState<number>(0);
  const [, setConvertedHighestBid] = useState<number | undefined>(undefined);
  const [, setIsConvertingPrices] = useState(false);
  const [tokenPrice, setTokenPrice] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);
  const [, setCopiedTimeout] = useState<NodeJS.Timeout | null>(null);
  const [imageStatus, setImageStatus] = useState<'idle' | 'loading' | 'copied' | 'downloaded'>('idle');
  const [isBeastModalOpen, setIsBeastModalOpen] = useState(false);
  const [selectedBeastIndex, setSelectedBeastIndex] = useState(0);
  const [tokenBalances, setTokenBalances] = useState<
    Record<string, { amount: string; usdValue: string | null }>
  >({});

  const priceRetryIntervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (selectedCollectionId && detailRef.current) {
      // Small delay to ensure the DOM has rendered the details
      const timer = setTimeout(() => {
        detailRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "center",
        });
      }, 100);
      return () => clearTimeout(timer);
    }
  }, [selectedCollectionId]);
  const nftCarouselRef = useRef<HTMLDivElement>(null);
  const detailRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);
  const [countdown, setCountdown] = useState<{
    days: number;
    hours: number;
    minutes: number;
    seconds: number;
  } | null>(null);

  const checkScrollButtons = useCallback(() => {
    const carousel = nftCarouselRef.current;
    if (!carousel) {
      setCanScrollLeft(false);
      setCanScrollRight(false);
      return;
    }

    const hasScroll = carousel.scrollWidth > carousel.clientWidth;
    setCanScrollLeft(hasScroll && carousel.scrollLeft > 0);
    setCanScrollRight(
      hasScroll &&
        carousel.scrollLeft < carousel.scrollWidth - carousel.clientWidth - 1,
    );
  }, []);

  const scrollNFTs = useCallback((direction: "left" | "right") => {
    const carousel = nftCarouselRef.current;
    if (!carousel) return;

    const scrollAmount = 120; // Width of one NFT card + gap
    const scrollDirection = direction === "left" ? -scrollAmount : scrollAmount;

    carousel.scrollBy({
      left: scrollDirection,
      behavior: "smooth",
    });
  }, []);

  // Check scroll buttons when selected collection changes
  useEffect(() => {
    // Small delay to ensure DOM is updated
    const timer = setTimeout(() => {
      checkScrollButtons();
    }, 100);

    // Also check on window resize
    const handleResize = () => {
      checkScrollButtons();
    };
    window.addEventListener("resize", handleResize);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("resize", handleResize);
    };
  }, [selectedCollectionId, checkScrollButtons]);

  const selectedCollection = useMemo(
    () =>
      collections.find((collection) => collection.id === selectedCollectionId),
    [selectedCollectionId, collections],
  );

  // Get NFTs for the selected auction (for modal)
  const selectedAuctionNfts = useMemo(() => {
    if (!selectedCollectionId) return [];
    const auction = paginatedFilteredAuctions.find(
      (a) => a.auction_id === selectedCollectionId,
    );
    return auction?.nfts || [];
  }, [selectedCollectionId, paginatedFilteredAuctions]);

  // Prepare beast metadata for skull rewards hook
  const selectedAuctionBeastData = useMemo(() => {
    if (!selectedCollectionId) return [];

    const auction = paginatedFilteredAuctions.find(
      (a) => a.auction_id === selectedCollectionId,
    );
    if (!auction?.nfts) return [];

    return auction.nfts.map((nft) => {
      // Extract "Adventurers Killed" from NFT attributes
      const adventurersKilledAttr = nft.attributes.find(
        (a) => a.trait_type === "Adventurers Killed"
      );

      // Parse tokenId - handle hex format
      const tokenIdStr = nft.tokenId;
      const tokenId = tokenIdStr.startsWith("0x") || tokenIdStr.startsWith("0X")
        ? parseInt(tokenIdStr, 16)
        : parseInt(tokenIdStr, 10);

      return {
        tokenId,
        adventurersKilled: adventurersKilledAttr ? Number(adventurersKilledAttr.value) : 0,
      };
    });
  }, [selectedCollectionId, paginatedFilteredAuctions]);

  // Fetch unclaimed skull rewards for selected auction's NFTs
  const {
    loading: skullsLoading,
    error: skullsError,
    totalUnclaimedSkulls,
  } = useBeastSkullRewards(selectedAuctionBeastData);

  // Check if selected auction contains any top summit beasts
  const auctionSummitBeasts = useMemo(() => {
    if (!selectedAuctionNfts.length || !summitTopBeasts.length) return [];

    const matches: Array<{ nftTokenId: number; summitBeast: SummitBeast }> = [];

    for (const nft of selectedAuctionNfts) {
      // Parse token ID
      const tokenId = nft.tokenId.startsWith("0x")
        ? parseInt(nft.tokenId, 16)
        : parseInt(nft.tokenId);

      // Get NFT attributes
      const prefixAttr = nft.attributes.find(a => a.trait_type === "Prefix")?.value;
      const suffixAttr = nft.attributes.find(a => a.trait_type === "Suffix")?.value;
      const beastNameAttr = nft.attributes.find(a => a.trait_type === "Beast")?.value;
      const prefix = prefixAttr !== undefined ? String(prefixAttr) : undefined;
      const suffix = suffixAttr !== undefined ? String(suffixAttr) : undefined;
      const beastName = beastNameAttr !== undefined ? String(beastNameAttr) : undefined;

      const match = findMatchingSummitBeast(prefix, suffix, beastName, tokenId, summitTopBeasts);
      if (match) {
        matches.push({ nftTokenId: tokenId, summitBeast: match });
      }
    }

    return matches;
  }, [selectedAuctionNfts, summitTopBeasts]);

  const isValidPrice = useCallback((price: number | null): boolean => {
    if (price === null) return false;
    return (
      isFinite(price) &&
      price !== Infinity &&
      price !== -Infinity &&
      !isNaN(price) &&
      price > 0
    );
  }, []);

  useEffect(() => {
    if (priceRetryIntervalRef.current) {
      clearInterval(priceRetryIntervalRef.current);
      priceRetryIntervalRef.current = null;
    }

    const fetchTokenPrice = async (
      isRetry: boolean = false,
    ): Promise<boolean> => {
      if (paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
        setTokenPrice(1);
        setIsConvertingPrices(false);
        return true;
      }

      if (!isRetry && !shouldRefetchPrice(paymentToken)) {
        try {
          const cachedPrice = await getTokenPriceInUSDC(paymentToken, address);
          if (isValidPrice(cachedPrice)) {
            setTokenPrice(cachedPrice);
            setIsConvertingPrices(false);
            return true;
          } else {
            console.warn("Invalid cached price, fetching fresh:", cachedPrice);
            setIsConvertingPrices(true);
          }
        } catch (error) {
          console.error("Error getting cached price:", error);
          setIsConvertingPrices(true);
        }
      } else {
        setIsConvertingPrices(true);
      }

      try {
        const price = await getTokenPriceInUSDC(paymentToken, address);
        if (isValidPrice(price)) {
          setTokenPrice(price);
          setIsConvertingPrices(false);
          return true;
        } else {
          console.warn("Invalid price received:", price);
          setTokenPrice(null);
          setIsConvertingPrices(true);
          return false;
        }
      } catch (error) {
        console.error("Error fetching token price:", error);
        setTokenPrice(null);
        setIsConvertingPrices(true);
        return false;
      }
    };

    fetchTokenPrice().then((success) => {
      if (!success) {
        const interval = setInterval(async () => {
          const retrySuccess = await fetchTokenPrice(true);
          if (retrySuccess) {
            if (priceRetryIntervalRef.current) {
              clearInterval(priceRetryIntervalRef.current);
              priceRetryIntervalRef.current = null;
            }
          }
        }, 5000);
        priceRetryIntervalRef.current = interval;
      }
    });

    return () => {
      if (priceRetryIntervalRef.current) {
        clearInterval(priceRetryIntervalRef.current);
        priceRetryIntervalRef.current = null;
      }
    };
  }, [paymentToken, isValidPrice]);

  useEffect(() => {
    // Always display prices in USDC, regardless of payment token selection
    if (!selectedCollection) {
      setConvertedStartingPrice(0);
      setConvertedHighestBid(undefined);
      return;
    }

    setConvertedStartingPrice(selectedCollection.startingPrice / 1e6);
    setConvertedHighestBid(selectedCollection.highestBid);
  }, [selectedCollection]);

  // Fetch user's pending offer for the selected auction
  useEffect(() => {
    // Check explicitly for empty string, null, or undefined (not just falsy, since "0" is valid)
    if (selectedCollectionId === "" || selectedCollectionId === null || selectedCollectionId === undefined || !address) {
      setUserOffer(null);
      return;
    }

    // Convert to string for comparison in case it's a number
    const collectionIdStr = String(selectedCollectionId);
    const auction = paginatedFilteredAuctions.find(
      (a) => String(a.auction_id) === collectionIdStr,
    );

    if (!auction || !auction.offers) {
      setUserOffer(null);
      return;
    }

    // Find user's pending offer
    // Note: offersByAuction already filters to status === 1, so we only need to check address
    const normalizedUserAddress = address ? normalizeContractAddress(address).toLowerCase() : "";
    const usersPendingOffer = auction.offers.find((offer) => {
      // Normalize both addresses for comparison
      const normalizedOfferBuyer = normalizeContractAddress(offer.buyer).toLowerCase();
      const addressMatch = normalizedOfferBuyer === normalizedUserAddress;
      return addressMatch;
    });

    if (usersPendingOffer) {
      // Parse amount - handle both hex strings and decimal strings
      let amountValue: number;
      const amountStr = String(usersPendingOffer.amount);
      if (amountStr.startsWith("0x") || amountStr.startsWith("0X")) {
        amountValue = parseInt(amountStr, 16) / 1e6;
      } else {
        amountValue = parseFloat(amountStr) / 1e6;
      }

      setUserOffer({
        buyer: usersPendingOffer.buyer,
        amount: amountValue,
        status: usersPendingOffer.status,
        createdAt: usersPendingOffer.created_at || "",
        expiresAt: usersPendingOffer.expires_at || "",
      });
    } else {
      setUserOffer(null);
    }
  }, [selectedCollectionId, address, paginatedFilteredAuctions]);

  // Fetch token balances with USD values
  useEffect(() => {
    if (!address || !provider) {
      return;
    }

    let cancelled = false;

    const fetchBalances = async () => {
      const balances: Record<
        string,
        { amount: string; usdValue: string | null }
      > = {};

      await Promise.all(
        SUPPORTED_TOKENS.map(async (token) => {
          try {
            const balanceResult = await provider.provider.callContract({
              contractAddress: token.address,
              entrypoint: "balanceOf",
              calldata: [address],
            });

            if (balanceResult && balanceResult.length >= 2) {
              const low = balanceResult[0];
              const high = balanceResult[1];
              const balance = BigInt(low) + (BigInt(high) << BigInt(128));
              const balanceDecimal =
                Number(balance) / Math.pow(10, token.decimals);

              // Format token amount
              const formattedAmount =
                balanceDecimal > 0
                  ? formatTokenAmount(balanceDecimal, token.decimals)
                  : "0.00";

              // Calculate USD value
              let usdValue: string | null = null;
              try {
                if (
                  token.address.toLowerCase() === USDC_ADDRESS.toLowerCase()
                ) {
                  // USDC is 1:1 with USD
                  usdValue = formatUSD(balanceDecimal);
                } else {
                  if (balanceDecimal > 0) {
                    const price = await getTokenPriceInUSDC(token.address, address);
                    if (price && isValidPrice(price)) {
                      const usdAmount = balanceDecimal * price;
                      usdValue = formatUSD(usdAmount);
                    } else {
                      // Price fetch succeeded but price is invalid - show $0.00 as fallback
                      usdValue = formatUSD(0);
                    }
                  } else {
                    // Even for 0 balance, show $0.00
                    usdValue = formatUSD(0);
                  }
                }
              } catch (error) {
                console.error(
                  `Error fetching USD value for ${token.symbol}:`,
                  error,
                );
                // Always show $0.00 on error, regardless of balance
                // This ensures the token still appears in the dropdown even if price fetch fails
                usdValue = formatUSD(0);
              }

              balances[token.address] = {
                amount: formattedAmount,
                usdValue: usdValue || formatUSD(0),
              };
            } else {
              balances[token.address] = {
                amount: "0.00",
                usdValue: formatUSD(0),
              };
            }
          } catch (error) {
            console.error(`Error fetching balance for ${token.symbol}:`, error);
            balances[token.address] = {
              amount: "0.00",
              usdValue: formatUSD(0),
            };
          }
        }),
      );

      if (!cancelled) {
        setTokenBalances(balances);
      }
    };

    fetchBalances();

    return () => {
      cancelled = true;
    };
  }, [address, provider]);

  // Countdown timer effect
  useEffect(() => {
    if (!selectedCollection?.endTime) {
      setCountdown(null);
      return;
    }

    const updateCountdown = () => {
      try {
        let endTimeNum: number;
        const endTime = selectedCollection.endTime;
        if (endTime.startsWith("0x") || endTime.startsWith("0X")) {
          endTimeNum = parseInt(endTime, 16);
        } else {
          endTimeNum = parseInt(endTime, 10);
        }

        if (isNaN(endTimeNum) || endTimeNum === 0) {
          setCountdown(null);
          return;
        }

        const statusNum = parseInt(selectedCollection.status);
        if (statusNum === 3) {
          // Auction ended
          setCountdown(null);
          return;
        }

        const now = Math.floor(Date.now() / 1000);
        const difference = endTimeNum - now;

        if (difference <= 0) {
          setCountdown(null);
          return;
        }

        const days = Math.floor(difference / 86400);
        const hours = Math.floor((difference % 86400) / 3600);
        const minutes = Math.floor((difference % 3600) / 60);
        const seconds = difference % 60;

        setCountdown({ days, hours, minutes, seconds });
      } catch (error) {
        console.error("Error updating countdown:", error);
        setCountdown(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [selectedCollection]);

  // bidAmountToken now always represents USDC amount
  const bidAmountUSD = useMemo(() => {
    const usdcAmount = parseFloat(bidAmountToken);
    if (Number.isNaN(usdcAmount) || usdcAmount <= 0) {
      return 0;
    }
    return usdcAmount;
  }, [bidAmountToken]);

  // Calculate equivalent amount in selected payment token
  const bidAmountInPaymentToken = useMemo(() => {
    const usdcAmount = parseFloat(bidAmountToken);
    if (Number.isNaN(usdcAmount) || usdcAmount <= 0) {
      return 0;
    }

    if (paymentToken.toLowerCase() === USDC_ADDRESS.toLowerCase()) {
      return usdcAmount;
    }

    if (tokenPrice === null || !isValidPrice(tokenPrice)) {
      return 0;
    }

    const tokenAmount = usdcAmount / tokenPrice;
    if (
      !isFinite(tokenAmount) ||
      tokenAmount === Infinity ||
      tokenAmount === -Infinity
    ) {
      return 0;
    }

    return tokenAmount;
  }, [bidAmountToken, tokenPrice, paymentToken, isValidPrice]);

  const isBidValid = useMemo(() => {
    const numericBid = parseFloat(bidAmountToken);
    if (Number.isNaN(numericBid) || numericBid <= 0) {
      return false;
    }
    return true;
  }, [bidAmountToken]);

  const handlePlaceBid = useCallback(async () => {
    if (
      !account ||
      !address ||
      selectedCollectionId === "" ||
      selectedCollectionId === null ||
      selectedCollectionId === undefined ||
      !isBidValid
    ) {
      return;
    }

    // If paying with non-USDC token, we need token price
    if (
      paymentToken.toLowerCase() !== USDC_ADDRESS.toLowerCase() &&
      (tokenPrice === null || !isValidPrice(tokenPrice))
    ) {
      return;
    }

    setInsufficientFundsError(null);

    const calls: Array<{
      contractAddress: string;
      entrypoint: string;
      calldata: string[];
    }> = [];

    try {
      setIsSubmitting(true);

      const auctionId = parseInt(selectedCollectionId, 10);

      // bidAmountToken is now always in USDC
      const usdcAmount = parseFloat(bidAmountToken);
      if (isNaN(usdcAmount) || usdcAmount <= 0) {
        throw new Error("Invalid bid amount");
      }

      // Check if bid is less than minimum required (reserved price + 2%)
      if (selectedCollection) {
        const reservedPriceUSD = selectedCollection.startingPrice / 1e6;
        const minimumBid = reservedPriceUSD * 1.02; // Reserved price + 2%

        if (usdcAmount < minimumBid) {
          setInsufficientFundsError(`Minimum bid is ${formatUSD(minimumBid)}`);
          setIsSubmitting(false);
          return;
        }
      }

      const finalUSDAmount = Math.floor(usdcAmount * 1e6);

      // If paying with a token other than USDC, we need to swap
      if (paymentToken.toLowerCase() !== USDC_ADDRESS.toLowerCase()) {
        const paymentTokenInfo = SUPPORTED_TOKENS.find(
          (t) => t.address.toLowerCase() === paymentToken.toLowerCase(),
        );
        if (!paymentTokenInfo) {
          throw new Error("Invalid payment token");
        }

        // Get fresh price if needed
        let currentTokenPrice = tokenPrice;
        if (shouldRefetchPrice(paymentToken)) {
          currentTokenPrice = await getTokenPriceInUSDC(paymentToken, address);
          setTokenPrice(currentTokenPrice);
        }

        if (currentTokenPrice === null || !isValidPrice(currentTokenPrice)) {
          throw new Error("Unable to get token price");
        }

        // Calculate how much of the payment token we need
        const tokenAmountNeeded = usdcAmount / currentTokenPrice;
        const tokenAmountWei = BigInt(
          Math.floor(
            tokenAmountNeeded * Math.pow(10, paymentTokenInfo.decimals),
          ),
        );

        // Check balance of payment token
        const balanceResult = await provider.provider.callContract({
          contractAddress: paymentToken,
          entrypoint: "balanceOf",
          calldata: [address],
        });

        if (!balanceResult || balanceResult.length < 2) {
          throw new Error("Invalid balance response");
        }

        const low = balanceResult[0];
        const high = balanceResult[1];
        const balance = BigInt(low) + (BigInt(high) << BigInt(128));

        // Check balance with a 2% buffer to account for swap needs
        const balanceWithBuffer = (tokenAmountWei * 102n) / 100n;
        if (balance < balanceWithBuffer) {
          setInsufficientFundsError(`Insufficient funds to place bid.`);
          setIsSubmitting(false);
          return;
        }

        // Calculate token amount needed for swap
        const tokenAmountNeededForSwap = usdcAmount / currentTokenPrice;
        const tokenAmountWeiForSwap = BigInt(
          Math.floor(
            tokenAmountNeededForSwap * Math.pow(10, paymentTokenInfo.decimals),
          ),
        );

        // Get Avnu swap quotes
        const quotes = await getQuotes({
          sellTokenAddress: paymentToken,
          buyTokenAddress: USDC_ADDRESS,
          sellAmount: tokenAmountWeiForSwap,
          takerAddress: address,
        });

        if (!quotes || quotes.length === 0) {
          throw new Error("No swap quotes available");
        }

        const bestQuote = quotes[0];

        // Build the execute transaction calls from the quote
        const slippage = 0.01; // 1% slippage
        const swapCallsResult = await quoteToCalls({
          quoteId: bestQuote.quoteId,
          slippage: slippage,
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

        // Use the actual sellAmount from the quote, and add 2% buffer for safety
        // This ensures we have enough approved even if the swap needs slightly more
        const actualSellAmount = bestQuote.sellAmount;
        const paymentTokenApprovalAmount = (actualSellAmount * 102n) / 100n; // Add 2% buffer
        const paymentTokenApproval = uint256.bnToUint256(
          paymentTokenApprovalAmount,
        );

        // Get the router address from the first swap call (the multi_route_swap call)
        const routerAddress = swapCalls[0]?.contractAddress;
        if (!routerAddress) {
          console.error("Swap calls structure:", swapCalls);
          throw new Error(
            `Unable to determine router address from swap calls. First call: ${JSON.stringify(swapCalls[0])}`,
          );
        }

        calls.push({
          contractAddress: paymentToken,
          entrypoint: "approve",
          calldata: [
            routerAddress,
            paymentTokenApproval.low.toString(),
            paymentTokenApproval.high.toString(),
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

        // Calculate the minimum USDC amount we'll receive after swap (accounting for slippage)
        // buyAmount is in wei (6 decimals for USDC)
        // Convert to BigInt, handling BigInt, string, and number types
        let buyAmount: bigint;
        if (typeof bestQuote.buyAmount === "bigint") {
          buyAmount = bestQuote.buyAmount;
        } else if (typeof bestQuote.buyAmount === "string") {
          buyAmount = BigInt(bestQuote.buyAmount);
        } else {
          buyAmount = BigInt(Math.floor(Number(bestQuote.buyAmount)));
        }
        const minBuyAmount =
          (buyAmount * BigInt(Math.floor((1 - slippage) * 10000))) / 10000n;

        // Use the minimum buy amount for approval and bid to ensure we have enough after swap
        const usdcApprovalAmount = minBuyAmount;
        const usdcApproval = uint256.bnToUint256(usdcApprovalAmount);
        calls.push({
          contractAddress: USDC_ADDRESS,
          entrypoint: "approve",
          calldata: [
            VAULT_CONTRACT_ADDRESS,
            usdcApproval.low.toString(),
            usdcApproval.high.toString(),
          ],
        });

        calls.push({
          contractAddress: AUCTION_CONTRACT_ADDRESS,
          entrypoint: "bid",
          calldata: [auctionId.toString(), minBuyAmount.toString()],
        });
      } else {
        // Paying with USDC directly - check USDC balance
        const usdcBalanceResult = await provider.provider.callContract({
          contractAddress: USDC_ADDRESS,
          entrypoint: "balanceOf",
          calldata: [address],
        });

        if (!usdcBalanceResult || usdcBalanceResult.length < 2) {
          throw new Error("Invalid balance response");
        }

        const usdcLow = usdcBalanceResult[0];
        const usdcHigh = usdcBalanceResult[1];
        const usdcBalance = BigInt(usdcLow) + (BigInt(usdcHigh) << BigInt(128));

        if (usdcBalance < BigInt(finalUSDAmount)) {
          setInsufficientFundsError(`Insufficient funds to place bid.`);
          setIsSubmitting(false);
          return;
        }

        // Approve 2% more than the USDC amount needed for the bid
        const approvalAmountValue = (BigInt(finalUSDAmount) * 102n) / 100n;
        const approvalAmount = uint256.bnToUint256(approvalAmountValue);
        calls.push({
          contractAddress: USDC_ADDRESS,
          entrypoint: "approve",
          calldata: [
            VAULT_CONTRACT_ADDRESS,
            approvalAmount.low.toString(),
            approvalAmount.high.toString(),
          ],
        });
        calls.push({
          contractAddress: AUCTION_CONTRACT_ADDRESS,
          entrypoint: "bid",
          calldata: [auctionId.toString(), finalUSDAmount.toString()],
        });
      }

      const response = await account.execute(calls);
      setTxnHash(response.transaction_hash);
      setBidAmountToken("");
    } catch (err) {
      console.error("Error placing bid:", err);
      if (err instanceof Error && err.message.includes("balance")) {
        setInsufficientFundsError("Insufficient funds");
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    account,
    address,
    selectedCollectionId,
    bidAmountToken,
    bidAmountUSD,
    isBidValid,
    paymentToken,
    tokenPrice,
    provider,
    isValidPrice,
    selectedCollection,
  ]);

  const handleMakeOffer = useCallback(async () => {
    if (
      !account ||
      !address ||
      selectedCollectionId === "" ||
      selectedCollectionId === null ||
      selectedCollectionId === undefined ||
      !isBidValid
    ) {
      return;
    }

    // If paying with non-USDC token, we need token price
    if (
      paymentToken.toLowerCase() !== USDC_ADDRESS.toLowerCase() &&
      (tokenPrice === null || !isValidPrice(tokenPrice))
    ) {
      return;
    }

    setInsufficientFundsError(null);

    try {
      setIsSubmittingOffer(true);

      const auctionId = parseInt(selectedCollectionId, 10);
      const usdcAmount = parseFloat(bidAmountToken);
      if (isNaN(usdcAmount) || usdcAmount <= 0) {
        throw new Error("Invalid offer amount");
      }

      const finalUSDAmount = Math.floor(usdcAmount * 1e6);

      const calls: Array<{
        contractAddress: string;
        entrypoint: string;
        calldata: string[];
      }> = [];

      // If paying with a token other than USDC, we need to swap
      if (paymentToken.toLowerCase() !== USDC_ADDRESS.toLowerCase()) {
        const paymentTokenInfo = SUPPORTED_TOKENS.find(
          (t) => t.address.toLowerCase() === paymentToken.toLowerCase(),
        );
        if (!paymentTokenInfo) {
          throw new Error("Invalid payment token");
        }

        // Get fresh price if needed
        let currentTokenPrice = tokenPrice;
        if (shouldRefetchPrice(paymentToken)) {
          currentTokenPrice = await getTokenPriceInUSDC(paymentToken, address);
          setTokenPrice(currentTokenPrice);
        }

        if (currentTokenPrice === null || !isValidPrice(currentTokenPrice)) {
          throw new Error("Unable to get token price");
        }

        // Calculate how much of the payment token we need
        const tokenAmountNeeded = usdcAmount / currentTokenPrice;
        const tokenAmountWei = BigInt(
          Math.floor(
            tokenAmountNeeded * Math.pow(10, paymentTokenInfo.decimals),
          ),
        );

        // Check balance of payment token
        const balanceResult = await provider.provider.callContract({
          contractAddress: paymentToken,
          entrypoint: "balanceOf",
          calldata: [address],
        });

        if (!balanceResult || balanceResult.length < 2) {
          throw new Error("Invalid balance response");
        }

        const low = balanceResult[0];
        const high = balanceResult[1];
        const balance = BigInt(low) + (BigInt(high) << BigInt(128));

        // Check balance with a 2% buffer to account for swap needs
        const balanceWithBuffer = (tokenAmountWei * 102n) / 100n;
        if (balance < balanceWithBuffer) {
          setInsufficientFundsError(`Insufficient funds to make offer.`);
          setIsSubmittingOffer(false);
          return;
        }

        // Calculate token amount needed for swap
        const tokenAmountNeededForSwap = usdcAmount / currentTokenPrice;
        const tokenAmountWeiForSwap = BigInt(
          Math.floor(
            tokenAmountNeededForSwap * Math.pow(10, paymentTokenInfo.decimals),
          ),
        );

        // Get Avnu swap quotes
        const quotes = await getQuotes({
          sellTokenAddress: paymentToken,
          buyTokenAddress: USDC_ADDRESS,
          sellAmount: tokenAmountWeiForSwap,
          takerAddress: address,
        });

        if (!quotes || quotes.length === 0) {
          throw new Error("No swap quotes available");
        }

        const bestQuote = quotes[0];

        // Build the execute transaction calls from the quote
        const slippage = 0.01; // 1% slippage
        const swapCallsResult = await quoteToCalls({
          quoteId: bestQuote.quoteId,
          slippage: slippage,
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

        // Use the actual sellAmount from the quote, and add 2% buffer for safety
        const actualSellAmount = bestQuote.sellAmount;
        const paymentTokenApprovalAmount = (actualSellAmount * 102n) / 100n;
        const paymentTokenApproval = uint256.bnToUint256(
          paymentTokenApprovalAmount,
        );

        // Get the router address from the first swap call
        const routerAddress = swapCalls[0]?.contractAddress;
        if (!routerAddress) {
          console.error("Swap calls structure:", swapCalls);
          throw new Error(
            `Unable to determine router address from swap calls. First call: ${JSON.stringify(swapCalls[0])}`,
          );
        }

        calls.push({
          contractAddress: paymentToken,
          entrypoint: "approve",
          calldata: [
            routerAddress,
            paymentTokenApproval.low.toString(),
            paymentTokenApproval.high.toString(),
          ],
        });

        // Add the swap transaction calls
        swapCalls.forEach((call) => {
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

        // Calculate the minimum USDC amount we'll receive after swap
        let buyAmount: bigint;
        if (typeof bestQuote.buyAmount === "bigint") {
          buyAmount = bestQuote.buyAmount;
        } else if (typeof bestQuote.buyAmount === "string") {
          buyAmount = BigInt(bestQuote.buyAmount);
        } else {
          buyAmount = BigInt(Math.floor(Number(bestQuote.buyAmount)));
        }
        const minBuyAmount =
          (buyAmount * BigInt(Math.floor((1 - slippage) * 10000))) / 10000n;

        // Approve USDC to vault with minimum amount from swap
        const usdcApprovalAmount = minBuyAmount;
        const usdcApproval = uint256.bnToUint256(usdcApprovalAmount);
        calls.push({
          contractAddress: USDC_ADDRESS,
          entrypoint: "approve",
          calldata: [
            VAULT_CONTRACT_ADDRESS,
            usdcApproval.low.toString(),
            usdcApproval.high.toString(),
          ],
        });

        // Make offer with minimum amount from swap
        const TEN_YEARS_IN_SECONDS = 10 * 365 * 24 * 60 * 60;
        calls.push({
          contractAddress: AUCTION_CONTRACT_ADDRESS,
          entrypoint: "make_offer",
          calldata: [
            auctionId.toString(),
            minBuyAmount.toString(),
            "0",
            TEN_YEARS_IN_SECONDS.toString(),
          ],
        });
      } else {
        // Paying with USDC directly - check USDC balance
        const usdcBalanceResult = await provider.provider.callContract({
          contractAddress: USDC_ADDRESS,
          entrypoint: "balanceOf",
          calldata: [address],
        });

        if (!usdcBalanceResult || usdcBalanceResult.length < 2) {
          throw new Error("Invalid balance response");
        }

        const usdcLow = usdcBalanceResult[0];
        const usdcHigh = usdcBalanceResult[1];
        const usdcBalance = BigInt(usdcLow) + (BigInt(usdcHigh) << BigInt(128));

        if (usdcBalance < BigInt(finalUSDAmount)) {
          setInsufficientFundsError(`Insufficient funds to make offer.`);
          setIsSubmittingOffer(false);
          return;
        }

        // Approve USDC for vault
        const approvalAmountValue = (BigInt(finalUSDAmount) * 102n) / 100n;
        const approvalAmount = uint256.bnToUint256(approvalAmountValue);
        calls.push({
          contractAddress: USDC_ADDRESS,
          entrypoint: "approve",
          calldata: [
            VAULT_CONTRACT_ADDRESS,
            approvalAmount.low.toString(),
            approvalAmount.high.toString(),
          ],
        });

        // Make offer
        const TEN_YEARS_IN_SECONDS = 10 * 365 * 24 * 60 * 60;
        calls.push({
          contractAddress: AUCTION_CONTRACT_ADDRESS,
          entrypoint: "make_offer",
          calldata: [
            auctionId.toString(),
            finalUSDAmount.toString(),
            "0",
            TEN_YEARS_IN_SECONDS.toString(),
          ],
        });
      }

      const response = await account.execute(calls);
      setOfferTxnHash(response.transaction_hash);
      setBidAmountToken("");
    } catch (err) {
      console.error("Error making offer:", err);
      if (err instanceof Error && err.message.includes("balance")) {
        setInsufficientFundsError("Insufficient funds");
      }
    } finally {
      setIsSubmittingOffer(false);
    }
  }, [
    account,
    address,
    selectedCollectionId,
    bidAmountToken,
    isBidValid,
    provider,
    paymentToken,
    tokenPrice,
    isValidPrice,
  ]);

  const handleWithdrawOffer = useCallback(async () => {
    if (!account || !selectedCollectionId || !userOffer) {
      return;
    }

    try {
      setIsWithdrawingOffer(true);
      setWithdrawOfferTxnHash("");

      const auctionId = parseInt(selectedCollectionId, 10);

      const calls = [
        {
          contractAddress: AUCTION_CONTRACT_ADDRESS,
          entrypoint: "withdraw_offer",
          calldata: [auctionId.toString()],
        },
      ];

      const response = await account.execute(calls);
      setWithdrawOfferTxnHash(response.transaction_hash);
    } catch (error) {
      console.error("Error withdrawing offer:", error);
    } finally {
      setIsWithdrawingOffer(false);
    }
  }, [account, selectedCollectionId, userOffer]);

  const isAuctionExpired = useCallback(
    (endTime: string, status: string): boolean => {
      if (!endTime || endTime === "0") return false;

      try {
        let endTimeNum: number;
        if (endTime.startsWith("0x") || endTime.startsWith("0X")) {
          endTimeNum = parseInt(endTime, 16);
        } else {
          endTimeNum = parseInt(endTime, 10);
        }

        if (isNaN(endTimeNum) || endTimeNum === 0) return false;

        const now = Math.floor(Date.now() / 1000);
        const statusNum = parseInt(status);

        // Expired if end time passed or status is Ended (3)
        return endTimeNum <= now || statusNum === 3;
      } catch {
        return false;
      }
    },
    [],
  );

  const handleSettleAuction = useCallback(async () => {
    if (
      !account ||
      !address ||
      selectedCollectionId === "" ||
      selectedCollectionId === null ||
      selectedCollectionId === undefined
    ) {
      return;
    }

    // Find the auction to get feeToken and currentBid
    const auction = paginatedFilteredAuctions.find(
      (a) => a.auction_id === selectedCollectionId,
    );
    if (!auction) {
      console.error("Auction not found");
      return;
    }

    // If there's no current bid, just settle without swap
    // current_bid is in u64 format (needs to be divided by 1e6 for display, but we need raw value for contract)
    const currentBidRaw = auction.current_bid
      ? (() => {
          const bidStr = auction.current_bid;
          return bidStr.startsWith("0x") || bidStr.startsWith("0X")
            ? parseInt(bidStr, 16)
            : parseFloat(bidStr);
        })()
      : 0;
    if (!currentBidRaw || currentBidRaw === 0) {
      try {
        setIsSettling(true);
        setSettleTxnHash(undefined);

        const auctionId = parseInt(selectedCollectionId, 10);

        const response = await account.execute({
          contractAddress: AUCTION_CONTRACT_ADDRESS,
          entrypoint: "settle_auction",
          calldata: [auctionId.toString()],
        });

        setSettleTxnHash(response.transaction_hash);

        try {
          await new Promise((resolve) => setTimeout(resolve, 2000));
          const canSettleResult = await provider.provider.callContract({
            contractAddress: AUCTION_CONTRACT_ADDRESS,
            entrypoint: "can_settle",
            calldata: [auctionId.toString()],
          });

          if (canSettleResult && canSettleResult.length > 0) {
            const canSettle = parseInt(canSettleResult[0], 16);
            setIsRefunded(canSettle === 0);
          }
        } catch (checkError) {
          console.error("Error checking can_settle:", checkError);
        }
      } catch (err) {
        console.error("Error settling auction:", err);
      } finally {
        setIsSettling(false);
      }
      return;
    }

    try {
      setIsSettling(true);
      setSettleTxnHash(undefined);

      const auctionId = parseInt(selectedCollectionId, 10);

      const calls: Array<{
        contractAddress: string;
        entrypoint: string;
        calldata: string[];
      }> = [];

      // 1. Settle the auction (this transfers USDC from vault to seller)
      calls.push({
        contractAddress: AUCTION_CONTRACT_ADDRESS,
        entrypoint: "settle_auction",
        calldata: [auctionId.toString()],
      });

      // 2. Swap USDC to feeToken only if caller is the seller
      // Check if caller is the seller
      const callerAddress = normalizeContractAddress(address).toLowerCase();
      const sellerAddress = normalizeContractAddress(
        auction.seller,
      ).toLowerCase();
      const isSeller = callerAddress === sellerAddress;

      // Only do swap if caller is seller and feeToken is different from USDC
      const feeTokenAddress = normalizeContractAddress(
        auction.fee_token,
      ).toLowerCase();
      const usdcAddress = normalizeContractAddress(USDC_ADDRESS).toLowerCase();

      if (isSeller && feeTokenAddress !== usdcAddress) {
        // Calculate USDC amount in wei (USDC has 6 decimals)
        // current_bid is already in USDC wei (6 decimals) from the contract (u64 format)
        const usdcAmountWei = BigInt(Math.floor(currentBidRaw));

        // Use exact amount for swap
        const swapInputAmount = usdcAmountWei;

        // Get Avnu swap quotes
        const quotes = await getQuotes({
          sellTokenAddress: USDC_ADDRESS,
          buyTokenAddress: auction.fee_token,
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

        // Approve the exact USDC amount needed for the swap
        const usdcApprovalAmount = swapInputAmount;
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
      setSettleTxnHash(response.transaction_hash);

      try {
        await new Promise((resolve) => setTimeout(resolve, 2000));
        const canSettleResult = await provider.provider.callContract({
          contractAddress: AUCTION_CONTRACT_ADDRESS,
          entrypoint: "can_settle",
          calldata: [auctionId.toString()],
        });

        if (canSettleResult && canSettleResult.length > 0) {
          const canSettle = parseInt(canSettleResult[0], 16);
          setIsRefunded(canSettle === 0);
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
        auctionId: selectedCollectionId,
      });
    } finally {
      setIsSettling(false);
    }
  }, [
    account,
    address,
    selectedCollectionId,
    paginatedFilteredAuctions,
    provider,
  ]);

  const updateSelection = useCallback((collection: Collection | undefined) => {
    if (!collection) {
      return;
    }

    setSelectedCollectionId(collection.id);
    setBidAmountToken("");
    setTxnHash(undefined);
    setOfferTxnHash(undefined);
    setSettleTxnHash(undefined);
    setInsufficientFundsError(null);
    setIsRefunded(false);
  }, []);

  const handleSelectCollection = useCallback(
    (collection: Collection) => {
      if (selectedCollectionId === collection.id) {
        setSelectedCollectionId("");
        setBidAmountToken("");
        setTxnHash(undefined);
        setOfferTxnHash(undefined);
        setSettleTxnHash(undefined);
        setInsufficientFundsError(null);
      } else {
        updateSelection(collection);
      }
    },
    [selectedCollectionId, updateSelection],
  );

  const handlePageChange = useCallback(
    (page: number) => {
      const nextPage = Math.min(Math.max(page, 1), totalFilteredPages);
      if (nextPage === localCurrentPage) {
        return;
      }

      setLocalCurrentPage(nextPage);
      setCurrentPage(nextPage);
      const firstOnPage = collections[0];
      if (firstOnPage) {
        updateSelection(firstOnPage);
      }
    },
    [
      localCurrentPage,
      totalFilteredPages,
      setCurrentPage,
      updateSelection,
      collections,
    ],
  );

  const renderContent = () => {
    if (loading) {
      return <BidsSkeleton />;
    }

    if (error) {
      return (
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-12">
          <p className="text-red-400">
            Error loading auctions: {error.message}
          </p>
        </div>
      );
    }

    if (collections.length === 0) {
      return (
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-center gap-4 px-4 py-12">
          <p className="text-[rgb(186,255,188)]/70">
            {auctions.length === 0
              ? "No auctions available."
              : "No auctions match your filters. Try adjusting your search criteria."}
          </p>
        </div>
      );
    }

    const renderGrid = () => {
      // Find the index of the selected card to determine which row it's in
      const selectedIndex = collections.findIndex(c => c.id === selectedCollectionId);

      // Calculate which row the selected card is in (3 columns on desktop)
      // We use 3 columns as the base since that's the desktop layout
      const columnsPerRow = 3;
      const selectedRow = selectedIndex >= 0 ? Math.floor(selectedIndex / columnsPerRow) : -1;

      // Find the index of the last card in the selected row
      const lastIndexInSelectedRow = selectedRow >= 0
        ? Math.min((selectedRow + 1) * columnsPerRow - 1, collections.length - 1)
        : -1;

      return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6 w-full">
          {collections.map((collection, index) => {
            const auction = paginatedFilteredAuctions.find(
              (a) => a.auction_id === collection.id,
            );
            const nfts = auction?.nfts || [];
            const isSelected = collection.id === selectedCollectionId;

            // Show detail panel after the last card in the selected row
            const showDetailAfterThis = index === lastIndexInSelectedRow && selectedCollection;

            return (
              <React.Fragment key={collection.id}>
                <MonsterCollectionCard
                  collection={collection}
                  isSelected={isSelected}
                  onSelect={() => handleSelectCollection(collection)}
                  nfts={nfts}
                />
                {showDetailAfterThis && (
                  <div className="col-span-1 md:col-span-2 lg:col-span-3">
                    {renderSelectedDetails()}
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      );
    };

    const renderSelectedDetails = () => {
      if (!selectedCollection) return null;

      const auction = paginatedFilteredAuctions.find(
        (a) => a.auction_id === selectedCollection.id,
      );
      const isUserSeller =
        address && auction?.seller
          ? (() => {
              const userAddress =
                normalizeContractAddress(address).toLowerCase();
              const sellerAddress = normalizeContractAddress(
                auction.seller,
              ).toLowerCase();
              return userAddress == sellerAddress;
            })()
          : false;

      return (
        <div ref={detailRef} className="mt-6">
          <section className="mx-auto w-full max-w-6xl overflow-hidden rounded-2xl border border-[rgb(50,255,52)]/80 bg-black/55 shadow-[0_16px_40px_rgba(5,20,5,0.35)]">
            <div className="grid gap-4 md:gap-8 p-4 md:p-6 grid-cols-1 md:grid-cols-[minmax(0,0.35fr)_minmax(0,0.65fr)] md:items-start">
              <div className="flex flex-col items-center gap-3 md:gap-4 text-center md:items-start md:text-left">
                {(() => {
                  const nfts = auction?.nfts || [];

                  if (nfts.length === 0) {
                    return (
                      <div className="flex h-28 w-28 items-center justify-center rounded-2xl border border-[rgb(50,255,52)]/35 bg-[rgb(50,255,52)]/10">
                        <Image
                          src="/logo.png"
                          alt={selectedCollection.name}
                          width={112}
                          height={112}
                          draggable={false}
                          className="h-16 w-16 object-contain"
                        />
                      </div>
                    );
                  }

                  const showCarousel = nfts.length > 4;

                  return (
                    <div className="w-full relative">
                      {showCarousel && (
                        <>
                          {canScrollLeft && (
                            <button
                              onClick={() => scrollNFTs("left")}
                              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 flex items-center justify-center rounded-full bg-black/70 border border-[rgb(50,255,52)]/40 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/20 transition-all shadow-lg cursor-pointer"
                              aria-label="Scroll left"
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M12.5 15L7.5 10L12.5 5"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          )}
                          {canScrollRight && (
                            <button
                              onClick={() => scrollNFTs("right")}
                              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 h-10 w-10 flex items-center justify-center rounded-full bg-black/70 border border-[rgb(50,255,52)]/40 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/20 transition-all shadow-lg cursor-pointer"
                              aria-label="Scroll right"
                            >
                              <svg
                                width="20"
                                height="20"
                                viewBox="0 0 20 20"
                                fill="none"
                                xmlns="http://www.w3.org/2000/svg"
                              >
                                <path
                                  d="M7.5 15L12.5 10L7.5 5"
                                  stroke="currentColor"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                />
                              </svg>
                            </button>
                          )}
                        </>
                      )}
                      <div
                        ref={nftCarouselRef}
                        onScroll={checkScrollButtons}
                        className="flex gap-3 overflow-x-auto pb-2 scrollbar-none [&::-webkit-scrollbar]:hidden [-ms-overflow-style:none] [scrollbar-width:none]"
                      >
                        {nfts.map((nft, index) => {
                          const imageSrc = nft.metadata?.image
                            ? nft.metadata.image
                            : nft.imagePath
                              ? `${IMAGE_BASE_URL}/${nft.imagePath}`
                              : "/logo.png";
                          const isBase64 = imageSrc.startsWith("data:");

                          return (
                            <div
                              key={`${nft.contractAddress}-${nft.tokenId}`}
                              onClick={() => {
                                setSelectedBeastIndex(index);
                                setIsBeastModalOpen(true);
                              }}
                              className={`group/nft relative shrink-0 h-28 w-fit overflow-hidden cursor-pointer transition-all hover:scale-105 hover:ring-2 hover:ring-[rgb(50,255,52)]/60 ${
                                !isBase64
                                  ? "border border-[rgb(50,255,52)]/35 bg-[rgb(50,255,52)]/10"
                                  : ""
                              }`}
                            >
                              {isBase64 ? (
                                <img
                                  src={imageSrc}
                                  alt={nft.metadataName || `NFT ${nft.tokenId}`}
                                  draggable={false}
                                  className="h-full w-full object-contain"
                                />
                              ) : (
                                <Image
                                  src={imageSrc}
                                  alt={nft.metadataName || `NFT ${nft.tokenId}`}
                                  width={112}
                                  height={112}
                                  draggable={false}
                                  className="h-full w-full object-contain"
                                  unoptimized
                                />
                              )}
                              {/* Eye icon overlay on hover */}
                              <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 group-hover/nft:opacity-100 transition-opacity">
                                <svg
                                  width="24"
                                  height="24"
                                  viewBox="0 0 24 24"
                                  fill="none"
                                  stroke="rgb(50,255,52)"
                                  strokeWidth="2"
                                  strokeLinecap="round"
                                  strokeLinejoin="round"
                                >
                                  <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z" />
                                  <circle cx="12" cy="12" r="3" />
                                </svg>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {/* Hint text for discoverability */}
                      <p className="text-[10px] text-center text-[rgb(186,255,188)]/50 mt-2 font-orbitron uppercase tracking-wider">
                        {nfts.length === 1 ? "Click beast to view details" : "Click any beast to view details"}
                      </p>
                    </div>
                  );
                })()}
                <div className="w-full flex flex-col gap-2">
                  <h2 className="text-xl md:text-2xl font-orbitron uppercase tracking-[0.12em] text-white">
                    {truncateAuctionName(selectedCollection.name)}
                  </h2>
                  <div className="flex flex-col sm:flex-row items-center gap-2">
                    <span
                      className={`inline-flex items-center justify-center rounded-full px-3 py-1 text-[10px] md:text-[11px] font-orbitron uppercase tracking-[0.16em] ${getStatusStyle(selectedCollection.status)}`}
                    >
                      {getStatusLabel(selectedCollection.status)}
                    </span>
                    <p className="text-xs leading-relaxed text-[rgb(186,255,188)]/70">
                      {selectedCollection.totalMonsters}{" "}
                      {selectedCollection.totalMonsters === 1 ? "NFT" : "NFTs"} in collection
                    </p>
                  </div>
                </div>
                <p className="text-xs leading-relaxed text-[rgb(186,255,188)]/70">
                  Seller:{" "}
                  <a
                    href={`https://voyager.online/contract/${selectedCollection.sellerFull}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="hover:text-[rgb(50,255,52)] hover:underline"
                  >
                    <AddressDisplay address={selectedCollection.sellerFull} showFullOnHover={false} />
                  </a>
                </p>
                <p className="text-xs leading-relaxed text-[rgb(186,255,188)]/70">
                  Highest Bidder:{" "}
                  {(() => {
                    const isZeroAddress =
                      !selectedCollection.highestBidderFull ||
                      selectedCollection.highestBidderFull === "0x0" ||
                      selectedCollection.highestBidderFull === "0" ||
                      selectedCollection.highestBidderFull
                        .toLowerCase()
                        .startsWith("0x0000") ||
                      selectedCollection.highestBidderFull ===
                        "0x0000000000000000000000000000000000000000000000000000000000000000";

                    if (isZeroAddress) {
                      return "-";
                    }

                    const isUserBidder =
                      address && selectedCollection.highestBidderFull
                        ? (() => {
                            const userAddress =
                              normalizeContractAddress(address).toLowerCase();
                            const bidderAddress = normalizeContractAddress(
                              selectedCollection.highestBidderFull,
                            ).toLowerCase();
                            return userAddress === bidderAddress;
                          })()
                        : false;

                    return (
                      <a
                        href={`https://voyager.online/contract/${selectedCollection.highestBidderFull}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-[rgb(50,255,52)] hover:underline"
                      >
                        <AddressDisplay address={selectedCollection.highestBidderFull} showFullOnHover={false} />
                        {isUserBidder ? " (you)" : ""}
                      </a>
                    );
                  })()}
                </p>
                {/* Unclaimed SKULL tokens display - hidden if API fails */}
                {selectedAuctionBeastData.length > 0 && !skullsError && (
                  <div className="flex items-center gap-2 text-xs leading-relaxed text-[rgb(186,255,188)]/70">
                    <span>Unclaimed:</span>
                    <Image
                      src="/skull-token.png"
                      alt="SKULL token"
                      width={18}
                      height={18}
                      className="inline-block"
                    />
                    {skullsLoading ? (
                      <span className="text-[rgb(50,255,52)]/50 animate-pulse">...</span>
                    ) : totalUnclaimedSkulls > 0 ? (
                      <span className="text-[rgb(50,255,52)] font-semibold">
                        {totalUnclaimedSkulls}
                      </span>
                    ) : (
                      <span>0</span>
                    )}
                    <InfoTooltip content="SKULL tokens can be claimed from beasts that have killed adventurers in Loot Survivor. These unclaimed tokens transfer with the NFTs." />
                  </div>
                )}
                {/* Summit Leaderboard Beast Indicator - hidden if API fails */}
                {auctionSummitBeasts.length > 0 && !summitError && (
                  <div className="flex items-center gap-2 text-xs leading-relaxed">
                    <span className="px-2 py-1 rounded-full bg-[rgb(255,215,0)]/20 border border-[rgb(255,215,0)]/40 text-[rgb(255,215,0)] font-orbitron uppercase tracking-wider flex items-center gap-1.5">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" />
                      </svg>
                      Summit Top {Math.min(...auctionSummitBeasts.map(m => m.summitBeast.rank))}
                    </span>
                    <InfoTooltip
                      content={
                        auctionSummitBeasts.length === 1
                          ? `"${auctionSummitBeasts[0].summitBeast.prefix} ${auctionSummitBeasts[0].summitBeast.suffix}" - #${auctionSummitBeasts[0].summitBeast.rank}`
                          : `Contains ${auctionSummitBeasts.length} Top 15 Summit names: ${auctionSummitBeasts.map(m => `"${m.summitBeast.prefix} ${m.summitBeast.suffix}" (#${m.summitBeast.rank})`).join(", ")}`
                      }
                    />
                  </div>
                )}
                {(() => {
                  const statusNum = parseInt(selectedCollection.status);
                  const formatTime = (timestamp: string) => {
                    try {
                      let timestampNum: number;
                      if (
                        timestamp.startsWith("0x") ||
                        timestamp.startsWith("0X")
                      ) {
                        timestampNum = parseInt(timestamp, 16);
                      } else {
                        timestampNum = parseInt(timestamp, 10);
                      }
                      if (isNaN(timestampNum) || timestampNum === 0)
                        return null;
                      const date = new Date(timestampNum * 1000);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                    } catch {
                      return null;
                    }
                  };

                  const endTimeFormatted = selectedCollection.endTime
                    ? formatTime(selectedCollection.endTime)
                    : null;

                  const formatExecutedAt = (executedAt: string | undefined) => {
                    if (!executedAt) return null;
                    try {
                      const date = new Date(executedAt);
                      return date.toLocaleDateString("en-US", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                      });
                    } catch {
                      return null;
                    }
                  };

                  const executedAtFormatted = formatExecutedAt(
                    selectedCollection.executedAt,
                  );

                  const timelineItems = [];

                  timelineItems.push({
                    status: "created",
                    label: "Auction Created",
                    active: true,
                    completed: true,
                    time: executedAtFormatted || undefined,
                  });

                  if (selectedCollection.endTime) {
                    timelineItems.push({
                      status: "settled",
                      label: "Auction Settled",
                      active: statusNum >= 3,
                      completed: statusNum >= 3,
                      time: endTimeFormatted,
                    });
                  }

                  return (
                    <div className="w-full -mt-2 md:-mt-4">
                      <div className="w-full mt-3 md:mt-4 rounded-2xl border border-[rgb(50,255,52)]/20 bg-[rgb(50,255,52)]/5 p-3 md:p-4">
                        <p className="text-[10px] font-orbitron uppercase tracking-[0.18em] text-[rgb(186,255,188)]/70 mb-2 md:mb-3">
                          Auction Timeline
                        </p>
                        <div className="flex flex-col gap-3">
                          {timelineItems.map((item, index) => {
                            const isLast = index === timelineItems.length - 1;
                            return (
                              <div
                                key={item.status}
                                className="relative flex items-start gap-3"
                              >
                                <div className="flex flex-col items-center">
                                  <div
                                    className={`w-3 h-3 rounded-full border-2 ${
                                      item.completed
                                        ? "bg-[rgb(50,255,52)] border-[rgb(50,255,52)]"
                                        : item.active
                                          ? "bg-[rgb(50,255,52)]/30 border-[rgb(50,255,52)] animate-pulse"
                                          : "bg-transparent border-[rgb(186,255,188)]/30"
                                    }`}
                                  />
                                  {!isLast && (
                                    <div
                                      className={`w-0.5 h-full min-h-[30px] mt-1 ${
                                        item.completed || item.active
                                          ? "bg-[rgb(50,255,52)]/30"
                                          : "bg-[rgb(186,255,188)]/10"
                                      }`}
                                    />
                                  )}
                                </div>
                                <div className="flex-1">
                                  <p
                                    className={`text-xs font-orbitron uppercase tracking-[0.12em] ${
                                      item.active
                                        ? "text-[rgb(50,255,52)]"
                                        : "text-[rgb(186,255,188)]/70"
                                    }`}
                                  >
                                    {item.label}
                                  </p>
                                  {item.time && (
                                    <p className="text-[10px] text-[rgb(186,255,188)]/50 mt-1">
                                      {item.time}
                                    </p>
                                  )}
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="w-full h-54 -mt-[154px] rounded-2xl border border-[rgb(50,255,52)]/20 bg-[rgb(50,255,52)]/5 p-3 flex flex-col justify-end">
                        <div className="flex items-center justify-between">
                          <p className="text-[10px] font-orbitron uppercase tracking-[0.16em] text-[rgb(50,255,52)]">
                            COUNTDOWN
                          </p>
                        </div>
                        {countdown ? (
                          <div className="flex items-baseline gap-1.5 flex-wrap">
                            <span className="text-white font-orbitron text-base tracking-wider">
                              {countdown.days}
                            </span>
                            <span className="text-[rgb(186,255,188)]/70 font-orbitron text-[10px] tracking-wider">
                              days
                            </span>
                            <span className="text-white font-orbitron text-base tracking-wider">
                              {countdown.hours}
                            </span>
                            <span className="text-[rgb(186,255,188)]/70 font-orbitron text-[10px] tracking-wider">
                              hrs
                            </span>
                            <span className="text-white font-orbitron text-base tracking-wider">
                              {countdown.minutes}
                            </span>
                            <span className="text-[rgb(186,255,188)]/70 font-orbitron text-[10px] tracking-wider">
                              Mins
                            </span>
                            <span className="text-white font-orbitron text-base tracking-wider">
                              {countdown.seconds}
                            </span>
                            <span className="text-[rgb(186,255,188)]/70 font-orbitron text-[10px] tracking-wider">
                              Secs
                            </span>
                          </div>
                        ) : (
                          <p className="text-[rgb(186,255,188)]/70 text-[10px] font-orbitron uppercase">
                            Auction ended
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })()}

                <div className="flex items-center gap-3">
                  <p
                    className="text-xs leading-relaxed text-[rgb(186,255,188)]/70 hover:cursor-pointer hover:text-[rgb(50,255,52)]"
                    onClick={() => {
                      const collectionLink = `${window.location.origin}/auction/${selectedCollection.id}`;
                      navigator.clipboard.writeText(collectionLink);
                      setCopied(true);
                      setCopiedTimeout(
                        setTimeout(() => {
                          setCopied(false);
                        }, 2000),
                      );
                    }}
                  >
                    {copied ? "Copied!" : "🔗 Copy Link"}
                  </p>
                  <span className="text-[rgb(186,255,188)]/30">|</span>
                  <p
                    className="text-xs leading-relaxed text-[rgb(186,255,188)]/70 hover:cursor-pointer hover:text-[rgb(50,255,52)]"
                    onClick={async () => {
                      setImageStatus('loading');
                      try {
                        const imageUrl = `${window.location.origin}/api/og/auction/${selectedCollection.id}`;
                        const response = await fetch(imageUrl);
                        const blob = await response.blob();

                        // Try to copy to clipboard first (modern browsers)
                        if (navigator.clipboard && 'write' in navigator.clipboard) {
                          try {
                            await navigator.clipboard.write([
                              new ClipboardItem({ 'image/png': blob })
                            ]);
                            setImageStatus('copied');
                            setTimeout(() => setImageStatus('idle'), 2000);
                            return;
                          } catch {
                            // Fall through to download
                          }
                        }

                        // Fallback: download the image
                        const url = URL.createObjectURL(blob);
                        const a = document.createElement('a');
                        a.href = url;
                        a.download = `auction-${selectedCollection.id}.png`;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        URL.revokeObjectURL(url);
                        setImageStatus('downloaded');
                        setTimeout(() => setImageStatus('idle'), 2000);
                      } catch (error) {
                        console.error('Failed to share image:', error);
                        setImageStatus('idle');
                      }
                    }}
                  >
                    {imageStatus === 'loading' ? '⏳ Loading...' :
                     imageStatus === 'copied' ? '✓ Copied!' :
                     imageStatus === 'downloaded' ? '✓ Downloaded!' :
                     '📷 Share Image'}
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-4 md:gap-6">
                <div className="grid grid-cols-2 gap-2 md:gap-3 text-sm text-white">
                  <div className="rounded-xl border border-white/12 bg-white/5 px-3 md:px-4 py-2 md:py-3 text-center">
                    <p className="text-[rgb(186,255,188)]/70 text-[10px] md:text-[11px] uppercase tracking-[0.16em]">
                      Reserved Price
                    </p>
                    <p className="font-orbitron text-base md:text-lg tracking-[0.12em]">
                      {formatUSDSmart(selectedCollection.startingPrice / 1e6)}
                    </p>
                  </div>
                  <div className="rounded-xl border border-white/12 bg-white/5 px-3 md:px-4 py-2 md:py-3 text-center">
                    <p className="text-[rgb(186,255,188)]/70 text-[10px] md:text-[11px] uppercase tracking-[0.16em]">
                      Highest Bid
                    </p>
                    <p className="font-orbitron text-base md:text-lg tracking-[0.12em]">
                      {selectedCollection.highestBid !== undefined
                        ? formatUSDSmart(selectedCollection.highestBid)
                        : "No bids"}
                    </p>
                  </div>
                </div>

                <div className="w-full rounded-xl border border-[rgb(50,255,52)]/20 bg-[rgb(50,255,52)]/5 px-3 md:px-4 py-3 md:py-4 overflow-hidden">
                  <div className="flex flex-col md:flex-row gap-4">
                    <div className="flex-1 min-w-0">
                      <p className="text-[rgb(186,255,188)]/70 text-[10px] md:text-[11px] font-orbitron uppercase tracking-[0.16em] mb-3">
                        Live Price Chart
                      </p>
                      <div className="w-full max-w-[400px]">
                        <BidPriceChart
                          width={380}
                          height={120}
                          startingPrice={selectedCollection.startingPrice / 1e6}
                          currentBid={selectedCollection.highestBid}
                          bids={auction?.bids}
                        />
                      </div>
                    </div>
                    <div className="md:w-48 lg:w-56 flex-shrink-0">
                      <p className="text-[rgb(186,255,188)]/70 text-[10px] md:text-[11px] font-orbitron uppercase tracking-[0.16em] mb-3">
                        Latest Bids
                      </p>
                      {auction?.bids && auction.bids.length > 0 ? (
                        <div className="flex flex-col gap-2">
                          {auction.bids
                            .slice()
                            .sort((a, b) => {
                              const amountA = a.amount.startsWith('0x') ? parseInt(a.amount, 16) : parseFloat(a.amount);
                              const amountB = b.amount.startsWith('0x') ? parseInt(b.amount, 16) : parseFloat(b.amount);
                              return amountB - amountA;
                            })
                            .slice(0, 5)
                            .map((bid, index) => {
                              const bidAmount = bid.amount.startsWith('0x') || bid.amount.startsWith('0X')
                                ? parseInt(bid.amount, 16) / 1e6
                                : parseFloat(bid.amount) / 1e6;
                              return (
                                <div
                                  key={`${bid.bidder}-${bid.amount}-${index}`}
                                  className="flex items-center justify-between py-1.5 px-2 rounded-lg bg-black/30"
                                >
                                  <span className="text-[10px] text-[rgb(186,255,188)]/60 truncate max-w-[80px]">
                                    <AddressDisplay address={bid.bidder} />
                                  </span>
                                  <span className="text-[11px] font-medium text-white">
                                    {formatUSDSmart(bidAmount)}
                                  </span>
                                </div>
                              );
                            })}
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => {
                            const reservePrice = selectedCollection.startingPrice / 1e6;
                            const minBid = (reservePrice * 1.02).toFixed(2);
                            setBidAmountToken(minBid);
                            setBidInputHighlight(true);
                            setTimeout(() => setBidInputHighlight(false), 1000);
                          }}
                          className="flex flex-col items-center justify-center py-4 px-2 rounded-lg bg-black/30 border border-dashed border-[rgb(50,255,52)]/40 hover:bg-[rgb(50,255,52)]/10 hover:border-[rgb(50,255,52)]/60 transition-all cursor-pointer w-full animate-pulse-glow"
                        >
                          <span className="text-xl mb-1">🔥</span>
                          <p className="text-[11px] font-orbitron uppercase tracking-wider text-[rgb(50,255,52)] text-center">
                            No bids yet — set the price!
                          </p>
                          <p className="text-[9px] text-[rgb(186,255,188)]/50 mt-1 text-center">
                            Start at {formatUSDSmart((selectedCollection.startingPrice / 1e6) * 1.02)}
                          </p>
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col md:flex-row gap-4 md:items-start w-full">
                  <div className="flex flex-col gap-3 w-full md:w-auto">
                    <label className="text-[11px] font-orbitron uppercase tracking-[0.14em] text-[rgb(186,255,188)]/70">
                      Pay With
                    </label>
                    <CustomDropdown
                      id="payment-token"
                      value={paymentToken}
                      onChange={setPaymentToken}
                      options={SUPPORTED_TOKENS.map((token) => {
                        const balanceInfo =
                          address && tokenBalances[token.address] !== undefined
                            ? tokenBalances[token.address]
                            : null;

                        let balanceDisplay: string;
                        if (!address) {
                          balanceDisplay = "—";
                        } else if (!balanceInfo) {
                          balanceDisplay = "...";
                        } else {
                          // Always show USD value (which will be $0.00 for zero balances)
                          balanceDisplay = balanceInfo.usdValue || formatUSD(0);
                        }

                        return {
                          value: token.address,
                          label: token.symbol,
                          balance: balanceDisplay,
                          logo: tokenLogos[token.address],
                        };
                      })}
                      variant="green"
                      className="w-full md:w-40"
                    />
                    {bidAmountUSD > 0 &&
                      paymentToken.toLowerCase() !==
                        USDC_ADDRESS.toLowerCase() && (
                        <p className="text-xs text-[rgb(186,255,188)]/50">
                          ≈{" "}
                          {(() => {
                            const tokenInfo = SUPPORTED_TOKENS.find(
                              (t) =>
                                t.address.toLowerCase() ===
                                paymentToken.toLowerCase(),
                            );
                            const symbol = tokenInfo?.symbol || "";
                            const decimals = tokenInfo?.decimals || 18;
                            return formatTokenAmount(
                              bidAmountInPaymentToken,
                              decimals,
                              symbol,
                            );
                          })()}
                        </p>
                      )}
                    {insufficientFundsError && (
                      <p className="text-xs text-red-400">
                        {insufficientFundsError}
                      </p>
                    )}
                  </div>
                  {(() => {
                    const auction = paginatedFilteredAuctions.find(
                      (a) => a.auction_id === selectedCollection.id,
                    );
                    const nfts = auction?.nfts || [];

                    const totalPower = nfts.reduce((sum, nft) => {
                      const power = parseFloat(nft.power || "0");
                      return sum + (isNaN(power) ? 0 : power);
                    }, 0);

                    const averagePower =
                      nfts.length > 0 ? totalPower / nfts.length : 0;

                    // For single-NFT auctions, show Type, Power, and Tier in a compact row
                    if (nfts.length === 1) {
                      const singleNft = nfts[0];
                      const beastType = singleNft.beastType || "—";
                      const tier = singleNft.tier || "—";
                      const level = singleNft.level || "—";

                      return (
                        <div className="flex-1 grid grid-cols-3 gap-2 md:gap-3 text-sm text-white">
                          <div className="rounded-xl border border-white/12 bg-white/5 px-2 md:px-3 py-2 md:py-3 text-center">
                            <p className="text-[rgb(186,255,188)]/70 text-[9px] md:text-[10px] uppercase tracking-[0.16em]">
                              Type
                            </p>
                            <p className="font-orbitron text-sm md:text-base tracking-[0.12em]">
                              {beastType}
                            </p>
                          </div>
                          <div className="rounded-xl border border-white/12 bg-white/5 px-2 md:px-3 py-2 md:py-3 text-center">
                            <p className="text-[rgb(186,255,188)]/70 text-[9px] md:text-[10px] uppercase tracking-[0.16em]">
                              Power
                            </p>
                            <p className="font-orbitron text-sm md:text-base tracking-[0.12em] text-[rgb(50,255,52)]">
                              {totalPower.toFixed(1)}
                            </p>
                          </div>
                          <div className="rounded-xl border border-white/12 bg-white/5 px-2 md:px-3 py-2 md:py-3 text-center">
                            <p className="text-[rgb(186,255,188)]/70 text-[9px] md:text-[10px] uppercase tracking-[0.16em]">
                              Level
                            </p>
                            <p className="font-orbitron text-sm md:text-base tracking-[0.12em]">
                              {level}
                            </p>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div className="flex-1 grid grid-cols-2 gap-3 md:gap-6 text-sm text-white w-full">
                        <div className="rounded-xl border border-white/12 bg-white/5 px-3 md:px-4 py-2 md:py-3 text-center">
                          <p className="text-[rgb(186,255,188)]/70 text-[10px] md:text-[11px] uppercase tracking-[0.16em]">
                            Collection Power
                          </p>
                          <p className="font-orbitron text-base md:text-lg tracking-[0.12em]">
                            {totalPower.toFixed(1)}
                          </p>
                        </div>
                        <div className="rounded-xl border border-white/12 bg-white/5 px-3 md:px-4 py-2 md:py-3 text-center">
                          <p className="text-[rgb(186,255,188)]/70 text-[10px] md:text-[11px] uppercase tracking-[0.16em]">
                            Collection Average Power
                          </p>
                          <p className="font-orbitron text-base md:text-lg tracking-[0.12em]">
                            {averagePower.toFixed(1)}
                          </p>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="w-full flex flex-col md:flex-row gap-4 items-start">
                  <div className="flex w-full md:w-[200px] flex-col gap-3">
                    <label
                      htmlFor="bid-amount-token"
                      className="text-[11px] font-orbitron uppercase tracking-[0.14em] text-[rgb(186,255,188)]/70"
                    >
                      Place Your Bid (USDC)
                    </label>
                    <input
                      id="bid-amount-token"
                      type="text"
                      value={bidAmountToken}
                      placeholder="0.00"
                      onChange={(event) => {
                        const value = event.target.value;
                        setBidAmountToken(value);

                        if (
                          paymentToken.toLowerCase() !==
                            USDC_ADDRESS.toLowerCase() &&
                          shouldRefetchPrice(paymentToken)
                        ) {
                          getTokenPriceInUSDC(paymentToken, address)
                            .then((price) => {
                              setTokenPrice(price);
                            })
                            .catch((err) => {
                              console.error("Error refetching price:", err);
                            });
                        }
                      }}
                      className={`w-full md:w-40 rounded-xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/5 px-4 py-2.5 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none ${bidInputHighlight ? "animate-attention-flash" : ""}`}
                    />
                    {(() => {
                      const hasHighestBid = selectedCollection.highestBid !== undefined && selectedCollection.highestBid > 0;
                      const basePrice = hasHighestBid
                        ? selectedCollection.highestBid!
                        : selectedCollection.startingPrice / 1e6;
                      const minBid = basePrice * 1.02;
                      const midBid = basePrice * 1.5;
                      const highBid = basePrice * 2;
                      const maxBid = basePrice * 3;

                      return (
                        <div className="flex flex-col gap-1.5">
                          <p className="text-[9px] text-[rgb(186,255,188)]/50 font-orbitron uppercase tracking-wider">
                            Quick bid {hasHighestBid ? `(${formatUSDSmart(basePrice)} highest)` : `(${formatUSDSmart(basePrice)} reserve)`}
                          </p>
                          <div className="flex gap-1.5 flex-wrap">
                            <button
                              type="button"
                              onClick={() => setBidAmountToken(minBid.toFixed(2))}
                              className="px-2 py-1 text-[9px] font-orbitron uppercase tracking-wider rounded-md border border-[rgb(50,255,52)]/30 bg-[rgb(50,255,52)]/5 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/15 transition"
                            >
                              +2%
                            </button>
                            <button
                              type="button"
                              onClick={() => setBidAmountToken(midBid.toFixed(2))}
                              className="px-2 py-1 text-[9px] font-orbitron uppercase tracking-wider rounded-md border border-[rgb(50,255,52)]/30 bg-[rgb(50,255,52)]/5 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/15 transition"
                            >
                              1.5x
                            </button>
                            <button
                              type="button"
                              onClick={() => setBidAmountToken(highBid.toFixed(2))}
                              className="px-2 py-1 text-[9px] font-orbitron uppercase tracking-wider rounded-md border border-[rgb(50,255,52)]/30 bg-[rgb(50,255,52)]/5 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/15 transition"
                            >
                              2x
                            </button>
                            <button
                              type="button"
                              onClick={() => setBidAmountToken(maxBid.toFixed(2))}
                              className="px-2 py-1 text-[9px] font-orbitron uppercase tracking-wider rounded-md border border-[rgb(50,255,52)]/30 bg-[rgb(50,255,52)]/5 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/15 transition"
                            >
                              3x
                            </button>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                  {(() => {
                    const auction = paginatedFilteredAuctions.find(
                      (a) => a.auction_id === selectedCollection.id,
                    );
                    const nfts = auction?.nfts || [];

                    // Calculate power distribution by type
                    const powerDistribution = nfts.reduce(
                      (acc, nft) => {
                        const type = nft.beastType || "Unknown";
                        const power = parseFloat(nft.power || "0");
                        const validPower = isNaN(power) ? 0 : power;

                        if (
                          type === "Magic" ||
                          type === "Brute" ||
                          type === "Hunter"
                        ) {
                          acc[type] = (acc[type] || 0) + validPower;
                        }
                        return acc;
                      },
                      {} as Record<string, number>,
                    );

                    const magicPower = powerDistribution["Magic"] || 0;
                    const brutePower = powerDistribution["Brute"] || 0;
                    const hunterPower = powerDistribution["Hunter"] || 0;

                    // Hide power distribution for single-NFT auctions (only one type will have power)
                    if (nfts.length === 1) {
                      return null;
                    }

                    return (
                      <div className="flex flex-col gap-3 flex-1 w-full">
                        <label className="text-[11px] font-orbitron uppercase tracking-[0.14em] text-[rgb(186,255,188)]/70">
                          Power Distribution
                        </label>
                        <div className="grid grid-cols-3 gap-2 md:gap-3">
                          <div className="rounded-xl border border-white/12 bg-white/5 px-2 md:px-4 py-2 md:py-3 text-center">
                            <p className="text-[rgb(186,255,188)]/70 text-[10px] md:text-[11px] uppercase tracking-[0.16em]">
                              Magic
                            </p>
                            <p className="font-orbitron text-sm md:text-lg tracking-[0.12em]">
                              {magicPower.toFixed(1)}
                            </p>
                          </div>
                          <div className="rounded-xl border border-white/12 bg-white/5 px-2 md:px-4 py-2 md:py-3 text-center">
                            <p className="text-[rgb(186,255,188)]/70 text-[10px] md:text-[11px] uppercase tracking-[0.16em]">
                              Brute
                            </p>
                            <p className="font-orbitron text-sm md:text-lg tracking-[0.12em]">
                              {brutePower.toFixed(1)}
                            </p>
                          </div>
                          <div className="rounded-xl border border-white/12 bg-white/5 px-2 md:px-4 py-2 md:py-3 text-center">
                            <p className="text-[rgb(186,255,188)]/70 text-[10px] md:text-[11px] uppercase tracking-[0.16em]">
                              Hunter
                            </p>
                            <p className="font-orbitron text-sm md:text-lg tracking-[0.12em]">
                              {hunterPower.toFixed(1)}
                            </p>
                          </div>
                        </div>
                      </div>
                    );
                  })()}
                </div>

                <div className="flex flex-col gap-2 w-full max-w-full md:max-w-[550px]">
                  <div className="flex flex-row gap-2 md:gap-3 w-full">
                    <button
                      type="button"
                      onClick={handlePlaceBid}
                      disabled={
                        !isBidValid || !account || isSubmitting || isUserSeller
                      }
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
                        onClick={handleMakeOffer}
                        disabled={
                          !isBidValid ||
                          !account ||
                          isSubmittingOffer ||
                          isUserSeller
                        }
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
                      onClick={handleSettleAuction}
                      disabled={
                        !account ||
                        isSettling ||
                        !isAuctionExpired(
                          selectedCollection.endTime,
                          selectedCollection.status,
                        )
                      }
                      className={`inline-flex items-center justify-center rounded-full flex-1 px-3 md:px-4 h-9 text-[10px] md:text-xs font-orbitron uppercase tracking-[0.1em] md:tracking-[0.12em] transition whitespace-nowrap ${
                        account &&
                        !isSettling &&
                        isAuctionExpired(
                          selectedCollection.endTime,
                          selectedCollection.status,
                        )
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
                      onClick={openWalletModal}
                      className="text-[10px] md:text-xs text-center text-[rgb(50,255,52)]/80 font-orbitron animate-pulse hover:text-[rgb(50,255,52)] hover:underline cursor-pointer transition-colors"
                    >
                      Connect wallet to place a bid →
                    </button>
                  )}
                </div>

                {userOffer && address && (
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
                          {new Date(
                            parseInt(userOffer.createdAt) * 1000,
                          ).toLocaleDateString()}
                        </div>
                      </div>

                      <button
                        onClick={handleWithdrawOffer}
                        disabled={isWithdrawingOffer}
                        className={`px-3 md:px-4 py-2 rounded-full font-orbitron text-[10px] md:text-xs uppercase tracking-[0.1em] md:tracking-[0.12em] transition whitespace-nowrap ${
                          isWithdrawingOffer
                            ? "bg-white/5 text-white/30 cursor-not-allowed border border-white/12"
                            : "bg-red-600/10 hover:bg-red-600 text-red-500 hover:text-black border border-red-500/40 hover:cursor-pointer"
                        }`}
                      >
                        {isWithdrawingOffer ? (
                          <div className="flex items-center gap-2">
                            <svg
                              className="animate-spin h-4 w-4"
                              viewBox="0 0 24 24"
                            >
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
                      {isRefunded
                        ? "Auction Refunded"
                        : "Settle Transaction Submitted"}
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
              </div>
            </div>
          </section>
        </div>
      );
    };

    return (
      <>
        {renderGrid()}

        <div className="flex justify-center mt-6">
          <Pagination
            currentPage={localCurrentPage}
            totalPages={totalFilteredPages}
            onPageChange={handlePageChange}
          />
        </div>
      </>
    );
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-8 px-4">
      <Filters token={token} filters={filters} onFiltersChange={setFilters} summitListedCount={summitListedCount} />
      {renderContent()}

      <BeastDetailModal
        isOpen={isBeastModalOpen}
        onClose={() => setIsBeastModalOpen(false)}
        nfts={selectedAuctionNfts}
        currentIndex={selectedBeastIndex}
        onNavigate={setSelectedBeastIndex}
      />
    </div>
  );
}
