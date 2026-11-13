"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  FileCheck2,
  PackageSearch,
} from "lucide-react";
import { ClaimStatusBadge } from "../../components/claims/ClaimStatusBadge";
import { useAuth } from "../../context/AuthContext";
import { useMyClaims } from "../../lib/claims-api";
import { ClaimRole, ClaimStatus } from "../../types";

const CLAIM_STATUSES: ClaimStatus[] = [
  "PENDING",
  "UNDER_REVIEW",
  "APPROVED",
  "REJECTED",
  "CANCELLED",
  "COMPLETED",
];

export default function MyClaimsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [role, setRole] = useState<ClaimRole>("claimant");
  const [status, setStatus] = useState<ClaimStatus | "">("");
  const [page, setPage] = useState(1);
  const claimsQuery = useMyClaims(
    { role, status: status || undefined, page },
    Boolean(user) && !authLoading,
  );

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?redirect=/my-claims");
  }, [authLoading, router, user]);

  const claims = claimsQuery.data?.claims ?? [];
  const totalPages = claimsQuery.data?.totalPages ?? 1;

  const chooseRole = (nextRole: ClaimRole) => {
    setRole(nextRole);
    setPage(1);
  };

  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 px-4 py-10 sm:px-6">
      <header className="space-y-2 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-indigo-600">
          <FileCheck2 className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Ownership verification
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">My Claims</h1>
        <p className="text-sm text-slate-500">
          Follow claims you made and claims on items you found.
        </p>
      </header>

      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div
          role="tablist"
          aria-label="Claim role"
          className="inline-flex rounded-xl border border-slate-200 bg-white p-1"
        >
          <button
            type="button"
            role="tab"
            aria-selected={role === "claimant"}
            onClick={() => chooseRole("claimant")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              role === "claimant"
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Claims I made
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={role === "finder"}
            onClick={() => chooseRole("finder")}
            className={`rounded-lg px-4 py-2 text-sm font-semibold ${
              role === "finder"
                ? "bg-indigo-600 text-white"
                : "text-slate-600 hover:bg-slate-50"
            }`}
          >
            Claims on my found items
          </button>
        </div>

        <label className="flex items-center gap-2 text-sm text-slate-600">
          Status
          <select
            value={status}
            onChange={(event) => {
              setStatus(event.target.value as ClaimStatus | "");
              setPage(1);
            }}
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-800"
          >
            <option value="">All statuses</option>
            {CLAIM_STATUSES.map((claimStatus) => (
              <option key={claimStatus} value={claimStatus}>
                {claimStatus.replace("_", " ")}
              </option>
            ))}
          </select>
        </label>
      </div>

      {authLoading || claimsQuery.isLoading ? (
        <div className="space-y-3" aria-label="Loading claims">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-36 animate-pulse rounded-2xl border border-slate-200 bg-white"
            />
          ))}
        </div>
      ) : claimsQuery.isError ? (
        <section
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center"
        >
          <AlertCircle className="mx-auto h-7 w-7 text-rose-600" />
          <p className="mt-3 text-sm text-rose-800">
            Claims could not be loaded.
          </p>
          <button
            type="button"
            onClick={() => void claimsQuery.refetch()}
            className="mt-3 text-sm font-semibold text-rose-800 underline"
          >
            Try again
          </button>
        </section>
      ) : claims.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <PackageSearch className="mx-auto h-8 w-8 text-slate-400" />
          <h2 className="mt-3 text-lg font-bold text-slate-900">
            No claims yet
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {status
              ? "No claims match this status filter."
              : role === "claimant"
                ? "When you request ownership verification, the claim will appear here."
                : "Claims submitted on your found items will appear here."}
          </p>
          <Link
            href={role === "claimant" ? "/lost-items" : "/found-items"}
            className="mt-5 inline-flex rounded-xl bg-indigo-600 px-4 py-2 text-sm font-semibold text-white hover:bg-indigo-700"
          >
            {role === "claimant" ? "Browse lost reports" : "Browse found reports"}
          </Link>
        </section>
      ) : (
        <>
          <div className="space-y-3">
            {claims.map((claim) => {
              const item =
                role === "claimant"
                  ? claim.match.foundReport
                  : claim.match.lostReport;
              const otherParty =
                role === "claimant" ? claim.finder.name : claim.claimant.name;

              return (
                <article
                  key={claim.id}
                  className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm sm:flex-row sm:items-center"
                >
                  <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                    {item.imageUrl ? (
                      <img
                        src={item.imageUrl}
                        alt={item.itemName}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <PackageSearch className="h-7 w-7 text-slate-400" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h2 className="truncate font-bold text-slate-900">
                      {item.itemName}
                    </h2>
                    <p className="mt-1 text-sm text-slate-500">
                      {role === "claimant" ? "Finder" : "Claimant"}: {otherParty}
                    </p>
                    <p className="mt-1 text-xs text-slate-400">
                      Started {new Date(claim.createdAt).toLocaleDateString()} ·{" "}
                      {claim._count.questions} verification questions
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3 sm:flex-col sm:items-end">
                    <ClaimStatusBadge status={claim.status} />
                    <Link
                      href={`/claims/${claim.id}`}
                      className="text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                    >
                      Open claim room
                    </Link>
                  </div>
                </article>
              );
            })}
          </div>

          <nav
            aria-label="My claims pages"
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
          >
            <span className="text-sm text-slate-500">
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                disabled={page === 1}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" /> Previous
              </button>
              <button
                type="button"
                onClick={() =>
                  setPage((current) => Math.min(totalPages, current + 1))
                }
                disabled={page === totalPages}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-200 px-3 py-2 text-sm font-medium disabled:opacity-40"
              >
                Next <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </nav>
        </>
      )}
    </main>
  );
}
