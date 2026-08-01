"use server";

import { redirect } from "next/navigation";
import { createServerAuthClient } from "@/lib/supabase/server-auth";

/** Signs the admin out and redirects to the login screen. */
export async function signOut() {
  const supabase = await createServerAuthClient();
  await supabase.auth.signOut();
  redirect("/admin/login");
}
