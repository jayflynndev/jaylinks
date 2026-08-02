/**
 * The brand icon element (deep-purple gradient + the 🔗 emoji also used on
 * the in-game guess button) shared by every generated icon size — the
 * browser-tab favicon (src/app/icon.tsx), the PWA manifest icons
 * (src/app/icon-192/route.tsx, icon-512/route.tsx), and the iOS home-
 * screen icon (src/app/apple-icon.tsx). Proportions are scaled off the
 * original 32px favicon (emoji ~69% of the box, corner radius ~22%) so
 * every size reads as the same mark, just bigger.
 */
export function brandIconElement(size: number) {
  return (
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(165deg, #4c1d95 0%, #2e1065 100%)",
        borderRadius: Math.round(size * 0.22),
      }}
    >
      <span style={{ fontSize: Math.round(size * 0.69) }}>🔗</span>
    </div>
  );
}
