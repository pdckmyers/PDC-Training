"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function UpdatePasswordPage() {
  const router = useRouter();
  const supabase = createClient();
  const [ready, setReady] = useState(false);
  const [linkInvalid, setLinkInvalid] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) {
        setReady(true);
      }
    });

    // The recovery link may have already been processed before this
    // listener was attached, so also check for an existing session.
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setReady(true);
    });

    const timeout = setTimeout(() => {
      setReady((isReady) => {
        if (!isReady) setLinkInvalid(true);
        return isReady;
      });
    }, 4000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [supabase]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError("Passwords don't match.");
      return;
    }

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSuccess(true);
    setLoading(false);
  }

  if (success) {
    return (
      <div className="mx-auto max-w-sm">
        <h1 className="mb-2 text-2xl font-semibold text-stone-900">
          Password updated
        </h1>
        <p className="mb-6 text-stone-600">
          Your password has been changed.
        </p>
        <button
          onClick={() => {
            router.push("/modules");
            router.refresh();
          }}
          className="rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-dark"
        >
          Continue
        </button>
      </div>
    );
  }

  if (linkInvalid) {
    return (
      <div className="mx-auto max-w-sm">
        <h1 className="mb-2 text-2xl font-semibold text-stone-900">
          Link expired
        </h1>
        <p className="mb-6 text-stone-600">
          This password reset link is invalid or has expired. Request a new
          one to continue.
        </p>
        <Link
          href="/reset-password"
          className="rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-dark"
        >
          Request a new link
        </Link>
      </div>
    );
  }

  if (!ready) {
    return (
      <div className="mx-auto max-w-sm">
        <p className="text-stone-600">Verifying your link...</p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold text-stone-900">
        Choose a new password
      </h1>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-stone-700">
          New password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-stone-700">
          Confirm new password
          <input
            type="password"
            required
            minLength={6}
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </label>
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? "Updating..." : "Update password"}
        </button>
      </form>
    </div>
  );
}
