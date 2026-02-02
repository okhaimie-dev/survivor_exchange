/**
 * Custom hook for auction bid, offer, and settle actions
 * Encapsulates all the complex transaction logic with token swaps
 */

import { useCallback, useState } from "react";
import { useAccount, useProvider } from "@starknet-react/core";
import { uint256 } from "starknet";
import { fetchTokens, getQuotes, quoteToCalls } from "@avnu/avnu-sdk";
import { useToast } from "../../providers/toast-provider";
import {
  AUCTION_CONTRACT_ADDRESS,
  VAULT_CONTRACT_ADDRESS,
  USDC_ADDRESS,
  SUPPORTED_TOKENS,
} from "../../lib/constants";
import { normalizeContractAddress } from "../../lib/utils/normalization";
import {
  getTokenPriceInUSDC,
  shouldRefetchPrice,
} from "../../lib/utils/token-price-cache";
import type { Collection } from "../../lib/types";
import type { AuctionWithNFTs } from "../data/use-auctions";

interface UseBidActionsOptions {
  selectedCollectionId: string;
  selectedCollection: Collection | undefined;
  paymentToken: string;
  tokenPrice: number | null;
  bidAmountToken: string;
  paginatedFilteredAuctions: AuctionWithNFTs[];
  onTokenPriceUpdate: (price: number | null) => void;
}

interface BidActionsState {
  isSubmitting: boolean;
  txnHash: string | undefined;
  isSubmittingOffer: boolean;
  offerTxnHash: string | undefined;
  isWithdrawingOffer: boolean;
  withdrawOfferTxnHash: string;
  isSettling: boolean;
  settleTxnHash: string | undefined;
  isRefunded: boolean;
  insufficientFundsError: string | null;
}

interface BidActionsCallbacks {
  handlePlaceBid: () => Promise<void>;
  /** Place a single bid on the given auction (for bulk buy). */
  placeBidForAuction: (auctionId: string, amountUsd: number, minimumBidUsd?: number) => Promise<void>;
  handleMakeOffer: () => Promise<void>;
  handleWithdrawOffer: () => Promise<void>;
  handleSettleAuction: () => Promise<void>;
  clearTxnHash: () => void;
  clearOfferTxnHash: () => void;
  clearSettleTxnHash: () => void;
  clearInsufficientFundsError: () => void;
  setBidAmountToken: (amount: string) => void;
}

const isValidPrice = (price: number | null): boolean => {
  if (price === null) return false;
  return (
    isFinite(price) &&
    price !== Infinity &&
    price !== -Infinity &&
    !isNaN(price) &&
    price > 0
  );
};

