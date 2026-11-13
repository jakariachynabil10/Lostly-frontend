"use client";

import React, { useState } from "react";
import {
  useAddVerificationQuestions,
  useReviewVerificationAnswer,
  useUpdateClaim,
} from "../../lib/claims-api";
import { ClaimStatus, VerificationQuestion } from "../../types";

interface FinderClaimControlsProps {
  claimId: string;
  status: ClaimStatus;
  questions: VerificationQuestion[];
}

export function FinderClaimControls({
  claimId,
  status,
  questions,
}: FinderClaimControlsProps) {
  const [drafts, setDrafts] = useState([""]);
  const [rejectReason, setRejectReason] = useState("");
  const addQuestionsMutation = useAddVerificationQuestions();
  const reviewAnswerMutation = useReviewVerificationAnswer();
  const claimActionMutation = useUpdateClaim();
  const busy =
    addQuestionsMutation.isPending ||
    reviewAnswerMutation.isPending ||
    claimActionMutation.isPending;
  const canAddQuestions = status === "PENDING" || status === "UNDER_REVIEW";
  const canReviewAnswers = status === "UNDER_REVIEW";
  const allAnswersAccepted =
    questions.length > 0 &&
    questions.every(
      (question) =>
        question.answers[question.answers.length - 1]?.reviewStatus ===
        "ACCEPTED",
    );

  const submitQuestions = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const values = drafts.map((question) => question.trim());
    if (
      values.length < 1 ||
      values.length > 5 ||
      values.some((question) => question.length < 3 || question.length > 500)
    ) {
      return;
    }

    addQuestionsMutation.mutate(
      { claimId, questions: values },
      { onSuccess: () => setDrafts([""]) },
    );
  };

  return (
    <section className="space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-bold text-slate-900">
          Verify the claimant&apos;s ownership
        </h2>
        <p className="mt-1 text-sm text-slate-500">
          Ask questions about details that were not included in the public report.
        </p>
      </div>

      {questions.length > 0 ? (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <article
              key={question.id}
              className="space-y-3 rounded-2xl border border-slate-200 p-4"
            >
              <h3 className="text-sm font-semibold text-slate-900">
                Question {index + 1}: {question.question}
              </h3>
              {question.answers.length === 0 ? (
                <p className="text-sm text-slate-500">Waiting for an answer.</p>
              ) : (
                <div className="space-y-3">
                  {question.answers.map((answer) => (
                    <div
                      key={answer.id}
                      className="space-y-2 rounded-xl bg-slate-50 p-3"
                    >
                      <p className="whitespace-pre-wrap text-sm text-slate-700">
                        {answer.answer}
                      </p>
                      <p className="text-xs font-medium text-slate-500">
                        Answer status:{" "}
                        {answer.reviewStatus === "PENDING"
                          ? "Awaiting your review"
                          : answer.reviewStatus.toLowerCase()}
                      </p>
                      {canReviewAnswers &&
                        answer.reviewStatus === "PENDING" && (
                          <div className="flex flex-wrap gap-2">
                            <button
                              type="button"
                              onClick={() =>
                                reviewAnswerMutation.mutate({
                                  answerId: answer.id,
                                  reviewStatus: "ACCEPTED",
                                })
                              }
                              disabled={busy}
                              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                            >
                              Accept answer
                            </button>
                            <button
                              type="button"
                              onClick={() =>
                                reviewAnswerMutation.mutate({
                                  answerId: answer.id,
                                  reviewStatus: "REJECTED",
                                })
                              }
                              disabled={busy}
                              className="rounded-lg border border-rose-200 px-3 py-1.5 text-xs font-semibold text-rose-700 hover:bg-rose-50 disabled:opacity-50"
                            >
                              Reject answer
                            </button>
                          </div>
                        )}
                    </div>
                  ))}
                </div>
              )}
            </article>
          ))}
        </div>
      ) : (
        <p className="rounded-xl bg-slate-50 p-4 text-sm text-slate-600">
          No verification questions have been added yet.
        </p>
      )}

      {canAddQuestions && (
        <form onSubmit={submitQuestions} className="space-y-3 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold text-slate-900">
            {status === "UNDER_REVIEW"
              ? "Request more information"
              : "Add verification questions"}
          </h3>
          {drafts.map((draft, index) => (
            <div key={index} className="space-y-1">
              <label
                htmlFor={`claim-question-${index}`}
                className="text-xs font-medium text-slate-600"
              >
                Question {index + 1}
              </label>
              <textarea
                id={`claim-question-${index}`}
                value={draft}
                onChange={(event) =>
                  setDrafts((current) =>
                    current.map((question, draftIndex) =>
                      draftIndex === index ? event.target.value : question,
                    ),
                  )
                }
                minLength={3}
                maxLength={500}
                rows={2}
                required
                disabled={busy}
                className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50"
              />
              <p className="text-right text-xs text-slate-400">
                {draft.length}/500
              </p>
            </div>
          ))}
          {drafts.length < 5 && (
            <button
              type="button"
              onClick={() => setDrafts((current) => [...current, ""])}
              disabled={busy}
              className="text-sm font-semibold text-indigo-700 hover:text-indigo-900 disabled:opacity-50"
            >
              Add another question
            </button>
          )}
          {drafts.length > 1 && (
            <button
              type="button"
              onClick={() => setDrafts((current) => current.slice(0, -1))}
              disabled={busy}
              className="ml-4 text-sm font-medium text-slate-600 hover:text-slate-900 disabled:opacity-50"
            >
              Remove last question
            </button>
          )}
          <button
            type="submit"
            disabled={
              busy ||
              drafts.some(
                (question) =>
                  question.trim().length < 3 || question.trim().length > 500,
              )
            }
            className="block rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {addQuestionsMutation.isPending
              ? "Saving questions..."
              : status === "UNDER_REVIEW"
                ? "Request more information"
                : "Send verification questions"}
          </button>
        </form>
      )}

      {status === "UNDER_REVIEW" && (
        <div className="space-y-3 border-t border-slate-100 pt-4">
          <h3 className="text-sm font-semibold text-slate-900">
            Resolve this claim
          </h3>
          <button
            type="button"
            onClick={() =>
              claimActionMutation.mutate({ claimId, action: "approve" })
            }
            disabled={busy || !allAnswersAccepted}
            className="rounded-xl bg-emerald-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-emerald-800 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {claimActionMutation.isPending &&
            claimActionMutation.variables?.action === "approve"
              ? "Approving..."
              : "Approve claim"}
          </button>
          {!allAnswersAccepted && (
            <p className="text-xs text-slate-500">
              Accept every submitted answer before approving the claim.
            </p>
          )}
          <label
            htmlFor="claim-rejection-reason"
            className="block text-xs font-medium text-slate-600"
          >
            Reason for rejection (required)
          </label>
          <textarea
            id="claim-rejection-reason"
            value={rejectReason}
            onChange={(event) => setRejectReason(event.target.value)}
            maxLength={1000}
            rows={3}
            disabled={busy}
            className="w-full rounded-xl border border-slate-200 p-3 text-sm text-slate-800 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 disabled:bg-slate-50"
          />
          <button
            type="button"
            onClick={() =>
              claimActionMutation.mutate({
                claimId,
                action: "reject",
                reviewNotes: rejectReason.trim(),
              })
            }
            disabled={
              busy ||
              rejectReason.trim().length === 0 ||
              rejectReason.trim().length > 1000
            }
            className="rounded-xl border border-rose-200 px-4 py-2.5 text-sm font-semibold text-rose-700 hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {claimActionMutation.isPending &&
            claimActionMutation.variables?.action === "reject"
              ? "Rejecting..."
              : "Reject claim"}
          </button>
        </div>
      )}

      {addQuestionsMutation.isError && (
        <p role="alert" className="text-sm text-rose-700">
          {addQuestionsMutation.error.message}
        </p>
      )}
      {reviewAnswerMutation.isError && (
        <p role="alert" className="text-sm text-rose-700">
          {reviewAnswerMutation.error.message}
        </p>
      )}
      {claimActionMutation.isError && (
        <p role="alert" className="text-sm text-rose-700">
          {claimActionMutation.error.message}
        </p>
      )}
    </section>
  );
}
