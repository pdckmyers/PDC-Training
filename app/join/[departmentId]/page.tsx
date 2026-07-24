import { notFound } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import type { Department, Location } from "@/lib/types";
import JoinForm from "@/components/JoinForm";

export default async function JoinPage({
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

  const { data: location } = await supabase
    .from("locations")
    .select("*")
    .eq("id", department.location_id)
    .single<Location>();

  return (
    <div className="mx-auto max-w-sm">
      <div className="mb-10 flex flex-col items-center text-center">
        <Image
          src="/logo.png"
          alt="Pretty Decent Concepts"
          width={366}
          height={79}
          priority
          className="h-auto w-64"
        />
        <p className="mt-6 font-serif text-xl italic leading-snug text-brand-ink">
          &ldquo;Together, we will succeed in creating environments that
          define a community.&rdquo;
        </p>
      </div>

      <p className="mb-1 text-sm font-semibold uppercase tracking-wide text-brand-dark">
        {location?.name ?? "PDC Training"}
      </p>
      <h1 className="mb-6 text-2xl font-semibold text-stone-900">
        Join as {department.name}
      </h1>
      <JoinForm departmentId={department.id} />
    </div>
  );
}
