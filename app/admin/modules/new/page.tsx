import { getAllDayOptions } from "@/lib/days";
import ModuleForm from "@/components/ModuleForm";

export default async function NewModulePage() {
  const dayOptions = await getAllDayOptions();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-stone-900">
        New module
      </h1>
      <ModuleForm dayOptions={dayOptions} />
    </div>
  );
}
