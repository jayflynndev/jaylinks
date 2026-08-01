import "server-only";
import { createServerAuthClient } from "./server-auth";

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
