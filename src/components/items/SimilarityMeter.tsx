import React from "react";

interface SimilarityMeterProps {
  score: number;
  size?: "sm" | "md" | "lg";
}

export const SimilarityMeter: React.FC<SimilarityMeterProps> = ({
  score,
  size = "md",
}) => {
  const rounded = Math.round(score);

  let colorScheme = {
    bg: "bg-amber-500",
    text: "text-amber-700",
    badgeBg: "bg-amber-50 text-amber-700 border-amber-200",
    label: "Possible Match",
  };

  if (score >= 90) {
    colorScheme = {
      bg: "bg-emerald-500",
      text: "text-emerald-700",
      badgeBg: "bg-emerald-50 text-emerald-700 border-emerald-200",
      label: "Very Strong Match",
    };
  } else if (score >= 75) {
    colorScheme = {
      bg: "bg-indigo-600",
      text: "text-indigo-700",
      badgeBg: "bg-indigo-50 text-indigo-700 border-indigo-200",
      label: "Strong Possible Match",
    };
  }

  if (size === "sm") {
    return (
      <div className="flex items-center gap-2">
        <div className="w-16 bg-slate-100 rounded-full h-2 overflow-hidden border border-slate-200">
          <div
            className={`h-full ${colorScheme.bg} transition-all duration-500`}
            style={{ width: `${Math.min(100, Math.max(0, rounded))}%` }}
          />
        </div>
        <span className={`text-xs font-bold ${colorScheme.text}`}>{rounded}%</span>
      </div>
    );
  }

  if (size === "lg") {
    return (
      <div className="flex flex-col items-center justify-center p-6 bg-white rounded-2xl border border-slate-200/80 shadow-xs">
        <div className="relative w-28 h-28 flex items-center justify-center">
          <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
            <path
              className="text-slate-100"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
            <path
              className={`${score >= 90 ? "text-emerald-500" : score >= 75 ? "text-indigo-600" : "text-amber-500"} transition-all duration-1000 ease-out`}
              strokeDasharray={`${rounded}, 100`}
              strokeLinecap="round"
              strokeWidth="3.5"
              stroke="currentColor"
              fill="none"
              d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
            />
          </svg>
          <div className="absolute flex flex-col items-center justify-center">
            <span className="text-2xl font-black tracking-tight text-slate-900">
              {rounded}%
            </span>
            <span className="text-[10px] uppercase font-bold text-slate-400">Match</span>
          </div>
        </div>

        <div className={`mt-3 px-3 py-1 rounded-full text-xs font-bold border ${colorScheme.badgeBg}`}>
          {colorScheme.label}
        </div>
      </div>
    );
  }

  // Default md
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between text-xs">
        <span className="font-semibold text-slate-700">Similarity Confidence</span>
        <span className={`font-bold ${colorScheme.text}`}>{rounded}% ({colorScheme.label})</span>
      </div>
      <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden border border-slate-200/80">
        <div
          className={`h-full ${colorScheme.bg} transition-all duration-500 rounded-full`}
          style={{ width: `${Math.min(100, Math.max(0, rounded))}%` }}
        />
      </div>
    </div>
  );
};
