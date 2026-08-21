"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import VideoEmbed from "@/components/VideoEmbed";

export default function WelcomeVideoSettings({
  initialUrl,
}: {
  initialUrl: string | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [url, setUrl] = useState(initialUrl ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSaved(false);

    const { error } = await supabase
      .from("app_settings")
      .update({ welcome_video_url: url.trim() || null })
      .eq("id", true);

    setSaving(false);

    if (error) {
      setError(error.message);
      return;
    }

    setSaved(true);
    router.refresh();
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-3 rounded-lg border border-stone-200 bg-white p-4"
    >
      <label className="flex flex-col gap-1 text-sm text-stone-700">
        Welcome video URL (YouTube or Vimeo link)
        <input
          type="text"
          value={url}
          onChange={(e) => {
            setUrl(e.target.value);
            setSaved(false);
          }}
          placeholder="https://www.youtube.com/watch?v=..."
          className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </label>
      <p className="text-sm text-stone-500">
        Shown once to every employee the first time they land on their
        training after logging in. Clear this field to turn it off.
      </p>
      {url.trim() && <VideoEmbed url={url.trim()} />}
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="self-start rounded-md bg-brand px-3 py-1.5 text-sm font-medium text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {saved && <span className="text-sm text-green-700">Saved</span>}
        {error && <span className="text-sm text-red-600">{error}</span>}
      </div>
    </form>
  );
}
