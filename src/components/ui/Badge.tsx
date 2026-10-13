import React from "react";

interface BadgeProps {
  children: React.ReactNode;
  variant?:
    | "lost"
    | "found"
    | "active"
    | "match_found"
    | "resolved"
    | "closed"
    | "strong"
    | "possible"
    | "neutral";
  size?: "sm" | "md";
  className?: string;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = "neutral",
  size = "md",
  className = "",
}) => {
  const sizeClasses = size === "sm" ? "px-2 py-0.5 text-[10px]" : "px-2.5 py-1 text-xs";

  const variantClasses = {
    lost: "bg-rose-50 text-rose-700 border-rose-200/80 font-medium",
    found: "bg-emerald-50 text-emerald-700 border-emerald-200/80 font-medium",
    active: "bg-sky-50 text-sky-700 border-sky-200/80 font-medium",
    match_found: "bg-amber-50 text-amber-800 border-amber-200 font-semibold",
    resolved: "bg-purple-50 text-purple-700 border-purple-200 font-medium",
    closed: "bg-slate-100 text-slate-700 border-slate-200 font-medium",
    strong: "bg-emerald-100/80 text-emerald-900 border-emerald-300 font-bold",
    possible: "bg-indigo-100/80 text-indigo-900 border-indigo-300 font-bold",
    neutral: "bg-slate-100 text-slate-700 border-slate-200 font-normal",
  }[variant];

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full border shadow-2xs tracking-wide transition-all ${sizeClasses} ${variantClasses} ${className}`}
    >
      {children}
    </span>
  );
};
