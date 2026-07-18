"use client";

import { useState } from "react";

const PROSE_CLASSES =
  "font-serif text-lg leading-relaxed text-brand-ink [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1";

export default function PagedBody({ pages }: { pages: string[] }) {
  const [index, setIndex] = useState(0);

  if (pages.length === 0) return null;

  if (pages.length === 1) {
    return (
      <div className={PROSE_CLASSES} dangerouslySetInnerHTML={{ __html: pages[0] }} />
    );
  }

  return (
    <div>
      <div
        className={PROSE_CLASSES}
        dangerouslySetInnerHTML={{ __html: pages[index] }}
      />
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
          Page {index + 1} of {pages.length}
        </span>
        <button
          type="button"
          onClick={() => setIndex((i) => Math.min(pages.length - 1, i + 1))}
          disabled={index === pages.length - 1}
          className="rounded-md border border-stone-300 px-3 py-1.5 text-sm font-medium text-stone-700 hover:bg-stone-100 disabled:opacity-40"
        >
          Next →
        </button>
      </div>
    </div>
  );
}
