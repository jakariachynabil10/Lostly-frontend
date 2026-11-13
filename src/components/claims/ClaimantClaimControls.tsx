"use client";

import React, { useMemo, useState } from "react";
import {
  useSubmitVerificationAnswers,
  useUpdateClaim,
} from "../../lib/claims-api";
import { ClaimStatus, VerificationQuestion } from "../../types";

interface ClaimantClaimControlsProps {
  claimId: string;
  status: ClaimStatus;
  questions: VerificationQuestion[];
}

export function ClaimantClaimControls({
  claimId,
  status,
  questions,
}: ClaimantClaimControlsProps) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [confirmCancel, setConfirmCancel] = useState(false);
  const submitMutation = useSubmitVerificationAnswers();
  const cancelMutation = useUpdateClaim();
  const busy =
    submitMutation.isPending ||
    cancelMutation.isPending;
  const openQuestions = useMemo(
    () =>
      questions.filter((question) => {
        const latest = question.answers[question.answers.length - 1];
        return !latest || latest.reviewStatus === "REJECTED";
      }),
    [questions],
  );
  const canAnswer = status === "PENDING" && openQuestions.length > 0;

  const submitAnswers = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const submission = openQuestions.map((question) => ({
      questionId: question.id,
      answer: (answers[question.id] || "").trim(),
    }));
    if (
      submission.some(
        ({ answer }) => answer.length < 1 || answer.length > 2000,
      )
    ) {
      return;
    }

    submitMutation.mutate(submission, {
      onSuccess: () => setAnswers({}),
    });
  };

  return (
    <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Finder verification questions
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Answer the questions with details that help verify ownership.
        </p>
      </div>

      {questions.length === 0 ? (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          The finder has not added verification questions yet.
        </p>
      ) : (
        <form onSubmit={submitAnswers} className="space-y-4">
          {questions.map((question) => {
            const latest = question.answers[question.answers.length - 1];
            const canEdit =
              canAnswer &&
              (!latest || latest.reviewStatus === "REJECTED");

            return (
              <div
                key={question.id}
                className="space-y-2 rounded-2xl border border-slate-200 p-4"
              >
                <h3 className="text-sm font-semibold text-slate-900">
                  {question.question}
                </h3>
                {canEdit ? (
                  <>
                    <textarea
                      value={answers[question.id] || ""}
                      onChange={(event) =>
                        setAnswers((current) => ({
                          ...current,
                          [question.id]: event.target.value,
                        }))
                      }
                      minLength={1}
                      maxLength={2000}
                      rows={3}
                      required
                      disabled={busy}
                      aria-label={`Answer: ${question.question}`}
                      className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50"
                    />
                    <p className="text-right text-xs text-slate-400">
                      {(answers[question.id] || "").length}/2000
                    </p>
                    {latest?.reviewStatus === "REJECTED" && (
                      <p className="text-xs font-medium text-rose-700">
                        The finder asked you to try this answer again.
                      </p>
                    )}
                  </>
                ) : latest ? (
                  <div className="space-y-1">
                    <p className="whitespace-pre-wrap rounded-xl bg-slate-50 p-3 text-sm text-slate-700">
                      {latest.answer}
                    </p>
                    <p className="text-xs font-medium text-slate-500">
                      Answer status:{" "}
                      {latest.reviewStatus === "PENDING"
                        ? "Awaiting review"
                        : latest.reviewStatus.toLowerCase()}
                    </p>
                  </div>
                ) : (
                  <p className="text-xs text-slate-500">
                    Answers can be submitted while the claim is pending.
                  </p>
                )}
              </div>
            );
          })}

          {submitMutation.isError && (
            <p
              role="alert"
              className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
            >
              {submitMutation.error.message}
            </p>
          )}

          {canAnswer && (
            <button
              type="submit"
              disabled={
                busy ||
                openQuestions.some(
                  (question) =>
                    (answers[question.id] || "").trim().length === 0 ||
                    (answers[question.id] || "").trim().length > 2000,
                )
              }
              className="rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {submitMutation.isPending ? "Submitting answers..." : "Submit answers"}
            </button>
          )}
        </form>
      )}

      {(status === "PENDING" || status === "UNDER_REVIEW") && (
        <div className="border-t border-slate-100 pt-4">
          <button
            type="button"
            onClick={() => setConfirmCancel(true)}
            disabled={busy}
            className="rounded-xl border border-rose-200 px-4 py-2 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
          >
            Cancel claim
          </button>
          {cancelMutation.isError && (
            <p role="alert" className="mt-2 text-sm text-rose-700">
              {cancelMutation.error.message}
            </p>
          )}
        </div>
      )}

      {confirmCancel && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4">
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="cancel-claim-title"
            className="w-full max-w-sm space-y-4 rounded-2xl bg-white p-6 shadow-2xl"
          >
            <h2 id="cancel-claim-title" className="text-lg font-bold text-slate-900">
              Cancel this claim?
            </h2>
            <p className="text-sm text-slate-600">
              This ends the ownership verification request.
            </p>
            {cancelMutation.isError && (
              <p role="alert" className="text-sm text-rose-700">
                {cancelMutation.error.message}
              </p>
            )}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                disabled={busy}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 disabled:opacity-50"
              >
                Keep claim
              </button>
              <button
                type="button"
                onClick={() =>
                  cancelMutation.mutate(
                    { claimId, action: "cancel" },
                    { onSuccess: () => setConfirmCancel(false) },
                  )
                }
                disabled={busy}
                className="flex-1 rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
              >
                {cancelMutation.isPending ? "Cancelling..." : "Confirm cancel"}
              </button>
            </div>
          </section>
        </div>
      )}
    </section>
  );
}
