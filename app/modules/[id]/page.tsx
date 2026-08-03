import { notFound } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import type { Completion, Module, Profile } from "@/lib/types";
import { splitModuleBodyIntoPages } from "@/lib/sanitize";
import VideoEmbed from "@/components/VideoEmbed";
import PagedBody from "@/components/PagedBody";
import PrintButton from "@/components/PrintButton";

export default async function ModuleDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ from?: string }>;
}) {
  const { id } = await params;
  const { from } = await searchParams;
  // Only ever send someone back into the training area itself -- `from` is
  // attacker-controlled via the URL, so an unchecked value here would be an
  // open redirect.
  const backHref = from && from.startsWith("/modules") ? from : "/modules";
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
        <p className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm font-medium text-amber-800 print:hidden">
          Draft preview — employees can&rsquo;t see this until you publish it.
        </p>
      )}

      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-stone-900">
            {mod.title}
          </h1>
          {mod.description && (
            <p className="mt-1 text-stone-600">{mod.description}</p>
          )}
        </div>
        <PrintButton />
      </div>

      {mod.image_url && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={mod.image_url}
          alt=""
          className="h-auto max-w-full rounded-lg border border-stone-200"
        />
      )}

      {mod.video_url && (
        <div className="print:hidden">
          <VideoEmbed url={mod.video_url} />
        </div>
      )}

      <PagedBody
        pages={mod.body ? splitModuleBodyIntoPages(mod.body) : []}
        moduleId={mod.id}
        quiz={mod.quiz}
        existingCompletion={completion ?? null}
        backHref={backHref}
      />
    </div>
  );
}
