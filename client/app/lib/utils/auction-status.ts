/**
 * Utility functions for auction status display
 */

export type AuctionStatusNumber = 0 | 1 | 2 | 3 | 4 | 5;

export const AuctionStatus = {
  NONE: 0,
  DRAFT: 1,
  ACTIVE: 2,
  ENDED: 3,
  SETTLED: 4,
  CANCELED: 5,
} as const;

/**
 * Returns a human-readable label for an auction status
 */
export function getStatusLabel(status: string | number): string {
  const statusNum = typeof status === 'number' ? status : parseInt(status);

  switch (statusNum) {
    case AuctionStatus.NONE:
      return "None";
    case AuctionStatus.DRAFT:
      return "Draft";
    case AuctionStatus.ACTIVE:
      return "Active";
    case AuctionStatus.ENDED:
      return "Ended";
    case AuctionStatus.SETTLED:
      return "Settled";
    case AuctionStatus.CANCELED:
      return "Canceled";
    default:
      return String(status);
  }
}

/**
 * Returns Tailwind CSS classes for styling an auction status badge
 */
export function getStatusStyle(status: string | number): string {
  const statusNum = typeof status === 'number' ? status : parseInt(status);

  switch (statusNum) {
    case AuctionStatus.NONE:
      return "bg-white/10 text-white/50 border border-white/20";
    case AuctionStatus.DRAFT:
      return "bg-yellow-400/10 text-yellow-300 border border-yellow-300/30";
    case AuctionStatus.ACTIVE:
      return "bg-[rgb(50,255,52)]/10 text-[rgb(50,255,52)] border border-[rgb(50,255,52)]/40";
    case AuctionStatus.ENDED:
      return "bg-white/10 text-white border border-white/20";
    case AuctionStatus.SETTLED:
      return "bg-blue-400/10 text-blue-300 border border-blue-300/30";
    case AuctionStatus.CANCELED:
      return "bg-red-400/10 text-red-300 border border-red-300/30";
    default:
      // Handle string statuses like "pending" or "queued"
      if (status === "pending" || status === "queued") {
        return "bg-yellow-400/10 text-yellow-300 border border-yellow-300/30";
      }
      return "bg-white/10 text-white border border-white/20";
  }
}

/**
 * Check if an auction has expired based on end time and status
 */
export function isAuctionExpired(endTime: string, status: string): boolean {
  if (!endTime || endTime === "0") return false;

  try {
    let endTimeNum: number;
    if (endTime.startsWith("0x") || endTime.startsWith("0X")) {
      endTimeNum = parseInt(endTime, 16);
    } else {
      endTimeNum = parseInt(endTime, 10);
    }

    if (isNaN(endTimeNum) || endTimeNum === 0) return false;

    const now = Math.floor(Date.now() / 1000);
    const statusNum = parseInt(status);

    // Expired if end time passed or status is Ended (3)
    return endTimeNum <= now || statusNum === AuctionStatus.ENDED;
  } catch {
    return false;
  }
}

/**
 * Parse an end time string (hex or decimal) to a Unix timestamp
 */
export function parseEndTime(endTime: string): number {
  if (!endTime || endTime === "0") return 0;

  try {
    if (endTime.startsWith("0x") || endTime.startsWith("0X")) {
      return parseInt(endTime, 16);
    }
    return parseInt(endTime, 10);
  } catch {
    return 0;
  }
}
