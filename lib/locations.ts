import { createClient } from "@/lib/supabase/server";

export interface LocationOption {
  id: string;
  name: string;
}

/** Every location, for the module editor's "limit to these locations" multi-select. */
export async function getAllLocationOptions(): Promise<LocationOption[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("locations")
    .select("id, name")
    .order("name", { ascending: true })
    .returns<LocationOption[]>();

  return data ?? [];
}

/** The location IDs a given (general) module is currently scoped to. */
export async function getModuleLocationIds(moduleId: string): Promise<string[]> {
  const supabase = await createClient();

  const { data } = await supabase
    .from("module_locations")
    .select("location_id")
    .eq("module_id", moduleId)
    .returns<{ location_id: string }[]>();

  return (data ?? []).map((row) => row.location_id);
}
