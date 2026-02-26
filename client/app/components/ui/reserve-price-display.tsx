"use client";

import { getReservePriceParts } from "../../lib/utils";

type ReservePriceDisplayProps = {
  value: number | string | null | undefined;
  symbol: string | undefined;
  className?: string;
  /** Class for the token name (smaller than amount). */
  symbolClassName?: string;
};

/**
 * Renders reserve price as symbol + amount (e.g. $ 5.00, STRK 5.00).
 * Auction prices are in USD; symbol is shown first, then amount.
 */
export default function ReservePriceDisplay({
  value,
  symbol,
  className = "",
  symbolClassName = "text-[0.9em] opacity-90",
}: ReservePriceDisplayProps) {
  const { symbol: s, amount } = getReservePriceParts(value, symbol);
  if (amount === "—") return <span className={className}>—</span>;
  return (
    <span className={className}>
      <span className={symbolClassName}>{s}</span>
      {" "}
      <span>{amount}</span>
    </span>
  );
}
