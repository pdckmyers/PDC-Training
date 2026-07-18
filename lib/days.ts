import { createClient } from "@/lib/supabase/server";

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
