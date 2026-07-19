import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Module } from "@/lib/types";
import { getAllDayOptions, getModuleDayIds } from "@/lib/days";
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

  const [dayOptions, initialDayIds] = await Promise.all([
    getAllDayOptions(),
    getModuleDayIds(mod.id),
  ]);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-stone-900">
        Edit module
      </h1>
      <ModuleForm existing={mod} dayOptions={dayOptions} initialDayIds={initialDayIds} />
    </div>
  );
}
