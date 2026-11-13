"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShieldCheck } from "lucide-react";
import { useCreateClaim } from "../../lib/claims-api";
import { ClaimSummary } from "../../types";
import { ClaimStatusBadge } from "./ClaimStatusBadge";

interface RequestClaimButtonProps {
  matchId: string;
  itemName: string;
  claim?: ClaimSummary | null;
  claimsReceivedCount?: number;
  role: "claimant" | "finder";
}

export function RequestClaimButton({
  matchId,
  itemName,
  claim,
  claimsReceivedCount = 0,
  role,
}: RequestClaimButtonProps) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const createClaimMutation = useCreateClaim();

  if (role === "finder") {
    return (
      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-600">
        <span>
          {claimsReceivedCount}{" "}
          {claimsReceivedCount === 1 ? "claim received" : "claims received"}
        </span>
      </div>
    );
  }

  if (claim) {
    return (
      <Link
        href={`/claims/${claim.id}`}
        className="inline-flex items-center gap-2 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500"
      >
        <ClaimStatusBadge status={claim.status} />
        <span className="text-xs font-semibold text-indigo-700">Open claim</span>
      </Link>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          createClaimMutation.reset();
          setConfirmOpen(true);
        }}
        className="inline-flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white shadow-xs transition hover:bg-indigo-700"
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        Request Claim
      </button>

      {confirmOpen && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/50 p-4 backdrop-blur-xs"
          role="presentation"
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="request-claim-title"
            aria-describedby="request-claim-description"
            className="w-full max-w-md space-y-5 rounded-3xl border border-slate-200 bg-white p-6 shadow-2xl sm:p-8"
          >
            <div className="text-center">
              <ShieldCheck className="mx-auto h-8 w-8 text-indigo-600" />
              <h2
                id="request-claim-title"
                className="mt-3 text-lg font-bold text-slate-900"
              >
                Request ownership verification?
              </h2>
              <p
                id="request-claim-description"
                className="mt-2 text-sm leading-6 text-slate-600"
              >
                You&apos;re requesting the found item, &quot;{itemName}&quot;.
                The finder will ask questions to verify ownership before
                approving the claim.
              </p>
            </div>

            {createClaimMutation.isError && (
              <p
                role="alert"
                className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700"
              >
                {createClaimMutation.error.message}
              </p>
            )}

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                disabled={createClaimMutation.isPending}
                className="flex-1 rounded-xl border border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() =>
                  createClaimMutation.mutate(matchId, {
                    onSuccess: (newClaim) =>
                      router.push(`/claims/${newClaim.id}`),
                  })
                }
                disabled={createClaimMutation.isPending}
                className="flex-1 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {createClaimMutation.isPending
                  ? "Requesting..."
                  : "Confirm Request"}
              </button>
            </div>
          </section>
        </div>
      )}
    </>
  );
}
