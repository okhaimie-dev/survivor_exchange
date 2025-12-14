"use client";

import { useState, useEffect } from "react";

const DISCLAIMER_DISMISSED_KEY = "disclaimer_dismissed";

export default function DisclaimerModal() {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Check if disclaimer has been dismissed
    const dismissed = localStorage.getItem(DISCLAIMER_DISMISSED_KEY);
    if (!dismissed) {
      setIsOpen(true);
    }
  }, []);

  const handleDismiss = () => {
    localStorage.setItem(DISCLAIMER_DISMISSED_KEY, "true");
    setIsOpen(false);
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm"
      onClick={handleDismiss}
    >
      <div 
        className="bg-black border-2 border-[rgb(50,255,52)] rounded-lg p-8 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-orbitron uppercase tracking-wide text-[rgb(50,255,52)]">
            ⚠️ Important Disclaimer
          </h2>
          <button
            onClick={handleDismiss}
            className="text-white hover:text-[rgb(50,255,52)] text-3xl leading-none hover:cursor-pointer transition-colors"
            aria-label="Close disclaimer"
          >
            ×
          </button>
        </div>

        <div className="space-y-4 text-white">
          <div className="space-y-3">
            <p className="text-base leading-relaxed">
              This auction platform is currently in an <strong className="text-[rgb(50,255,52)]">experimental and testing phase</strong>. 
              By participating in auctions, placing bids, or listing items for sale, you acknowledge that this platform is still under development.
            </p>
            
            <p className="text-base leading-relaxed">
              <strong className="text-[rgb(50,255,52)]">Participate at your own risk.</strong> You understand and accept the following risks when using this auction platform:
            </p>

            <ul className="list-disc list-inside space-y-2 ml-4 text-base leading-relaxed">
              <li>You may lose funds or assets due to smart contract bugs, vulnerabilities, or technical failures</li>
              <li>Bids may not be processed correctly, or you may be unable to withdraw funds or assets</li>
              <li>Auction transactions may fail, be delayed, or execute unexpectedly</li>
              <li>Listed items may not sell as expected, or auction mechanics may behave incorrectly</li>
              <li>The platform may experience downtime, preventing you from bidding, listing, or managing auctions</li>
              <li>Smart contracts are experimental and may contain undiscovered vulnerabilities that could result in loss of funds or assets</li>
            </ul>

            <p className="text-base leading-relaxed pt-2">
              <strong className="text-[rgb(50,255,52)]">Only participate with funds and assets you can afford to lose.</strong> The developers 
              and operators of this auction platform are not responsible for any losses incurred from bidding, listing, or participating in auctions on this platform.
            </p>
          </div>

          <div className="pt-4 border-t border-[rgb(50,255,52)]/30">
            <button
              onClick={handleDismiss}
              className="w-full py-3 px-6 bg-[rgb(50,255,52)]/10 border-2 border-[rgb(50,255,52)] rounded-lg text-[rgb(50,255,52)] font-orbitron uppercase tracking-wide hover:bg-[rgb(50,255,52)]/20 transition-colors cursor-pointer"
            >
              I Understand and Accept the Risks
            </button>
            <p className="text-xs text-gray-400 text-center mt-3">
              This disclaimer will not appear again after you dismiss it
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

