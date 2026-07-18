import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Module } from "@/lib/types";
import { getDepartmentOptions } from "@/lib/departments";

export default async function AdminModulesPage() {
  const supabase = await createClient();

  const [{ data: modules }, departments] = await Promise.all([
    supabase
      .from("modules")
      .select("*")
      .order("sort_order", { ascending: true })
      .returns<Module[]>(),
    getDepartmentOptions(),
  ]);

  const departmentLabel = new Map(departments.map((d) => [d.id, d.label]));

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-900">
          Manage modules
        </h1>
        <Link
          href="/admin/modules/new"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          New module
        </Link>
      </div>

      {(!modules || modules.length === 0) && (
        <p className="rounded-lg border border-dashed border-stone-300 p-6 text-stone-500">
          No modules yet. Create the first one.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {modules?.map((mod) => (
          <li key={mod.id}>
            <Link
              href={`/admin/modules/${mod.id}/edit`}
              className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-5 py-4 hover:border-brand"
            >
              <div>
                <h2 className="font-medium text-stone-900">{mod.title}</h2>
                <p className="mt-0.5 text-sm text-stone-500">
                  {mod.department_id
                    ? departmentLabel.get(mod.department_id) ?? "Unknown department"
                    : "General — all employees"}
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
