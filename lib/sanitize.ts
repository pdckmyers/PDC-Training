import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = ["b", "strong", "i", "em", "u", "ul", "ol", "li", "br", "p", "div"];

export function sanitizeModuleBody(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {},
  });
}

/**
 * Existing modules stored body as plain text rendered with
 * whitespace-pre-wrap. Convert that into safe HTML (escaped, with line
 * breaks) so it still displays correctly in the new rich text editor and
 * on the module page. HTML bodies (already rich text) pass through.
 */
export function toEditableHtml(body: string): string {
  if (!body) return "";
  if (/<[a-z][\s\S]*>/i.test(body)) return body;

  return body
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/\n/g, "<br>");
}
