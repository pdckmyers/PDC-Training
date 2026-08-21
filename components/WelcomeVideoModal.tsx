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

  async function handleClose() {
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
      <div className="relative w-full max-w-2xl">
        <button
          type="button"
          onClick={handleClose}
          disabled={dismissing}
          aria-label="Close"
          className="absolute -top-4 -right-4 z-10 flex h-9 w-9 items-center justify-center rounded-full bg-white text-lg leading-none text-stone-700 shadow-lg hover:bg-stone-100 disabled:opacity-60"
        >
          &times;
        </button>
        <VideoEmbed url={videoUrl} autoPlay />
      </div>
    </div>
  );
}
