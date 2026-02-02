import { useConnect } from "@starknet-react/core";
import { ControllerConnector } from "@cartridge/connector";
import { useMemo } from "react";
import Image from "next/image";
import { useToast } from "../../providers/toast-provider";

interface WalletConnectModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function WalletConnectModal({ isOpen, onClose }: WalletConnectModalProps) {
  const { connect, connectors } = useConnect();
  const toast = useToast();

  const controller = useMemo(() => {
    try {
      return ControllerConnector.fromConnectors(connectors);
    } catch {
      return undefined;
    }
  }, [connectors]);

  // Find the connectors - Argent has been renamed to "ready"
  const readyConnector = connectors.find(c => c.id === 'argent' || c.id === 'ready' || c.name?.toLowerCase().includes('argent') || c.name?.toLowerCase().includes('ready'));
  const braavosConnector = connectors.find(c => c.id === 'braavos' || c.name?.toLowerCase().includes('braavos'));
  const cartridgeConnector = controller;

  if (!isOpen) return null;

  const handleWalletConnect = async (connector: typeof readyConnector | typeof braavosConnector | typeof cartridgeConnector) => {
    if (!connector) return;

    try {
      await connect({ connector });
      onClose();
    } catch (error) {
      console.error("Failed to connect wallet:", error);
      const msg = connector === cartridgeConnector
        ? "Open the Cartridge extension and unlock your keychain, then try again."
        : "Please try again or use another wallet.";
      toast.error("Connection failed", msg);
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div 
        className="bg-black border border-[rgb(50,255,52)] rounded-lg p-6 max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-orbitron uppercase tracking-wide text-[rgb(50,255,52)]">
            Connect Wallet
          </h2>
          <button
            onClick={onClose}
            className="text-white hover:text-[rgb(50,255,52)] text-2xl leading-none hover:cursor-pointer"
            aria-label="Close modal"
          >
            ×
          </button>
        </div>

        <div className="space-y-3">
          {cartridgeConnector && (
            <button
              onClick={() => handleWalletConnect(cartridgeConnector)}
              className="w-full flex items-center justify-between p-4 border rounded border-[rgb(50,255,52)] cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Image
                  src="/catridge.png"
                  alt="Cartridge"
                  width={32}
                  height={32}
                  className="rounded"
                  draggable={false}
                />
                <span className="text-white font-orbitron uppercase tracking-wide group-hover:text-[rgb(50,255,52)]">Cartridge</span>
              </div>
              <span className="group-hover:text-[rgb(50,255,52)] text-white">→</span>
            </button>
          )}

          {readyConnector && (
            <button
              onClick={() => handleWalletConnect(readyConnector)}
              className="w-full flex items-center justify-between p-4 border rounded border-[rgb(50,255,52)] cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Image
                  src="/ready.png"
                  alt="Ready (Argent)"
                  width={32}
                  height={32}
                  className="rounded"
                  draggable={false}
                />
                <span className="text-white font-orbitron uppercase tracking-wide group-hover:text-[rgb(50,255,52)]">Ready</span>
              </div>
              <span className="group-hover:text-[rgb(50,255,52)] text-white">→</span>
            </button>
          )}

          {braavosConnector && (
            <button
              onClick={() => handleWalletConnect(braavosConnector)}
              className="w-full flex items-center justify-between p-4 border rounded border-[rgb(50,255,52)] cursor-pointer transition-colors group"
            >
              <div className="flex items-center gap-3">
                <Image
                  src="/braavos.png"
                  alt="Braavos"
                  width={32}
                  height={32}
                  className="rounded"
                  draggable={false}
                />
                <span className="text-white font-orbitron uppercase tracking-wide group-hover:text-[rgb(50,255,52)]">Braavos</span>
              </div>
              <span className="group-hover:text-[rgb(50,255,52)] text-white">→</span>
            </button>
          )}

          {!cartridgeConnector && !readyConnector && !braavosConnector && (
            <div className="text-white text-center py-4">
              No wallets available. Please install a Starknet wallet extension.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

