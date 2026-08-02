import Link from "next/link";

export const metadata = { title: "Privacy Policy — Jay's Links" };

/**
 * Static content — no player/account state involved, so this is a plain
 * Server Component with no dynamic export needed (contrast with the game
 * pages, which fetch live puzzle/session state on every request).
 */
export default function PrivacyPolicyPage() {
  return (
    <div className="relative flex flex-1 flex-col items-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-2xl">
        <h1 className="mb-1 font-display text-3xl tracking-wide text-yellow-300 sm:text-4xl">
          Privacy Policy
        </h1>
        <p className="mb-8 font-sans text-sm text-yellow-100/60">Last updated: August 2026</p>

        <div className="flex flex-col gap-6 rounded-3xl border-2 border-yellow-300/30 bg-purple-900/40 p-6 font-sans text-yellow-100/90 sm:p-10">
          <p>
            Jay&apos;s Links (&ldquo;we&rdquo;, &ldquo;us&rdquo;, &ldquo;our&rdquo;) is committed to
            protecting your privacy. This policy explains what information we collect, how we use
            it, and the choices available to you when you play.
          </p>

          <Section title="Who we are">
            <p>
              Jay&apos;s Links is a daily chain-quiz game at jayslinks.com. It shares its account
              system with QuizHub — signing in with the same email and password works on both
              sites.
            </p>
            <p>
              Questions about this policy:{" "}
              <a className="underline" href="mailto:virtualpubquiz@yahoo.com">
                virtualpubquiz@yahoo.com
              </a>
            </p>
          </Section>

          <Section title="Playing without an account">
            <p>
              You can play Jay&apos;s Links without signing in — this is the default, and most
              players will never need to create one. In this mode, your results, streak, and
              stats are stored only in your own browser (via local storage), on your own device.
              We never receive or see this information. It stays there until you clear your
              browser data or uninstall the app, if you&apos;ve installed it to your home screen.
            </p>
          </Section>

          <Section title="If you choose to sign in">
            <p>
              Signing in is entirely optional, and only worthwhile if you want your progress to
              follow you across devices. If you do, we collect:
            </p>
            <ul className="list-disc pl-5">
              <li>
                Your email address and a securely hashed password, via Supabase (our
                authentication provider — the same account works on QuizHub)
              </li>
              <li>Your chosen username, if you&apos;ve set one on QuizHub</li>
              <li>
                Your play history: which daily puzzles you&apos;ve played, the date, your score,
                whether you guessed correctly, and how many clues had revealed — so your streak
                and stats can follow you across devices
              </li>
            </ul>
            <p>
              You can permanently delete your saved Jay&apos;s Links play history at any time from
              the Account page (&ldquo;Clear my saved history&rdquo;). Because your login is
              shared with QuizHub, deleting your account entirely — not just your Jay&apos;s Links
              history — needs to be requested directly; see &ldquo;Your rights&rdquo; below.
            </p>
          </Section>

          <Section title="Automatically collected information">
            <p>
              Like most websites, our hosting provider (Vercel) automatically logs basic
              technical information — such as IP address, browser type, and general usage
              patterns — for security and reliability.
            </p>
          </Section>

          <Section title="How we use information">
            <ul className="list-disc pl-5">
              <li>To run the daily puzzle, check your guesses, and show your results</li>
              <li>To save and display your streak and history if you&apos;re signed in</li>
              <li>To keep the site secure and prevent abuse</li>
              <li>To respond if you contact us</li>
            </ul>
            <p>We do not sell your personal information to third parties.</p>
          </Section>

          <Section title="Cookies and local storage">
            <p>Right now, Jay&apos;s Links uses:</p>
            <ul className="list-disc pl-5">
              <li>
                A session cookie, set only if you sign in, to keep you logged in — strictly
                necessary, so no cookie banner is needed for this alone
              </li>
              <li>Local storage, to save your progress if you&apos;re playing without an account</li>
            </ul>
            <p>
              We don&apos;t currently use analytics or advertising cookies.{" "}
              <strong className="text-yellow-200">If advertising is introduced in future</strong>{" "}
              — for example through a service like Google AdSense — that will likely involve
              additional cookies and third-party data processing. This policy, and the site
              itself, will be updated before that happens, including a cookie consent option
              where required.
            </p>
          </Section>

          <Section title="Third parties involved in running Jay's Links">
            <ul className="list-disc pl-5">
              <li>
                <strong className="text-yellow-200">Supabase</strong> — authentication and
                database hosting (shared with QuizHub)
              </li>
              <li>
                <strong className="text-yellow-200">Vercel</strong> — website hosting
              </li>
            </ul>
            <p>Each operates under its own privacy policy.</p>
          </Section>

          <Section title="Data retention">
            <p>
              Anonymous play data lives only in your browser until you clear it. Signed-in play
              history is kept until you clear it yourself or request account deletion.
            </p>
          </Section>

          <Section title="Your rights">
            <p>
              Depending on where you live, you may have rights to access, correct, or delete your
              personal information, and to object to or restrict certain processing. For your
              Jay&apos;s Links play history, use &ldquo;Clear my saved history&rdquo; on the
              Account page, or contact us. Because your login is shared with QuizHub, a request to
              delete your account entirely is handled the same way as a QuizHub account deletion
              request — contact us and we&apos;ll take care of it.
            </p>
          </Section>

          <Section title="Children's privacy">
            <p>
              Jay&apos;s Links isn&apos;t specifically directed at children under 13. If you
              believe a child has provided us with personal information without appropriate
              consent, please contact us and we&apos;ll investigate.
            </p>
          </Section>

          <Section title="Changes to this policy">
            <p>
              We may update this policy from time to time — the &ldquo;Last updated&rdquo; date
              above will reflect the most recent change.
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
