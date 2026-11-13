import React from "react";
import {
  Ban,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  PackageCheck,
  XCircle,
} from "lucide-react";
import { ClaimStatus } from "../../types";
import { Badge } from "../ui/Badge";

const statusPresentation: Record<
  ClaimStatus,
  {
    label: string;
    variant: "possible" | "active" | "found" | "lost" | "closed" | "resolved";
    Icon: React.ComponentType<{ className?: string }>;
  }
> = {
  PENDING: { label: "Pending", variant: "possible", Icon: Clock3 },
  UNDER_REVIEW: {
    label: "Under review",
    variant: "active",
    Icon: ClipboardCheck,
  },
  APPROVED: { label: "Approved", variant: "found", Icon: CheckCircle2 },
  REJECTED: { label: "Rejected", variant: "lost", Icon: XCircle },
  CANCELLED: { label: "Cancelled", variant: "closed", Icon: Ban },
  COMPLETED: { label: "Completed", variant: "resolved", Icon: PackageCheck },
};

interface ClaimStatusBadgeProps {
  status: ClaimStatus;
  size?: "sm" | "md";
}

export function ClaimStatusBadge({
  status,
  size = "sm",
}: ClaimStatusBadgeProps) {
  const { label, variant, Icon } = statusPresentation[status];

  return (
    <Badge variant={variant} size={size}>
      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
      <span>{label}</span>
    </Badge>
  );
}
