"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Module, QuizQuestion } from "@/lib/types";

function emptyQuestion(): QuizQuestion {
  return { question: "", options: ["", ""], correct_index: 0 };
}

export default function ModuleForm({
  existing,
}: {
  existing?: Module | null;
}) {
  const router = useRouter();
  const supabase = createClient();

  const [title, setTitle] = useState(existing?.title ?? "");
  const [description, setDescription] = useState(existing?.description ?? "");
  const [body, setBody] = useState(existing?.body ?? "");
  const [imageUrl, setImageUrl] = useState(existing?.image_url ?? "");
  const [videoUrl, setVideoUrl] = useState(existing?.video_url ?? "");
  const [sortOrder, setSortOrder] = useState(existing?.sort_order ?? 0);
  const [published, setPublished] = useState(existing?.published ?? false);
  const [quiz, setQuiz] = useState<QuizQuestion[]>(existing?.quiz ?? []);

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function updateQuestion(qi: number, patch: Partial<QuizQuestion>) {
    setQuiz((prev) =>
      prev.map((q, i) => (i === qi ? { ...q, ...patch } : q))
    );
  }

  function updateOption(qi: number, oi: number, value: string) {
    setQuiz((prev) =>
      prev.map((q, i) => {
        if (i !== qi) return q;
        const options = [...q.options];
        options[oi] = value;
        return { ...q, options };
      })
    );
  }

  function addOption(qi: number) {
    setQuiz((prev) =>
      prev.map((q, i) => (i === qi ? { ...q, options: [...q.options, ""] } : q))
    );
  }

  function removeOption(qi: number, oi: number) {
    setQuiz((prev) =>
      prev.map((q, i) => {
        if (i !== qi) return q;
        const options = q.options.filter((_, idx) => idx !== oi);
        const correct_index =
          q.correct_index >= options.length
            ? Math.max(0, options.length - 1)
            : q.correct_index;
        return { ...q, options, correct_index };
      })
    );
  }

  function removeQuestion(qi: number) {
    setQuiz((prev) => prev.filter((_, i) => i !== qi));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const cleanedQuiz = quiz
      .map((q) => ({
        ...q,
        options: q.options.map((o) => o.trim()).filter(Boolean),
      }))
      .filter((q) => q.question.trim() && q.options.length >= 2);

    for (const q of cleanedQuiz) {
      if (q.correct_index >= q.options.length) q.correct_index = 0;
    }

    setSaving(true);

    const payload = {
      title: title.trim(),
      description: description.trim(),
      body: body.trim(),
      image_url: imageUrl.trim() || null,
      video_url: videoUrl.trim() || null,
      sort_order: sortOrder,
      published,
      quiz: cleanedQuiz,
    };

    if (existing) {
      const { error } = await supabase
        .from("modules")
        .update(payload)
        .eq("id", existing.id);
      setSaving(false);
      if (error) {
        setError(error.message);
        return;
      }
    } else {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      const { error } = await supabase
        .from("modules")
        .insert({ ...payload, created_by: user!.id });
      setSaving(false);
      if (error) {
        setError(error.message);
        return;
      }
    }

    router.push("/admin/modules");
    router.refresh();
  }

  async function handleDelete() {
    if (!existing) return;
    if (!confirm(`Delete "${existing.title}"? This can't be undone.`)) return;

    setDeleting(true);
    const { error } = await supabase
      .from("modules")
      .delete()
      .eq("id", existing.id);
    setDeleting(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.push("/admin/modules");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-6">
      <label className="flex flex-col gap-1 text-sm text-stone-700">
        Title
        <input
          required
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-stone-700">
        Short description (shown in the module list)
        <input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-stone-700">
        Main content
        <textarea
          rows={8}
          value={body}
          onChange={(e) => setBody(e.target.value)}
          className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-stone-700">
        Image URL (optional)
        <input
          value={imageUrl}
          onChange={(e) => setImageUrl(e.target.value)}
          placeholder="https://..."
          className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-stone-700">
        Video URL (optional — YouTube, Vimeo, or a direct .mp4 link)
        <input
          value={videoUrl}
          onChange={(e) => setVideoUrl(e.target.value)}
          placeholder="https://..."
          className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm text-stone-700">
        Order (lower numbers show first)
        <input
          type="number"
          value={sortOrder}
          onChange={(e) => setSortOrder(Number(e.target.value))}
          className="w-32 rounded-md border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
        />
      </label>

      <label className="flex items-center gap-2 text-sm text-stone-700">
        <input
          type="checkbox"
          checked={published}
          onChange={(e) => setPublished(e.target.checked)}
          className="text-brand focus:ring-brand"
        />
        Published (visible to new hires)
      </label>

      <div className="border-t border-stone-200 pt-6">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-stone-900">
            Quiz questions (optional)
          </h2>
          <button
            type="button"
            onClick={() => setQuiz((prev) => [...prev, emptyQuestion()])}
            className="rounded-md border border-brand px-3 py-1.5 text-sm font-medium text-brand-dark hover:bg-brand/10"
          >
            Add question
          </button>
        </div>

        {quiz.length === 0 && (
          <p className="text-sm text-stone-500">
            No quiz — hires just mark this module complete after reading it.
          </p>
        )}

        <div className="flex flex-col gap-5">
          {quiz.map((q, qi) => (
            <div
              key={qi}
              className="rounded-lg border border-stone-200 bg-stone-50 p-4"
            >
              <div className="mb-3 flex items-start gap-2">
                <input
                  value={q.question}
                  onChange={(e) =>
                    updateQuestion(qi, { question: e.target.value })
                  }
                  placeholder={`Question ${qi + 1}`}
                  className="flex-1 rounded-md border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                />
                <button
                  type="button"
                  onClick={() => removeQuestion(qi)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Remove
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {q.options.map((opt, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <input
                      type="radio"
                      name={`correct-${qi}`}
                      checked={q.correct_index === oi}
                      onChange={() => updateQuestion(qi, { correct_index: oi })}
                      title="Correct answer"
                      className="text-brand focus:ring-brand"
                    />
                    <input
                      value={opt}
                      onChange={(e) => updateOption(qi, oi, e.target.value)}
                      placeholder={`Option ${oi + 1}`}
                      className="flex-1 rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                    />
                    {q.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(qi, oi)}
                        className="text-xs text-stone-400 hover:text-red-600"
                      >
                        remove
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOption(qi)}
                  className="self-start text-xs text-brand-dark hover:underline"
                >
                  + add option
                </button>
              </div>
              <p className="mt-2 text-xs text-stone-500">
                Select the radio button next to the correct answer.
              </p>
            </div>
          ))}
        </div>
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <div className="flex items-center gap-3 border-t border-stone-200 pt-6">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {saving ? "Saving..." : existing ? "Save changes" : "Create module"}
        </button>
        {existing && (
          <button
            type="button"
            onClick={handleDelete}
            disabled={deleting}
            className="text-sm text-red-600 hover:underline disabled:opacity-60"
          >
            {deleting ? "Deleting..." : "Delete module"}
          </button>
        )}
      </div>
    </form>
  );
}
