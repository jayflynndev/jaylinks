import type { Metadata, Viewport } from "next";
import { Fredoka, Luckiest_Guy } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { RegisterServiceWorker } from "@/components/RegisterServiceWorker";
import { Footer } from "@/components/brand/Footer";
import "./globals.css";

const SITE_URL = "https://jayslinks.com";
const SITE_DESCRIPTION = "A daily chain-quiz game — guess the link before it's revealed.";

// Fredoka: rounded, friendly sans used for all body/UI text.
const fredoka = Fredoka({
  variable: "--font-fredoka",
  subsets: ["latin"],
});

// Luckiest Guy: chunky marquee/poster-style display font, used sparingly
// (the "JAY'S LINKS" wordmark, big score numbers) — matches the gameshow
// look of Jay's existing Shorts/Reels thumbnails.
const luckiestGuy = Luckiest_Guy({
  variable: "--font-luckiest-guy",
  weight: "400",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  // Lets Next resolve the absolute URLs it needs for Open Graph/Twitter
  // tags (og:url, and the auto-injected og:image from opengraph-image.tsx)
  // without hard-coding the domain into every page.
  metadataBase: new URL(SITE_URL),
  title: "Jay's Links",
  description: SITE_DESCRIPTION,
  // iOS Safari's "Add to Home Screen" prefers these over the web manifest
  // (see manifest.ts) — statusBarStyle "black-translucent" lets the
  // brand's purple gradient show through the status bar in standalone mode.
  appleWebApp: {
    title: "Jay's Links",
    statusBarStyle: "black-translucent",
  },
  // No puzzle-specific content ever appears here to rank for — the link
  // answer is deliberately never in the page source (see docs/ANSWER_ENGINE.md's
  // security note) — this is about the product being discoverable, not
  // individual puzzles showing up in search results.
  openGraph: {
    title: "Jay's Links",
    description: SITE_DESCRIPTION,
    url: SITE_URL,
    siteName: "Jay's Links",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Jay's Links",
    description: SITE_DESCRIPTION,
  },
};

export const viewport: Viewport = {
  themeColor: "#2e1065",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fredoka.variable} ${luckiestGuy.variable} h-full antialiased`}
    >
      <body className="brand-gradient-bg min-h-full flex flex-col font-sans text-foreground">
        {children}
        <Footer />
        <RegisterServiceWorker />
        <Analytics />
      </body>
    </html>
  );
}
