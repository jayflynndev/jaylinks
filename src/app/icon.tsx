import { ImageResponse } from "next/og";

export const size = { width: 32, height: 32 };
export const contentType = "image/png";

/** Browser-tab favicon: the brand's deep-purple/gold palette plus the 🔗 emoji already used on the in-game guess button, for visual consistency. */
export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(165deg, #4c1d95 0%, #2e1065 100%)",
          borderRadius: 7,
        }}
      >
        <span style={{ fontSize: 22 }}>🔗</span>
      </div>
    ),
    { ...size }
  );
}
