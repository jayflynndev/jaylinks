import { ImageResponse } from "next/og";
import { brandIconElement } from "@/lib/brand-icon";

const SIZE = 512;

export const dynamic = "force-static";

/** 512x512 PWA manifest icon — see src/app/manifest.ts and icon-192/route.tsx's doc comment. */
export async function GET() {
  return new ImageResponse(brandIconElement(SIZE), { width: SIZE, height: SIZE });
}
