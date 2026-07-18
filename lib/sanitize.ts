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

/**
 * Admins can insert a page break (an <hr>) in the editor to split a long
 * module into multiple screens. Split on those markers -- consuming
 * them, not rendering them -- and sanitize each resulting page.
 */
const LEADING_OR_TRAILING_BR = /^(\s|<br\s*\/?>)+|(\s|<br\s*\/?>)+$/gi;

export function splitModuleBodyIntoPages(body: string): string[] {
  if (!body) return [];

  return toEditableHtml(body)
    .split(/<hr[^>]*>/i)
    .map((page) => sanitizeModuleBody(page).replace(LEADING_OR_TRAILING_BR, "").trim())
    .filter((page) => page.length > 0);
}
