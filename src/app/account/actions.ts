"use server";

import { redirect } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

/** Signs the player out and redirects home. */
export async function signOutAction() {
  const supabase = await createServerAuthClient();
  await supabase.auth.signOut();
  redirect("/");
}
