"use client";

import { useEffect, useLayoutEffect, useRef, useState } from "react";
import ModuleCompletion from "./ModuleCompletion";
import type { Completion, QuizQuestion } from "@/lib/types";

const PROSE_CLASSES =
  "font-serif text-lg leading-relaxed text-brand-ink overflow-x-auto [&_div]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1 [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-stone-200 [&_p]:mb-4 [&_table]:my-4 [&_table]:w-[800px] [&_table]:table-fixed [&_table]:border-collapse [&_table]:overflow-hidden [&_table]:rounded-lg [&_table]:border [&_table]:border-stone-300 [&_table]:break-inside-avoid [&_th]:border [&_th]:border-stone-300 [&_th]:bg-brand [&_th]:px-4 [&_th]:py-2 [&_th]:text-left [&_th]:font-semibold [&_th]:text-white [&_td]:border [&_td]:border-stone-300 [&_td]:px-4 [&_td]:py-2 [&_td]:align-top [&_td]:break-words [&_td[rowspan]]:align-middle" +
  // A printed table's height is dominated by the screen-sized photo and
  // roomy padding/type -- neither of which a reader needs on paper. That
  // height is also why two rarely fit on one printed sheet today: once the
  // first table is placed, `break-inside: avoid` (above) bumps the second
  // to a fresh page rather than splitting it if it doesn't fit in what's
  // left, even when a fresh page would've had plenty of room. Shrinking
  // each table's footprint for print is what actually gets two per page,
  // not just letting them flow (that part was already true).
  //
  // Print gets its own table width instead of the 800px screen design
  // width: on screen, JS (scaleTablesToFit below) shrinks an oversized
  // table to fit -- but that JS never touches this hidden print-only
  // markup, so left at 800px a table just overflows the printed page.
  // `w-full` alone isn't enough, though: some tables were authored with a
  // fixed pixel width directly on a <col> or <img> (e.g. `width: 300px`),
  // which under table-fixed layout is a hard floor the table must honor
  // no matter how narrow its own width is asked to be. `!w-auto` on both
  // -- beating that inline style the same way the table's own width beats
  // the screen design width -- lets the table actually shrink to the
  // page. An image's own width has to reset the same way, and *before*
  // the max-height below -- height:auto with a fixed width means capping
  // height alone (without freeing width to shrink with it) squashes the
  // image instead of scaling it.
  " print:text-xs print:leading-snug print:[&_table]:my-1 print:[&_table]:w-full print:[&_col]:!w-auto print:[&_th]:px-2 print:[&_th]:py-0.5 print:[&_td]:px-2 print:[&_td]:py-0.5 print:[&_img]:my-0.5 print:[&_img]:!w-auto print:[&_img]:max-h-[120px]";

// Tables are authored at a fixed "designed" width (matching PROSE_CLASSES'
// [&_table]:w-[800px] above) so their columns/image/text always keep the
// same proportions as on desktop. `zoom` would be the simple way to shrink
// that down to fit a phone, but it's unreliable on iOS Safari in practice
// (confirmed: it silently did nothing on a real device). `transform: scale`
// is universally supported, but it doesn't affect layout -- the element
// still reserves its full, unscaled box -- so each table is wrapped in a
// div whose height we set explicitly to the scaled-down height, collapsing
// the leftover space the transform would otherwise leave behind.
//
// 800px (not the original 640px) so the 20%-wide label column a table
// gets by default has enough room for a longer label like "Palate/
// Flavor:" to stay on one line instead of breaking mid-word -- that
// happened on a real table and 640px only left about 96px for the label
// text, well under the ~110px "Palate/Flavor:" needs.
const TABLE_DESIGN_WIDTH = 800;

function scaleTablesToFit(container: HTMLElement) {
  const tables = Array.from(container.querySelectorAll("table"));
  for (const table of tables) {
    let wrapper = table.parentElement;
    if (!(wrapper instanceof HTMLElement) || !wrapper.dataset.tableScale) {
      wrapper = document.createElement("div");
      wrapper.dataset.tableScale = "true";
      wrapper.style.overflow = "hidden";
      table.replaceWith(wrapper);
      wrapper.appendChild(table);
    }
    table.style.transformOrigin = "top left";
    const scale = Math.min(1, wrapper.clientWidth / TABLE_DESIGN_WIDTH);
    table.style.transform = `scale(${scale})`;
    wrapper.style.height = `${table.offsetHeight * scale}px`;
  }
}

// On screen, only the current page is ever in the DOM (that's how the
// Next/Previous pagination works), so there's nothing for print CSS to
// reveal for the other pages. This renders every page so a printed copy
// is the complete module, not just whatever page was on screen. The quiz
// itself doesn't print -- it's a "did you retain this" check for the
// employee taking the module on screen, not reference material someone
// printing a recipe/wine card wants a paper copy of.
//
// A page break in the editor just paces the on-screen reading experience
// (e.g. "start the next recipe on a fresh screen") -- it isn't a signal
// that each one deserves its own printed sheet, and forcing that wasted
// paper on modules with lots of short pages. Pages flow together with
// just a divider between them; the browser only starts an actual new
// printed page when content naturally runs out of room.
function PrintableModule({ pages }: { pages: string[] }) {
  if (pages.length === 0) return null;

  return (
    <div className="hidden print:block">
      {pages.map((page, i) => (
        <div key={i}>
          {i > 0 && <hr className="my-2 border-stone-300" />}
          <div
            className={PROSE_CLASSES}
            dangerouslySetInnerHTML={{ __html: page }}
          />
        </div>
      ))}
    </div>
  );
}

export default function PagedBody({
  pages,
  moduleId,
  quiz,
  existingCompletion,
}: {
  pages: string[];
  moduleId: string;
  quiz: QuizQuestion[];
  existingCompletion: Completion | null;
}) {
  const [index, setIndex] = useState(0);
  const onQuiz = index === pages.length;
  const isFirstRender = useRef(true);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Skip on mount -- only scroll when Next/Previous actually changes
    // the page, not on the page's initial load.
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [index]);

  useLayoutEffect(() => {
    const container = contentRef.current;
    if (!container) return;

    scaleTablesToFit(container);

    const handleResize = () => scaleTablesToFit(container);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [index, pages]);

  if (pages.length === 0) {
    return (
      <>
        <PrintableModule pages={pages} />
        <div className="print:hidden">
          <ModuleCompletion
            moduleId={moduleId}
            quiz={quiz}
            existingCompletion={existingCompletion}
          />
        </div>
      </>
    );
  }

  return (
    <div>
      <PrintableModule pages={pages} />

      <div className="print:hidden">
        {onQuiz ? (
          <ModuleCompletion
            moduleId={moduleId}
            quiz={quiz}
            existingCompletion={existingCompletion}
          />
        ) : (
          <div
            ref={contentRef}
            className={PROSE_CLASSES}
            dangerouslySetInnerHTML={{ __html: pages[index] }}
          />
        )}
        <div className="mt-6 flex items-center justify-between border-t border-stone-200 pt-4">
          <button
            type="button"
            onClick={() => setIndex((i) => Math.max(0, i - 1))}
            disabled={index === 0}
            className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-40"
          >
            ← Previous
          </button>
          <span className="text-sm font-medium text-stone-500">
            {onQuiz
              ? "Quick check"
              : `Page ${index + 1} of ${pages.length + 1}`}
          </span>
          {onQuiz ? (
            <span className="w-[86px]" aria-hidden="true" />
          ) : (
            <button
              type="button"
              onClick={() => setIndex((i) => Math.min(pages.length, i + 1))}
              className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100"
            >
              Next →
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
