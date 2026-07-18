import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Completion, Module } from "@/lib/types";
import VideoEmbed from "@/components/VideoEmbed";
import ModuleCompletion from "@/components/ModuleCompletion";

export default async function ModuleDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: mod } = await supabase
    .from("modules")
    .select("*")
    .eq("id", id)
    .single<Module>();

  if (!mod || !mod.published) notFound();

  const { data: completion } = await supabase
    .from("completions")
    .select("*")
    .eq("user_id", user!.id)
    .eq("module_id", mod.id)
    .maybeSingle<Completion>();

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold text-stone-900">{mod.title}</h1>
        {mod.description && (
          <p className="mt-1 text-stone-600">{mod.description}</p>
        )}
      </div>

      {mod.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mod.image_url}
          alt=""
          className="w-full rounded-lg border border-stone-200"
        />
      )}

      {mod.video_url && <VideoEmbed url={mod.video_url} />}

      {mod.body && (
        <div className="whitespace-pre-wrap leading-relaxed text-stone-800">
          {mod.body}
        </div>
      )}

      <ModuleCompletion
        moduleId={mod.id}
        quiz={mod.quiz}
        existingCompletion={completion ?? null}
      />
    </div>
  );
}