export function useBidActions(
  options: UseBidActionsOptions
): BidActionsState & BidActionsCallbacks {
  const { account, address } = useAccount();
  const provider = useProvider();
  const toast = useToast();

  const {
    selectedCollectionId,
    selectedCollection,
    paymentToken,
    tokenPrice,
    bidAmountToken,
    paginatedFilteredAuctions,
    onTokenPriceUpdate,
  } = options;

  // State
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [txnHash, setTxnHash] = useState<string | undefined>();
  const [isSubmittingOffer, setIsSubmittingOffer] = useState(false);
  const [offerTxnHash, setOfferTxnHash] = useState<string | undefined>();
  const [isWithdrawingOffer, setIsWithdrawingOffer] = useState(false);
  const [withdrawOfferTxnHash, setWithdrawOfferTxnHash] = useState("");
  const [isSettling, setIsSettling] = useState(false);
  const [settleTxnHash, setSettleTxnHash] = useState<string | undefined>();
  const [isRefunded, setIsRefunded] = useState(false);
  const [insufficientFundsError, setInsufficientFundsError] = useState<string | null>(null);
  const [localBidAmount, setLocalBidAmount] = useState("");

  const isBidValid = useCallback(() => {
    const amount = bidAmountToken || localBidAmount;
    const numericBid = parseFloat(amount);
    return !Number.isNaN(numericBid) && numericBid > 0;
  }, [bidAmountToken, localBidAmount]);

  const buildSwapCalls = useCallback(async (
    usdcAmount: number,
    currentTokenPrice: number
  ): Promise<{
    calls: Array<{ contractAddress: string; entrypoint: string; calldata: string[] }>;
    finalAmount: bigint;
  }> => {
    const calls: Array<{ contractAddress: string; entrypoint: string; calldata: string[] }> = [];

    const paymentTokenInfo = SUPPORTED_TOKENS.find(
      (t) => t.address.toLowerCase() === paymentToken.toLowerCase()
    );
    if (!paymentTokenInfo) {
      throw new Error("Invalid payment token");
    }

    // Calculate how much of the payment token we need
    const tokenAmountNeeded = usdcAmount / currentTokenPrice;
    const tokenAmountWei = BigInt(
      Math.floor(tokenAmountNeeded * Math.pow(10, paymentTokenInfo.decimals))
    );

    // Check balance of payment token
    const balanceResult = await provider.provider.callContract({
      contractAddress: paymentToken,
      entrypoint: "balanceOf",
      calldata: [address!],
    });

    if (!balanceResult || balanceResult.length < 2) {
      throw new Error("Invalid balance response");
    }

    const low = balanceResult[0];
    const high = balanceResult[1];
    const balance = BigInt(low) + (BigInt(high) << BigInt(128));

    // Check balance with a 2% buffer
    const balanceWithBuffer = (tokenAmountWei * 102n) / 100n;
    if (balance < balanceWithBuffer) {
      throw new Error("Insufficient funds");
    }

    // Get Avnu swap quotes
    const quotes = await getQuotes({
      sellTokenAddress: paymentToken,
      buyTokenAddress: USDC_ADDRESS,
      sellAmount: tokenAmountWei,
      takerAddress: address!,
    });

    if (!quotes || quotes.length === 0) {
      throw new Error("No swap quotes available");
    }

    const bestQuote = quotes[0];
    const slippage = 0.01; // 1% slippage

    const swapCallsResult = await quoteToCalls({
      quoteId: bestQuote.quoteId,
      slippage: slippage,
    });

    const allSwapCalls =
      swapCallsResult.calls ||
      (Array.isArray(swapCallsResult) ? swapCallsResult : [swapCallsResult]);

    const swapCalls = allSwapCalls.filter((call) => call.entrypoint !== "approve");

    if (swapCalls.length === 0) {
      throw new Error("No swap calls available from quote");
    }

    const actualSellAmount = bestQuote.sellAmount;
    const paymentTokenApprovalAmount = (actualSellAmount * 102n) / 100n;
    const paymentTokenApproval = uint256.bnToUint256(paymentTokenApprovalAmount);

    const routerAddress = swapCalls[0]?.contractAddress;
    if (!routerAddress) {
      throw new Error("Unable to determine router address from swap calls");
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

    swapCalls.forEach((call) => {
      const calldataArray = Array.isArray(call.calldata)
        ? call.calldata.map((arg) => (typeof arg === "string" ? arg : String(arg)))
        : [];

      calls.push({
        contractAddress: call.contractAddress,
        entrypoint: call.entrypoint,
        calldata: calldataArray,
      });
    });

    // Calculate minimum buy amount after slippage
    let buyAmount: bigint;
    if (typeof bestQuote.buyAmount === "bigint") {
      buyAmount = bestQuote.buyAmount;
    } else if (typeof bestQuote.buyAmount === "string") {
      buyAmount = BigInt(bestQuote.buyAmount);
    } else {
      buyAmount = BigInt(Math.floor(Number(bestQuote.buyAmount)));
    }
    const minBuyAmount = (buyAmount * BigInt(Math.floor((1 - slippage) * 10000))) / 10000n;

    return { calls, finalAmount: minBuyAmount };
  }, [paymentToken, address, provider]);

  const handlePlaceBid = useCallback(async () => {
    const amount = bidAmountToken || localBidAmount;
    if (
      !account ||
      !address ||
      selectedCollectionId === "" ||
      selectedCollectionId === null ||
      selectedCollectionId === undefined ||
      !isBidValid()
    ) {
      return;
    }

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
      const usdcAmount = parseFloat(amount);
      if (isNaN(usdcAmount) || usdcAmount <= 0) {
        throw new Error("Invalid bid amount");
      }

      // Check minimum bid (reserved price + 2%)
      if (selectedCollection) {
        const reservedPriceUSD = selectedCollection.startingPrice / 1e6;
        const minimumBid = reservedPriceUSD * 1.02;

        if (usdcAmount < minimumBid) {
          setInsufficientFundsError(`Minimum bid is $${minimumBid.toFixed(2)}`);
          setIsSubmitting(false);
          return;
        }
      }

      const finalUSDAmount = Math.floor(usdcAmount * 1e6);

      if (paymentToken.toLowerCase() !== USDC_ADDRESS.toLowerCase()) {
        let currentTokenPrice = tokenPrice;
        if (shouldRefetchPrice(paymentToken)) {
          currentTokenPrice = await getTokenPriceInUSDC(paymentToken, address);
          onTokenPriceUpdate(currentTokenPrice);
        }

        if (currentTokenPrice === null || !isValidPrice(currentTokenPrice)) {
          throw new Error("Unable to get token price");
        }

        const { calls: swapCalls, finalAmount } = await buildSwapCalls(usdcAmount, currentTokenPrice);
        calls.push(...swapCalls);

        const usdcApproval = uint256.bnToUint256(finalAmount);
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
          calldata: [auctionId.toString(), finalAmount.toString()],
        });
      } else {
        // USDC direct payment
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
          setInsufficientFundsError("Insufficient funds to place bid.");
          setIsSubmitting(false);
          return;
        }

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
      setLocalBidAmount("");
      toast.success("Bid placed", "Your bid has been submitted successfully");
    } catch (err) {
      console.error("Error placing bid:", err);
      if (err instanceof Error && err.message.includes("balance")) {
        setInsufficientFundsError("Insufficient funds");
        toast.error("Insufficient funds", "You don't have enough balance to place this bid");
      } else {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        toast.error("Failed to place bid", errorMessage);
      }
    } finally {
      setIsSubmitting(false);
    }
  }, [
    account,
    address,
    selectedCollectionId,
    bidAmountToken,
    localBidAmount,
    isBidValid,
    paymentToken,
    tokenPrice,
    provider,
    selectedCollection,
    buildSwapCalls,
    onTokenPriceUpdate,
    toast,
  ]);

  const placeBidForAuction = useCallback(
    async (auctionId: string, amountUsd: number, minimumBidUsd?: number) => {
      if (!account || !address) return;
      if (minimumBidUsd !== undefined && amountUsd < minimumBidUsd) {
        throw new Error(`Minimum bid is $${minimumBidUsd.toFixed(2)}`);
      }
      const calls: Array<{
        contractAddress: string;
        entrypoint: string;
        calldata: string[];
      }> = [];
      const auctionIdNum = parseInt(auctionId, 10);
      const finalUSDAmount = Math.floor(amountUsd * 1e6);

      if (paymentToken.toLowerCase() !== USDC_ADDRESS.toLowerCase()) {
        let currentTokenPrice = tokenPrice;
        if (shouldRefetchPrice(paymentToken)) {
          currentTokenPrice = await getTokenPriceInUSDC(paymentToken, address);
          onTokenPriceUpdate(currentTokenPrice);
        }
        if (currentTokenPrice === null || !isValidPrice(currentTokenPrice)) {
          throw new Error("Unable to get token price");
        }
        const { calls: swapCalls, finalAmount } = await buildSwapCalls(amountUsd, currentTokenPrice);
        calls.push(...swapCalls);
        const usdcApproval = uint256.bnToUint256(finalAmount);
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
          calldata: [auctionIdNum.toString(), finalAmount.toString()],
        });
      } else {
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
          throw new Error("Insufficient funds to place bid.");
        }
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
          calldata: [auctionIdNum.toString(), finalUSDAmount.toString()],
        });
      }
      await account.execute(calls);
    },
    [
      account,
      address,
      paymentToken,
      tokenPrice,
      provider,
      buildSwapCalls,
      onTokenPriceUpdate,
    ]
  );

  const handleMakeOffer = useCallback(async () => {
    const amount = bidAmountToken || localBidAmount;
    if (
      !account ||
      !address ||
      selectedCollectionId === "" ||
      selectedCollectionId === null ||
      selectedCollectionId === undefined ||
      !isBidValid()
    ) {
      return;
    }

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
      const usdcAmount = parseFloat(amount);
      if (isNaN(usdcAmount) || usdcAmount <= 0) {
        throw new Error("Invalid offer amount");
      }

      const finalUSDAmount = Math.floor(usdcAmount * 1e6);
      const calls: Array<{
        contractAddress: string;
        entrypoint: string;
        calldata: string[];
      }> = [];

      if (paymentToken.toLowerCase() !== USDC_ADDRESS.toLowerCase()) {
        let currentTokenPrice = tokenPrice;
        if (shouldRefetchPrice(paymentToken)) {
          currentTokenPrice = await getTokenPriceInUSDC(paymentToken, address);
          onTokenPriceUpdate(currentTokenPrice);
        }

        if (currentTokenPrice === null || !isValidPrice(currentTokenPrice)) {
          throw new Error("Unable to get token price");
        }

        const { calls: swapCalls, finalAmount } = await buildSwapCalls(usdcAmount, currentTokenPrice);
        calls.push(...swapCalls);

        const usdcApproval = uint256.bnToUint256(finalAmount);
        calls.push({
          contractAddress: USDC_ADDRESS,
          entrypoint: "approve",
          calldata: [
            VAULT_CONTRACT_ADDRESS,
            usdcApproval.low.toString(),
            usdcApproval.high.toString(),
          ],
        });

        const TEN_YEARS_IN_SECONDS = 10 * 365 * 24 * 60 * 60;
        calls.push({
          contractAddress: AUCTION_CONTRACT_ADDRESS,
          entrypoint: "make_offer",
          calldata: [
            auctionId.toString(),
            finalAmount.toString(),
            "0",
            TEN_YEARS_IN_SECONDS.toString(),
          ],
        });
      } else {
        // USDC direct payment
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
          setInsufficientFundsError("Insufficient funds to make offer.");
          setIsSubmittingOffer(false);
          return;
        }

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
      setLocalBidAmount("");
      toast.success("Offer submitted", "Your offer has been sent to the seller");
    } catch (err) {
      console.error("Error making offer:", err);
      if (err instanceof Error && err.message.includes("balance")) {
        setInsufficientFundsError("Insufficient funds");
        toast.error("Insufficient funds", "You don't have enough balance to make this offer");
      } else {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        toast.error("Failed to make offer", errorMessage);
      }
    } finally {
      setIsSubmittingOffer(false);
    }
  }, [
    account,
    address,
    selectedCollectionId,
    bidAmountToken,
    localBidAmount,
    isBidValid,
    provider,
    paymentToken,
    tokenPrice,
    buildSwapCalls,
    onTokenPriceUpdate,
    toast,
  ]);

  const handleWithdrawOffer = useCallback(async () => {
    if (!account || !selectedCollectionId) {
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
      toast.success("Offer withdrawn", "Your offer has been cancelled");
    } catch (error) {
      console.error("Error withdrawing offer:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error occurred";
      toast.error("Failed to withdraw offer", errorMessage);
    } finally {
      setIsWithdrawingOffer(false);
    }
  }, [account, selectedCollectionId, toast]);

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

    const auction = paginatedFilteredAuctions.find(
      (a) => String(a.auction_id) === selectedCollectionId
    );
    if (!auction) {
      console.error("Auction not found");
      return;
    }

    const currentBidRaw = auction.current_bid
      ? (() => {
          const bidStr = auction.current_bid;
          return bidStr.startsWith("0x") || bidStr.startsWith("0X")
            ? parseInt(bidStr, 16)
            : parseFloat(bidStr);
        })()
      : 0;

    if (!currentBidRaw || currentBidRaw === 0) {
      // Settle without swap
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
        toast.success("Auction settled", "NFTs have been returned");

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
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
        toast.error("Failed to settle auction", errorMessage);
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

      // Settle the auction
      calls.push({
        contractAddress: AUCTION_CONTRACT_ADDRESS,
        entrypoint: "settle_auction",
        calldata: [auctionId.toString()],
      });

      // Swap USDC to feeToken if caller is seller
      const callerAddress = normalizeContractAddress(address).toLowerCase();
      const sellerAddress = normalizeContractAddress(auction.seller).toLowerCase();
      const isSeller = callerAddress === sellerAddress;

      const feeTokenAddress = normalizeContractAddress(auction.fee_token).toLowerCase();
      const usdcAddress = normalizeContractAddress(USDC_ADDRESS).toLowerCase();

      if (isSeller && feeTokenAddress !== usdcAddress) {
        const usdcAmountWei = BigInt(Math.floor(currentBidRaw));
        const swapInputAmount = usdcAmountWei;

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

        const swapCallsResult = await quoteToCalls({
          quoteId: bestQuote.quoteId,
          slippage: 0.01,
        });

        const allSwapCalls =
          swapCallsResult.calls ||
          (Array.isArray(swapCallsResult) ? swapCallsResult : [swapCallsResult]);

        const swapCalls = allSwapCalls.filter((call) => call.entrypoint !== "approve");

        if (swapCalls.length === 0) {
          throw new Error("No swap calls available from quote");
        }

        const usdcApprovalAmount = swapInputAmount;
        const usdcApproval = uint256.bnToUint256(usdcApprovalAmount);

        const routerAddress = swapCalls[0]?.contractAddress;
        if (!routerAddress) {
          throw new Error("Unable to determine router address from swap calls");
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

        swapCalls.forEach((call) => {
          const calldataArray = Array.isArray(call.calldata)
            ? call.calldata.map((arg) => (typeof arg === "string" ? arg : String(arg)))
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
      toast.success("Auction settled", "Transaction submitted successfully");

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
      const errorMessage = err instanceof Error ? err.message : "Unknown error occurred";
      toast.error("Failed to settle auction", errorMessage);
    } finally {
      setIsSettling(false);
    }
  }, [
    account,
    address,
    selectedCollectionId,
    paginatedFilteredAuctions,
    provider,
    toast,
  ]);

  return {
    // State
    isSubmitting,
    txnHash,
    isSubmittingOffer,
    offerTxnHash,
    isWithdrawingOffer,
    withdrawOfferTxnHash,
    isSettling,
    settleTxnHash,
    isRefunded,
    insufficientFundsError,
    // Actions
    handlePlaceBid,
    placeBidForAuction,
    handleMakeOffer,
    handleWithdrawOffer,
    handleSettleAuction,
    clearTxnHash: () => setTxnHash(undefined),
    clearOfferTxnHash: () => setOfferTxnHash(undefined),
    clearSettleTxnHash: () => setSettleTxnHash(undefined),
    clearInsufficientFundsError: () => setInsufficientFundsError(null),
    setBidAmountToken: setLocalBidAmount,
  };
}
