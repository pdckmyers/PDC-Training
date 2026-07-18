import { createClient } from "@/lib/supabase/server";
import type { Department, Location } from "@/lib/types";
import LocationsManager from "@/components/LocationsManager";

export default async function AdminLocationsPage() {
  const supabase = await createClient();

  const [{ data: locations }, { data: departments }] = await Promise.all([
    supabase
      .from("locations")
      .select("*")
      .order("name", { ascending: true })
      .returns<Location[]>(),
    supabase
      .from("departments")
      .select("*")
      .order("name", { ascending: true })
      .returns<Department[]>(),
  ]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-stone-900">
        Locations &amp; departments
      </h1>
      <p className="mb-8 text-stone-600">
        Add a location, then the departments under it. Each department gets
        its own invite link you can send a new employee so they land straight in
        their training.
      </p>
      <LocationsManager
        initialLocations={locations ?? []}
        initialDepartments={departments ?? []}
      />
    </div>
  );
}
