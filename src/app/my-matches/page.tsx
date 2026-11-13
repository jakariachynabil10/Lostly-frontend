"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertCircle, ArrowRight, ChevronLeft, ChevronRight, Sparkles } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import { RequestClaimButton } from "../../components/claims/RequestClaimButton";
import { ClaimStatusBadge } from "../../components/claims/ClaimStatusBadge";
import { MatchFactorsList } from "../../components/items/MatchFactorsList";
import { SimilarityMeter } from "../../components/items/SimilarityMeter";
import { useMyMatches } from "../../lib/claims-api";

const PAGE_SIZE = 10;

export default function MyMatchesPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const [page, setPage] = useState(1);
  const matchesQuery = useMyMatches(Boolean(user) && !authLoading);

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?redirect=/my-matches");
  }, [authLoading, router, user]);

  const matches = matchesQuery.data ?? [];
  const pageCount = Math.max(1, Math.ceil(matches.length / PAGE_SIZE));
  const visibleMatches = matches.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  if (authLoading || (!user && !matchesQuery.isError)) {
    return (
      <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 sm:px-6">
        <div className="h-8 w-48 animate-pulse rounded bg-slate-200" />
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-56 animate-pulse rounded-3xl border border-slate-200 bg-white"
          />
        ))}
      </main>
    );
  }

  return (
    <main className="mx-auto w-full max-w-6xl space-y-6 px-4 py-10 sm:px-6">
      <header className="space-y-2 border-b border-slate-200 pb-5">
        <div className="flex items-center gap-2 text-indigo-600">
          <Sparkles className="h-5 w-5" />
          <span className="text-xs font-semibold uppercase tracking-wider">
            Your recovery matches
          </span>
        </div>
        <h1 className="text-2xl font-extrabold text-slate-900">My Matches</h1>
        <p className="text-sm text-slate-500">
          Compare possible matches and track any ownership claims.
        </p>
      </header>

      {matchesQuery.isError ? (
        <section
          role="alert"
          className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center"
        >
          <AlertCircle className="mx-auto h-7 w-7 text-rose-600" />
          <p className="mt-3 text-sm text-rose-800">
            Your matches could not be loaded.
          </p>
          <button
            type="button"
            onClick={() => void matchesQuery.refetch()}
            className="mt-3 text-sm font-semibold text-rose-800 underline"
          >
            Try again
          </button>
        </section>
      ) : matchesQuery.isLoading ? (
        Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-56 animate-pulse rounded-3xl border border-slate-200 bg-white"
          />
        ))
      ) : matches.length === 0 ? (
        <section className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
          <Sparkles className="mx-auto h-8 w-8 text-indigo-400" />
          <h2 className="mt-3 text-lg font-bold text-slate-900">
            No matches yet
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            Matching reports will appear here when an opposite report is found.
          </p>
          <div className="mt-5 flex flex-wrap justify-center gap-3">
            <Link
              href="/report/lost"
              className="rounded-xl bg-rose-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Report a lost item
            </Link>
            <Link
              href="/report/found"
              className="rounded-xl bg-emerald-600 px-4 py-2 text-sm font-semibold text-white"
            >
              Report a found item
            </Link>
          </div>
        </section>
      ) : (
        <>
          <div className="space-y-5">
            {visibleMatches.map((match) => {
              const isClaimant = match.myItem.type === "LOST";
              return (
                <article
                  key={match.id}
                  className="grid gap-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm md:grid-cols-[minmax(0,1fr)_220px]"
                >
                  <div className="min-w-0 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                          {match.myItem.type} report
                        </p>
                        <h2 className="mt-1 text-lg font-bold text-slate-900">
                          {match.myItem.itemName}{" "}
                          <span className="font-normal text-slate-400">↔</span>{" "}
                          {match.matchedItem.itemName}
                        </h2>
                        <p className="mt-1 text-xs text-slate-500">
                          {match.myItem.location} ·{" "}
                          {new Date(match.myItem.date).toLocaleDateString()}
                        </p>
                      </div>
                      {match.claim && (
                        <ClaimStatusBadge status={match.claim.status} />
                      )}
                    </div>

                    <MatchFactorsList factors={match.matchingFactors} />

                    <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">
                      <Link
                        href={`/${match.matchedItem.type === "LOST" ? "lost-items" : "found-items"}/${match.matchedItem.id}`}
                        className="inline-flex items-center gap-1 text-sm font-semibold text-indigo-700 hover:text-indigo-900"
                      >
                        View matched item <ArrowRight className="h-4 w-4" />
                      </Link>
                      {user && (
                        <RequestClaimButton
                          matchId={match.id}
                          itemName={match.matchedItem.itemName}
                          claim={match.claim}
                          claimsReceivedCount={match.claimsReceivedCount}
                          role={isClaimant ? "claimant" : "finder"}
                        />
                      )}
                    </div>
                  </div>

                  <aside className="flex flex-col items-center justify-center rounded-2xl bg-slate-50 p-4">
                    <SimilarityMeter score={match.similarityScore} size="lg" />
                    <p className="mt-3 text-center text-xs text-slate-600">
                      Possible match for {match.matchedItem.itemName}
                    </p>
                  </aside>
                </article>
              );
            })}
          </div>

          <nav
            aria-label="My matches pages"
            className="flex items-center justify-between rounded-2xl border border-slate-200 bg-white px-4 py-3"
          >
            <span className="text-sm text-slate-500">
              Page {page} of {pageCount}
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
                  setPage((current) => Math.min(pageCount, current + 1))
                }
                disabled={page === pageCount}
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
