import { createClient } from "@/lib/supabase/server";
import type { Department, Location } from "@/lib/types";
import SignupForm from "@/components/SignupForm";

export default async function SignupPage() {
  const supabase = await createClient();

  const [{ data: locations }, { data: departments }] = await Promise.all([
    supabase
      .from("locations")
      .select("*")
      .order("name", { ascending: true })
      .returns<Location[]>(),
    supabase
      .from("departments")
      .select("*")
      .order("name", { ascending: true })
      .returns<Department[]>(),
  ]);

  return (
    <div className="mx-auto max-w-sm">
      <h1 className="mb-6 text-2xl font-semibold text-stone-900">
        Create an account
      </h1>
      <SignupForm
        locations={locations ?? []}
        departments={departments ?? []}
      />
    </div>
  );
}
