"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createBrowserClient } from "@/lib/supabase/browser";

type Mode = "sign-in" | "sign-up";

/**
 * Player-facing sign-in/sign-up, combined with a toggle — a sibling to
 * the admin-only LoginForm.tsx (styled identically), not a refactor of
 * it, since that one deliberately has no public sign-up flow. Signing up
 * here creates a real account in the same shared-with-QuizHub
 * `auth.users` table, so it's also a valid QuizHub login.
 */
export function PlayerAuthForm() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [checkEmailMessage, setCheckEmailMessage] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsSubmitting(true);
    setErrorMessage(null);
    setCheckEmailMessage(null);

    const supabase = createBrowserClient();

    if (mode === "sign-in") {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        setErrorMessage(error.message);
        setIsSubmitting(false);
        return;
      }
    } else {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: { emailRedirectTo: `${window.location.origin}/account` },
      });
      if (error) {
        setErrorMessage(error.message);
        setIsSubmitting(false);
        return;
      }
      if (!data.session) {
        // Supabase project has "confirm email" turned on — there's no
        // session yet, so there's nothing to redirect into. The
        // confirmation link itself also points at /account.
        setCheckEmailMessage("Check your email to confirm your account, then come back here.");
        setIsSubmitting(false);
        return;
      }
      // A session came back immediately — "confirm email" is off. Fall through and proceed like a sign-in.
    }

    // router.refresh() forces the /account Server Component to re-run now
    // that the session cookie is set, same pattern as the admin LoginForm.
    router.replace("/account");
    router.refresh();
  }

  return (
    <div className="flex w-full max-w-sm flex-col items-center gap-6">
      <h1 className="font-display text-3xl tracking-wide text-yellow-300">
        {mode === "sign-in" ? "Sign in" : "Create an account"}
      </h1>
      <p className="text-center font-sans text-sm text-yellow-100/70">
        {mode === "sign-in"
          ? "Already have a QuizHub account? Sign in with the same email and password — it works here too."
          : "Save your progress and streak across devices. This also creates a QuizHub login, if you don't have one already."}
      </p>

      <form onSubmit={handleSubmit} className="flex w-full flex-col gap-4">
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
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            className="rounded-full border-2 border-yellow-300/50 bg-purple-950/70 px-5 py-3 text-yellow-50 focus:border-yellow-300 focus:outline-none"
          />
        </div>
        {errorMessage && <p className="font-sans text-sm text-red-300">{errorMessage}</p>}
        {checkEmailMessage && <p className="font-sans text-sm text-emerald-300">{checkEmailMessage}</p>}
        <button
          type="submit"
          disabled={isSubmitting}
          className="rounded-full bg-yellow-300 px-6 py-3 font-display text-lg tracking-wide text-purple-950 transition disabled:opacity-50"
        >
          {isSubmitting
            ? mode === "sign-in"
              ? "Signing in…"
              : "Creating account…"
            : mode === "sign-in"
              ? "Sign in"
              : "Create account"}
        </button>
      </form>

      <button
        type="button"
        onClick={() => {
          setMode(mode === "sign-in" ? "sign-up" : "sign-in");
          setErrorMessage(null);
          setCheckEmailMessage(null);
        }}
        className="font-sans text-sm text-yellow-100/80 underline"
      >
        {mode === "sign-in" ? "Don't have an account? Sign up" : "Already have an account? Sign in"}
      </button>
    </div>
  );
}
