"use client";

/**
 * AddressDisplay Component
 * Displays a Starknet address, resolving to Cartridge username if available
 */

import { useAddressName } from "../hooks/use-address-name";

interface AddressDisplayProps {
  address: string | undefined | null;
  /** Optional class name for styling */
  className?: string;
  /** If true, shows full address on hover as title */
  showFullOnHover?: boolean;
}

export default function AddressDisplay({
  address,
  className = "",
  showFullOnHover = true,
}: AddressDisplayProps) {
  const { name, isLoading } = useAddressName(address);

  if (!address) {
    return <span className={className}>-</span>;
  }

  return (
    <span
      className={`${className} ${isLoading ? "animate-pulse" : ""}`}
      title={showFullOnHover ? address : undefined}
    >
      {name}
    </span>
  );
}
