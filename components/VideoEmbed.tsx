import { detectVideoKind, toYoutubeEmbed, toVimeoEmbed, withAutoplay } from "@/lib/video";

export default function VideoEmbed({
  url,
  autoPlay = false,
}: {
  url: string;
  /** Starts the video immediately instead of waiting for a click. */
  autoPlay?: boolean;
}) {
  const kind = detectVideoKind(url);

  if (kind === "youtube") {
    const embedUrl = toYoutubeEmbed(url);
    if (!embedUrl) return null;
    return (
      <div className="aspect-video w-full overflow-hidden rounded-lg border border-stone-200">
        <iframe
          src={autoPlay ? withAutoplay(embedUrl) : embedUrl}
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
          src={autoPlay ? withAutoplay(embedUrl) : embedUrl}
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
        autoPlay={autoPlay}
        // Browsers block autoplay-with-sound on a plain <video> element
        // outright (unlike an iframe granted allow="autoplay") -- muted
        // is what makes the autoplay actually happen instead of silently
        // staying paused. The viewer can unmute from the controls.
        muted={autoPlay}
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
