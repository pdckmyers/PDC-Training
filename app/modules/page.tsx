import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Completion, Day, Module, Profile } from "@/lib/types";

export default async function ModulesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<Profile>();

  const [{ data: publishedModules }, { data: allLinks }] = await Promise.all([
    supabase
      .from("modules")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .returns<Module[]>(),
    supabase.from("module_days").select("module_id").returns<{ module_id: string }[]>(),
  ]);

  const linkedModuleIds = new Set((allLinks ?? []).map((l) => l.module_id));
  const generalModules = (publishedModules ?? []).filter(
    (m) => !linkedModuleIds.has(m.id)
  );

  let days: Day[] = [];
  let dayModuleRows: { day_id: string; module: Module }[] = [];

  if (profile?.department_id) {
    const { data: departmentDays } = await supabase
      .from("days")
      .select("*")
      .eq("department_id", profile.department_id)
      .order("sort_order", { ascending: true })
      .returns<Day[]>();
    days = departmentDays ?? [];

    if (days.length > 0) {
      const { data: rows } = await supabase
        .from("module_days")
        .select("day_id, modules(*)")
        .in(
          "day_id",
          days.map((d) => d.id)
        )
        .returns<{ day_id: string; modules: Module | null }[]>();

      dayModuleRows = (rows ?? [])
        .filter((r) => r.modules !== null && r.modules.published)
        .map((r) => ({ day_id: r.day_id, module: r.modules as Module }));
    }
  }

  const { data: completions } = await supabase
    .from("completions")
    .select("*")
    .eq("user_id", user!.id)
    .returns<Completion[]>();

  const completedIds = new Set((completions ?? []).map((c) => c.module_id));

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="mb-1 text-2xl font-semibold text-stone-900">
          Training
        </h1>
        <p className="text-stone-600">
          Work through each module below. Your progress is saved as you go.
        </p>
      </div>

      {days.length > 0 && (
        <div>
          <h2 className="mb-3 text-lg font-semibold text-stone-900">
            Your training days
          </h2>
          <ul className="flex flex-col gap-3">
            {days.map((day) => {
              const modulesForDay = dayModuleRows
                .filter((r) => r.day_id === day.id)
                .map((r) => r.module);
              const completedCount = modulesForDay.filter((m) =>
                completedIds.has(m.id)
              ).length;
              return (
                <li key={day.id}>
                  <Link
                    href={`/modules/days/${day.id}`}
                    className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-5 py-4 hover:border-brand"
                  >
                    <h3 className="font-medium text-stone-900">
                      📁 {day.title}
                    </h3>
                    <span className="ml-4 flex-none text-xs font-semibold text-stone-500">
                      {modulesForDay.length === 0
                        ? "No modules yet"
                        : `${completedCount}/${modulesForDay.length} completed`}
                    </span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div>
        {days.length > 0 && (
          <h2 className="mb-3 text-lg font-semibold text-stone-900">
            General
          </h2>
        )}

        {generalModules.length === 0 && days.length === 0 && (
          <p className="rounded-lg border border-dashed border-stone-300 p-6 text-stone-500">
            No training modules are published yet. Check back soon.
          </p>
        )}

        <ul className="flex flex-col gap-3">
          {generalModules.map((mod) => {
            const done = completedIds.has(mod.id);
            return (
              <li key={mod.id}>
                <Link
                  href={`/modules/${mod.id}`}
                  className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-5 py-4 hover:border-brand"
                >
                  <div>
                    <h3 className="font-medium text-stone-900">{mod.title}</h3>
                    {mod.description && (
                      <p className="mt-0.5 text-sm text-stone-600">
                        {mod.description}
                      </p>
                    )}
                  </div>
                  <span
                    className={`ml-4 flex-none rounded-full px-3 py-1 text-xs font-semibold ${
                      done
                        ? "bg-green-100 text-green-700"
                        : "bg-stone-100 text-stone-500"
                    }`}
                  >
                    {done ? "Completed" : "Not started"}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
