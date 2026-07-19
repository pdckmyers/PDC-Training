"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Location, ManagerLocation, Profile, Role } from "@/lib/types";

const ROLE_LABEL: Record<Role, string> = {
  hire: "Employee",
  manager: "Manager",
  admin: "Admin",
};

export default function TeamManager({
  initialProfiles,
  locations,
  initialManagerLocations,
}: {
  initialProfiles: Profile[];
  locations: Location[];
  initialManagerLocations: ManagerLocation[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [profiles, setProfiles] = useState(initialProfiles);
  const [managerLocations, setManagerLocations] = useState(
    initialManagerLocations
  );
  const [error, setError] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  async function setRole(id: string, role: Role) {
    setUpdatingId(id);
    setError(null);

    const { error } = await supabase
      .from("profiles")
      .update({ role })
      .eq("id", id);

    setUpdatingId(null);

    if (error) {
      setError(error.message);
      return;
    }

    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, role } : p)));
    router.refresh();
  }

  async function toggleLocation(managerId: string, locationId: string) {
    const alreadyAssigned = managerLocations.some(
      (ml) => ml.manager_id === managerId && ml.location_id === locationId
    );

    setUpdatingId(managerId);
    setError(null);

    if (alreadyAssigned) {
      const { error } = await supabase
        .from("manager_locations")
        .delete()
        .eq("manager_id", managerId)
        .eq("location_id", locationId);

      setUpdatingId(null);
      if (error) {
        setError(error.message);
        return;
      }

      setManagerLocations((prev) =>
        prev.filter(
          (ml) => !(ml.manager_id === managerId && ml.location_id === locationId)
        )
      );
    } else {
      const { data, error } = await supabase
        .from("manager_locations")
        .insert({ manager_id: managerId, location_id: locationId })
        .select()
        .single<ManagerLocation>();

      setUpdatingId(null);
      if (error || !data) {
        setError(error?.message ?? "Could not assign location");
        return;
      }

      setManagerLocations((prev) => [...prev, data]);
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col gap-3">
      {error && <p className="text-sm text-red-600">{error}</p>}

      {profiles.length === 0 && (
        <p className="rounded-lg border border-dashed border-stone-300 p-6 text-stone-500">
          No one has signed up yet.
        </p>
      )}

      <div className="overflow-x-auto rounded-lg border border-stone-200 bg-white">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-stone-200 bg-stone-50 text-left">
              <th className="px-4 py-3 font-medium text-stone-700">Name</th>
              <th className="px-4 py-3 font-medium text-stone-700">Email</th>
              <th className="px-4 py-3 font-medium text-stone-700">Role</th>
              <th className="px-4 py-3 font-medium text-stone-700">
                Locations
              </th>
              <th className="px-4 py-3 font-medium text-stone-700"></th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => {
              const assignedIds = managerLocations
                .filter((ml) => ml.manager_id === profile.id)
                .map((ml) => ml.location_id);
              const assignedNames = locations
                .filter((loc) => assignedIds.includes(loc.id))
                .map((loc) => loc.name);

              return (
                <tr key={profile.id} className="border-b border-stone-100">
                  <td className="px-4 py-3 font-medium text-stone-900">
                    {profile.full_name || "—"}
                  </td>
                  <td className="px-4 py-3 text-stone-600">
                    {profile.email}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                        profile.role === "admin"
                          ? "bg-brand/10 text-brand-dark"
                          : profile.role === "manager"
                            ? "bg-blue-100 text-blue-700"
                            : "bg-stone-100 text-stone-600"
                      }`}
                    >
                      {ROLE_LABEL[profile.role]}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {profile.role === "manager" ? (
                      <details>
                        <summary className="cursor-pointer select-none text-stone-700 hover:underline">
                          {assignedNames.length > 0
                            ? assignedNames.join(", ")
                            : "Not assigned"}
                        </summary>
                        <div className="mt-2 flex w-56 flex-col gap-1 rounded-md border border-stone-300 bg-white p-2">
                          {locations.length === 0 && (
                            <p className="p-1 text-xs text-stone-500">
                              No locations exist yet.
                            </p>
                          )}
                          {locations.map((loc) => (
                            <label
                              key={loc.id}
                              className="flex items-center gap-2 rounded px-2 py-1 text-sm text-stone-800 hover:bg-stone-50"
                            >
                              <input
                                type="checkbox"
                                checked={assignedIds.includes(loc.id)}
                                onChange={() =>
                                  toggleLocation(profile.id, loc.id)
                                }
                                disabled={updatingId === profile.id}
                                className="text-brand focus:ring-brand"
                              />
                              {loc.name}
                            </label>
                          ))}
                        </div>
                      </details>
                    ) : (
                      <span className="text-stone-400">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3">
                    {profile.role === "hire" && (
                      <button
                        onClick={() => setRole(profile.id, "manager")}
                        disabled={updatingId === profile.id}
                        className="text-xs font-medium text-brand-dark hover:underline disabled:opacity-60"
                      >
                        Make manager
                      </button>
                    )}
                    {profile.role === "manager" && (
                      <button
                        onClick={() => setRole(profile.id, "hire")}
                        disabled={updatingId === profile.id}
                        className="text-xs font-medium text-stone-500 hover:underline disabled:opacity-60"
                      >
                        Make employee
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
