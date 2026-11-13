"use client";

import React, { useEffect } from "react";
import axios from "axios";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { AlertCircle, ArrowLeft, PackageSearch } from "lucide-react";
import { ClaimStatusBadge } from "../../../components/claims/ClaimStatusBadge";
import { ClaimStatusTimeline } from "../../../components/claims/ClaimStatusTimeline";
import { ClaimantClaimControls } from "../../../components/claims/ClaimantClaimControls";
import { useAuth } from "../../../context/AuthContext";
import { useClaim } from "../../../lib/claims-api";

export default function ClaimRoomPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const claimQuery = useClaim(id, Boolean(user) && !authLoading);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace(`/login?redirect=${encodeURIComponent(`/claims/${id}`)}`);
    }
  }, [authLoading, id, router, user]);

  if (authLoading || claimQuery.isLoading || (!user && !claimQuery.isError)) {
    return (
      <main className="mx-auto w-full max-w-4xl space-y-5 px-4 py-10 sm:px-6">
        <div className="h-7 w-32 animate-pulse rounded bg-slate-200" />
        <div className="h-32 animate-pulse rounded-3xl border border-slate-200 bg-white" />
        <div className="h-52 animate-pulse rounded-3xl border border-slate-200 bg-white" />
      </main>
    );
  }

  if (claimQuery.isError) {
    const status = axios.isAxiosError(claimQuery.error)
      ? claimQuery.error.response?.status
      : undefined;
    if (status === 403 || status === 404) {
      return (
        <main className="mx-auto max-w-xl px-4 py-20 text-center">
          <AlertCircle className="mx-auto h-10 w-10 text-slate-400" />
          <h1 className="mt-4 text-xl font-bold text-slate-900">
            Claim not found
          </h1>
          <p className="mt-2 text-sm text-slate-500">
            This claim is unavailable or you don&apos;t have access to it.
          </p>
          <Link
            href="/my-claims"
            className="mt-5 inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            Back to My Claims
          </Link>
        </main>
      );
    }

    return (
      <main className="mx-auto max-w-xl px-4 py-20 text-center">
        <AlertCircle className="mx-auto h-10 w-10 text-rose-500" />
        <h1 className="mt-4 text-xl font-bold text-slate-900">
          Could not load this claim
        </h1>
        <p className="mt-2 text-sm text-slate-500">
          Please try again.
        </p>
        <button
          type="button"
          onClick={() => void claimQuery.refetch()}
          className="mt-5 rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
        >
          Retry
        </button>
      </main>
    );
  }

  const claim = claimQuery.data;
  if (!claim) return null;

  const item = claim.match.foundReport;

  return (
    <main className="mx-auto w-full max-w-4xl space-y-6 px-4 py-10 sm:px-6">
      <Link
        href="/my-claims"
        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-indigo-700"
      >
        <ArrowLeft className="h-4 w-4" /> My Claims
      </Link>

      <header className="space-y-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-600">
              Ownership verification
            </p>
            <h1 className="mt-1 text-2xl font-extrabold text-slate-900">
              Claim for {item.itemName}
            </h1>
          </div>
          <ClaimStatusBadge status={claim.status} size="md" />
        </div>
        <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
          <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-200">
            {item.imageUrl ? (
              <img
                src={item.imageUrl}
                alt={item.itemName}
                className="h-full w-full object-cover"
              />
            ) : (
              <PackageSearch className="h-6 w-6 text-slate-500" />
            )}
          </div>
          <div>
            <p className="text-xs text-slate-500">
              {claim.userRole === "claimant" ? "You are the claimant" : "You are the finder"}
            </p>
            <p className="font-semibold text-slate-900">{item.location}</p>
            <p className="text-xs text-slate-500">
              Started {new Date(claim.createdAt).toLocaleDateString()}
            </p>
          </div>
        </div>
        <ClaimStatusTimeline status={claim.status} />
      </header>

      {claim.userRole === "claimant" && (
        <ClaimantClaimControls
          claimId={claim.id}
          status={claim.status}
          questions={claim.questions}
        />
      )}
    </main>
  );
}
