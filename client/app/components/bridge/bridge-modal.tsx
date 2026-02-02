"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAccount as useEVMAccount, useConnect, useDisconnect, useSendTransaction, useWaitForTransactionReceipt, useSwitchChain, useBalance, useReadContract, useWriteContract } from "wagmi";
import { parseEther, parseUnits, formatUnits, erc20Abi } from "viem";
import { useAccount as useStarknetAccount } from "@starknet-react/core";
import {
  SUPPORTED_CHAINS,
  CHAIN_TOKENS,
  STARKNET_STRK,
  getQuote,
  submitDeposit,
  getStatus,
  formatAmount,
  parseAmount,
  isValidStarknetAddress,
  type SupportedChainId,
  type QuoteResponse,
  type StatusResponse,
  type TokenInfo,
} from "../../lib/bridge/1click-api";

interface BridgeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type BridgeStep = "select" | "quote" | "confirm" | "bridging" | "complete" | "error";

export default function BridgeModal({ isOpen, onClose }: BridgeModalProps) {
  // EVM wallet state
  const { address: evmAddress, isConnected: isEVMConnected, chain } = useEVMAccount();
  const { connectors, connect } = useConnect();
  const { disconnect: disconnectEVM } = useDisconnect();
  const { switchChainAsync } = useSwitchChain();
  const { sendTransaction, data: nativeTxHash, isPending: isNativeSending, error: nativeSendError } = useSendTransaction();
  const { writeContract, data: erc20TxHash, isPending: isErc20Sending, error: erc20SendError } = useWriteContract();

  // Combine tx hashes and states for native and ERC20
  const txHash = nativeTxHash || erc20TxHash;
  const isSending = isNativeSending || isErc20Sending;
  const sendError = nativeSendError || erc20SendError;

  const { isLoading: isConfirming, isSuccess: isConfirmed } = useWaitForTransactionReceipt({
    hash: txHash,
  });

  // Starknet wallet state
  const { address: starknetAddress, isConnected: isStarknetConnected } = useStarknetAccount();

  // Form state (declared early for balance hooks)
  const [sourceChain, setSourceChain] = useState<SupportedChainId>("base");
  const [selectedToken, setSelectedToken] = useState<TokenInfo | null>(null);

  // Get the chain ID for balance queries
  const selectedChainId = SUPPORTED_CHAINS[sourceChain]?.chainId;

  // Fetch native token balance
  const { data: nativeBalance } = useBalance({
    address: evmAddress,
    chainId: selectedChainId,
  });

  // Fetch ERC20 token balance (only if token is not native)
  const { data: erc20Balance } = useReadContract({
    address: selectedToken?.address !== 'native' ? selectedToken?.address as `0x${string}` : undefined,
    abi: erc20Abi,
    functionName: 'balanceOf',
    args: evmAddress ? [evmAddress] : undefined,
    chainId: selectedChainId,
    query: {
      enabled: !!evmAddress && !!selectedToken && selectedToken.address !== 'native',
    },
  });

  // Calculate display balance
  const tokenBalance = selectedToken?.address === 'native'
    ? nativeBalance ? formatUnits(nativeBalance.value, nativeBalance.decimals) : undefined
    : erc20Balance && selectedToken
      ? formatUnits(erc20Balance as bigint, selectedToken.decimals)
      : undefined;

  // Form state (sourceChain and selectedToken declared earlier for balance hooks)
  const [amount, setAmount] = useState("");
  const [destinationAddress, setDestinationAddress] = useState("");
  const [useConnectedStarknet, setUseConnectedStarknet] = useState(true);

  // Quote and status state
  const [quote, setQuote] = useState<QuoteResponse | null>(null);
  const [quoteLoading, setQuoteLoading] = useState(false);
  const [quoteError, setQuoteError] = useState<string | null>(null);
  const [bridgeStatus, setBridgeStatus] = useState<StatusResponse | null>(null);
  const [step, setStep] = useState<BridgeStep>("select");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Track mounted state to prevent state updates after unmount
  const isMountedRef = useRef(true);
  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Initialize selected token when chain changes
  useEffect(() => {
    const tokens = CHAIN_TOKENS[sourceChain];
    if (tokens && tokens.length > 0) {
      setSelectedToken(tokens[0]);
    }
  }, [sourceChain]);

  // Use connected Starknet address if available
  useEffect(() => {
    if (useConnectedStarknet && starknetAddress) {
      setDestinationAddress(starknetAddress);
    }
  }, [useConnectedStarknet, starknetAddress]);

  // Fetch quote when inputs change (only when modal is open)
  useEffect(() => {
    // Don't fetch quotes when modal is closed
    if (!isOpen) return;

    const fetchQuote = async () => {
      if (!selectedToken || !amount || !evmAddress) {
        if (isMountedRef.current) setQuote(null);
        return;
      }

      // Safely parse amount
      let parsedAmount: number;
      try {
        parsedAmount = parseFloat(amount);
        if (isNaN(parsedAmount) || parsedAmount <= 0) {
          if (isMountedRef.current) setQuote(null);
          return;
        }
      } catch {
        if (isMountedRef.current) setQuote(null);
        return;
      }

      const destAddr = useConnectedStarknet ? starknetAddress : destinationAddress;
      if (!destAddr || !isValidStarknetAddress(destAddr)) {
        if (isMountedRef.current) setQuote(null);
        return;
      }

      if (isMountedRef.current) {
        setQuoteLoading(true);
        setQuoteError(null);
      }

      try {
        const amountInSmallest = parseAmount(amount, selectedToken.decimals);
        const quoteResult = await getQuote({
          originAsset: selectedToken.defuseAssetId,
          destinationAsset: STARKNET_STRK.defuseAssetId,
          amount: amountInSmallest,
          recipient: destAddr,
          refundTo: evmAddress,
          dry: true,
        });
        if (isMountedRef.current) {
          setQuote(quoteResult);
        }
      } catch (error) {
        console.error("Quote error:", error);
        if (isMountedRef.current) {
          setQuoteError(error instanceof Error ? error.message : "Failed to get quote");
          setQuote(null);
        }
      } finally {
        if (isMountedRef.current) {
          setQuoteLoading(false);
        }
      }
    };

    const debounce = setTimeout(fetchQuote, 500);
    return () => clearTimeout(debounce);
  }, [isOpen, selectedToken, amount, destinationAddress, starknetAddress, useConnectedStarknet, evmAddress]);

  // Poll status when bridging (uses depositAddress, not quoteId)
  useEffect(() => {
    if (step !== "bridging" || !quote?.depositAddress || !isOpen) return;

    let isPollingActive = true;

    const pollStatus = async () => {
      if (!isPollingActive || !isMountedRef.current) return;

      try {
        const status = await getStatus(quote.depositAddress);
        if (!isPollingActive || !isMountedRef.current) return;

        setBridgeStatus(status);

        // Check for completion status (SUCCESS)
        if (status.status === "SUCCESS") {
          setStep("complete");
        } else if (status.status === "FAILED") {
          setStep("error");
          setErrorMessage(status.error || "Bridge failed");
        } else if (status.status === "REFUNDED") {
          setStep("error");
          setErrorMessage("Bridge was refunded. Funds returned to your wallet.");
        }
        // Other statuses (PENDING_DEPOSIT, KNOWN_DEPOSIT_TX, PROCESSING, INCOMPLETE_DEPOSIT) mean still in progress
      } catch (error) {
        console.error("Status poll error:", error);
        // Don't set error state for polling failures - just log and continue
      }
    };

    pollStatus();
    const interval = setInterval(pollStatus, 5000);
    return () => {
      isPollingActive = false;
      clearInterval(interval);
    };
  }, [step, quote?.depositAddress, isOpen]);

  // Submit deposit hash when transaction confirms
  useEffect(() => {
    if (isConfirmed && txHash && quote?.depositAddress && step === "confirm") {
      // Submit the deposit tx hash to speed up processing
      submitDeposit(quote.quoteId || quote.depositAddress, txHash)
        .then(() => {
          console.log("Deposit submitted successfully");
          if (isMountedRef.current) {
            setStep("bridging");
          }
        })
        .catch((error) => {
          console.error("Submit deposit error:", error);
          // Still move to bridging - the API will detect the deposit anyway
          if (isMountedRef.current) {
            setStep("bridging");
          }
        });
    }
  }, [isConfirmed, txHash, quote?.depositAddress, quote?.quoteId, step]);

  // Handle send error
  useEffect(() => {
    if (sendError && step === "confirm") {
      if (isMountedRef.current) {
        setStep("error");
        setErrorMessage(sendError.message || "Transaction failed");
      }
    }
  }, [sendError, step]);

  const handleExecuteBridge = async () => {
    if (!selectedToken || !quote || !evmAddress) return;

    setStep("confirm");
    setErrorMessage(null);

    try {
      // Get the required chain ID for the selected source chain
      const requiredChainId = SUPPORTED_CHAINS[sourceChain].chainId;

      // Switch to the correct network if needed
      if (chain?.id !== requiredChainId) {
        console.log(`Switching from chain ${chain?.id} to ${requiredChainId} (${sourceChain})`);
        await switchChainAsync({ chainId: requiredChainId });
      }

      // Get fresh quote with dry: false
      const destAddr = useConnectedStarknet ? starknetAddress : destinationAddress;
      if (!destAddr) return;

      const amountInSmallest = parseAmount(amount, selectedToken.decimals);
      console.log('Requesting live quote with dry: false...');
      const liveQuote = await getQuote({
        originAsset: selectedToken.defuseAssetId,
        destinationAsset: STARKNET_STRK.defuseAssetId,
        amount: amountInSmallest,
        recipient: destAddr,
        refundTo: evmAddress,
        dry: false,
      });
      console.log('Live quote received:', liveQuote);
      setQuote(liveQuote);

      // Validate deposit address
      if (!liveQuote.depositAddress || !liveQuote.depositAddress.startsWith('0x')) {
        throw new Error(`Invalid deposit address received from API: ${liveQuote.depositAddress || 'empty'}`);
      }

      // Send transaction
      if (selectedToken.address === "native") {
        // Native token transfer (ETH, POL, etc.)
        console.log('Sending native token to:', liveQuote.depositAddress, 'amount:', amount, 'on chain:', requiredChainId);
        sendTransaction({
          to: liveQuote.depositAddress as `0x${string}`,
          value: parseEther(amount),
          chainId: requiredChainId,
        });
      } else {
        // ERC20 token transfer (USDC, USDT, etc.)
        const tokenAmount = parseUnits(amount, selectedToken.decimals);
        console.log('Sending ERC20 token to:', liveQuote.depositAddress, 'amount:', tokenAmount.toString(), 'token:', selectedToken.address, 'on chain:', requiredChainId);
        writeContract({
          address: selectedToken.address as `0x${string}`,
          abi: erc20Abi,
          functionName: 'transfer',
          args: [liveQuote.depositAddress as `0x${string}`, tokenAmount],
          chainId: requiredChainId,
        });
      }
    } catch (error) {
      console.error("Bridge error:", error);
      if (!isMountedRef.current) return;

      // Check if user rejected the transaction
      const errorMessage = error instanceof Error ? error.message : "Bridge failed";
      const isUserRejection = errorMessage.toLowerCase().includes("rejected") ||
                              errorMessage.toLowerCase().includes("denied") ||
                              errorMessage.toLowerCase().includes("cancelled") ||
                              errorMessage.toLowerCase().includes("user refused");

      if (isUserRejection) {
        // User rejected - go back to select step instead of error
        setStep("select");
        setErrorMessage(null);
      } else {
        setStep("error");
        setErrorMessage(errorMessage);
      }
    }
  };

  const handleReset = useCallback(() => {
    setStep("select");
    setQuote(null);
    setBridgeStatus(null);
    setErrorMessage(null);
    setQuoteError(null);
    setQuoteLoading(false);
    setAmount("");
  }, []);

  const handleClose = useCallback(() => {
    handleReset();
    onClose();
  }, [handleReset, onClose]);

  if (!isOpen) return null;

  const tokens = CHAIN_TOKENS[sourceChain] || [];
  const destAddr = useConnectedStarknet ? starknetAddress : destinationAddress;
  const isValidDest = destAddr && isValidStarknetAddress(destAddr);
  // For dry quotes, check amountOut; depositAddress only comes with non-dry quotes
  const hasValidQuote = quote && quote.amountOut && quote.amountOut !== '0';
  // Check if user has sufficient balance
  const hasInsufficientBalance = tokenBalance && amount && parseFloat(amount) > parseFloat(tokenBalance);
  const canBridge = isEVMConnected && selectedToken && amount && parseFloat(amount) > 0 && isValidDest && hasValidQuote && !quoteLoading && !hasInsufficientBalance;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div
        className="relative w-full max-w-md bg-black/95 border-2 border-[rgb(50,255,52)]/60 rounded-2xl shadow-[0_0_40px_rgba(50,255,52,0.2)] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[rgb(50,255,52)]/30">
          <h2 className="text-lg font-orbitron uppercase tracking-wider text-white">
            Bridge to Starknet
          </h2>
          <button
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-lg border border-[rgb(50,255,52)]/40 text-[rgb(50,255,52)] hover:bg-[rgb(50,255,52)]/20 transition-all"
          >
            <svg width="16" height="16" viewBox="0 0 20 20" fill="none">
              <path d="M15 5L5 15M5 5L15 15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-5">
          {step === "select" && (
            <>
              {/* EVM Wallet Connection */}
              {!isEVMConnected ? (
                <div className="space-y-3">
                  <p className="text-sm text-[rgb(186,255,188)]/70 font-orbitron">
                    Connect your wallet to bridge funds
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    {connectors.map((connector) => (
                      <button
                        key={connector.uid}
                        onClick={() => connect({ connector })}
                        className="flex items-center justify-center gap-2 px-4 py-3 rounded-xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/5 text-white hover:bg-[rgb(50,255,52)]/15 transition-all font-orbitron text-sm"
                      >
                        {connector.name}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <>
                  {/* Connected wallet info */}
                  <div className="flex items-center justify-between px-4 py-3 rounded-xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-[rgb(50,255,52)] animate-pulse" />
                      <span className="text-xs text-[rgb(186,255,188)]/70 font-orbitron">
                        {chain?.name || "Connected"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-white font-orbitron">
                        {evmAddress?.slice(0, 6)}...{evmAddress?.slice(-4)}
                      </span>
                      <button
                        onClick={() => disconnectEVM()}
                        className="text-xs text-red-400 hover:text-red-300"
                      >
                        Disconnect
                      </button>
                    </div>
                  </div>

                  {/* Network mismatch warning */}
                  {chain && chain.id !== SUPPORTED_CHAINS[sourceChain].chainId && (
                    <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-yellow-500/40 bg-yellow-500/10">
                      <svg className="w-4 h-4 text-yellow-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      </svg>
                      <span className="text-xs text-yellow-400">
                        Will switch to {SUPPORTED_CHAINS[sourceChain].name} when bridging
                      </span>
                    </div>
                  )}

                  {/* Source Chain Selector */}
                  <div className="space-y-2">
                    <label className="text-xs text-[rgb(186,255,188)]/70 font-orbitron uppercase tracking-wider">
                      From Chain
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      {(Object.keys(SUPPORTED_CHAINS) as SupportedChainId[])
                        .filter((c) => c !== "solana" && c !== "ethereum") // Base, Arbitrum, Polygon only
                        .map((chainId) => {
                          const chainInfo = SUPPORTED_CHAINS[chainId];
                          return (
                            <button
                              key={chainId}
                              onClick={() => setSourceChain(chainId)}
                              className={`flex flex-col items-center gap-1 px-3 py-2 rounded-lg border transition-all ${
                                sourceChain === chainId
                                  ? "border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/20"
                                  : "border-white/20 bg-white/5 hover:border-[rgb(50,255,52)]/50"
                              }`}
                            >
                              <span className="text-xs text-white font-orbitron">{chainInfo.name}</span>
                            </button>
                          );
                        })}
                    </div>
                  </div>

                  {/* Token Selector */}
                  <div className="space-y-2">
                    <label className="text-xs text-[rgb(186,255,188)]/70 font-orbitron uppercase tracking-wider">
                      Token
                    </label>
                    <div className="flex gap-2">
                      {tokens.map((token) => (
                        <button
                          key={token.symbol}
                          onClick={() => setSelectedToken(token)}
                          className={`flex items-center gap-2 px-4 py-2 rounded-lg border transition-all ${
                            selectedToken?.symbol === token.symbol
                              ? "border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/20"
                              : "border-white/20 bg-white/5 hover:border-[rgb(50,255,52)]/50"
                          }`}
                        >
                          <span className="text-sm text-white font-orbitron">{token.symbol}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Amount Input */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-[rgb(186,255,188)]/70 font-orbitron uppercase tracking-wider">
                        Amount
                      </label>
                      {tokenBalance && (
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-[rgb(186,255,188)]/50">
                            Balance: {parseFloat(tokenBalance).toFixed(selectedToken?.address === 'native' ? 4 : 2)} {selectedToken?.symbol}
                          </span>
                          <button
                            onClick={() => setAmount(tokenBalance)}
                            className="text-xs text-[rgb(50,255,52)] hover:underline font-orbitron"
                          >
                            MAX
                          </button>
                        </div>
                      )}
                    </div>
                    <input
                      type="number"
                      value={amount}
                      onChange={(e) => setAmount(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-4 py-3 rounded-xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/5 text-white font-orbitron text-lg outline-none focus:border-[rgb(50,255,52)] transition-all [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none"
                    />
                  </div>

                  {/* Destination Address */}
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs text-[rgb(186,255,188)]/70 font-orbitron uppercase tracking-wider">
                        Starknet Address
                      </label>
                      {isStarknetConnected && (
                        <button
                          onClick={() => setUseConnectedStarknet(!useConnectedStarknet)}
                          className="text-xs text-[rgb(50,255,52)] hover:underline"
                        >
                          {useConnectedStarknet ? "Enter manually" : "Use connected"}
                        </button>
                      )}
                    </div>
                    {useConnectedStarknet && starknetAddress ? (
                      <div className="px-4 py-3 rounded-xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10">
                        <span className="text-sm text-white font-orbitron break-all">
                          {starknetAddress.slice(0, 10)}...{starknetAddress.slice(-8)}
                        </span>
                      </div>
                    ) : (
                      <input
                        type="text"
                        value={destinationAddress}
                        onChange={(e) => setDestinationAddress(e.target.value)}
                        placeholder="0x..."
                        className={`w-full px-4 py-3 rounded-xl border bg-[rgb(50,255,52)]/5 text-white font-orbitron text-sm outline-none transition-all ${
                          destinationAddress && !isValidStarknetAddress(destinationAddress)
                            ? "border-red-500"
                            : "border-[rgb(50,255,52)]/40 focus:border-[rgb(50,255,52)]"
                        }`}
                      />
                    )}
                    {!isStarknetConnected && !destinationAddress && (
                      <p className="text-xs text-[rgb(186,255,188)]/50">
                        Connect your Starknet wallet or enter address manually
                      </p>
                    )}
                  </div>

                  {/* Quote Display */}
                  {quoteLoading && (
                    <div className="flex items-center justify-center py-4">
                      <div className="w-6 h-6 border-2 border-[rgb(50,255,52)] border-t-transparent rounded-full animate-spin" />
                    </div>
                  )}

                  {quoteError && (
                    <div className="px-4 py-3 rounded-xl border border-red-500/40 bg-red-500/10">
                      <p className="text-sm text-red-400">{quoteError}</p>
                    </div>
                  )}

                  {quote && !quoteLoading && (
                    <div className="space-y-2 px-4 py-3 rounded-xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/5">
                      <div className="flex items-center justify-between">
                        <span className="text-xs text-[rgb(186,255,188)]/70">You receive</span>
                        <span className="text-lg text-[rgb(50,255,52)] font-orbitron font-bold">
                          ~{quote.amountOutFormatted || formatAmount(quote.amountOut, STARKNET_STRK.decimals)} STRK
                        </span>
                      </div>
                      {quote.amountOutUsd && quote.amountOutUsd !== '0' && (
                        <div className="flex items-center justify-between text-xs text-[rgb(186,255,188)]/50">
                          <span>Estimated value</span>
                          <span>${quote.amountOutUsd}</span>
                        </div>
                      )}
                      {quote.timeEstimate && (
                        <div className="flex items-center justify-between text-xs text-[rgb(186,255,188)]/50">
                          <span>Estimated time</span>
                          <span>~{quote.timeEstimate}s</span>
                        </div>
                      )}
                    </div>
                  )}

                  {/* Bridge Button */}
                  <button
                    onClick={handleExecuteBridge}
                    disabled={!canBridge}
                    className={`w-full py-4 rounded-xl font-orbitron font-bold uppercase tracking-wider transition-all ${
                      canBridge
                        ? "bg-[rgb(50,255,52)] text-black hover:bg-[rgb(40,220,42)] shadow-[0_0_20px_rgba(50,255,52,0.4)]"
                        : hasInsufficientBalance
                        ? "bg-red-500/20 text-red-400 cursor-not-allowed border border-red-500/40"
                        : "bg-white/10 text-white/40 cursor-not-allowed"
                    }`}
                  >
                    {!isEVMConnected
                      ? "Connect Wallet"
                      : !isValidDest
                      ? "Enter Starknet Address"
                      : !amount || parseFloat(amount) <= 0
                      ? "Enter Amount"
                      : hasInsufficientBalance
                      ? "Insufficient Balance"
                      : quoteLoading
                      ? "Getting Quote..."
                      : "Bridge to Starknet"}
                  </button>
                </>
              )}
            </>
          )}

          {step === "confirm" && (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 mx-auto border-4 border-[rgb(50,255,52)] border-t-transparent rounded-full animate-spin" />
              <p className="text-white font-orbitron">Confirm in your wallet...</p>
              {isSending && <p className="text-sm text-[rgb(186,255,188)]/70">Waiting for transaction...</p>}
              {isConfirming && <p className="text-sm text-[rgb(186,255,188)]/70">Confirming transaction...</p>}
            </div>
          )}

          {step === "bridging" && (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 mx-auto border-4 border-[rgb(50,255,52)] border-t-transparent rounded-full animate-spin" />
              <p className="text-white font-orbitron">Bridging in progress...</p>
              <p className="text-sm text-[rgb(186,255,188)]/70">
                {bridgeStatus?.status === 'PENDING_DEPOSIT' && 'Waiting for deposit confirmation...'}
                {bridgeStatus?.status === 'KNOWN_DEPOSIT_TX' && 'Deposit detected, processing...'}
                {bridgeStatus?.status === 'PROCESSING' && 'Executing swap...'}
                {bridgeStatus?.status === 'INCOMPLETE_DEPOSIT' && 'Partial deposit received...'}
                {!bridgeStatus?.status && 'Initializing bridge...'}
              </p>
              {txHash && (
                <p className="text-xs text-[rgb(186,255,188)]/50 break-all">
                  TX: {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </p>
              )}
              <p className="text-[10px] text-[rgb(186,255,188)]/40 mt-4">
                This may take 30-60 seconds. You can close this modal and check back later.
              </p>
            </div>
          )}

          {step === "complete" && (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-[rgb(50,255,52)]/20 border-2 border-[rgb(50,255,52)]">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgb(50,255,52)" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
              <p className="text-white font-orbitron text-lg">Bridge Complete!</p>
              <p className="text-sm text-[rgb(186,255,188)]/70">
                Your STRK has been sent to your Starknet wallet.
              </p>
              <button
                onClick={handleClose}
                className="px-6 py-3 rounded-xl bg-[rgb(50,255,52)] text-black font-orbitron font-bold uppercase hover:bg-[rgb(40,220,42)] transition-all"
              >
                Done
              </button>
            </div>
          )}

          {step === "error" && (
            <div className="text-center space-y-4 py-8">
              <div className="w-16 h-16 mx-auto flex items-center justify-center rounded-full bg-red-500/20 border-2 border-red-500">
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="rgb(239,68,68)" strokeWidth="2">
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </div>
              <p className="text-white font-orbitron text-lg">Bridge Failed</p>
              <p className="text-sm text-red-400">{errorMessage}</p>
              <button
                onClick={handleReset}
                className="px-6 py-3 rounded-xl border border-[rgb(50,255,52)] text-[rgb(50,255,52)] font-orbitron font-bold uppercase hover:bg-[rgb(50,255,52)]/10 transition-all"
              >
                Try Again
              </button>
            </div>
          )}
        </div>

        {/* Footer info */}
        {step === "select" && (
          <div className="px-6 pb-4">
            <p className="text-[10px] text-center text-[rgb(186,255,188)]/40">
              Powered by NEAR Intents. Bridge fees apply.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
