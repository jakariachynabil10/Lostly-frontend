import React from "react";
import { MatchFactor } from "../../types";
import { CheckCircle2, AlertCircle, Sparkles } from "lucide-react";

interface MatchFactorsListProps {
  factors: MatchFactor[];
}

export const MatchFactorsList: React.FC<MatchFactorsListProps> = ({ factors }) => {
  if (!factors || factors.length === 0) {
    return (
      <div className="text-center py-4 text-xs text-slate-400">
        No breakdown factors available.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between pb-2 border-b border-slate-100">
        <h4 className="text-xs font-bold uppercase tracking-wider text-slate-700 flex items-center gap-1.5">
          <Sparkles className="w-3.5 h-3.5 text-indigo-500" />
          Algorithmic Sub-Metrics Breakdown
        </h4>
        <span className="text-[11px] text-slate-400">8 Factor Analysis</span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {factors.map((factor, index) => {
          const isFull = factor.score >= 0.8;
          const isPartial = factor.score >= 0.4 && factor.score < 0.8;

          return (
            <div
              key={index}
              className={`p-3 rounded-xl border transition-all ${
                isFull
                  ? "bg-emerald-50/50 border-emerald-200/70"
                  : isPartial
                  ? "bg-indigo-50/40 border-indigo-200/70"
                  : "bg-slate-50 border-slate-200/60"
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex items-center gap-1.5">
                  {isFull || factor.matched ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-amber-500 shrink-0" />
                  )}
                  <span className="text-xs font-semibold text-slate-800">
                    {factor.factor}
                  </span>
                </div>
                <span className="text-[11px] font-bold text-slate-600 bg-white/90 px-1.5 py-0.5 rounded border border-slate-200/70 shrink-0">
                  {factor.earned} / {factor.weight} pts
                </span>
              </div>

              <p className="mt-1.5 text-[11px] text-slate-600 leading-snug">
                {factor.details}
              </p>

              {/* Mini progress bar */}
              <div className="mt-2 w-full bg-slate-200/70 rounded-full h-1 overflow-hidden">
                <div
                  className={`h-full ${
                    isFull
                      ? "bg-emerald-500"
                      : isPartial
                      ? "bg-indigo-500"
                      : "bg-amber-400"
                  }`}
                  style={{ width: `${Math.round(factor.score * 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
