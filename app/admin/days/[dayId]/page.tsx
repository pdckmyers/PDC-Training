import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Day, Department, Location, Module } from "@/lib/types";
import DayDescriptionEditor from "@/components/DayDescriptionEditor";

export default async function DayPage({
  params,
}: {
  params: Promise<{ dayId: string }>;
}) {
  const { dayId } = await params;
  const supabase = await createClient();

  const { data: day } = await supabase
    .from("days")
    .select("*")
    .eq("id", dayId)
    .single<Day>();

  if (!day) notFound();

  const [{ data: department }, { data: moduleDayRows }] = await Promise.all([
    supabase
      .from("departments")
      .select("*")
      .eq("id", day.department_id)
      .single<Department>(),
    supabase
      .from("module_days")
      .select("modules(*)")
      .eq("day_id", dayId)
      .returns<{ modules: Module | null }[]>(),
  ]);

  const modules = (moduleDayRows ?? [])
    .map((row) => row.modules)
    .filter((mod): mod is Module => mod !== null)
    .sort((a, b) => a.sort_order - b.sort_order);

  const { data: location } = department
    ? await supabase
        .from("locations")
        .select("*")
        .eq("id", department.location_id)
        .single<Location>()
    : { data: null };

  return (
    <div>
      {department && (
        <Link
          href={`/admin/departments/${department.id}`}
          className="mb-2 inline-block text-sm text-brand-dark hover:underline"
        >
          ← {location?.name} — {department.name}
        </Link>
      )}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-stone-900">{day.title}</h1>
        <Link
          href={`/admin/days/${dayId}/modules/new`}
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          New module
        </Link>
      </div>

      <DayDescriptionEditor dayId={day.id} initialDescription={day.description} />

      {modules.length === 0 && (
        <p className="rounded-lg border border-dashed border-stone-300 p-6 text-stone-500">
          No modules in this day yet.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {modules.map((mod) => (
          <li key={mod.id}>
            <Link
              href={`/admin/modules/${mod.id}/edit`}
              className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-5 py-4 hover:border-brand"
            >
              <div>
                <h2 className="font-medium text-stone-900">{mod.title}</h2>
                <p className="mt-0.5 text-sm text-stone-500">
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
