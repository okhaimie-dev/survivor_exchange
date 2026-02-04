import { ControllerConnector } from "@cartridge/connector";
import { useAccount, useDisconnect, useConnect } from "@starknet-react/core";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useWalletModal } from "../../providers/wallet-modal-provider";
import { truncateAddress } from "../../lib/utils/formatters";
import BridgeModal from "../bridge/bridge-modal";

    export default function Header() {
        const { disconnect } = useDisconnect();
        const { address, connector } = useAccount();
        const { connectors } = useConnect();
        const controller = useMemo(() => {
            try {
                return ControllerConnector.fromConnectors(connectors);
            } catch {
                return undefined;
            }
        }, [connectors]);
        
        // Check if connected wallet is Cartridge (not Ready or Braavos)
        const isCartridge = useMemo(() => {
            if (!connector) return false;
            // Ready and Braavos have specific IDs/names
            const connectorId = connector.id?.toLowerCase() || '';
            const connectorName = connector.name?.toLowerCase() || '';
            const isReadyOrBraavos = 
                connectorId === 'argent' || 
                connectorId === 'ready' || 
                connectorId === 'braavos' ||
                connectorName.includes('argent') ||
                connectorName.includes('ready') ||
                connectorName.includes('braavos');
            // If it's Ready or Braavos, it's not Cartridge
            return !isReadyOrBraavos && controller !== undefined;
        }, [connector, controller]);
        
        const [username, setUsername] = useState<string | undefined>(undefined);
        const [isBridgeModalOpen, setIsBridgeModalOpen] = useState(false);
        const { openWalletModal } = useWalletModal();
        
        // Only fetch username for Cartridge wallet
        useEffect(() => {
            if (!address || !controller || !isCartridge) {
                setUsername(undefined);
                return;
            }

            let isCancelled = false;
            let retryHandle: ReturnType<typeof setTimeout> | undefined;

            const fetchUsername = async (attemptsRemaining: number) => {
                if (isCancelled) return;

                try {
                    if (!controller.isReady()) {
                        if (attemptsRemaining > 0) {
                            retryHandle = setTimeout(() => fetchUsername(attemptsRemaining - 1), 500);
                        }
                        return;
                    }

                    const name = await controller.username();
                    if (isCancelled) return;

                    if (name) {
                        setUsername(name);
                    } else if (attemptsRemaining > 0) {
                        retryHandle = setTimeout(() => fetchUsername(attemptsRemaining - 1), 500);
                    }
                } catch (error) {
                    console.error("Failed to load username from controller", error);
                    if (attemptsRemaining > 0) {
                        retryHandle = setTimeout(() => fetchUsername(attemptsRemaining - 1), 500);
                    }
                }
            };

            fetchUsername(8);

            return () => {
                isCancelled = true;
                if (retryHandle) {
                    clearTimeout(retryHandle);
                }
            };
        }, [address, controller, isCartridge])

        useEffect(() => {
            if (!address) {
                setUsername(undefined);
            }
        }, [address]);

        const handleConnect = () => {
            openWalletModal();
        };

        const handleDisconnect = async () => {
            disconnect();
            setUsername(undefined);
        };

        const handleOpenProfile = () => {
            // Open Cartridge inventory modal
            if (isCartridge && connector) {
                try {
                    (connector as any)?.controller?.openProfile("inventory");
                } catch (error) {
                    console.error("Failed to open profile:", error);
                }
            }
        };

        return (
            <>
            <BridgeModal isOpen={isBridgeModalOpen} onClose={() => setIsBridgeModalOpen(false)} />
            <div className="w-full min-h-14 bg-black flex flex-row items-center justify-center px-3 md:px-3.5 py-3">
                <div className="w-full flex flex-row items-center justify-between gap-2">
                    <div className="flex flex-row items-center gap-2 md:gap-3 flex-shrink-0 min-w-0">
                        <Image src="/logo.png" alt="logo" width={50} height={50} draggable={false} className="w-10 h-10 md:w-12 md:h-12" />
                        <div className="flex flex-col items-start gap-0.5 min-w-0">
                            <h1 className="text-sm sm:text-base font-bold font-orbitron text-white truncate">Survivor Exchange</h1>
                            <p className="text-[10px] sm:text-xs text-left text-[rgb(186,255,188)]/80 truncate max-w-[180px] sm:max-w-none">
                                Buy, sell, and auction{" "}
                                <Link href="https://lootsurvivor.io/" target="_blank" className="font-medium text-[rgb(50,255,52)] hover:underline">Loot Survivor</Link>
                                {" "}assets.
                            </p>
                        </div>
                    </div>
                    <div className="flex-shrink min-w-0 flex items-center gap-3">
                        {/* Bridge Button - Desktop */}
                        <button
                            onClick={() => setIsBridgeModalOpen(true)}
                            className="hidden md:flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500/60 bg-blue-500/10 hover:bg-blue-500/20 transition-all cursor-pointer"
                            title="Bridge funds from other chains to Starknet"
                        >
                            {/* Bridge icon - arrows between chains */}
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="rgb(59, 130, 246)"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M7 16V4M7 4L3 8M7 4L11 8" />
                                <path d="M17 8V20M17 20L21 16M17 20L13 16" />
                            </svg>
                            <span className="font-orbitron uppercase tracking-wide text-blue-400 text-xs md:text-sm">
                                Bridge
                            </span>
                        </button>
                        {/* Bridge Button - Mobile (icon only) */}
                        <button
                            onClick={() => setIsBridgeModalOpen(true)}
                            className="flex md:hidden items-center justify-center w-10 h-10 rounded-lg border border-blue-500/60 bg-blue-500/10 hover:bg-blue-500/20 transition-all cursor-pointer"
                            title="Bridge funds from other chains to Starknet"
                        >
                            <svg
                                width="18"
                                height="18"
                                viewBox="0 0 24 24"
                                fill="none"
                                stroke="rgb(59, 130, 246)"
                                strokeWidth="2"
                                strokeLinecap="round"
                                strokeLinejoin="round"
                            >
                                <path d="M7 16V4M7 4L3 8M7 4L11 8" />
                                <path d="M17 8V20M17 20L21 16M17 20L13 16" />
                            </svg>
                        </button>
                        {
                                address ? (
                                <div className="flex items-center rounded-lg border-2 border-[rgb(50,255,52)] overflow-hidden">
                                    <button
                                        onClick={handleOpenProfile}
                                        className="flex items-center gap-2 px-4 py-2 bg-[rgb(50,255,52)]/10 hover:bg-[rgb(50,255,52)]/20 transition-all cursor-pointer"
                                    >
                                        {/* Controller/Wallet Icon */}
                                        <svg
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="rgb(50,255,52)"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                        >
                                            <rect x="2" y="6" width="20" height="12" rx="2" />
                                            <circle cx="8" cy="12" r="2" />
                                            <path d="M16 10v4" />
                                            <path d="M14 12h4" />
                                        </svg>
                                        <span className="font-orbitron uppercase tracking-wide text-[rgb(50,255,52)] text-xs md:text-sm">
                                            {username || truncateAddress(address)}
                                        </span>
                                    </button>
                                    <div className="w-px h-6 bg-[rgb(50,255,52)]/40" />
                                    <button
                                        onClick={handleDisconnect}
                                        title="Disconnect"
                                        className="flex items-center justify-center px-3 py-2 bg-[rgb(50,255,52)]/10 hover:bg-red-500/20 transition-all cursor-pointer group"
                                    >
                                        {/* Exit/Logout Icon */}
                                        <svg
                                            width="18"
                                            height="18"
                                            viewBox="0 0 24 24"
                                            fill="none"
                                            stroke="rgb(50,255,52)"
                                            strokeWidth="2"
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            className="group-hover:stroke-red-500 transition-colors"
                                        >
                                            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
                                            <polyline points="16 17 21 12 16 7" />
                                            <line x1="21" y1="12" x2="9" y2="12" />
                                        </svg>
                                    </button>
                                </div>
                            ) : (
                                <button
                                    onClick={handleConnect}
                                    className="group relative flex items-center gap-2.5 px-5 py-2.5 rounded-lg border-2 border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/10 hover:bg-[rgb(50,255,52)]/30 hover:scale-105 transition-all cursor-pointer animate-subtle-pulse"
                                >
                                    {/* Glow effect - pointer-events-none ensures clicks pass through */}
                                    <div className="absolute inset-0 rounded-lg bg-[rgb(50,255,52)]/20 blur-md opacity-50 group-hover:opacity-80 transition-opacity pointer-events-none" />
                                    {/* Wallet icon */}
                                    <svg
                                        className="relative w-4 h-4 md:w-5 md:h-5 text-[rgb(50,255,52)]"
                                        fill="none"
                                        stroke="currentColor"
                                        strokeWidth="2"
                                        viewBox="0 0 24 24"
                                    >
                                        <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a2.25 2.25 0 00-2.25-2.25H15a3 3 0 11-6 0H5.25A2.25 2.25 0 003 12m18 0v6a2.25 2.25 0 01-2.25 2.25H5.25A2.25 2.25 0 013 18v-6m18 0V9M3 12V9m18 0a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 9m18 0V6a2.25 2.25 0 00-2.25-2.25H5.25A2.25 2.25 0 003 6v3" />
                                    </svg>
                                    <span className="relative font-orbitron uppercase tracking-wide text-[rgb(50,255,52)] text-sm md:text-base font-semibold">
                                        Connect Wallet
                                    </span>
                                </button>
                            )
                        }
                    </div>
                </div>
            </div>
            </>
        )
    }