import { ImageResponse } from "next/og";
import { brandIconElement } from "@/lib/brand-icon";

const SIZE = 192;

// Plain Route Handlers aren't statically optimized by default the way
// Next's special icon.tsx convention is — force it, since this never
// depends on the request.
export const dynamic = "force-static";

/** 192x192 PWA manifest icon — see src/app/manifest.ts. Not one of Next's special icon/apple-icon files (those are for the browser tab), just a plain image Route Handler at a predictable URL the manifest can reference. */
export async function GET() {
  return new ImageResponse(brandIconElement(SIZE), { width: SIZE, height: SIZE });
}
