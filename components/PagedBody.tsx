"use client";

import { useState } from "react";
import ModuleCompletion from "./ModuleCompletion";
import type { Completion, QuizQuestion } from "@/lib/types";

const PROSE_CLASSES =
  "font-serif text-lg leading-relaxed text-brand-ink [&_div]:mb-4 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5 [&_li]:mt-1 [&_img]:my-4 [&_img]:h-auto [&_img]:max-w-full [&_img]:rounded-lg [&_img]:border [&_img]:border-stone-200 [&_p]:mb-4";

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

  if (pages.length === 0) {
    return (
      <ModuleCompletion
        moduleId={moduleId}
        quiz={quiz}
        existingCompletion={existingCompletion}
      />
    );
  }

  return (
    <div>
      {onQuiz ? (
        <ModuleCompletion
          moduleId={moduleId}
          quiz={quiz}
          existingCompletion={existingCompletion}
        />
      ) : (
        <div
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
          {onQuiz ? "Quick check" : `Page ${index + 1} of ${pages.length + 1}`}
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
  );
}
