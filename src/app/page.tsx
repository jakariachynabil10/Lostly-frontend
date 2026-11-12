"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { api } from "../lib/api";
import { ItemReport } from "../types";
import { ItemCard } from "../components/items/ItemCard";
import {
  Search,
  Sparkles,
  ArrowRight,
  PlusCircle,
} from "lucide-react";

export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedType, setSelectedType] = useState<"LOST" | "FOUND">("LOST");

  // Fetch recent lost items
  const { data: lostData, isLoading: loadingLost } = useQuery({
    queryKey: ["recent-lost"],
    queryFn: async () => {
      const res = await api.get("/reports", {
        params: { type: "LOST", limit: 4, sortBy: "createdAt", sortOrder: "desc" },
      });
      return res.data?.data?.reports as ItemReport[];
    },
  });

  // Fetch recent found items
  const { data: foundData, isLoading: loadingFound } = useQuery({
    queryKey: ["recent-found"],
    queryFn: async () => {
      const res = await api.get("/reports", {
        params: { type: "FOUND", limit: 4, sortBy: "createdAt", sortOrder: "desc" },
      });
      return res.data?.data?.reports as ItemReport[];
    },
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    const targetPath = selectedType === "LOST" ? "/lost-items" : "/found-items";
    router.push(`${targetPath}?search=${encodeURIComponent(searchQuery.trim())}`);
  };

  return (
    <div className="flex flex-col gap-16 pb-20">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-b from-indigo-50/60 via-slate-50 to-white pt-16 pb-20 border-b border-slate-200/60">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(120,119,198,0.15),rgba(255,255,255,0))]" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-indigo-100/70 border border-indigo-200/80 text-xs font-semibold text-indigo-800 shadow-2xs animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-indigo-600 animate-pulse" />
            <span>Next-Gen Lost & Found Similarity Engine</span>
          </div>

          {/* Heading */}
          <div className="max-w-3xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight leading-[1.15]">
              Reuniting what was lost with{" "}
              <span className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                intelligent matching.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
              Lostly pairs lost items with found reports using multi-metric algorithmic scoring across name, brand, color, location distance, and date proximity.
            </p>
          </div>

          {/* Search Box & Quick Type Select */}
          <div className="max-w-2xl mx-auto">
            <form
              onSubmit={handleSearchSubmit}
              className="bg-white p-2 rounded-2xl shadow-xl shadow-indigo-500/5 border border-slate-200/90 flex flex-col sm:flex-row items-center gap-2"
            >
              {/* Type Switcher */}
              <div className="flex bg-slate-100 p-1 rounded-xl w-full sm:w-auto shrink-0">
                <button
                  type="button"
                  onClick={() => setSelectedType("LOST")}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    selectedType === "LOST"
                      ? "bg-white text-rose-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Lost Items
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedType("FOUND")}
                  className={`flex-1 sm:flex-none px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                    selectedType === "FOUND"
                      ? "bg-white text-emerald-600 shadow-xs"
                      : "text-slate-600 hover:text-slate-900"
                  }`}
                >
                  Found Items
                </button>
              </div>

              {/* Input */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search keys, iPhone, black backpack, wallet..."
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-transparent border-0 focus:outline-none focus:ring-0 placeholder:text-slate-400 text-slate-800"
                />
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full sm:w-auto px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-semibold transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-1.5 shrink-0"
              >
                Search
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            <div className="mt-3 flex items-center justify-center gap-2 text-xs text-slate-500 flex-wrap">
              <span className="font-medium text-slate-400">Popular:</span>
              <button
                type="button"
                onClick={() => router.push("/lost-items?search=iPhone")}
                className="hover:text-indigo-600 underline decoration-slate-300"
              >
                iPhone
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => router.push("/lost-items?search=Wallet")}
                className="hover:text-indigo-600 underline decoration-slate-300"
              >
                Leather Wallet
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => router.push("/found-items?search=Keys")}
                className="hover:text-indigo-600 underline decoration-slate-300"
              >
                Car Keys
              </button>
              <span>•</span>
              <button
                type="button"
                onClick={() => router.push("/found-items?search=Backpack")}
                className="hover:text-indigo-600 underline decoration-slate-300"
              >
                Black Backpack
              </button>
            </div>
          </div>

          {/* Action CTAs */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-2">
            <Link
              href="/report/lost"
              className="px-5 py-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-semibold text-sm shadow-md shadow-rose-600/20 transition-all hover:scale-[1.02] flex items-center gap-2"
            >
              <PlusCircle className="w-4 h-4" />
              Report a Lost Item
            </Link>
            <Link
              href="/report/found"
              className="px-5 py-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 transition-all hover:scale-[1.02] flex items-center gap-2"
            >
              <Sparkles className="w-4 h-4" />
              I Found Something
            </Link>
          </div>
        </div>
      </section>

      {/* Matching Engine Showcase — 3 Steps */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12 space-y-3">
          <h2 className="text-xs font-bold uppercase tracking-wider text-indigo-600">
            How The Matching Engine Works
          </h2>
          <p className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
            Automated, high-precision recovery workflow
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-lg border border-rose-200/60">
              1
            </div>
            <h3 className="font-bold text-slate-900 text-base">Submit Report & Details</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Upload photos, enter brand, color, approximate date, and geographical location where the item was lost or found.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold text-lg border border-indigo-200/60">
              2
            </div>
            <h3 className="font-bold text-slate-900 text-base">Algorithmic Scoring Engine</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Our backend calculates Jaro-Winkler string distance, token Dice similarity, color taxonomy, and location overlap across 8 distinct factors.
            </p>
          </div>

          <div className="bg-white p-6 rounded-2xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all space-y-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold text-lg border border-emerald-200/60">
              3
            </div>
            <h3 className="font-bold text-slate-900 text-base">Instant High-Confidence Matches</h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Review matching factors breakdown with percentage confidence meters and reach out to reclaim your verified belonging.
            </p>
          </div>
        </div>
      </section>

      {/* Recent Lost Items */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
              Recently Reported Lost Items
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Have you seen any of these items around? Help someone find their belongings.
            </p>
          </div>
          <Link
            href="/lost-items"
            className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 group"
          >
            View All Lost Items
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loadingLost ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : lostData && lostData.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {lostData.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <p className="text-xs text-slate-500">No lost items reported yet.</p>
          </div>
        )}
      </section>

      {/* Recent Found Items */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
              Recently Reported Found Items
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Items safely recovered by community members waiting to be claimed.
            </p>
          </div>
          <Link
            href="/found-items"
            className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 group"
          >
            View All Found Items
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </Link>
        </div>

        {loadingFound ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl h-72 animate-pulse border border-slate-200" />
            ))}
          </div>
        ) : foundData && foundData.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-6">
            {foundData.map((item) => (
              <ItemCard key={item.id} item={item} />
            ))}
          </div>
        ) : (
          <div className="bg-white rounded-2xl p-8 text-center border border-slate-200">
            <p className="text-xs text-slate-500">No found items reported yet.</p>
          </div>
        )}
      </section>

      {/* Feature CTA Callout */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
        <div className="bg-gradient-to-r from-indigo-900 via-indigo-800 to-purple-900 rounded-3xl p-8 sm:p-12 text-white shadow-xl relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-8">
          <div className="space-y-3 max-w-xl z-10">
            <span className="px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider bg-white/10 text-indigo-200 border border-white/20">
              Community Powered
            </span>
            <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Lost something important today?
            </h3>
            <p className="text-xs sm:text-sm text-indigo-200 leading-relaxed">
              Don&apos;t panic. Submit a report in under two minutes. Our matching system automatically checks existing and newly incoming found items 24/7.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 z-10 shrink-0">
            <Link
              href="/report/lost"
              className="px-6 py-3 rounded-xl bg-white text-indigo-950 font-bold text-xs hover:bg-indigo-50 shadow-lg transition-all text-center"
            >
              File Report Now
            </Link>
            <Link
              href="/found-items"
              className="px-6 py-3 rounded-xl bg-indigo-700/60 hover:bg-indigo-700 text-white font-semibold text-xs border border-white/20 transition-all text-center"
            >
              Browse Found Directory
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
