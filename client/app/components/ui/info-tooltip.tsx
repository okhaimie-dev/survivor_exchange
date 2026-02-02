"use client";

import { useState } from "react";

interface InfoTooltipProps {
  content: string;
  className?: string;
}

export default function InfoTooltip({ content, className = "" }: InfoTooltipProps) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className={`relative inline-flex items-center ${className}`}>
      <span
        className="inline-flex items-center justify-center w-3.5 h-3.5 md:w-4 md:h-4 opacity-70 hover:opacity-100 transition-opacity cursor-help"
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        onClick={(e) => e.stopPropagation()}
        role="button"
        tabIndex={0}
        aria-label="More information"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="w-full h-full"
        >
          <circle cx="12" cy="12" r="10" />
          <path d="M12 16v-4" />
          <path d="M12 8h.01" />
        </svg>
      </span>

      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-3 w-72 md:w-80 px-4 py-3 text-[11px] md:text-xs text-[rgb(186,255,188)] bg-[rgb(0,20,0)] backdrop-blur-sm border border-[rgb(186,255,188)]/30 rounded-md shadow-xl z-50 pointer-events-none">
          <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-[1px]">
            <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-[rgb(186,255,188)]/30" />
            <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-full w-0 h-0 border-l-[3px] border-r-[3px] border-t-[3px] border-transparent border-t-[rgb(0,20,0)]" />
          </div>
          <p className="text-center leading-relaxed font-sans break-words whitespace-normal normal-case">{content}</p>
        </div>
      )}
    </div>
  );
}
