"use client";

import { useState } from "react";
import Link from "next/link";
import type { Module } from "@/lib/types";

interface ModuleWithLabels extends Module {
  labels: string[];
  locationLabels: string[];
}

export default function ModuleSearchList({
  modules,
}: {
  modules: ModuleWithLabels[];
}) {
  const [query, setQuery] = useState("");

  const normalizedQuery = query.trim().toLowerCase();
  const filtered = normalizedQuery
    ? modules.filter((mod) => {
        const haystack = [mod.title, ...mod.labels, ...mod.locationLabels]
          .join(" ")
          .toLowerCase();
        return haystack.includes(normalizedQuery);
      })
    : modules;

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="Search by title, location, department, or day…"
        className="mb-4 w-full rounded-md border border-stone-300 px-3 py-2 text-sm focus:border-brand focus:outline-none"
      />

      {modules.length > 0 && filtered.length === 0 && (
        <p className="rounded-lg border border-dashed border-stone-300 p-6 text-stone-500">
          No modules match &ldquo;{query}&rdquo;.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {filtered.map((mod) => (
          <li key={mod.id}>
            <Link
              href={`/admin/modules/${mod.id}/edit`}
              className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-5 py-4 hover:border-brand"
            >
              <div>
                <h2 className="font-medium text-stone-900">{mod.title}</h2>
                <p className="mt-0.5 text-sm text-stone-500">
                  {mod.labels.length === 0
                    ? mod.locationLabels.length === 0
                      ? "Master Your Craft — all employees"
                      : `Master Your Craft — ${mod.locationLabels.join(", ")}`
                    : mod.labels.join(" · ")}
                  {" · "}
                  {mod.quiz.length} question{mod.quiz.length === 1 ? "" : "s"}
                </p>
              </div>
              <span
                className={`ml-4 flex-none rounded-full px-3 py-1 text-xs font-semibold ${
                  mod.published
                    ? "bg-green-100 text-green-700"
                    : "bg-stone-100 text-stone-500"
                }`}
              >
                {mod.published ? "Published" : "Draft"}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
