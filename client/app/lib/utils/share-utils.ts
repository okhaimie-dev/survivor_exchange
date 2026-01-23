/**
 * Beast Lore - Share Utilities
 * T021-T029: Functions for generating and sharing beast card images
 */

import { toBlob } from "html-to-image";
import type { ShareResult, ShareCardConfig } from "../types/beast-profile";

/**
 * Twitter card dimensions (1200x675 for 1.91:1 ratio)
 */
export const SHARE_CARD_DIMENSIONS = {
  width: 1200,
  height: 675,
} as const;

/**
 * T029: Build Twitter Intent URL with pre-populated text and hashtags
 */
export function buildTwitterIntentUrl(
  text: string,
  hashtags: string[] = ["LootSurvivor", "Starknet", "NFT"]
): string {
  const params = new URLSearchParams({
    text: text,
    hashtags: hashtags.join(","),
  });
  return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * T32: Generate share text with Survivor Exchange attribution
 */
export function generateShareText(config: ShareCardConfig): string {
  return `${config.fullName}\n\n"${config.tagline}"\n\nvia @SurvivorExchange`;
}

/**
 * T022: Copy image blob to clipboard
 */
export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  // Check for Clipboard API support
  if (!navigator.clipboard?.write) {
    return false;
  }

  try {
    await navigator.clipboard.write([
      new ClipboardItem({
        [blob.type]: blob,
      }),
    ]);
    return true;
  } catch (error) {
    console.error("Clipboard write failed:", error);
    return false;
  }
}

/**
 * T023: Download blob as file (final fallback)
 */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * T025: Generate share image from a DOM element using html-to-image
 */
export async function generateShareImage(
  element: HTMLElement,
  options?: {
    pixelRatio?: number;
    backgroundColor?: string;
  }
): Promise<Blob | null> {
  try {
    const blob = await toBlob(element, {
      pixelRatio: options?.pixelRatio ?? 2,
      backgroundColor: options?.backgroundColor ?? "#0a0a0a",
      cacheBust: true,
      // Ensure we get proper dimensions
      width: element.offsetWidth,
      height: element.offsetHeight,
    });

    return blob;
  } catch (error) {
    console.error("Image generation failed:", error);
    return null;
  }
}

/**
 * T021: Main share function with Web Share API and fallback chain
 * Attempts: Web Share API → Clipboard → Download
 */
export async function shareBeastCard(
  cardElement: HTMLElement,
  config: ShareCardConfig
): Promise<ShareResult> {
  const shareText = generateShareText(config);
  const hashtags = ["LootSurvivor", "Starknet", "NFT"];
  const filename = `${config.beastName.replace(/\s+/g, "-")}-beast-card.png`;

  try {
    // Generate the image blob
    const blob = await generateShareImage(cardElement);

    if (!blob) {
      return {
        status: "error",
        error: new Error("Failed to generate image"),
      };
    }

    // Create File object for Web Share API
    const file = new File([blob], filename, {
      type: "image/png",
      lastModified: Date.now(),
    });

    const shareData = {
      files: [file],
      text: shareText,
      title: `${config.fullName} - Beast Profile`,
    };

    // T021: Try Web Share API first (best for mobile)
    if (navigator.share && navigator.canShare?.(shareData)) {
      try {
        await navigator.share(shareData);
        return { status: "shared" };
      } catch (err) {
        // User cancelled or share failed
        if ((err as Error).name === "AbortError") {
          return { status: "cancelled" };
        }
        // Fall through to clipboard fallback
        console.warn("Web Share failed, trying clipboard:", err);
      }
    }

    // T022: Try Clipboard API (desktop fallback)
    const clipboardSuccess = await copyImageToClipboard(blob);
    if (clipboardSuccess) {
      const twitterUrl = buildTwitterIntentUrl(shareText, hashtags);
      return { status: "copied", twitterUrl };
    }

    // T023: Final fallback - download the image
    downloadBlob(blob, filename);
    return { status: "downloaded" };
  } catch (error) {
    console.error("Share failed:", error);
    return {
      status: "error",
      error: error instanceof Error ? error : new Error("Share failed"),
    };
  }
}

/**
 * Share directly to Twitter: copy image to clipboard and open Twitter intent
 * This skips the native share dialog and goes straight to Twitter
 */
export async function shareToTwitter(
  cardElement: HTMLElement,
  config: ShareCardConfig
): Promise<ShareResult> {
  const shareText = generateShareText(config);
  const hashtags = ["LootSurvivor", "Starknet", "NFT"];
  const filename = `${config.beastName.replace(/\s+/g, "-")}-beast-card.png`;

  try {
    // Generate the image blob
    const blob = await generateShareImage(cardElement);

    if (!blob) {
      return {
        status: "error",
        error: new Error("Failed to generate image"),
      };
    }

    // Try to copy image to clipboard
    const clipboardSuccess = await copyImageToClipboard(blob);

    // Build Twitter URL
    const twitterUrl = buildTwitterIntentUrl(shareText, hashtags);

    if (clipboardSuccess) {
      // Open Twitter in new tab
      window.open(twitterUrl, "_blank", "noopener,noreferrer");
      return { status: "copied", twitterUrl };
    }

    // Fallback: download image and still open Twitter
    downloadBlob(blob, filename);
    window.open(twitterUrl, "_blank", "noopener,noreferrer");
    return { status: "downloaded" };
  } catch (error) {
    console.error("Share to Twitter failed:", error);
    return {
      status: "error",
      error: error instanceof Error ? error : new Error("Share failed"),
    };
  }
}

/**
 * Check if Web Share API with files is available
 */
export function canShareFiles(): boolean {
  if (!navigator.share || !navigator.canShare) {
    return false;
  }

  try {
    // Create a test file to check if file sharing is supported
    const testFile = new File(["test"], "test.png", { type: "image/png" });
    return navigator.canShare({ files: [testFile] });
  } catch {
    return false;
  }
}

/**
 * Check if Clipboard API with images is available
 */
export function canCopyImages(): boolean {
  return typeof navigator.clipboard?.write === "function";
}

/**
 * Generate a shareable URL for a beast by token ID.
 * The URL format is: https://survivorexchange.com/?beast=tokenId
 */
export function generateBeastUrl(tokenId: string): string {
  // Normalize tokenId to decimal format for cleaner URLs
  let normalizedTokenId = tokenId;
  if (tokenId.startsWith("0x") || tokenId.startsWith("0X")) {
    normalizedTokenId = BigInt(tokenId).toString();
  }

  // Get the base URL (works for both localhost and production)
  const baseUrl = typeof window !== "undefined"
    ? `${window.location.protocol}//${window.location.host}`
    : "https://survivorexchange.com";

  return `${baseUrl}/?beast=${normalizedTokenId}`;
}

/**
 * Copy beast link to clipboard.
 * Returns true if successful, false otherwise.
 */
export async function copyBeastLink(tokenId: string): Promise<boolean> {
  const url = generateBeastUrl(tokenId);

  try {
    await navigator.clipboard.writeText(url);
    return true;
  } catch (error) {
    console.error("Failed to copy link:", error);
    return false;
  }
}
