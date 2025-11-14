import { ControllerConnector } from "@cartridge/connector";
import { useAccount, useConnect, useDisconnect } from "@starknet-react/core";
import Image from "next/image";
import { useEffect, useMemo, useState } from "react";

    export default function Header() {
        const { connectors } = useConnect();
        const { disconnect } = useDisconnect();
        const { address } = useAccount();
        const controller = useMemo(() => {
            try {
                return ControllerConnector.fromConnectors(connectors);
            } catch {
                return undefined;
            }
        }, [connectors]);
        const [username, setUsername] = useState<string | undefined>(undefined);
        
        useEffect(() => {
            if (!address || !controller) {
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
        }, [address, controller])

        useEffect(() => {
            if (address) {
                return;
            }

            const frame = window.requestAnimationFrame(() => setUsername(undefined));
            return () => window.cancelAnimationFrame(frame);
        }, [address]);

        const handleConnect = async () => {
            if (!controller) return;

            await controller.connect();
            try {
                const name = await controller.username();
                if (name) {
                    setUsername(name);
                }
            } catch (error) {
                console.error("Failed to resolve username after connecting", error);
            }
        }

        const handleDisconnect = async () => {
            await controller?.disconnect();
            disconnect();
            setUsername(undefined);
        }

        return (
            <div className="w-full h-14 bg-black flex flex-row items-center justify-center">
                <div className="w-full flex flex-row items-center justify-between p-3.5">
                    <div>
                        <Image src="/logo.png" alt="logo" width={50} height={50} draggable={false} />
                    </div>
                    <div>
                        {
                            username ? (
                                <div className="flex items-center gap-3">
                                    <p className="font-orbitron uppercase tracking-wide text-[rgb(50,255,52)]">{username}</p>
                                    <button
                                        className="text-white text-sm font-orbitron tracking-wide uppercase hover:cursor-pointer border border-white px-3 py-1 rounded hover:bg-transparent hover:text-[rgb(50,255,52)] hover:border-[rgb(50,255,52)]"
                                        onClick={handleDisconnect}
                                    >
                                        Disconnect
                                    </button>
                                </div>
                            ) : (
                                <button className="text-[rgb(50,255,52)] text-base font-medium font-orbitron tracking-wide uppercase hover:cursor-pointer hover:bg-transparent hover:text-[rgb(50,255,52)] hover:border-[rgb(50,255,52)]" onClick={handleConnect}>CONNECT WALLET</button>
                            )
                        }
                    </div>
                </div>
            </div>
        )
    }