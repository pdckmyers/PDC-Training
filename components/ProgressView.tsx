"use client";

import { useMemo, useState } from "react";
import type { Completion, Module, Profile } from "@/lib/types";

export type ProgressRow = {
  profile: Profile;
  locationName: string;
  departmentName: string;
};

function ProgressTable({
  rows,
  modules,
  completionMap,
}: {
  rows: ProgressRow[];
  modules: Module[];
  completionMap: Map<string, Completion>;
}) {
  return (
    <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-stone-200 bg-stone-50 text-left">
            <th className="px-4 py-3 font-medium text-stone-700">Name</th>
            {modules.map((mod) => (
              <th key={mod.id} className="px-4 py-3 font-medium text-stone-700">
                {mod.title}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map(({ profile }) => (
            <tr key={profile.id} className="border-b border-stone-100">
              <td className="px-4 py-3 font-medium text-stone-900">
                {profile.full_name || profile.email}
              </td>
              {modules.map((mod) => {
                const completion = completionMap.get(
                  `${profile.id}:${mod.id}`
                );
                return (
                  <td key={mod.id} className="px-4 py-3">
                    {completion ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700">
                        Done
                        {completion.quiz_total != null &&
                          ` · ${completion.quiz_score}/${completion.quiz_total}`}
                      </span>
                    ) : (
                      <span className="text-xs text-stone-400">—</span>
                    )}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function ProgressView({
  hires,
  modules,
  completions,
}: {
  hires: ProgressRow[];
  modules: Module[];
  completions: Completion[];
}) {
  const [search, setSearch] = useState("");

  const completionMap = useMemo(() => {
    const map = new Map<string, Completion>();
    completions.forEach((c) => map.set(`${c.user_id}:${c.module_id}`, c));
    return map;
  }, [completions]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return hires;
    return hires.filter(
      (h) =>
        (h.profile.full_name ?? "").toLowerCase().includes(q) ||
        h.profile.email.toLowerCase().includes(q)
    );
  }, [hires, search]);

  const groups = useMemo(() => {
    const byLocation = new Map<string, Map<string, ProgressRow[]>>();
    filtered.forEach((row) => {
      if (!byLocation.has(row.locationName)) {
        byLocation.set(row.locationName, new Map());
      }
      const byDept = byLocation.get(row.locationName)!;
      if (!byDept.has(row.departmentName)) byDept.set(row.departmentName, []);
      byDept.get(row.departmentName)!.push(row);
    });

    const sortRows = (rows: ProgressRow[]) =>
      [...rows].sort((a, b) =>
        (a.profile.full_name || a.profile.email).localeCompare(
          b.profile.full_name || b.profile.email
        )
      );

    return Array.from(byLocation.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([locationName, byDept]) => ({
        locationName,
        departments: Array.from(byDept.entries())
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([departmentName, rows]) => ({
            departmentName,
            rows: sortRows(rows),
          })),
        total: Array.from(byDept.values()).reduce(
          (sum, rows) => sum + rows.length,
          0
        ),
      }));
  }, [filtered]);

  return (
    <div className="flex flex-col gap-4">
      <input
        type="search"
        placeholder="Search by name or email..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full max-w-sm rounded-md border border-stone-300 px-3 py-2 text-sm text-stone-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
      />

      {filtered.length === 0 && (
        <p className="rounded-lg border border-dashed border-stone-300 p-6 text-stone-500">
          No employees match &ldquo;{search}&rdquo;.
        </p>
      )}

      {search.trim() ? (
        filtered.length > 0 && (
          <ProgressTable
            rows={filtered}
            modules={modules}
            completionMap={completionMap}
          />
        )
      ) : (
        <div className="flex flex-col gap-4">
          {groups.map((group) => (
            <details
              key={group.locationName}
              open={groups.length === 1}
              className="rounded-lg border border-stone-200 bg-white"
            >
              <summary className="cursor-pointer select-none px-4 py-3 text-base font-semibold text-stone-900">
                {group.locationName}{" "}
                <span className="font-normal text-stone-500">
                  ({group.total})
                </span>
              </summary>
              <div className="flex flex-col gap-4 border-t border-stone-200 p-4">
                {group.departments.map((dept) => (
                  <div key={dept.departmentName}>
                    <h3 className="mb-2 text-sm font-semibold text-stone-700">
                      {dept.departmentName}{" "}
                      <span className="font-normal text-stone-400">
                        ({dept.rows.length})
                      </span>
                    </h3>
                    <ProgressTable
                      rows={dept.rows}
                      modules={modules}
                      completionMap={completionMap}
                    />
                  </div>
                ))}
              </div>
            </details>
          ))}
        </div>
      )}
    </div>
  );
}
