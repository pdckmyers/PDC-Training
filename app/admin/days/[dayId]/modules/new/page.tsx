import { notFound } from "next/navigation";
import { getAllDayOptions, getDayBreadcrumb } from "@/lib/days";
import ModuleForm from "@/components/ModuleForm";

export default async function NewModuleInDayPage({
  params,
}: {
  params: Promise<{ dayId: string }>;
}) {
  const { dayId } = await params;
  const [breadcrumb, dayOptions] = await Promise.all([
    getDayBreadcrumb(dayId),
    getAllDayOptions(),
  ]);

  if (!breadcrumb) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-stone-900">
        New module
      </h1>
      <ModuleForm
        dayOptions={dayOptions}
        initialDayIds={[dayId]}
        backHref={`/admin/days/${dayId}`}
      />
    </div>
  );
}
