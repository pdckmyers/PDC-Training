export type VideoKind = "youtube" | "vimeo" | "file" | null;

export function detectVideoKind(url: string): VideoKind {
  if (!url) return null;
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/vimeo\.com/.test(url)) return "vimeo";
  if (/\.(mp4|webm|ogg)$/i.test(url)) return "file";
  return null;
}

export function toYoutubeEmbed(url: string): string | null {
  const watchMatch = url.match(/[?&]v=([^&]+)/);
  if (watchMatch) return `https://www.youtube.com/embed/${watchMatch[1]}`;
  const shortMatch = url.match(/youtu\.be\/([^?&]+)/);
  if (shortMatch) return `https://www.youtube.com/embed/${shortMatch[1]}`;
  const embedMatch = url.match(/youtube\.com\/embed\//);
  if (embedMatch) return url;
  return null;
}

export function toVimeoEmbed(url: string): string | null {
  const match = url.match(/vimeo\.com\/(\d+)/);
  if (match) return `https://player.vimeo.com/video/${match[1]}`;
  return null;
}

/**
 * Adds autoplay=1 to an embed URL, respecting whatever query string (if
 * any) is already there -- e.g. an admin who pasted a youtube.com/embed/
 * URL that already has its own params.
 */
export function withAutoplay(embedUrl: string): string {
  return `${embedUrl}${embedUrl.includes("?") ? "&" : "?"}autoplay=1`;
}
