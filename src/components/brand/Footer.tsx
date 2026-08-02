import Link from "next/link";

/** Site-wide footer — the site had no legal-page entry points anywhere before this, despite collecting an email/password for optional sign-in. */
export function Footer() {
  return (
    <footer className="relative flex flex-wrap items-center justify-center gap-x-6 gap-y-2 px-6 py-6 font-sans text-sm text-yellow-100/50">
      <Link href="/privacy" className="underline hover:text-yellow-100/80">
        Privacy Policy
      </Link>
      <Link href="/terms" className="underline hover:text-yellow-100/80">
        Terms of Service
      </Link>
      <a href="mailto:virtualpubquiz@yahoo.com" className="underline hover:text-yellow-100/80">
        Contact
      </a>
    </footer>
  );
}
