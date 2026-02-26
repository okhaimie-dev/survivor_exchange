/**
 * Branded types for better type safety across the codebase.
 * These types help prevent mixing incompatible values at compile time.
 */

/**
 * Brand symbol for nominal typing
 */
declare const __brand: unique symbol;
type Brand<B> = { [__brand]: B };

/**
 * A hexadecimal string prefixed with "0x"
 * Example: "0x123abc"
 */
export type HexString = string & Brand<"HexString">;

/**
 * A Starknet contract address (64 hex characters, padded with leading zeros)
 * Example: "0x0000...1234"
 */
export type ContractAddress = string & Brand<"ContractAddress">;

/**
 * A token amount as a bigint (raw, with all decimals)
 * Example: 1000000n for 1 USDC (6 decimals)
 */
export type TokenAmount = bigint & Brand<"TokenAmount">;

/**
 * A Unix timestamp in seconds
 */
export type Timestamp = number & Brand<"Timestamp">;

/**
 * A token ID (can be decimal or hex string representation)
 */
export type TokenId = string & Brand<"TokenId">;

// Type guards

/**
 * Checks if a string is a valid hex string (starts with 0x)
 */
export function isHexString(value: unknown): value is HexString {
  return typeof value === "string" && /^0x[0-9a-fA-F]+$/i.test(value);
}

/**
 * Checks if a string looks like a contract address (0x + up to 64 hex chars)
 */
export function isContractAddress(value: unknown): value is ContractAddress {
  return typeof value === "string" && /^0x[0-9a-fA-F]{1,64}$/i.test(value);
}

/**
 * Checks if a value is a valid timestamp (positive number)
 */
export function isTimestamp(value: unknown): value is Timestamp {
  return typeof value === "number" && value > 0 && Number.isInteger(value);
}

// Constructors / Converters

/**
 * Creates a HexString from a regular string (validates format)
 * @throws Error if the string is not a valid hex string
 */
export function toHexString(value: string): HexString {
  if (!isHexString(value)) {
    throw new Error(`Invalid hex string: ${value}`);
  }
  return value as HexString;
}

/**
 * Creates a HexString from a number
 */
export function numberToHexString(value: number | bigint): HexString {
  return `0x${value.toString(16)}` as HexString;
}

/**
 * Creates a ContractAddress from a string (normalizes to 64 chars with leading zeros)
 */
export function toContractAddress(value: string): ContractAddress {
  if (!value) {
    throw new Error("Contract address cannot be empty");
  }

  let hexPart: string;
  if (value.startsWith("0x") || value.startsWith("0X")) {
    hexPart = value.slice(2);
  } else {
    hexPart = value;
  }

  // Validate hex characters
  if (!/^[0-9a-fA-F]+$/.test(hexPart)) {
    throw new Error(`Invalid contract address: ${value}`);
  }

  // Normalize: remove leading zeros, then pad to 64 chars
  hexPart = hexPart.toLowerCase().replace(/^0+/, "") || "0";
  const padded = hexPart.padStart(64, "0");

  return `0x${padded}` as ContractAddress;
}

/**
 * Creates a TokenAmount from a number and decimal places
 * @param amount - The human-readable amount (e.g., 1.5 for 1.5 USDC)
 * @param decimals - The token's decimal places (e.g., 6 for USDC, 18 for ETH)
 */
export function toTokenAmount(amount: number, decimals: number): TokenAmount {
  const multiplier = BigInt(10 ** decimals);
  const rawAmount = BigInt(Math.floor(amount * Number(multiplier)));
  return rawAmount as TokenAmount;
}

/**
 * Converts a TokenAmount to a human-readable number
 * @param amount - The raw token amount
 * @param decimals - The token's decimal places
 */
export function fromTokenAmount(amount: TokenAmount | bigint, decimals: number): number {
  const divisor = BigInt(10 ** decimals);
  const wholePart = amount / divisor;
  const fractionPart = amount % divisor;
  const fraction = Number(fractionPart) / Number(divisor);
  return Number(wholePart) + fraction;
}

/**
 * Creates a Timestamp from a Date object
 */
export function toTimestamp(date: Date): Timestamp {
  return Math.floor(date.getTime() / 1000) as Timestamp;
}

/**
 * Creates a Timestamp from the current time
 */
export function nowTimestamp(): Timestamp {
  return Math.floor(Date.now() / 1000) as Timestamp;
}

/**
 * Converts a Timestamp to a Date object
 */
export function fromTimestamp(timestamp: Timestamp | number): Date {
  return new Date(timestamp * 1000);
}

/**
 * Safely parses a hex or decimal string to a TokenAmount
 */
export function parseTokenAmount(value: string | number | null | undefined): TokenAmount | null {
  if (value === null || value === undefined) {
    return null;
  }

  try {
    if (typeof value === "number") {
      return BigInt(Math.floor(value)) as TokenAmount;
    }

    const trimmed = value.trim();
    if (!trimmed) {
      return null;
    }

    if (trimmed.startsWith("0x") || trimmed.startsWith("0X")) {
      return BigInt(trimmed) as TokenAmount;
    }

    // Handle decimal strings
    if (trimmed.includes(".")) {
      return BigInt(Math.floor(parseFloat(trimmed))) as TokenAmount;
    }

    return BigInt(trimmed) as TokenAmount;
  } catch {
    return null;
  }
}

/**
 * Common token decimal configurations
 */
export const TOKEN_DECIMALS = {
  USDC: 6,
  ETH: 18,
  STRK: 18,
  LORDS: 18,
  WBTC: 8,
  SURVIVOR: 18,
} as const;
