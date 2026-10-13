"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import { DashboardStats, ItemReport, MatchItem } from "../../types";
import { Badge } from "../../components/ui/Badge";
import { SimilarityMeter } from "../../components/items/SimilarityMeter";
import {
  LayoutDashboard,
  Sparkles,
  PlusCircle,
  Package,
  CheckCircle2,
  Clock,
  ArrowRight,
  ExternalLink,
  MapPin,
  Calendar,
  AlertCircle,
  Tag,
  Trash2,
} from "lucide-react";

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, loading: authLoading } = useAuth();
  const [activeTab, setActiveTab] = useState<"reports" | "matches">("reports");
  const [itemToDelete, setItemToDelete] = useState<ItemReport | null>(null);

  // Delete Report Mutation
  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      await api.delete(`/reports/${reportId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      router.refresh();
    },
  });

  // Fetch Dashboard Stats
  const { data: stats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/dashboard/stats");
      return res.data?.data;
    },
    enabled: !!user,
  });

  // Fetch User's Own Reports
  const { data: myReports, isLoading: reportsLoading } = useQuery<ItemReport[]>({
    queryKey: ["my-reports"],
    queryFn: async () => {
      const res = await api.get("/reports/my");
      return res.data?.data;
    },
    enabled: !!user,
  });

  // Fetch User's Matches Feed
  const { data: myMatches, isLoading: matchesLoading } = useQuery<MatchItem[]>({
    queryKey: ["my-matches"],
    queryFn: async () => {
      const res = await api.get("/matches/my");
      return res.data?.data;
    },
    enabled: !!user,
  });

  if (!authLoading && !user) {
    return (
      <div className="max-w-md mx-auto py-24 px-4 text-center space-y-4">
        <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mx-auto">
          <LayoutDashboard className="w-6 h-6" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Dashboard Access Required</h2>
        <p className="text-xs text-slate-500">
          Sign in or create an account to view your activity and matches.
        </p>
        <Link
          href="/login?redirect=/dashboard"
          className="inline-block px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700 shadow-sm"
        >
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 w-full space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            <LayoutDashboard className="w-6 h-6 text-indigo-600" />
            Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Welcome back, <strong className="text-slate-800">{user?.name}</strong>. Monitor your active reports and algorithmic matches.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <Link
            href="/report/lost"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all hover:scale-[1.02]"
          >
            <PlusCircle className="w-3.5 h-3.5" />
            Report Lost
          </Link>
          <Link
            href="/report/found"
            className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-semibold rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-all hover:scale-[1.02]"
          >
            <Sparkles className="w-3.5 h-3.5" />
            Report Found
          </Link>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        {/* Total Lost */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Lost Reports</span>
            <div className="w-8 h-8 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center">
              <Package className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            {statsLoading ? "—" : stats?.userStats.totalLost ?? 0}
          </p>
          <p className="text-[11px] text-slate-400">Items you reported missing</p>
        </div>

        {/* Total Found */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Found Reports</span>
            <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            {statsLoading ? "—" : stats?.userStats.totalFound ?? 0}
          </p>
          <p className="text-[11px] text-slate-400">Items you safely recovered</p>
        </div>

        {/* Active Matches */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Discovered Matches</span>
            <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-600 flex items-center justify-center">
              <Clock className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-amber-600">
            {statsLoading ? "—" : stats?.userStats.activeMatches ?? 0}
          </p>
          <p className="text-[11px] text-slate-400">Similarity score ≥60%</p>
        </div>

        {/* Resolved */}
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-semibold uppercase tracking-wider">Reunited & Resolved</span>
            <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <p className="text-2xl sm:text-3xl font-black text-slate-900">
            {statsLoading ? "—" : stats?.userStats.resolvedItems ?? 0}
          </p>
          <p className="text-[11px] text-slate-400">Successfully closed reports</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 border-b border-slate-200">
          <button
            onClick={() => setActiveTab("reports")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "reports"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Package className="w-4 h-4" />
            My Reports ({myReports?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("matches")}
            className={`px-4 py-2.5 text-xs font-bold border-b-2 transition-all flex items-center gap-2 ${
              activeTab === "matches"
                ? "border-indigo-600 text-indigo-600"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sparkles className="w-4 h-4" />
            Active Match Feed ({myMatches?.length || 0})
          </button>
        </div>

        {/* Tab 1: My Reports */}
        {activeTab === "reports" && (
          <div className="space-y-4">
            {reportsLoading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-24 bg-white rounded-2xl animate-pulse border border-slate-200" />
                ))}
              </div>
            ) : myReports && myReports.length > 0 ? (
              <div className="grid grid-cols-1 gap-3">
                {myReports.map((item) => (
                  <div
                    key={item.id}
                    className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:border-slate-300 transition-all"
                  >
                    <div className="flex items-center gap-3.5">
                      <div className="w-14 h-14 rounded-xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200/60">
                        {item.imageUrl ? (
                          <img
                            src={item.imageUrl}
                            alt={item.itemName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-slate-400">
                            <Tag className="w-6 h-6 stroke-[1.5]" />
                          </div>
                        )}
                      </div>

                      <div className="space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <Badge variant={item.type === "LOST" ? "lost" : "found"} size="sm">
                            {item.type}
                          </Badge>
                          {item.status === "MATCH_FOUND" && (
                            <span className="px-2 py-0.5 text-[10px] font-bold bg-amber-500 text-white rounded-full flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5" />
                              {item.matchesCount ? `${item.matchesCount} Match` : "Match Found"}
                            </span>
                          )}
                          {item.status === "RESOLVED" && (
                            <Badge variant="resolved" size="sm">Resolved</Badge>
                          )}
                          <span className="text-[11px] text-slate-400">
                            {item.category?.name}
                          </span>
                        </div>

                        <h3 className="text-sm font-bold text-slate-900">
                          {item.itemName}
                        </h3>

                        <div className="flex items-center gap-3 text-[11px] text-slate-500">
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            {item.location}
                          </span>
                          <span>•</span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3 text-slate-400" />
                            {new Date(item.date).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 self-end sm:self-center">
                      <Link
                        href={`/items/${item.id}`}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold flex items-center gap-1.5 transition-all"
                      >
                        <span>View Details</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                      <button
                        onClick={() => setItemToDelete(item)}
                        disabled={deleteReportMutation.isPending}
                        title="Delete report"
                        className="p-1.5 rounded-xl text-rose-600 bg-rose-50 hover:bg-rose-100 border border-rose-200 transition-all disabled:opacity-50 hover:scale-105"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 space-y-3">
                <Package className="w-10 h-10 text-slate-300 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">No reports filed yet</h4>
                <p className="text-xs text-slate-500">
                  When you report a lost or found item, it will appear here with active match tracking.
                </p>
                <div className="flex justify-center gap-3 pt-2">
                  <Link
                    href="/report/lost"
                    className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold shadow-xs"
                  >
                    Report Lost Item
                  </Link>
                  <Link
                    href="/report/found"
                    className="px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xs"
                  >
                    Report Found Item
                  </Link>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Matches Feed */}
        {activeTab === "matches" && (
          <div className="space-y-4">
            {matchesLoading ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-32 bg-white rounded-2xl animate-pulse border border-slate-200" />
                ))}
              </div>
            ) : myMatches && myMatches.length > 0 ? (
              <div className="grid grid-cols-1 gap-4">
                {myMatches.map((match) => (
                  <div
                    key={match.id}
                    className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-xs space-y-4 hover:border-indigo-300 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-indigo-600" />
                        <span className="text-xs font-bold text-slate-900">
                          Automated Algorithmic Match Discovery
                        </span>
                      </div>
                      <span
                        className={`text-xs font-extrabold px-3 py-1 rounded-full self-start sm:self-auto ${
                          match.similarityScore >= 90
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : match.similarityScore >= 75
                            ? "bg-indigo-100 text-indigo-800 border border-indigo-300"
                            : "bg-amber-100 text-amber-800 border border-amber-300"
                        }`}
                      >
                        {Math.round(match.similarityScore)}% Similarity Confidence
                      </span>
                    </div>

                    {/* Paired comparison preview */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                      {/* My Item */}
                      <div className="p-3 bg-slate-50 rounded-xl border border-slate-200/60 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                          Your Report ({match.myItem?.type})
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {match.myItem?.itemName}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {match.myItem?.location}
                        </p>
                      </div>

                      {/* Counterpart */}
                      <div className="p-3 bg-indigo-50/50 rounded-xl border border-indigo-200/70 space-y-1">
                        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                          Discovered Item ({match.matchedItem?.type})
                        </span>
                        <h4 className="text-xs font-bold text-slate-900 truncate">
                          {match.matchedItem?.itemName}
                        </h4>
                        <p className="text-[11px] text-slate-500 truncate">
                          {match.matchedItem?.location}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">
                        Discovered {new Date(match.createdAt).toLocaleDateString()}
                      </span>
                      <Link
                        href={`/items/${match.myItem?.id}`}
                        className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-700"
                      >
                        <span>Inspect Match Factors</span>
                        <ExternalLink className="w-3.5 h-3.5" />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white rounded-3xl p-10 text-center border border-slate-200/80 space-y-3">
                <Sparkles className="w-10 h-10 text-indigo-300 mx-auto" />
                <h4 className="font-bold text-slate-800 text-sm">No matches discovered yet</h4>
                <p className="text-xs text-slate-500 max-w-sm mx-auto">
                  Our algorithm will notify you as soon as an item matching yours at 60%+ similarity is reported.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Delete Confirmation Modal */}
      {itemToDelete && (
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
                Are you sure you want to delete "{itemToDelete.itemName}"? This item will be removed immediately.
              </p>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setItemToDelete(null)}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-all"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => {
                  const id = itemToDelete.id;
                  setItemToDelete(null);
                  deleteReportMutation.mutate(id);
                }}
                disabled={deleteReportMutation.isPending}
                className="flex-1 py-2.5 px-4 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
              >
                {deleteReportMutation.isPending ? "Deleting..." : "Confirm Delete"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
