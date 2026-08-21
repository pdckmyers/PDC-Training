import { notFound } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import type { Module } from "@/lib/types";
import { getAllDayOptions, getModuleDayIds } from "@/lib/days";
import { getAllLocationOptions, getModuleLocationIds } from "@/lib/locations";
import ModuleForm from "@/components/ModuleForm";

export default async function EditModulePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: mod } = await supabase
    .from("modules")
    .select("*")
    .eq("id", id)
    .single<Module>();

  if (!mod) notFound();

  const [dayOptions, initialDayIds, locationOptions, initialLocationIds] =
    await Promise.all([
      getAllDayOptions(),
      getModuleDayIds(mod.id),
      getAllLocationOptions(),
      getModuleLocationIds(mod.id),
    ]);

  return (
    <div>
      <Link
        href="/admin/modules"
        className="mb-2 inline-block text-sm text-brand-dark hover:underline"
      >
        ← Manage modules
      </Link>
      <h1 className="mb-6 text-2xl font-semibold text-stone-900">
        Edit module
      </h1>
      <ModuleForm
        existing={mod}
        dayOptions={dayOptions}
        initialDayIds={initialDayIds}
        locationOptions={locationOptions}
        initialLocationIds={initialLocationIds}
      />
    </div>
  );
}
