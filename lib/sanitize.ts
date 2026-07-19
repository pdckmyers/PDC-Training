import sanitizeHtml from "sanitize-html";

const ALLOWED_TAGS = [
  "b",
  "strong",
  "i",
  "em",
  "u",
  "ul",
  "ol",
  "li",
  "br",
  "p",
  "div",
  "img",
];

export function sanitizeModuleBody(html: string): string {
  return sanitizeHtml(html, {
    allowedTags: ALLOWED_TAGS,
    allowedAttributes: {
      img: ["src", "alt"],
    },
    // Only allow https:// image sources -- blocks javascript:/data: URI
    // injection through a crafted src attribute.
    allowedSchemesByTag: {
      img: ["https"],
    },
    // Content pasted in from Word/Google Docs often carries heading tags.
    // Rather than silently dropping them (which also destroys the block
    // break they provided, running surrounding text together), downgrade
    // them to plain paragraphs -- keeps the separation, avoids a stray
    // oversized heading competing with the module's real title.
    transformTags: {
      h1: "p",
      h2: "p",
      h3: "p",
      h4: "p",
      h5: "p",
      h6: "p",
    },
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

/**
 * <br> is a void element -- browsers don't apply margins, height, or
 * generated content (::before/::after) to it, so it can't be styled into
 * a visible paragraph gap no matter what CSS is applied. Swap each one
 * for a real block box with an explicit height instead. Inline style is
 * intentional here: this HTML is generated at render time, not scanned
 * from source by Tailwind, so a Tailwind class name here would never
 * make it into the compiled CSS.
 *
 * A run of consecutive <br>s (e.g. a blank line between paragraphs in
 * legacy plain-text content) collapses to a single spacer -- otherwise a
 * blank line renders as a double-height gap instead of one paragraph
 * break.
 */
function replaceLineBreaksWithSpacers(html: string): string {
  return html.replace(
    /(?:<br\s*\/?>\s*)+/gi,
    '<div style="height:0.9em" aria-hidden="true"></div>'
  );
}

export function splitModuleBodyIntoPages(body: string): string[] {
  if (!body) return [];

  return toEditableHtml(body)
    .split(/<hr[^>]*>/i)
    .map((page) =>
      replaceLineBreaksWithSpacers(
        sanitizeModuleBody(page).replace(LEADING_OR_TRAILING_BR, "").trim()
      )
    )
    .filter((page) => page.length > 0);
}
