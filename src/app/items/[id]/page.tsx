"use client";

import React, { useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft } from "lucide-react";
import { api } from "../../../lib/api";
import { ItemReport } from "../../../types";

export default function ItemRedirectPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.id as string;
  const { data, isLoading, error } = useQuery<{
    report: Pick<ItemReport, "type">;
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
