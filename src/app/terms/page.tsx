import Link from "next/link";

export const metadata = { title: "Terms of Service — Jay's Links" };

export default function TermsOfServicePage() {
  return (
    <div className="relative flex flex-1 flex-col items-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-2xl">
        <h1 className="mb-1 font-display text-3xl tracking-wide text-yellow-300 sm:text-4xl">
          Terms of Service
        </h1>
        <p className="mb-8 font-sans text-sm text-yellow-100/60">
          By using Jay&apos;s Links, you agree to the following.
        </p>

        <div className="flex flex-col gap-6 rounded-3xl border-2 border-yellow-300/30 bg-purple-900/40 p-6 font-sans text-yellow-100/90 sm:p-10">
          <Section title="The game">
            <p>
              Jay&apos;s Links is a free daily chain-quiz game: five clues reveal over time, and
              you guess the hidden link connecting them. A new puzzle is published each day.
            </p>
          </Section>

          <Section title="Accounts">
            <p>
              Signing in is optional. If you do, your account is shared with QuizHub — the same
              login works on both sites. You&apos;re responsible for keeping your password secure
              and not sharing your account.
            </p>
          </Section>

          <Section title="Fair use">
            <p>
              Please play fairly. Don&apos;t try to interfere with the site, other players, or the
              scoring and answer-checking systems — for example, automating guesses or attempting
              to extract puzzle answers before they&apos;ve been revealed.
            </p>
          </Section>

          <Section title="Content">
            <p>
              The puzzles, branding, and design of Jay&apos;s Links belong to us. You&apos;re
              welcome to share your results — that&apos;s what the built-in share feature is for
              — but please don&apos;t reuse or redistribute puzzle content itself without
              permission.
            </p>
          </Section>

          <Section title="No guarantees">
            <p>
              Jay&apos;s Links is provided &ldquo;as is.&rdquo; We don&apos;t guarantee the site
              will always be available, that scores or streaks will never be lost, or that
              answer checking will always be perfectly accurate. If you think a guess was
              wrongly marked, contact us.
            </p>
          </Section>

          <Section title="Changes">
            <p>
              We may update these terms from time to time. Continuing to use Jay&apos;s Links
              after a change means you accept the update.
            </p>
          </Section>

          <Section title="Contact">
            <p>
              <a className="underline" href="mailto:virtualpubquiz@yahoo.com">
                virtualpubquiz@yahoo.com
              </a>
            </p>
          </Section>
        </div>

        <Link href="/" className="mt-6 block text-center font-sans text-yellow-100/80 underline">
          Back home
        </Link>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <h2 className="font-display text-lg tracking-wide text-yellow-300">{title}</h2>
      {children}
    </div>
  );
}
