"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Profile, Role } from "@/lib/types";

const ROLE_LABEL: Record<Role, string> = {
  hire: "Employee",
  manager: "Manager",
  admin: "Admin",
};

export default function TeamManager({
  initialProfiles,
}: {
  initialProfiles: Profile[];
}) {
  const router = useRouter();
  const supabase = createClient();

  const [profiles, setProfiles] = useState(initialProfiles);
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
              <th className="px-4 py-3 font-medium text-stone-700"></th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((profile) => (
              <tr key={profile.id} className="border-b border-stone-100">
                <td className="px-4 py-3 font-medium text-stone-900">
                  {profile.full_name || "—"}
                </td>
                <td className="px-4 py-3 text-stone-600">{profile.email}</td>
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
