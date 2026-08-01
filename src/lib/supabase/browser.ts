"use client";
import { createBrowserClient as createSupabaseBrowserClient } from "@supabase/ssr";
import type { Database } from "./types";

/**
 * Browser-side Supabase client using the public anon key. Used only for
 * the /admin sign-in flow (Supabase Auth) — never for reading/writing
 * puzzle data, which always goes through server-side code backed by the
 * service role client in ./server.ts.
 *
 * Uses @supabase/ssr's createBrowserClient (not plain @supabase/supabase-js
 * createClient) specifically because it syncs the auth session into
 * cookies rather than just localStorage — the server-side auth client
 * (./server-auth.ts) and the session-refreshing proxy (src/proxy.ts) can
 * only see a session that arrived this way.
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.local.example to .env.local and fill in your Supabase project keys (see docs/SUPABASE_SETUP.md)."
    );
  }

  return createSupabaseBrowserClient<Database>(url, anonKey);
}
