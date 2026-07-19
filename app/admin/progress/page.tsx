import { createClient } from "@/lib/supabase/server";
import type {
  Completion,
  Department,
  Location,
  Module,
  Profile,
} from "@/lib/types";
import ProgressView, { type ProgressRow } from "@/components/ProgressView";

export default async function ProgressPage() {
  const supabase = await createClient();

  const [
    { data: profiles },
    { data: modules },
    { data: completions },
    { data: locations },
    { data: departments },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("*")
      .eq("role", "hire")
      .returns<Profile[]>(),
    supabase
      .from("modules")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .returns<Module[]>(),
    supabase.from("completions").select("*").returns<Completion[]>(),
    supabase.from("locations").select("*").returns<Location[]>(),
    supabase.from("departments").select("*").returns<Department[]>(),
  ]);

  const locationNameById = new Map(
    (locations ?? []).map((l) => [l.id, l.name])
  );
  const departmentsById = new Map((departments ?? []).map((d) => [d.id, d]));

  const hires: ProgressRow[] = (profiles ?? []).map((profile) => {
    const dept = profile.department_id
      ? departmentsById.get(profile.department_id)
      : undefined;
    const locationName = dept
      ? (locationNameById.get(dept.location_id) ?? "Unknown location")
      : "Unassigned";
    const departmentName = dept ? dept.name : "No department";
    return { profile, locationName, departmentName };
  });

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-stone-900">
        Training progress
      </h1>
      <p className="mb-6 text-stone-600">
        Who&rsquo;s finished what, at a glance.
      </p>

      {hires.length === 0 && (
        <p className="rounded-lg border border-dashed border-stone-300 p-6 text-stone-500">
          No employees have signed up yet.
        </p>
      )}

      {hires.length > 0 && (!modules || modules.length === 0) && (
        <p className="rounded-lg border border-dashed border-stone-300 p-6 text-stone-500">
          No published modules yet, so there&rsquo;s nothing to track.
        </p>
      )}

      {hires.length > 0 && modules && modules.length > 0 && (
        <ProgressView
          hires={hires}
          modules={modules}
          completions={completions ?? []}
        />
      )}
    </div>
  );
}
