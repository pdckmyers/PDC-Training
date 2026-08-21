export type VideoKind = "youtube" | "vimeo" | "file" | null;

export function detectVideoKind(url: string): VideoKind {
  if (!url) return null;
  if (/youtube\.com|youtu\.be/.test(url)) return "youtube";
  if (/vimeo\.com/.test(url)) return "vimeo";
  // A Dropbox share link is a video file too, just without a bare file
  // extension at the end of the URL (it's a `?rlkey=...` query string
  // instead) -- caught separately below so it doesn't need one.
  if (/dropbox(usercontent)?\.com/i.test(url)) return "file";
  // Match the extension even when it's followed by a query string or
  // fragment (e.g. Dropbox/Google Drive/S3 share links), not only when
  // it's the very last thing in the URL.
  if (/\.(mp4|webm|ogg)(?:[?#]|$)/i.test(url)) return "file";
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

/**
 * A Dropbox share link (dropbox.com/scl/... or .../s/...) serves an HTML
 * preview page by default -- not something a <video> tag's src can play.
 * `dl=1`/`raw=1` makes Dropbox serve the actual file bytes instead. Admins
 * copying the "Copy link" URL from Dropbox won't have that param (or will
 * have dl=0, the preview-page default), so normalize it here rather than
 * asking them to hand-edit the link.
 */
export function toDirectFileUrl(url: string): string {
  if (!/dropbox(usercontent)?\.com/i.test(url)) return url;
  if (/[?&]raw=1(?:&|$)/.test(url)) return url;
  const withoutDlFlag = url.replace(/([?&])dl=\d/, "$1raw=1");
  if (withoutDlFlag !== url) return withoutDlFlag;
  return `${url}${url.includes("?") ? "&" : "?"}raw=1`;
}
