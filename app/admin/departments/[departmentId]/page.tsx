import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Day, Department, Location } from "@/lib/types";
import DaysManager from "@/components/DaysManager";

export default async function DepartmentPage({
  params,
}: {
  params: Promise<{ departmentId: string }>;
}) {
  const { departmentId } = await params;
  const supabase = await createClient();

  const { data: department } = await supabase
    .from("departments")
    .select("*")
    .eq("id", departmentId)
    .single<Department>();

  if (!department) notFound();

  const [{ data: location }, { data: days }] = await Promise.all([
    supabase
      .from("locations")
      .select("*")
      .eq("id", department.location_id)
      .single<Location>(),
    supabase
      .from("days")
      .select("*")
      .eq("department_id", departmentId)
      .order("sort_order", { ascending: true })
      .returns<Day[]>(),
  ]);

  return (
    <div>
      <Link
        href="/admin/locations"
        className="mb-2 inline-block text-sm text-brand-dark hover:underline"
      >
        ← Locations
      </Link>
      <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-brand-dark">
        {location?.name}
      </p>
      <h1 className="mb-1 text-2xl font-semibold text-stone-900">
        {department.name}
      </h1>
      <p className="mb-8 text-stone-600">
        Add a day folder, then go into it to add that day&rsquo;s modules.
      </p>
      <DaysManager departmentId={department.id} initialDays={days ?? []} />
    </div>
  );
}
