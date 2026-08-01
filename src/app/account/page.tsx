import Link from "next/link";
import { getStats, listPlayHistory } from "@/lib/storage/player-history-queries";
import { createServerAuthClient } from "@/lib/supabase/server-auth";
import { getCurrentPlayerId, getPlayerDisplayName } from "@/lib/supabase/player-auth";
import { PlayerAuthForm } from "@/components/player/PlayerAuthForm";
import { AccountDashboard } from "@/components/player/AccountDashboard";

// Session-dependent — must never be statically cached, same reasoning as
// src/app/page.tsx and src/app/play/page.tsx.
export const dynamic = "force-dynamic";

/** Signed out -> sign-in/sign-up form. Signed in -> stats/history/sign-out dashboard (also owns the one-time local-history merge). */
export default async function AccountPage() {
  const userId = await getCurrentPlayerId();

  if (!userId) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 py-16">
        <PlayerAuthForm />
        <Link href="/" className="font-sans text-yellow-100/80 underline">
          Back home
        </Link>
      </div>
    );
  }

  const supabase = await createServerAuthClient();
  const { data: userResult } = await supabase.auth.getUser();
  const [stats, history, displayName] = await Promise.all([
    getStats(userId),
    listPlayHistory(userId, 100),
    getPlayerDisplayName(userId, userResult.user?.email ?? null),
  ]);

  return (
    <div className="flex flex-1 flex-col items-center px-6 py-12">
      <h1 className="mb-6 font-display text-3xl tracking-wide text-yellow-300">My account</h1>
      <AccountDashboard
        userId={userId}
        displayName={displayName}
        stats={stats}
        history={history}
      />
      <Link href="/" className="mt-6 font-sans text-yellow-100/80 underline">
        Back home
      </Link>
    </div>
  );
}
