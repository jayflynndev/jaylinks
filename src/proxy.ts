import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/types";

/**
 * Runs before every matched request (see config.matcher below): refreshes
 * the Supabase auth session, writing any refreshed tokens back as cookies.
 * This is the standard Supabase + Next.js SSR pattern — see
 * https://supabase.com/docs/guides/auth/server-side/nextjs — and matters
 * for player routes too, not just /admin: a plain Server Component's
 * Supabase client can refresh an expired access token in-memory for that
 * one request (see server-auth.ts's doc comment), but can't persist the
 * *new* refresh token back to the browser's cookie — and Supabase rotates
 * refresh tokens on every use by default, so without proxy doing that
 * persisting, a signed-in player's session would eventually go stale and
 * silently sign them out. Covering `/` and `/play` here is a correctness
 * requirement, not just latency polish.
 *
 * On top of the refresh, `/admin/*` paths additionally redirect to
 * /admin/login unless the signed-in user is an admin — this Supabase
 * project is shared with Jay's other site, QuizHub, so "signed in" alone
 * doesn't mean "admin," it could be any QuizHub user. Admin status is
 * checked against the existing `profiles` table's `is_admin` column (see
 * src/lib/supabase/admin-check.ts, whose logic is deliberately duplicated
 * here rather than imported — Next's own docs recommend Proxy files not
 * depend on shared app modules). Player routes (`/`, `/play`, `/account`)
 * only ever get the refresh, never a redirect — signing in stays fully
 * optional there.
 *
 * Named `proxy` (not `middleware`) per Next.js 16's renamed convention —
 * see AGENTS.md.
 */
export async function proxy(request: NextRequest) {
  let response = NextResponse.next({ request });

  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !anonKey) {
    // Supabase isn't configured yet (e.g. local dev before .env.local is
    // filled in). Let the request through rather than hard-locking every
    // page — pages themselves still fail informatively when they try to
    // use a Supabase client.
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

  const pathname = request.nextUrl.pathname;
  if (!pathname.startsWith("/admin")) {
    // Player routes: session refresh only, no redirect — see the doc
    // comment above. Sign-in stays optional here.
    return response;
  }

  const isLoginPage = pathname === "/admin/login";

  if (isLoginPage) {
    return response;
  }

  if (!user) {
    return NextResponse.redirect(new URL("/admin/login", request.url));
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return response;
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
  matcher: ["/", "/play", "/account/:path*", "/admin/:path*"],
};
