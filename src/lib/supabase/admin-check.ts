import "server-only";
import { redirect } from "next/navigation";
import { createServiceRoleClient } from "./server";
import { createServerAuthClient } from "./server-auth";

/**
 * Checks Jay's existing `profiles` table (from the shared Supabase
 * project — see docs/SUPABASE_SETUP.md) for admin status. This project's
 * Supabase project is shared with Jay's other site, QuizHub, so
 * "authenticated" alone doesn't mean "admin" — it could be any QuizHub
 * user. Queried via the service-role client (bypassing RLS) so this
 * doesn't depend on whatever RLS policies QuizHub has configured on
 * `profiles`.
 *
 * Used by the (protected) admin layout and every admin Server Action's
 * own auth re-check. src/proxy.ts inlines the same logic separately
 * rather than importing this — Next's own docs recommend Proxy files not
 * depend on shared app modules.
 */
export async function isAdmin(userId: string): Promise<boolean> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("profiles").select("is_admin").eq("id", userId).maybeSingle();
  return data?.is_admin === true;
}

/**
 * Re-verifies the admin session inside a Server Action itself, rather
 * than relying solely on the /admin proxy or layout — Server Actions are
 * their own POST endpoint and Next's docs explicitly warn against trusting
 * Proxy alone for authorization (a matcher change could silently stop
 * covering a route). Redirects to /admin/login if not an admin; otherwise
 * resolves with nothing.
 */
export async function requireAdmin(): Promise<void> {
  const supabase = await createServerAuthClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user || !(await isAdmin(user.id))) {
    redirect("/admin/login");
  }
}
