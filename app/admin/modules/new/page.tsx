import { getDepartmentOptions } from "@/lib/departments";
import ModuleForm from "@/components/ModuleForm";

export default async function NewModulePage() {
  const departments = await getDepartmentOptions();

  return (
    <div>
      <h1 className="mb-6 text-2xl font-semibold text-stone-900">
        New module
      </h1>
      <ModuleForm departments={departments} />
    </div>
  );
}
