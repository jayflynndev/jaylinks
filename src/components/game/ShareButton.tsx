"use client";

import { useState } from "react";

interface ShareButtonProps {
  text: string;
}

/**
 * Shares the result via the Web Share API where available (mobile
 * browsers, mainly), falling back to copying the text to the clipboard
 * everywhere else — per the product brief. A cancelled native share sheet
 * is treated as "done, no further action", not a failure to fall back on.
 */
export function ShareButton({ text }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ text });
      } catch {
        // User cancelled the share sheet, or it failed for some other
        // reason — either way there's nothing more useful to do here.
      }
      return;
    }

    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard access denied/unavailable — nothing more we can do.
    }
  }

  return (
    <button
      type="button"
      onClick={handleShare}
      className="rounded-full bg-yellow-300 px-8 py-3 font-display text-lg tracking-wide text-purple-950 transition active:translate-y-0.5"
    >
      {copied ? "Copied!" : "Share result"}
    </button>
  );
}
