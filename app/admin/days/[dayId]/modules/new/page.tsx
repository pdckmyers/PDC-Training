import { notFound } from "next/navigation";
import { getDayBreadcrumb } from "@/lib/days";
import ModuleForm from "@/components/ModuleForm";

export default async function NewModuleInDayPage({
  params,
}: {
  params: Promise<{ dayId: string }>;
}) {
  const { dayId } = await params;
  const breadcrumb = await getDayBreadcrumb(dayId);

  if (!breadcrumb) notFound();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-stone-900">
        New module
      </h1>
      <ModuleForm
        dayId={dayId}
        breadcrumb={breadcrumb}
        backHref={`/admin/days/${dayId}`}
      />
    </div>
  );
}
