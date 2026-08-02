import { ImageResponse } from "next/og";
import { brandIconElement } from "@/lib/brand-icon";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Browser-tab favicon — see src/lib/brand-icon.tsx for the shared design used across every generated icon size. */
export default function Icon() {
  return new ImageResponse(brandIconElement(size.width), { ...size });
}
