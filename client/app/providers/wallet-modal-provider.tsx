"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { WalletConnectModal } from "../components/modals";

interface WalletModalContextType {
  openWalletModal: () => void;
  closeWalletModal: () => void;
  isWalletModalOpen: boolean;
}

const WalletModalContext = createContext<WalletModalContextType | undefined>(undefined);

export function WalletModalProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);

  const openWalletModal = useCallback(() => {
    setIsOpen(true);
  }, []);

  const closeWalletModal = useCallback(() => {
    setIsOpen(false);
  }, []);

  return (
    <WalletModalContext.Provider
      value={{
        openWalletModal,
        closeWalletModal,
        isWalletModalOpen: isOpen,
      }}
    >
      {children}
      <WalletConnectModal isOpen={isOpen} onClose={closeWalletModal} />
    </WalletModalContext.Provider>
  );
}

export function useWalletModal() {
  const context = useContext(WalletModalContext);
  if (context === undefined) {
    throw new Error("useWalletModal must be used within a WalletModalProvider");
  }
  return context;
}
