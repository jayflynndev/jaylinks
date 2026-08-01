import { redirect } from "next/navigation";
import { LoginForm } from "@/components/admin/LoginForm";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { isAdmin } from "@/lib/supabase/admin-check";
import { signOut } from "../actions";

export const dynamic = "force-dynamic";

type AuthState = "signed-out" | "signed-in-non-admin" | "signed-in-admin";

/**
 * Distinguishes three states, not just "signed in or not" — this
 * Supabase project is shared with Jay's other site, QuizHub, so a
 * signed-in user here might not be an admin at all. Treating "signed in"
 * as "redirect to /admin" without checking is_admin would infinite-loop a
 * signed-in-but-non-admin visitor: /admin redirects them right back to
 * /admin/login via the (protected) layout's own requireAdmin() check.
 */
async function getAuthState(): Promise<{ state: AuthState; email: string | null }> {
  try {
    const supabase = await createServerAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) return { state: "signed-out", email: null };
    if (await isAdmin(user.id)) return { state: "signed-in-admin", email: user.email ?? null };
    return { state: "signed-in-non-admin", email: user.email ?? null };
  } catch {
    // Supabase not configured yet — treat as signed out rather than
    // crashing this page; submitting the form will fail with a clear
    // error instead.
    return { state: "signed-out", email: null };
  }
}

/** /admin/login — redirects to /admin if already an admin, otherwise shows the sign-in form (or a "not an admin" notice). */
export default async function AdminLoginPage() {
  // redirect() throws internally, so it must never be called inside a
  // try/catch that could swallow it — getAuthState() contains the
  // fallible Supabase calls, and this stays outside that boundary.
  const { state, email } = await getAuthState();
  if (state === "signed-in-admin") {
    redirect("/admin");
  }

  if (state === "signed-in-non-admin") {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 py-16 text-center">
        <h1 className="font-display text-2xl tracking-wide text-yellow-300">Not an admin account</h1>
        <p className="max-w-sm font-sans text-yellow-100/80">
          You&apos;re signed in{email ? ` as ${email}` : ""}, but this account doesn&apos;t have admin
          access to Jay&apos;s Links.
        </p>
        <form action={signOut}>
          <button
            type="submit"
            className="rounded-full border-2 border-yellow-300/40 px-6 py-3 font-sans text-yellow-100"
          >
            Sign out
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 py-16">
      <h1 className="mb-8 font-display text-3xl tracking-wide text-yellow-300">Admin sign in</h1>
      <LoginForm />
    </div>
  );
}
