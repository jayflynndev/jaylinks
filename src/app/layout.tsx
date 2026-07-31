import type { Metadata, Viewport } from "next";
import { Fredoka, Luckiest_Guy } from "next/font/google";
import "./globals.css";

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
  title: "Jay's Links",
  description: "A daily chain-quiz game — guess the link before it's revealed.",
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
      </body>
    </html>
  );
}
