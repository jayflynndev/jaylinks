"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/browser";

/**
 * Email/password sign-in for /admin. Supabase Auth only — no public
 * sign-up flow exists (Jay's is the only account, created directly in the
 * Supabase dashboard per docs/SUPABASE_SETUP.md).
 */
export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);

    const supabase = createBrowserClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      setErrorMessage(error.message);
      setIsSubmitting(false);
      return;
    }

    // router.refresh() forces server components (the /admin layout's auth
    // check in particular) to re-run now that the session cookie is set.
    router.replace("/admin");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex w-full max-w-sm flex-col gap-4">
      <div className="flex flex-col gap-1">
        <label htmlFor="email" className="font-sans text-sm text-yellow-100/80">
          Email
        </label>
        <input
          id="email"
          type="email"
          required
          autoComplete="username"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="rounded-full border-2 border-yellow-300/50 bg-purple-950/70 px-5 py-3 text-yellow-50 focus:border-yellow-300 focus:outline-none"
        />
      </div>
      <div className="flex flex-col gap-1">
        <label htmlFor="password" className="font-sans text-sm text-yellow-100/80">
          Password
        </label>
        <input
          id="password"
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="rounded-full border-2 border-yellow-300/50 bg-purple-950/70 px-5 py-3 text-yellow-50 focus:border-yellow-300 focus:outline-none"
        />
      </div>
      {errorMessage && <p className="font-sans text-sm text-red-300">{errorMessage}</p>}
      <button
        type="submit"
        disabled={isSubmitting}
        className="rounded-full bg-yellow-300 px-6 py-3 font-display text-lg tracking-wide text-purple-950 transition disabled:opacity-50"
      >
        {isSubmitting ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}
