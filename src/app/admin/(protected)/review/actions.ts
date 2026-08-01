"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/supabase/admin-check";
import { approveReviewItem, dismissReviewItem, rejectReviewItem } from "@/lib/puzzles/review-queue";

/**
 * Three thin wrappers bound to a row's id (see `.bind(null, item.id)` in
 * ReviewQueueList) so each row's Approve/Reject/Dismiss button is its own
 * plain `<form action={...}>` — no client-side state needed, works even
 * without JS. `revalidatePath` re-runs the server-rendered list so the
 * decided item drops out immediately.
 */
export async function approveAction(id: string): Promise<void> {
  await requireAdmin();
  await approveReviewItem(id);
  revalidatePath("/admin/review");
}

export async function rejectAction(id: string): Promise<void> {
  await requireAdmin();
  await rejectReviewItem(id);
  revalidatePath("/admin/review");
}

export async function dismissAction(id: string): Promise<void> {
  await requireAdmin();
  await dismissReviewItem(id);
  revalidatePath("/admin/review");
}
