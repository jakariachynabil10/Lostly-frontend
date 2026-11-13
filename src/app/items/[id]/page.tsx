"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import Link from "next/link";
import { api } from "../../../lib/api";
import { ClaimableMatch, ItemReport } from "../../../types";
import { useAuth } from "../../../context/AuthContext";
import { Badge } from "../../../components/ui/Badge";
import { SimilarityMeter } from "../../../components/items/SimilarityMeter";
import { MatchFactorsList } from "../../../components/items/MatchFactorsList";
import { RequestClaimButton } from "../../../components/claims/RequestClaimButton";
import {
  MapPin,
  Calendar,
  Clock,
  Tag,
  Sparkles,
  ArrowLeft,
  User as UserIcon,
  Trash2,
  CheckCircle,
  RotateCcw,
  ShieldCheck,
  AlertCircle,
  ExternalLink,
} from "lucide-react";

export function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const itemId = params.id as string;

  const [selectedMatch, setSelectedMatch] = useState<ClaimableMatch | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);

  // Fetch report details & matches
  const { data, isLoading, error } = useQuery<{
    report: ItemReport;
    matches: ClaimableMatch[];
  }>({
    queryKey: ["item-detail", itemId],
    queryFn: async () => {
      const res = await api.get(`/reports/${itemId}`);
      return res.data?.data;
    },
  });

  // Re-run matching mutation
  const triggerMatchMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post(`/matches/report/${itemId}/trigger`);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["item-detail", itemId] });
    },
  });

  // Delete report mutation
  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/reports/${itemId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      const target = data?.report.type === "LOST" ? "/lost-items" : "/found-items";
      router.push(target);
      router.refresh();
    },
  });

  // Mark resolved mutation
  const resolveMutation = useMutation({
    mutationFn: async () => {
      await api.put(`/reports/${itemId}`, { status: "RESOLVED" });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      router.refresh();
    },
  });

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 w-full animate-pulse space-y-6">
        <div className="h-6 w-32 bg-slate-200 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="h-96 bg-slate-200 rounded-3xl md:col-span-1"></div>
          <div className="h-96 bg-slate-200 rounded-3xl md:col-span-2"></div>
        </div>
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
        <AlertCircle className="w-12 h-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Item not found</h2>
        <p className="text-xs text-slate-500">
          This report may have been deleted or does not exist.
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
        >
          <ArrowLeft className="w-4 h-4" /> Return to Home
        </Link>
      </div>
    );
  }

  const { report, matches } = data;
  const isOwner = user && user.id === report.userId;
  const isLost = report.type === "LOST";

  const formattedDate = new Date(report.date).toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-10">
      {/* Back button & Breadcrumb */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-slate-600 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Listings
        </button>

        {/* Owner actions */}
        {isOwner && (
          <div className="flex items-center gap-2">
            {report.status !== "RESOLVED" && (
              <button
                onClick={() => resolveMutation.mutate()}
                disabled={resolveMutation.isPending}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all"
              >
                <CheckCircle className="w-3.5 h-3.5" />
                Mark as Resolved
              </button>
            )}
            <button
              onClick={() => setDeleteConfirmOpen(true)}
              disabled={deleteMutation.isPending}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all hover:scale-[1.02]"
            >
              <Trash2 className="w-3.5 h-3.5" />
              Delete Report
            </button>
          </div>
        )}
      </div>

      {/* Main Item Spec Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left: Media */}
        <div className="lg:col-span-5 bg-white rounded-3xl p-4 border border-slate-200/80 shadow-xs space-y-3">
          <div className="relative aspect-4/3 rounded-2xl overflow-hidden bg-slate-100">
            {report.imageUrl ? (
              <img
                src={report.imageUrl}
                alt={report.itemName}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-slate-50 text-slate-400 p-6 text-center">
                <Tag className="w-12 h-12 text-slate-300 mb-2" />
                <span className="text-xs font-medium text-slate-400">
                  No photo attached to this report
                </span>
              </div>
            )}
          </div>

          <div className="px-2 py-1 flex items-center justify-between text-[11px] text-slate-500">
            <span>Report ID: {report.id.substring(0, 8)}...</span>
            <span>
              Category:{" "}
              <strong className="text-slate-700">{report.category?.name}</strong>
            </span>
          </div>
        </div>

        {/* Right: Info */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={isLost ? "lost" : "found"}>
                {isLost ? "LOST ITEM" : "FOUND ITEM"}
              </Badge>
              {report.status === "MATCH_FOUND" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-bold rounded-full bg-amber-500 text-white shadow-xs">
                  <Sparkles className="w-3 h-3" />
                  Active Matches Available
                </span>
              )}
              {report.status === "RESOLVED" && (
                <Badge variant="resolved">RESOLVED</Badge>
              )}
            </div>

            <h1 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
              {report.itemName}
            </h1>

            {(report.brand || report.color) && (
              <div className="flex flex-wrap gap-2 pt-1">
                {report.brand && (
                  <span className="px-3 py-1 text-xs font-medium bg-slate-100 text-slate-800 rounded-lg">
                    Brand: <strong>{report.brand}</strong>
                  </span>
                )}
                {report.color && (
                  <span className="px-3 py-1 text-xs font-medium bg-slate-100 text-slate-800 rounded-lg">
                    Color: <strong>{report.color}</strong>
                  </span>
                )}
              </div>
            )}
          </div>

          {/* Details list */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 py-4 border-y border-slate-100 text-xs">
            <div className="flex items-center gap-2.5 text-slate-600">
              <MapPin className="w-4 h-4 text-indigo-500 shrink-0" />
              <div>
                <span className="block text-[11px] text-slate-400 font-medium">
                  {isLost ? "Lost Location" : "Found Location"}
                </span>
                <span className="font-semibold text-slate-800">{report.location}</span>
              </div>
            </div>

            <div className="flex items-center gap-2.5 text-slate-600">
              <Calendar className="w-4 h-4 text-indigo-500 shrink-0" />
              <div>
                <span className="block text-[11px] text-slate-400 font-medium">
                  Date
                </span>
                <span className="font-semibold text-slate-800">{formattedDate}</span>
              </div>
            </div>

            {report.approximateTime && (
              <div className="flex items-center gap-2.5 text-slate-600">
                <Clock className="w-4 h-4 text-indigo-500 shrink-0" />
                <div>
                  <span className="block text-[11px] text-slate-400 font-medium">
                    Time Estimate
                  </span>
                  <span className="font-semibold text-slate-800">
                    {report.approximateTime}
                  </span>
                </div>
              </div>
            )}

            <div className="flex items-center gap-2.5 text-slate-600">
              <UserIcon className="w-4 h-4 text-indigo-500 shrink-0" />
              <div>
                <span className="block text-[11px] text-slate-400 font-medium">
                  Reporter
                </span>
                <span className="font-semibold text-slate-800">
                  {report.user?.name || "Anonymous Member"}
                </span>
              </div>
            </div>
          </div>

          {/* Descriptions */}
          <div className="space-y-4">
            <div>
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-1.5">
                Description
              </h3>
              <p className="text-xs sm:text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {report.description}
              </p>
            </div>

            {report.identifyingFeatures && (
              <div className="p-3.5 bg-slate-50 border border-slate-200/80 rounded-2xl">
                <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5 mb-1">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  Identifying Markers / Proof Clues
                </h4>
                <p className="text-xs text-slate-600 leading-relaxed">
                  {report.identifyingFeatures}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ==================================================================== */}
      {/* MATCHING ENGINE SECTION — Phase 4 Core Feature */}
      {/* ==================================================================== */}
      <section className="bg-white rounded-3xl p-6 sm:p-8 border border-slate-200/80 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2">
              <div className="p-1.5 rounded-lg bg-indigo-50 text-indigo-600">
                <Sparkles className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Algorithmic Similarity Matches
              </h2>
            </div>
            <p className="text-xs text-slate-500 mt-1">
              Automated score cross-referencing this item against counter-reports (threshold: ≥60% similarity).
            </p>
          </div>

          <button
            onClick={() => triggerMatchMutation.mutate()}
            disabled={triggerMatchMutation.isPending}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-indigo-700 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 transition-all self-start sm:self-auto disabled:opacity-50"
          >
            <RotateCcw
              className={`w-3.5 h-3.5 ${
                triggerMatchMutation.isPending ? "animate-spin" : ""
              }`}
            />
            {triggerMatchMutation.isPending ? "Re-evaluating..." : "Re-Scan Matches"}
          </button>
        </div>

        {matches && matches.length > 0 ? (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {matches.map((match) => {
                const counterpart = match.counterpart;
                if (!counterpart) return null;

                const isSelected = selectedMatch?.id === match.id;

                return (
                  <div
                    key={match.id}
                    onClick={() => {
                      setSelectedMatch(match);
                    }}
                    className={`cursor-pointer rounded-2xl p-4 border transition-all ${
                      isSelected
                        ? "border-indigo-600 bg-indigo-50/20 shadow-md ring-2 ring-indigo-500/20"
                        : "border-slate-200/80 bg-slate-50/60 hover:bg-white hover:border-slate-300 hover:shadow-xs"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                        Opposite: {counterpart.type}
                      </span>
                      <span
                        className={`text-xs font-black px-2.5 py-0.5 rounded-full ${
                          match.similarityScore >= 90
                            ? "bg-emerald-100 text-emerald-800"
                            : match.similarityScore >= 75
                            ? "bg-indigo-100 text-indigo-800"
                            : "bg-amber-100 text-amber-800"
                        }`}
                      >
                        {Math.round(match.similarityScore)}% Match
                      </span>
                    </div>

                    <div className="flex gap-3 items-center">
                      <div className="w-16 h-16 rounded-xl bg-slate-200 overflow-hidden shrink-0">
                        {counterpart.imageUrl ? (
                          <img
                            src={counterpart.imageUrl}
                            alt={counterpart.itemName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400 text-[10px]">
                            No photo
                          </div>
                        )}
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {counterpart.itemName}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {counterpart.location}
                        </p>
                        <p className="text-[10px] text-slate-400">
                          {new Date(counterpart.date).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="mt-3 pt-3 border-t border-slate-200/60 flex items-center justify-between text-[11px]">
                      <span className="text-indigo-600 font-semibold">
                        {isSelected ? "Inspecting factors below ↓" : "Click to view analysis"}
                      </span>
                      <ExternalLink className="w-3 h-3 text-slate-400" />
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Selected Match In-Depth Inspection Card */}
            {selectedMatch && selectedMatch.counterpart && (
              <div className="bg-slate-50/70 border border-slate-200 rounded-3xl p-6 sm:p-8 space-y-6 animate-fade-in">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <span className="text-[11px] font-bold uppercase tracking-wider text-indigo-600">
                      Match Inspection Details
                    </span>
                    <h3 className="text-lg font-bold text-slate-900">
                      Pairing: &quot;{report.itemName}&quot; ↔ &quot;{selectedMatch.counterpart.itemName}&quot;
                    </h3>
                  </div>

                  <div className="flex items-center gap-3">
                    <Link
                      href={`/${selectedMatch.counterpart.type === "LOST" ? "lost-items" : "found-items"}/${selectedMatch.counterpart.id}`}
                      className="px-3.5 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-xl hover:bg-slate-50"
                    >
                      Open Matched Item
                    </Link>

                    {isLost && user?.id === report.userId && (
                      <RequestClaimButton
                        matchId={selectedMatch.id}
                        itemName={selectedMatch.counterpart.itemName}
                        claim={selectedMatch.claim}
                        role="claimant"
                      />
                    )}
                    {!isLost && user?.id === report.userId && (
                      <RequestClaimButton
                        matchId={selectedMatch.id}
                        itemName={selectedMatch.counterpart.itemName}
                        claimsReceivedCount={selectedMatch.claimsReceivedCount}
                        role="finder"
                      />
                    )}
                  </div>
                </div>

                {/* Similarity meter & comparison summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-center">
                  <div className="md:col-span-1">
                    <SimilarityMeter score={selectedMatch.similarityScore} size="lg" />
                  </div>
                  <div className="md:col-span-2">
                    <MatchFactorsList factors={selectedMatch.matchingFactors} />
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 space-y-3">
            <Sparkles className="w-8 h-8 text-indigo-400 mx-auto stroke-[1.5]" />
            <h3 className="text-sm font-bold text-slate-800">
              No matching counterparts discovered yet
            </h3>
            <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              Our matching algorithm requires a similarity score of 60% or higher. Whenever an opposite {isLost ? "found" : "lost"} report is filed with corresponding attributes, it will automatically link here.
            </p>
          </div>
        )}
      </section>

      {/* Delete Confirmation Modal */}
      {deleteConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 backdrop-blur-xs p-4 animate-fade-in">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 space-y-4 border border-slate-200 shadow-2xl text-center">
            <div className="w-12 h-12 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center mx-auto">
              <Trash2 className="w-6 h-6" />
            </div>

            <div className="space-y-1">
              <h3 className="text-base font-bold text-slate-900">
                Delete This Report?
              </h3>
              <p className="text-xs text-slate-500 leading-relaxed">
                Are you sure you want to delete &quot;{report.itemName}&quot;? This action cannot be undone.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeleteConfirmOpen(false)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  setDeleteConfirmOpen(false);
                  deleteMutation.mutate();
                }}
                disabled={deleteMutation.isPending}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
              >
                {deleteMutation.isPending ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ItemRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;
  const { data, isLoading, error } = useQuery<{
    report: ItemReport;
    matches: ClaimableMatch[];
  }>({
    queryKey: ["item-detail", itemId],
    queryFn: async () => {
      const res = await api.get(`/reports/${itemId}`);
      return res.data?.data;
    },
  });

  useEffect(() => {
    if (!data?.report) return;
    const route = data.report.type === "LOST" ? "lost-items" : "found-items";
    router.replace(`/${route}/${itemId}`);
  }, [data, itemId, router]);

  if (isLoading || data?.report) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-16 w-full animate-pulse space-y-6">
        <div className="h-6 w-32 bg-slate-200 rounded-lg"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="h-96 bg-slate-200 rounded-3xl md:col-span-1"></div>
          <div className="h-96 bg-slate-200 rounded-3xl md:col-span-2"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto py-20 px-4 text-center space-y-4">
      <h2 className="text-xl font-bold text-slate-900">Item not found</h2>
      <p className="text-xs text-slate-500">
        {error
          ? "This report may have been deleted or does not exist."
          : "This report could not be opened."}
      </p>
      <Link
        href="/"
        className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-semibold"
      >
        <ArrowLeft className="w-4 h-4" /> Return to Home
      </Link>
    </div>
  );
}
