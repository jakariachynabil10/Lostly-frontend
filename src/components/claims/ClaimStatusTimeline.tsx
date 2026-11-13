import React from "react";
import { Check, Circle, X } from "lucide-react";
import { ClaimStatus } from "../../types";

const stages: { status: ClaimStatus; label: string }[] = [
  { status: "PENDING", label: "Pending" },
  { status: "UNDER_REVIEW", label: "Under Review" },
  { status: "APPROVED", label: "Approved" },
  { status: "COMPLETED", label: "Completed" },
];

interface ClaimStatusTimelineProps {
  status: ClaimStatus;
}

export function ClaimStatusTimeline({ status }: ClaimStatusTimelineProps) {
  const terminal = status === "REJECTED" || status === "CANCELLED";
  const currentIndex = terminal
    ? 1
    : stages.findIndex((stage) => stage.status === status);

  return (
    <ol
      aria-label="Claim status"
      className="grid grid-cols-2 gap-3 sm:grid-cols-4"
    >
      {stages.map((stage, index) => {
        const complete = !terminal && index < currentIndex;
        const current = !terminal && index === currentIndex;
        return (
          <li
            key={stage.status}
            aria-current={current ? "step" : undefined}
            className={`flex items-center gap-2 rounded-xl border p-3 text-xs font-semibold ${
              current
                ? "border-indigo-300 bg-indigo-50 text-indigo-800"
                : complete
                  ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                  : "border-slate-200 bg-slate-50 text-slate-500"
            }`}
          >
            {complete ? (
              <Check aria-hidden="true" className="h-4 w-4 shrink-0" />
            ) : current ? (
              <Circle
                aria-hidden="true"
                className="h-4 w-4 shrink-0 fill-current"
              />
            ) : (
              <Circle aria-hidden="true" className="h-4 w-4 shrink-0" />
            )}
            <span>{stage.label}</span>
          </li>
        );
      })}
      {terminal && (
        <li className="col-span-2 flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800 sm:col-span-4">
          <X aria-hidden="true" className="h-4 w-4 shrink-0" />
          <span>Claim {status === "REJECTED" ? "Rejected" : "Cancelled"}</span>
          <span className="font-normal">— this claim is closed</span>
        </li>
      )}
    </ol>
  );
}
