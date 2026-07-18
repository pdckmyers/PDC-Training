import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Completion, Module, Profile } from "@/lib/types";
import { splitModuleBodyIntoPages } from "@/lib/sanitize";
import VideoEmbed from "@/components/VideoEmbed";
import ModuleCompletion from "@/components/ModuleCompletion";
import PagedBody from "@/components/PagedBody";

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

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user!.id)
    .single<Profile>();

  const canPreviewDrafts = profile?.role === "admin";

  if (!mod || (!mod.published && !canPreviewDrafts)) notFound();

  const { data: completion } = await supabase
    .from("completions")
    .select("*")
    .eq("user_id", user!.id)
    .eq("module_id", mod.id)
    .maybeSingle<Completion>();

  return (
    <div className="flex flex-col gap-6">
      {!mod.published && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800">
          Draft preview — employees can&rsquo;t see this until you publish it.
        </p>
      )}

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

      {mod.body && <PagedBody pages={splitModuleBodyIntoPages(mod.body)} />}

      <ModuleCompletion
        moduleId={mod.id}
        quiz={mod.quiz}
        existingCompletion={completion ?? null}
      />
    </div>
  );
}
