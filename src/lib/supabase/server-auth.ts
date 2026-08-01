import "server-only";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Server-side Supabase client that's aware of the admin's auth session
 * (via cookies), using the anon key — distinct from server.ts's service
 * role client, which bypasses auth/RLS entirely for game data access.
 *
 * This client answers exactly one question for admin code: "is there a
 * logged-in user, and who are they?" (via `.auth.getUser()`). It is not
 * used to read/write puzzle data — once a request is authenticated, admin
 * Server Actions/route handlers switch to the service-role client for
 * that, same as the rest of the app.
 *
 * `setAll` is wrapped in a try/catch because Next.js only allows setting
 * cookies from a Server Action or Route Handler, not a plain Server
 * Component — when called from a Server Component this is a no-op, and
 * that's fine: src/proxy.ts refreshes the session cookie on every request
 * to /admin/*, so a Server Component reading a soon-to-expire token will
 * see it refreshed on the next navigation regardless.
 */
export async function createServerAuthClient() {
  const cookieStore = await cookies();

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.local.example to .env.local and fill in your Supabase project keys (see docs/SUPABASE_SETUP.md)."
    );
  }

  return createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          for (const { name, value, options } of cookiesToSet) {
            cookieStore.set(name, value, options);
          }
        } catch {
          // Called from a Server Component — see the doc comment above.
        }
      },
    },
  });
}
