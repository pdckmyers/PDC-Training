import { createClient } from "@/lib/supabase/server";

export interface DepartmentOption {
  id: string;
  label: string;
}

export async function getDepartmentOptions(): Promise<DepartmentOption[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("departments")
    .select("id, name, locations(name)")
    .order("name", { ascending: true })
    .returns<{ id: string; name: string; locations: { name: string } | null }[]>();

  return (data ?? []).map((d) => ({
    id: d.id,
    label: d.locations?.name ? `${d.locations.name} — ${d.name}` : d.name,
  }));
}
