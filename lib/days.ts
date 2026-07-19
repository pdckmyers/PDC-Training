import { createClient } from "@/lib/supabase/server";

export interface DayOption {
  id: string;
  label: string;
}

/** All days across every location/department, for the module editor's multi-select. */
export async function getAllDayOptions(): Promise<DayOption[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("days")
    .select("id, title, sort_order, departments(name, locations(name))")
    .order("sort_order", { ascending: true })
    .returns<
      {
        id: string;
        title: string;
        sort_order: number;
        departments: { name: string; locations: { name: string } | null } | null;
      }[]
    >();

  return (data ?? []).map((d) => {
    const locationName = d.departments?.locations?.name ?? "";
    const departmentName = d.departments?.name ?? "";
    return {
      id: d.id,
      label: [locationName, departmentName, d.title].filter(Boolean).join(" — "),
    };
  });
}

/** The day IDs a given module is currently linked to. */
export async function getModuleDayIds(moduleId: string): Promise<string[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("module_days")
    .select("day_id")
    .eq("module_id", moduleId)
    .returns<{ day_id: string }[]>();

  return (data ?? []).map((row) => row.day_id);
}

export async function getDayBreadcrumb(
  dayId: string
): Promise<{ label: string; href: string } | null> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("days")
    .select("title, departments(name, locations(name))")
    .eq("id", dayId)
    .single<{
      title: string;
      departments: { name: string; locations: { name: string } | null } | null;
    }>();

  if (!data) return null;

  const locationName = data.departments?.locations?.name ?? "";
  const departmentName = data.departments?.name ?? "";
  const label = [locationName, departmentName, data.title]
    .filter(Boolean)
    .join(" — ");

  return { label, href: `/admin/days/${dayId}` };
}
