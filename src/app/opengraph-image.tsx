import { ImageResponse } from "next/og";

export const alt = "Jay's Links — a daily chain-quiz game";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

/**
 * The share-card image shown when a link to jayslinks.com is pasted into
 * social media, Slack, iMessage, etc. — including via the in-game
 * ShareButton, which links straight back to the site. Reuses the brand
 * palette from globals.css's gradient background; a bold system font
 * stack stands in for the Luckiest Guy display font (ImageResponse can't
 * use next/font's CSS variables — it needs an actual font file supplied
 * via the `fonts` option — so this deliberately keeps it simple rather
 * than fetching one at render time).
 */
export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: 24,
          background:
            "radial-gradient(circle at 15% -10%, rgba(147, 51, 234, 0.55) 0%, transparent 55%), linear-gradient(165deg, #4c1d95 0%, #2e1065 55%, #150733 100%)",
        }}
      >
        <span style={{ fontSize: 160 }}>🔗</span>
        <span
          style={{
            fontSize: 96,
            fontWeight: 800,
            color: "#fde047",
            letterSpacing: -2,
          }}
        >
          JAY&apos;S LINKS
        </span>
        <span style={{ fontSize: 34, color: "#fef9c3" }}>
          Daily chain-quiz — guess the link before it&apos;s revealed
        </span>
      </div>
    ),
    { ...size }
  );
}
