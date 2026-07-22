import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Completion, Day, Module } from "@/lib/types";

export default async function HireDayPage({
  params,
}: {
  params: Promise<{ dayId: string }>;
}) {
  const { dayId } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: day } = await supabase
    .from("days")
    .select("*")
    .eq("id", dayId)
    .single<Day>();

  if (!day) notFound();

  const { data: rows } = await supabase
    .from("module_days")
    .select("modules(*)")
    .eq("day_id", dayId)
    .returns<{ modules: Module | null }[]>();

  const modules = (rows ?? [])
    .map((row) => row.modules)
    .filter((mod): mod is Module => mod !== null && mod.published)
    .sort((a, b) => a.sort_order - b.sort_order);

  const { data: completions } = await supabase
    .from("completions")
    .select("*")
    .eq("user_id", user!.id)
    .returns<Completion[]>();

  const completedIds = new Set((completions ?? []).map((c) => c.module_id));

  return (
    <div>
      <Link
        href="/modules"
        className="mb-2 inline-block text-sm text-brand-dark hover:underline"
      >
        ← Training
      </Link>
      <div className="mb-8">
        <h1 className="text-2xl font-semibold text-stone-900">
          {day.title}
        </h1>
        {day.description && (
          <p className="mt-1 text-stone-600">{day.description}</p>
        )}
      </div>

      {modules.length === 0 && (
        <p className="rounded-lg border border-dashed border-stone-300 p-6 text-stone-500">
          No modules in this day yet. Check back soon.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {modules.map((mod) => {
          const done = completedIds.has(mod.id);
          return (
            <li key={mod.id}>
              <Link
                href={`/modules/${mod.id}`}
                className="flex items-center justify-between rounded-lg border border-stone-200 bg-white px-5 py-4 hover:border-brand"
              >
                <div>
                  <h2 className="font-medium text-stone-900">{mod.title}</h2>
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
  );
}
