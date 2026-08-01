import "server-only";
import { createServerAuthClient } from "./server-auth";
import { createServiceRoleClient } from "./server";

/**
 * The signed-in player's user id, or null — sign-in is fully optional for
 * player-facing routes (unlike admin), so unlike requireAdmin() this never
 * redirects. Used to resolve which PlayerStore backend a page's game loop
 * should use (see src/lib/storage/player-store.ts) and to drive the
 * sign-in/account entry points on the home and results screens.
 */
export async function getCurrentPlayerId(): Promise<string | null> {
  try {
    const supabase = await createServerAuthClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    return user?.id ?? null;
  } catch {
    // Supabase not configured yet (e.g. local dev before .env.local is
    // filled in), or a transient error — treat as signed out rather than
    // crashing the page; anonymous play still works either way.
    return null;
  }
}

/**
 * A friendly display name for the account page — QuizHub's `profiles.username`
 * if the player has set one, falling back to their email. Queried via the
 * service-role client (bypasses RLS) so this doesn't depend on QuizHub's own
 * RLS policies for `profiles`, same reasoning as admin-check.ts.
 */
export async function getPlayerDisplayName(userId: string, fallbackEmail: string | null): Promise<string | null> {
  const supabase = createServiceRoleClient();
  const { data } = await supabase.from("profiles").select("username").eq("id", userId).maybeSingle();
  return data?.username || fallbackEmail;
}
