"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Department, Location } from "@/lib/types";

export default function SignupForm({
  locations,
  departments,
}: {
  locations: Location[];
  departments: Department[];
}) {
  const supabase = createClient();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [locationId, setLocationId] = useState("");
  const [departmentId, setDepartmentId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const departmentsForLocation = useMemo(
    () => departments.filter((d) => d.location_id === locationId),
    [departments, locationId]
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          full_name: fullName,
          department_id: departmentId || undefined,
        },
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <div>
        <h2 className="mb-2 text-lg font-semibold text-stone-900">
          Check your email
        </h2>
        <p className="text-stone-600">
          We sent a confirmation link to <strong>{email}</strong>. Click it,
          then come back and sign in.
        </p>
        <Link href="/login" className="mt-4 inline-block text-brand-dark underline">
          Go to sign in
        </Link>
      </div>
    );
  }

  return (
    <>
      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm text-stone-700">
          Full name
          <input
            type="text"
            required
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-stone-700">
          Email
          <input
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm text-stone-700">
          Password
          <input
            type="password"
            required
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="rounded-md border border-stone-300 px-3 py-2 text-stone-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
          />
        </label>

        {locations.length > 0 && (
          <>
            <label className="flex flex-col gap-1 text-sm text-stone-700">
              Location
              <select
                required
                value={locationId}
                onChange={(e) => {
                  setLocationId(e.target.value);
                  setDepartmentId("");
                }}
                className="rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
              >
                <option value="" disabled>
                  Select your location
                </option>
                {locations.map((loc) => (
                  <option key={loc.id} value={loc.id}>
                    {loc.name}
                  </option>
                ))}
              </select>
            </label>

            {locationId && (
              <label className="flex flex-col gap-1 text-sm text-stone-700">
                Department
                <select
                  required
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  className="rounded-md border border-stone-300 bg-white px-3 py-2 text-stone-900 focus:border-brand focus:outline-none focus:ring-1 focus:ring-brand"
                >
                  <option value="" disabled>
                    Select your department
                  </option>
                  {departmentsForLocation.map((dept) => (
                    <option key={dept.id} value={dept.id}>
                      {dept.name}
                    </option>
                  ))}
                </select>
                {departmentsForLocation.length === 0 && (
                  <span className="text-xs text-stone-500">
                    No departments set up at this location yet — ask your
                    admin.
                  </span>
                )}
              </label>
            )}
          </>
        )}

        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {loading ? "Creating account..." : "Create account"}
        </button>
      </form>
      <p className="mt-4 text-sm text-stone-600">
        Already have an account?{" "}
        <Link href="/login" className="text-brand-dark underline">
          Sign in
        </Link>
      </p>
    </>
  );
}
