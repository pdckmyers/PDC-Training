"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import VideoEmbed from "@/components/VideoEmbed";

/**
 * Shown once, the first time an employee lands on /modules (see the
 * welcome_video_seen_at check in app/modules/page.tsx). Dismissing marks
 * it seen so it never appears again -- if they close the tab instead of
 * dismissing, it'll simply show again next login rather than being
 * silently burned on a page load they never finished.
 */
export default function WelcomeVideoModal({ videoUrl }: { videoUrl: string }) {
  const supabase = createClient();
  const [open, setOpen] = useState(true);
  const [dismissing, setDismissing] = useState(false);

  if (!open) return null;

  async function handleContinue() {
    setDismissing(true);
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      await supabase
        .from("profiles")
        .update({ welcome_video_seen_at: new Date().toISOString() })
        .eq("id", user.id);
    }

    setOpen(false);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/70 p-4">
      <div className="flex w-full max-w-2xl flex-col gap-4 rounded-lg bg-white p-6 shadow-xl">
        <div>
          <h2 className="text-xl font-semibold text-stone-900">
            Welcome to PDC Training
          </h2>
          <p className="mt-1 text-sm text-stone-600">
            Take a minute to watch this before you get started.
          </p>
        </div>
        <VideoEmbed url={videoUrl} />
        <button
          type="button"
          onClick={handleContinue}
          disabled={dismissing}
          className="self-end rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {dismissing ? "Continuing..." : "Continue"}
        </button>
      </div>
    </div>
  );
}
