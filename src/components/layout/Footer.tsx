"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Compass, Shield, Sparkles } from "lucide-react";

export const Footer: React.FC = () => {
  const pathname = usePathname();

  if (pathname?.startsWith("/dashboard")) {
    return null;
  }
  return (
    <footer className="bg-slate-900 text-slate-300 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center text-white shadow-md">
                <Compass className="w-4 h-4 text-white stroke-[2.2]" />
              </div>
              <span className="text-xl font-bold tracking-tight text-white">
                Lost<span className="text-indigo-400">ly</span>
              </span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Automated multi-factor similarity matching platform bridging the gap between lost belongings and honest finders.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Explore
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <Link href="/lost-items" className="hover:text-white transition-colors">
                  Lost Items Directory
                </Link>
              </li>
              <li>
                <Link href="/found-items" className="hover:text-white transition-colors">
                  Found Items Directory
                </Link>
              </li>
              <li>
                <Link href="/report/lost" className="hover:text-white transition-colors">
                  File Lost Report
                </Link>
              </li>
              <li>
                <Link href="/report/found" className="hover:text-white transition-colors">
                  File Found Report
                </Link>
              </li>
            </ul>
          </div>

          {/* Matching Engine Specs */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200 mb-3">
              Matching Intelligence
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-indigo-400" /> Jaro-Winkler & Token Similarity
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-emerald-400" /> Location Distance Weighting
              </li>
              <li className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5 text-pink-400" /> Color Taxonomy Analysis
              </li>
              <li className="flex items-center gap-1.5">
                <Shield className="w-3.5 h-3.5 text-amber-400" /> Automated Verification
              </li>
            </ul>
          </div>

          {/* Platform Status */}
          <div className="space-y-3">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
              Platform Status
            </h4>
            <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-emerald-950/60 border border-emerald-800 text-[11px] text-emerald-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Matching Engine Active (Phase 1)
            </div>
            <p className="text-[11px] text-slate-500">
              Protected by JWT session authentication and encrypted tokens.
            </p>
          </div>
        </div>

        <div className="border-t border-slate-800 pt-6 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <p>© {new Date().getFullYear()} Lostly Inc. All rights reserved.</p>
          <p className="flex items-center gap-1">
            Built with modern full-stack TypeScript & Next.js
          </p>
        </div>
      </div>
    </footer>
  );
};
