import { createClient } from "@/lib/supabase/server";
import type { Completion, Module, Profile } from "@/lib/types";

export default async function ProgressPage() {
  const supabase = await createClient();

  const [{ data: profiles }, { data: modules }, { data: completions }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .eq("role", "hire")
        .order("full_name", { ascending: true })
        .returns<Profile[]>(),
      supabase
        .from("modules")
        .select("*")
        .eq("published", true)
        .order("sort_order", { ascending: true })
        .returns<Module[]>(),
      supabase.from("completions").select("*").returns<Completion[]>(),
    ]);

  const completionMap = new Map<string, Completion>();
  (completions ?? []).forEach((c) =>
    completionMap.set(`${c.user_id}:${c.module_id}`, c)
  );

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-stone-900">
        Training progress
      </h1>
      <p className="mb-6 text-stone-600">
        Who&rsquo;s finished what, at a glance.
      </p>

      {(!profiles || profiles.length === 0) && (
        <p className="rounded-lg border border-dashed border-stone-300 p-6 text-stone-500">
          No employees have signed up yet.
        </p>
      )}

      {(!modules || modules.length === 0) && profiles && profiles.length > 0 && (
        <p className="rounded-lg border border-dashed border-stone-300 p-6 text-stone-500">
          No published modules yet, so there&rsquo;s nothing to track.
        </p>
      )}

      {profiles && profiles.length > 0 && modules && modules.length > 0 && (
        <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-stone-200 bg-stone-50 text-left">
                <th className="px-4 py-3 font-medium text-stone-700">
                  Name
                </th>
                {modules.map((mod) => (
                  <th
                    key={mod.id}
                    className="px-4 py-3 font-medium text-stone-700"
                  >
                    {mod.title}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {profiles.map((profile) => (
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
      )}
    </div>
  );
}
