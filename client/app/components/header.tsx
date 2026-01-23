import { ControllerConnector } from "@cartridge/connector";
import { useAccount, useDisconnect, useConnect } from "@starknet-react/core";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";
import { useWalletModal } from "../providers/wallet-modal-provider";
import { truncateAddress } from "../lib/utils/formatters";

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

                if (!controller.isReady()) {
                    if (attemptsRemaining > 0) {
                        retryHandle = setTimeout(() => fetchUsername(attemptsRemaining - 1), 500);
                    }
                    return;
                }

                try {
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
            <div className="w-full min-h-14 bg-black flex flex-row items-center justify-center px-3 md:px-3.5 py-3">
                <div className="w-full flex flex-row items-center justify-between gap-2">
                    <div className="flex-shrink-0">
                        <Image src="/logo.png" alt="logo" width={50} height={50} draggable={false} className="w-10 h-10 md:w-12 md:h-12" />
                    </div>
                    <div className="flex-shrink min-w-0">
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
                                    className="flex items-center gap-2 px-4 py-2 rounded-lg border-2 border-[rgb(50,255,52)] bg-[rgb(50,255,52)]/10 hover:bg-[rgb(50,255,52)]/20 transition-all cursor-pointer"
                                >
                                    <span className="font-orbitron uppercase tracking-wide text-[rgb(50,255,52)] text-xs md:text-sm">
                                        Connect
                                    </span>
                                </button>
                            )
                        }
                    </div>
                </div>
            </div>
        )
    }