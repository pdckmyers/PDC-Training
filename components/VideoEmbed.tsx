import { detectVideoKind, toYoutubeEmbed, toVimeoEmbed } from "@/lib/video";

export default function VideoEmbed({ url }: { url: string }) {
  const kind = detectVideoKind(url);

  if (kind === "youtube") {
    const embedUrl = toYoutubeEmbed(url);
    if (!embedUrl) return null;
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-stone-200">
        <iframe
          src={embedUrl}
          className="h-full w-full"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          title="Training video"
        />
      </div>
    );
  }

  if (kind === "vimeo") {
    const embedUrl = toVimeoEmbed(url);
    if (!embedUrl) return null;
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-stone-200">
        <iframe
          src={embedUrl}
          className="h-full w-full"
          allow="autoplay; fullscreen; picture-in-picture"
          allowFullScreen
          title="Training video"
        />
      </div>
    );
  }

  if (kind === "file") {
    return (
      <video
        controls
        className="w-full rounded-lg border border-stone-200"
        src={url}
      />
    );
  }

  return (
    <a href={url} className="text-brand-dark underline" target="_blank" rel="noreferrer">
      Watch video
    </a>
  );
}
