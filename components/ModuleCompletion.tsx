"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Completion, QuizQuestion } from "@/lib/types";

const PASS_THRESHOLD = 0.8;
const MAX_FAILED_ATTEMPTS = 2;

function isPassing(score: number, total: number) {
  return total === 0 ? true : score / total >= PASS_THRESHOLD;
}

export default function ModuleCompletion({
  moduleId,
  quiz,
  existingCompletion,
}: {
  moduleId: string;
  quiz: QuizQuestion[];
  existingCompletion: Completion | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [answers, setAnswers] = useState<(number | null)[]>(
    quiz.map(() => null)
  );
  const [submitting, setSubmitting] = useState(false);
  const [result, setResult] = useState<{ score: number; total: number } | null>(
    existingCompletion?.quiz_score != null && existingCompletion?.quiz_total != null
      ? { score: existingCompletion.quiz_score, total: existingCompletion.quiz_total }
      : null
  );
  const [error, setError] = useState<string | null>(null);

  const allAnswered = answers.every((a) => a !== null);

  const locked =
    existingCompletion != null &&
    existingCompletion.failed_attempts >= MAX_FAILED_ATTEMPTS &&
    existingCompletion.quiz_score != null &&
    existingCompletion.quiz_total != null &&
    !isPassing(existingCompletion.quiz_score, existingCompletion.quiz_total);

  async function saveCompletion(
    score: number | null,
    total: number | null,
    failedAttempts: number
  ) {
    setSubmitting(true);
    setError(null);

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const { error } = await supabase.from("completions").upsert(
      {
        user_id: user!.id,
        module_id: moduleId,
        quiz_score: score,
        quiz_total: total,
        failed_attempts: failedAttempts,
        completed_at: new Date().toISOString(),
      },
      { onConflict: "user_id,module_id" }
    );

    setSubmitting(false);

    if (error) {
      setError(error.message);
      return;
    }

    router.refresh();
  }

  async function handleQuizSubmit(e: React.FormEvent) {
    e.preventDefault();
    const score = quiz.reduce(
      (acc, q, i) => acc + (answers[i] === q.correct_index ? 1 : 0),
      0
    );
    const total = quiz.length;
    setResult({ score, total });

    const failedAttempts = isPassing(score, total)
      ? (existingCompletion?.failed_attempts ?? 0)
      : (existingCompletion?.failed_attempts ?? 0) + 1;

    await saveCompletion(score, total, failedAttempts);
  }

  if (quiz.length === 0) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-5">
        {existingCompletion ? (
          <p className="font-medium text-green-700">
            You&rsquo;ve completed this module.
          </p>
        ) : (
          <>
            <p className="mb-3 text-stone-700">
              No quiz on this one &mdash; mark it complete once you&rsquo;ve
              gone through the material.
            </p>
            <button
              onClick={() => saveCompletion(null, null, 0)}
              disabled={submitting}
              className="rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-dark disabled:opacity-60"
            >
              {submitting ? "Saving..." : "Mark as complete"}
            </button>
          </>
        )}
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </div>
    );
  }

  if (locked) {
    return (
      <div className="rounded-lg border border-stone-200 bg-white p-5">
        <h2 className="mb-2 text-lg font-semibold text-stone-900">
          Quick check
        </h2>
        <p className="mb-2 text-sm text-stone-700">
          You scored {existingCompletion!.quiz_score} /{" "}
          {existingCompletion!.quiz_total} on your last attempt.
        </p>
        <p className="rounded-md bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800">
          You&rsquo;ve reached the maximum number of attempts for this quiz.
          Please contact your manager to try again.
        </p>
      </div>
    );
  }

  const passedLastAttempt =
    result != null && isPassing(result.score, result.total);

  return (
    <div className="rounded-lg border border-stone-200 bg-white p-5">
      <h2 className="mb-4 text-lg font-semibold text-stone-900">
        Quick check
      </h2>

      {result && (
        <p
          className={`mb-4 rounded-md px-3 py-2 text-sm font-medium ${
            passedLastAttempt
              ? "bg-brand/10 text-brand-dark"
              : "bg-amber-50 text-amber-800"
          }`}
        >
          You scored {result.score} / {result.total}
          {!passedLastAttempt &&
            ` — you need at least ${Math.ceil(
              result.total * PASS_THRESHOLD
            )} / ${result.total} to pass. You have ${
              MAX_FAILED_ATTEMPTS - (existingCompletion?.failed_attempts ?? 0)
            } attempt${
              MAX_FAILED_ATTEMPTS - (existingCompletion?.failed_attempts ?? 0) === 1
                ? ""
                : "s"
            } left.`}
          {passedLastAttempt && existingCompletion
            ? " — you can retake it any time."
            : ""}
        </p>
      )}

      <form onSubmit={handleQuizSubmit} className="flex flex-col gap-6">
        {quiz.map((q, qi) => (
          <fieldset key={qi} className="flex flex-col gap-2">
            <legend className="font-medium text-stone-800">
              {qi + 1}. {q.question}
            </legend>
            {q.options.map((opt, oi) => (
              <label
                key={oi}
                className="flex items-center gap-2 text-sm text-stone-700"
              >
                <input
                  type="radio"
                  name={`q-${qi}`}
                  checked={answers[qi] === oi}
                  onChange={() =>
                    setAnswers((prev) => {
                      const next = [...prev];
                      next[qi] = oi;
                      return next;
                    })
                  }
                  className="text-brand focus:ring-brand"
                />
                {opt}
              </label>
            ))}
          </fieldset>
        ))}

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={!allAnswered || submitting}
          className="self-start rounded-md bg-brand px-4 py-2 text-white hover:bg-brand-dark disabled:opacity-60"
        >
          {submitting ? "Saving..." : existingCompletion ? "Resubmit" : "Submit"}
        </button>
      </form>
    </div>
  );
}
