interface TitlePanelProps {
  /** Optional line shown under the wordmark, e.g. "Link #281". */
  subtitle?: string;
}

/**
 * The gameshow-style rounded title panel reading "JAY'S LINKS" — bold
 * yellow display type on a purple panel, framed by the marquee-light
 * "bulb ring" border (see .bulb-ring in globals.css). Matches the brand
 * look of Jay's existing Shorts/Reels thumbnails.
 */
export function TitlePanel({ subtitle }: TitlePanelProps) {
  return (
    <div className="bulb-ring rounded-[2.5rem] border-4 border-yellow-300 bg-gradient-to-b from-purple-700 to-purple-950 px-8 py-6 shadow-[0_0_45px_rgba(250,204,21,0.2)] sm:px-12 sm:py-8">
      <h1 className="text-center font-display text-4xl leading-none tracking-wide text-yellow-300 [text-shadow:0_3px_0_rgba(46,16,101,1)] sm:text-6xl">
        JAY&apos;S LINKS
      </h1>
      {subtitle ? (
        <p className="mt-2 text-center font-display text-lg tracking-wide text-yellow-100 sm:mt-3 sm:text-2xl">
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}
