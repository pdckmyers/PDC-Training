import { createClient } from "@/lib/supabase/server";
import type { Profile } from "@/lib/types";
import TeamManager from "@/components/TeamManager";

export default async function AdminTeamPage() {
  const supabase = await createClient();

  const { data: profiles } = await supabase
    .from("profiles")
    .select("*")
    .order("full_name", { ascending: true })
    .returns<Profile[]>();

  return (
    <div>
      <h1 className="mb-1 text-2xl font-semibold text-stone-900">Team</h1>
      <p className="mb-8 text-stone-600">
        Promote an employee to manager so they can view everyone&rsquo;s
        progress, or move them back to employee.
      </p>
      <TeamManager initialProfiles={profiles ?? []} />
    </div>
  );
}
