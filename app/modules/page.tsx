import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Completion, Module } from "@/lib/types";

export default async function ModulesPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: modules } = await supabase
    .from("modules")
    .select("*")
    .eq("published", true)
    .order("sort_order", { ascending: true })
    .returns<Module[]>();

  const { data: completions } = await supabase
    .from("completions")
    .select("*")
    .eq("user_id", user!.id)
    .returns<Completion[]>();

  const completedIds = new Set((completions ?? []).map((c) => c.module_id));

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-stone-900">
        Training modules
      </h1>
      <p className="mb-8 text-stone-600">
        Work through each module below. Your progress is saved as you go.
      </p>

      {(!modules || modules.length === 0) && (
        <p className="rounded-lg border border-dashed border-stone-300 p-6 text-stone-500">
          No training modules are published yet. Check back soon.
        </p>
      )}

      <ul className="flex flex-col gap-3">
        {modules?.map((mod) => {
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
