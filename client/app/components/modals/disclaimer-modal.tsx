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
              This auction platform is currently in a <strong className="text-[rgb(50,255,52)]">beta phase</strong>. 
              We&apos;re actively developing and improving the platform to provide the best auction experience.
            </p>
            
            <p className="text-base leading-relaxed">
              Please be aware that:
            </p>

            <ul className="list-disc list-inside space-y-2 ml-4 text-base leading-relaxed">
              <li>The platform and smart contracts are still being tested and may have occasional issues</li>
              <li>There is a risk of loss of funds due to technical issues, bugs, or vulnerabilities in the smart contracts or other issues</li>
              <li>We recommend using caution and only participating with funds you&apos;re comfortable with</li>
            </ul>

            <p className="text-base leading-relaxed pt-2">
              By using this platform, you acknowledge that you understand it&apos;s in a testing phase. 
              We appreciate your participation as we continue to build and refine the platform.
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

