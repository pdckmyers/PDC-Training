import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Module } from "@/lib/types";
import ModuleSearchList from "@/components/admin/ModuleSearchList";

interface ModuleDayLabelRow {
  module_id: string;
  days: {
    title: string;
    departments: { name: string; locations: { name: string } | null } | null;
  } | null;
}

function dayLabel(row: ModuleDayLabelRow["days"]): string {
  if (!row) return "";
  const locationName = row.departments?.locations?.name ?? "";
  const departmentName = row.departments?.name ?? "";
  return [locationName, departmentName, row.title].filter(Boolean).join(" — ");
}

export default async function AdminModulesPage() {
  const supabase = await createClient();

  const [{ data: modules }, { data: moduleDayRows }] = await Promise.all([
    supabase
      .from("modules")
      .select("*")
      .order("sort_order", { ascending: true })
      .returns<Module[]>(),
    supabase
      .from("module_days")
      .select("module_id, days(title, departments(name, locations(name)))")
      .returns<ModuleDayLabelRow[]>(),
  ]);

  const labelsByModule = new Map<string, string[]>();
  for (const row of moduleDayRows ?? []) {
    const label = dayLabel(row.days);
    if (!label) continue;
    const existing = labelsByModule.get(row.module_id) ?? [];
    existing.push(label);
    labelsByModule.set(row.module_id, existing);
  }

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
          New general module
        </Link>
      </div>
      <p className="mb-6 text-sm text-stone-500">
        Every module across every location, department, and day. To add a
        module inside a specific day, go to{" "}
        <Link href="/admin/locations" className="text-brand-dark underline">
          Locations
        </Link>{" "}
        and open that day&rsquo;s folder instead. A module can be checked
        into more than one day from its edit screen &mdash; edit it once and
        every day it&rsquo;s in updates together.
      </p>

      {(!modules || modules.length === 0) && (
        <p className="rounded-lg border border-dashed border-stone-300 p-6 text-stone-500">
          No modules yet. Create the first one.
        </p>
      )}

      {modules && modules.length > 0 && (
        <ModuleSearchList
          modules={modules.map((mod) => ({
            ...mod,
            labels: labelsByModule.get(mod.id) ?? [],
          }))}
        />
      )}
    </div>
  );
}
