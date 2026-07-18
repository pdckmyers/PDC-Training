"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Department, Location } from "@/lib/types";

export default function LocationsManager({
  initialLocations,
  initialDepartments,
}: {
  initialLocations: Location[];
  initialDepartments: Department[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [locations, setLocations] = useState(initialLocations);
  const [departments, setDepartments] = useState(initialDepartments);
  const [newLocationName, setNewLocationName] = useState("");
  const [newDeptNameByLocation, setNewDeptNameByLocation] = useState<
    Record<string, string>
  >({});
  const [error, setError] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  async function addLocation(e: React.FormEvent) {
    e.preventDefault();
    const name = newLocationName.trim();
    if (!name) return;

    const { data, error } = await supabase
      .from("locations")
      .insert({ name })
      .select()
      .single<Location>();

    if (error) {
      setError(error.message);
      return;
    }

    setLocations((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setNewLocationName("");
    router.refresh();
  }

  async function addDepartment(locationId: string, e: React.FormEvent) {
    e.preventDefault();
    const name = (newDeptNameByLocation[locationId] ?? "").trim();
    if (!name) return;

    const { data, error } = await supabase
      .from("departments")
      .insert({ name, location_id: locationId })
      .select()
      .single<Department>();

    if (error) {
      setError(error.message);
      return;
    }

    setDepartments((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    setNewDeptNameByLocation((prev) => ({ ...prev, [locationId]: "" }));
    router.refresh();
  }

  async function deleteLocation(id: string) {
    if (!confirm("Delete this location and all its departments? Modules under those departments become general (visible to everyone) instead of being deleted.")) return;

    const { error } = await supabase.from("locations").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }

    setLocations((prev) => prev.filter((l) => l.id !== id));
    setDepartments((prev) => prev.filter((d) => d.location_id !== id));
    router.refresh();
  }

  async function deleteDepartment(id: string) {
    if (!confirm("Delete this department? Its modules become general (visible to everyone) instead of being deleted.")) return;

    const { error } = await supabase.from("departments").delete().eq("id", id);
    if (error) {
      setError(error.message);
      return;
    }

    setDepartments((prev) => prev.filter((d) => d.id !== id));
    router.refresh();
  }

  function copyInviteLink(departmentId: string) {
    const url = `${window.location.origin}/join/${departmentId}`;
    navigator.clipboard.writeText(url).then(() => {
      setCopiedId(departmentId);
      setTimeout(() => setCopiedId(null), 1500);
    });
  }

  return (
    <div className="flex flex-col gap-6">
      {error && <p className="text-sm text-red-600">{error}</p>}

      <form onSubmit={addLocation} className="flex items-end gap-2">
        <label className="flex flex-1 flex-col gap-1 text-sm text-stone-700">
          New location
          <input
            value={newLocationName}
            onChange={(e) => setNewLocationName(e.target.value)}
            placeholder="e.g. Wren & Wolf"
            className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </label>
        <button
          type="submit"
          className="rounded-md bg-brand px-4 py-2 text-sm font-medium text-white hover:bg-brand-dark"
        >
          Add location
        </button>
      </form>

      {locations.length === 0 && (
        <p className="rounded-lg border border-dashed border-stone-300 p-6 text-stone-500">
          No locations yet. Add your first one above.
        </p>
      )}

      <div className="flex flex-col gap-4">
        {locations.map((location) => {
          const deptsForLocation = departments.filter(
            (d) => d.location_id === location.id
          );

          return (
            <div
              key={location.id}
              className="rounded-lg border border-stone-200 bg-white p-5"
            >
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-semibold text-stone-900">{location.name}</h2>
                <button
                  onClick={() => deleteLocation(location.id)}
                  className="text-sm text-red-600 hover:underline"
                >
                  Delete location
                </button>
              </div>

              <ul className="mb-4 flex flex-col gap-2">
                {deptsForLocation.map((dept) => (
                  <li
                    key={dept.id}
                    className="flex items-center justify-between rounded-md bg-stone-50 px-3 py-2"
                  >
                    <span className="text-sm text-stone-800">{dept.name}</span>
                    <div className="flex items-center gap-3">
                      <Link
                        href={`/admin/departments/${dept.id}`}
                        className="text-xs font-medium text-brand-dark hover:underline"
                      >
                        Manage days
                      </Link>
                      <button
                        onClick={() => copyInviteLink(dept.id)}
                        className="text-xs font-medium text-brand-dark hover:underline"
                      >
                        {copiedId === dept.id ? "Copied!" : "Copy invite link"}
                      </button>
                      <button
                        onClick={() => deleteDepartment(dept.id)}
                        className="text-xs text-stone-400 hover:text-red-600"
                      >
                        remove
                      </button>
                    </div>
                  </li>
                ))}
                {deptsForLocation.length === 0 && (
                  <li className="text-sm text-stone-500">
                    No departments yet.
                  </li>
                )}
              </ul>

              <form
                onSubmit={(e) => addDepartment(location.id, e)}
                className="flex items-end gap-2"
              >
                <label className="flex flex-1 flex-col gap-1 text-xs text-stone-600">
                  New department
                  <input
                    value={newDeptNameByLocation[location.id] ?? ""}
                    onChange={(e) =>
                      setNewDeptNameByLocation((prev) => ({
                        ...prev,
                        [location.id]: e.target.value,
                      }))
                    }
                    placeholder="e.g. Server"
                    className="rounded-md border border-stone-300 px-3 py-1.5 text-sm text-stone-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                  />
                </label>
                <button
                  type="submit"
                  className="rounded-md border border-brand px-3 py-1.5 text-sm font-medium text-brand-dark hover:bg-brand/10"
                >
                  Add department
                </button>
              </form>
            </div>
          );
        })}
      </div>
    </div>
  );
}
