import { createClient } from "@/lib/supabase/server";
import type { Location, ManagerLocation, Profile } from "@/lib/types";
import TeamManager from "@/components/TeamManager";

export default async function AdminTeamPage() {
  const supabase = await createClient();

  const [{ data: profiles }, { data: locations }, { data: managerLocations }] =
    await Promise.all([
      supabase
        .from("profiles")
        .select("*")
        .order("full_name", { ascending: true })
        .returns<Profile[]>(),
      supabase
        .from("locations")
        .select("*")
        .order("name", { ascending: true })
        .returns<Location[]>(),
      supabase
        .from("manager_locations")
        .select("*")
        .returns<ManagerLocation[]>(),
    ]);

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-stone-900">Team</h1>
      <p className="mb-8 text-stone-600">
        Promote an employee to manager so they can view progress, or move
        them back to employee. Assign each manager one or more locations so
        they only see hires at their stores.
      </p>
      <TeamManager
        initialProfiles={profiles ?? []}
        locations={locations ?? []}
        initialManagerLocations={managerLocations ?? []}
      />
    </div>
  );
}
