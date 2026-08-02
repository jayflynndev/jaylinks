import { ImageResponse } from "next/og";
import { brandIconElement } from "@/lib/brand-icon";

// 180x180 is Apple's recommended apple-touch-icon size. iOS Safari's "Add
// to Home Screen" prefers this over the web manifest's icons, so it's
// worth generating separately rather than relying on manifest.ts alone.
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(brandIconElement(size.width), { ...size });
}
