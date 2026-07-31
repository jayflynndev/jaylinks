import "server-only";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Server-only Supabase client using the service role key, which bypasses
 * Row Level Security. This is what every route handler and server
 * component uses to read/write puzzles, questions, and judged answers.
 *
 * Importing "server-only" makes the build fail loudly if this module is
 * ever pulled into a client component/bundle — the service role key must
 * never reach the browser (see docs/SUPABASE_SETUP.md, section 3).
 *
 * Callers are responsible for stripping answer fields before sending
 * puzzle data on to the player-facing client; this client itself applies
 * no such filtering.
 */
export function createServiceRoleClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !serviceRoleKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY. Copy .env.local.example to .env.local and fill in your Supabase project keys (see docs/SUPABASE_SETUP.md)."
    );
  }

  return createClient<Database>(url, serviceRoleKey, {
    auth: {
      // Service role usage is per-request server-side code, not a signed-in
      // user session — no need to persist or auto-refresh a session.
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}
