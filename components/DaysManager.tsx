"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Day } from "@/lib/types";

export default function DaysManager({
  departmentId,
  initialDays,
}: {
  departmentId: string;
  initialDays: Day[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [days, setDays] = useState(initialDays);
  const [newTitle, setNewTitle] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function addDay(e: React.FormEvent) {
    e.preventDefault();
    const title = newTitle.trim();
    if (!title) return;

    const { data, error } = await supabase
      .from("days")
      .insert({
        department_id: departmentId,
        title,
        sort_order: days.length,
      })
      .select()
      .single<Day>();

    if (error) {
      setError(error.message);
      return;
    }

    setDays((prev) => [...prev, data]);
    setNewTitle("");
    router.refresh();
  }

  async function deleteDay(id: string) {
    if (
      !confirm(
        "Delete this day? Its modules become general (visible to everyone) instead of being deleted."
      )
    )
      return;

    const { error } = await supabase.from("days").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }

    setDays((prev) => prev.filter((d) => d.id !== id));
    router.refresh();
  }

  return (
    <div className="flex flex-col gap-4">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {days.length === 0 && (
        <p className="rounded-lg border border-dashed border-stone-300 p-6 text-stone-500">
          No days yet. Add the first one below.
        </p>
      )}

      <ul className="flex flex-col gap-2">
        {days.map((day) => (
          <li key={day.id}>
            <div className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-5 py-3">
              <Link
                href={`/admin/days/${day.id}`}
                className="font-medium text-stone-900 hover:text-brand-dark"
              >
                📁 {day.title}
              </Link>
              <button
                onClick={() => deleteDay(day.id)}
                className="text-xs text-stone-400 hover:text-red-600"
              >
                remove
              </button>
            </div>
          </li>
        ))}
      </ul>

      <form onSubmit={addDay} className="flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1 text-sm text-stone-700">
          New day
          <input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="e.g. Day One"
            className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Add day
        </button>
      </form>
    </div>
  );
}
