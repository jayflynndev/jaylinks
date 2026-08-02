import Link from "next/link";
import { signOut } from "../actions";
import { requireAdmin } from "@/lib/supabase/admin-check";

export const dynamic = "force-dynamic";

const NAV_LINKS = [
  { href: "/admin", label: "Dashboard" },
  { href: "/admin/puzzles", label: "Puzzles" },
  { href: "/admin/puzzles/new", label: "New puzzle" },
  { href: "/admin/puzzles/import", label: "Bulk import" },
  { href: "/admin/review", label: "Review queue" },
];

/**
 * Shared shell for every authenticated /admin page: nav + sign-out. The
 * proxy (src/proxy.ts) already redirects non-admins to /admin/login before
 * they reach here, but requireAdmin() here is deliberate defense-in-depth
 * — Next's own docs warn against relying on Proxy alone for authorization
 * (a matcher change could silently stop covering a route). This layout
 * only wraps routes inside the (protected) group; /admin/login is a
 * sibling outside it, so it never hits this redirect.
 *
 * requireAdmin() checks `is_admin`, not just "is signed in" — this
 * Supabase project is shared with Jay's other site, QuizHub, so any of
 * its users could have a valid session here too.
 */
export default async function ProtectedAdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await requireAdmin();

  return (
    <div className="flex flex-1 flex-col px-4 py-6 sm:px-8">
      <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-6">
          <h1 className="font-display text-2xl tracking-wide text-yellow-300">Jay&apos;s Links Admin</h1>
          <nav className="flex gap-4">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="font-sans text-yellow-100/80 hover:text-yellow-100"
              >
                {link.label}
              </Link>
            ))}
          </nav>
        </div>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-full border-2 border-yellow-300/40 px-4 py-2 font-sans text-sm text-yellow-100/80"
          >
            Sign out
          </button>
        </form>
      </header>
      <main className="flex-1">{children}</main>
    </div>
  );
}
