"use client";

import { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";

export interface DropdownOption {
  value: string;
  label: string;
  logo?: string;
  balance?: string | null; // Optional balance to display
}

interface CustomDropdownProps {
  options: DropdownOption[];
  value: string;
  onChange: (value: string) => void;
  className?: string;
  variant?: "default" | "green" | "bar" | "compact";
  placeholder?: string;
  id?: string;
}

export default function CustomDropdown({
  options,
  value,
  onChange,
  className = "",
  variant = "default",
  placeholder,
  id,
}: CustomDropdownProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const [position, setPosition] = useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);
  const [mounted, setMounted] = useState(false);

  const selectedOption = options.find((opt) => opt.value === value);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    const updatePosition = () => {
      if (buttonRef.current) {
        const rect = buttonRef.current.getBoundingClientRect();
        setPosition({
          top: rect.bottom + 4,
          left: rect.left,
          width: rect.width,
        });
      }
    };

    // Calculate position immediately
    updatePosition();

    // Update on scroll and resize
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      // Use a small delay to avoid immediate closing
      setTimeout(() => {
        document.addEventListener("mousedown", handleClickOutside);
      }, 0);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
    };
  }, [isOpen]);

  const baseButtonClasses =
    variant === "green"
      ? "rounded-xl border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/5 px-4 py-2.5 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 cursor-pointer"
      : variant === "bar"
        ? "inline-flex items-center justify-center rounded-full border border-[rgb(50,255,52)]/40 bg-[rgb(50,255,52)]/10 px-4 py-1.5 text-xs font-orbitron uppercase tracking-[0.14em] text-[rgb(50,255,52)] transition hover:bg-[rgb(50,255,52)]/20 cursor-pointer min-w-0 w-auto"
        : variant === "compact"
          ? "rounded-lg border border-white/12 bg-black/60 px-2.5 py-1.5 text-[11px] font-orbitron uppercase tracking-wider text-white outline-none transition focus:border-[rgb(50,255,52)] cursor-pointer"
          : "rounded-xl border border-white/12 bg-black/60 px-4 py-2.5 text-sm font-orbitron uppercase tracking-widest text-white outline-none transition focus:border-[rgb(50,255,52)] focus:ring-2 focus:ring-[rgb(50,255,52)]/35 cursor-pointer";

  const baseOptionClasses =
    variant === "green"
      ? "px-4 py-3 text-sm font-orbitron uppercase tracking-widest text-white hover:bg-[rgb(50,255,52)]/20 transition cursor-pointer"
      : variant === "compact"
        ? "px-2.5 py-2 text-[11px] font-orbitron uppercase tracking-wider text-white hover:bg-[rgb(50,255,52)]/20 transition cursor-pointer"
        : "px-4 py-3 text-sm font-orbitron uppercase tracking-widest text-white hover:bg-[rgb(50,255,52)]/20 transition cursor-pointer";

  const dropdownMenu = isOpen && mounted && position && (
    <div
      ref={dropdownRef}
      className={`fixed z-[99999] rounded-xl border border-[rgb(50,255,52)]/40 shadow-2xl overflow-hidden backdrop-blur-md min-w-[240px] ${
        variant === "green" ? "bg-[rgb(50,255,52)]/10" : "bg-black/95"
      }`}
      style={{
        top: `${position.top}px`,
        left: `${position.left}px`,
        width: `${Math.max(position.width, 240)}px`,
      }}
      role="listbox"
    >
      <div className="max-h-60 overflow-auto [&::-webkit-scrollbar]:w-2 [&::-webkit-scrollbar-thumb]:bg-[rgb(50,255,52)]/30 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-track]:bg-transparent">
        {options.map((option) => {
          const isSelected = option.value === value;
          return (
            <button
              key={option.value}
              type="button"
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className={`w-full text-left ${baseOptionClasses} ${
                isSelected ? "bg-[rgb(50,255,52)]/30 text-[rgb(50,255,52)]" : ""
              }`}
              role="option"
              aria-selected={isSelected}
            >
              <div className="flex items-center justify-between w-full gap-2">
                <div className="flex items-center gap-2 flex-1">
                  {option.logo && (
                    <img
                      src={option.logo}
                      alt={`${option.label} logo`}
                      className="w-4 h-4 mr-2 rounded-full flex-shrink-0"
                    />
                  )}
                  <span className="truncate font-medium">{option.label}</span>
                </div>
                {option.balance !== undefined && (
                  <span className="text-xs font-orbitron text-[rgb(186,255,188)]/70 ml-auto flex-shrink-0 tabular-nums">
                    {option.balance}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  return (
    <div className={`relative ${variant === "bar" ? "inline-block" : ""} ${className}`}>
      <button
        ref={buttonRef}
        id={id}
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${variant === "bar" ? "w-auto" : "w-full"} flex items-center justify-between ${baseButtonClasses} ${isOpen ? "border-[rgb(50,255,52)] ring-2 ring-[rgb(50,255,52)]/35" : ""}`}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <div className="flex items-center gap-2">
          {selectedOption?.logo && (
            <img
              src={selectedOption.logo}
              alt={`${selectedOption.label} logo`}
              className="w-4 h-4 rounded-full flex-shrink-0"
            />
          )}
          <span className="truncate flex-1">
            {selectedOption ? selectedOption.label : placeholder || "Select..."}
          </span>
        </div>
        <svg
          className={`ml-2 h-4 w-4 transition-transform ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {mounted &&
        typeof document !== "undefined" &&
        dropdownMenu &&
        createPortal(dropdownMenu, document.body)}
    </div>
  );
}
