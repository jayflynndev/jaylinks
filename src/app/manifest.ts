import type { MetadataRoute } from "next";

/**
 * Makes the site installable ("Add to Home Screen") — the main point of a
 * PWA for a daily-habit game like this one: a home-screen icon is a real
 * nudge to come back and play. Icons are generated at src/app/icon-192/
 * and icon-512/ (plain image Route Handlers, not Next's special icon.tsx
 * convention — see those files' doc comments); colors match the existing
 * brand background (globals.css's --background) and viewport theme color
 * (layout.tsx).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jay's Links",
    short_name: "Jay's Links",
    description: "A daily chain-quiz game — guess the link before it's revealed.",
    start_url: "/",
    display: "standalone",
    background_color: "#1e0a4a",
    theme_color: "#2e1065",
    icons: [
      { src: "/icon-192", sizes: "192x192", type: "image/png" },
      { src: "/icon-512", sizes: "512x512", type: "image/png" },
    ],
  };
}
