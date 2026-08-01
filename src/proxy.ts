import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Runs before every /admin/* request: refreshes the Supabase auth session
 * (writing any refreshed tokens back as cookies) and redirects to
 * /admin/login unless the signed-in user is an admin. This is the
 * standard Supabase + Next.js SSR pattern — see
 * https://supabase.com/docs/guides/auth/server-side/nextjs — with one
 * addition: this Supabase project is shared with Jay's other site,
 * QuizHub, so "signed in" alone doesn't mean "admin" — it could be any
 * QuizHub user. Admin status is checked against the existing `profiles`
 * table's `is_admin` column (see src/lib/supabase/admin-check.ts, whose
 * logic is deliberately duplicated here rather than imported — Next's own
 * docs recommend Proxy files not depend on shared app modules).
 *
 * Named `proxy` (not `middleware`) per Next.js 16's renamed convention —
 * see AGENTS.md.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!url || !anonKey || !serviceRoleKey) {
    // Supabase isn't configured yet (e.g. local dev before .env.local is
    // filled in). Let the request through rather than hard-locking every
    // /admin page — the pages themselves still fail informatively when
    // they try to use a Supabase client.
    return response;
  }

  const supabase = createServerClient<Database>(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        for (const { name, value } of cookiesToSet) {
          request.cookies.set(name, value);
        }
        response = NextResponse.next({ request });
        for (const { name, value, options } of cookiesToSet) {
          response.cookies.set(name, value, options);
        }
      },
    },
  });

  // Must call getUser() (not just getSession()) here — this is what
  // actually triggers the token refresh that setAll above writes back.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const isLoginPage = request.nextUrl.pathname === "/admin/login";

  if (isLoginPage) {
    return response;
  }

  if (!user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  // Service-role client (bypasses RLS) so this doesn't depend on
  // QuizHub's own RLS policies for `profiles`.
  const serviceRoleClient = createClient<Database>(url, serviceRoleKey);
  const { data: profile } = await serviceRoleClient
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .maybeSingle();

  if (profile?.is_admin !== true) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  return response;
}

export const config = {
  matcher: ["/admin/:path*"],
};
