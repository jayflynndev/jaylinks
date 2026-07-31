"use client";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "./types";

/**
 * Browser-side Supabase client using the public anon key. Used only for
 * the /admin sign-in flow (Supabase Auth) — never for reading/writing
 * puzzle data, which always goes through server-side API routes backed by
 * the service role client in ./server.ts.
 */
export function createBrowserClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY. Copy .env.local.example to .env.local and fill in your Supabase project keys (see docs/SUPABASE_SETUP.md)."
    );
  }

  return createClient<Database>(url, anonKey);
}
