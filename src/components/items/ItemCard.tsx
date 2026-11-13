import React from "react";
import Link from "next/link";
import { ItemReport } from "../../types";
import { Badge } from "../ui/Badge";
import { MapPin, Calendar, Sparkles, Tag, PackageSearch } from "lucide-react";

interface ItemCardProps {
  item: ItemReport;
}

export const ItemCard: React.FC<ItemCardProps> = ({ item }) => {
  const isLost = item.type === "LOST";

  const formattedDate = new Date(item.date).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  return (
    <Link
      href={`/${item.type === "LOST" ? "lost-items" : "found-items"}/${item.id}`}
      className="group block bg-white rounded-2xl border border-slate-200/80 overflow-hidden shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-300 hover:-translate-y-0.5"
    >
      {/* Media container */}
      <div className="relative aspect-4/3 bg-slate-100 overflow-hidden">
        {item.imageUrl ? (
          <img
            src={item.imageUrl}
            alt={item.itemName}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-50 to-slate-100 text-slate-400 p-4 text-center">
            <PackageSearch className="w-10 h-10 text-slate-300 mb-2 stroke-[1.5]" />
            <span className="text-xs font-medium text-slate-400">
              No photo provided
            </span>
          </div>
        )}

        {/* Top Badges */}
        <div className="absolute top-3 left-3 flex flex-wrap items-center gap-1.5">
          <Badge variant={isLost ? "lost" : "found"}>
            {isLost ? "LOST" : "FOUND"}
          </Badge>
          {item.status === "MATCH_FOUND" && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold rounded-full bg-amber-500 text-white shadow-xs animate-pulse">
              <Sparkles className="w-2.5 h-2.5" />
              {item.matchesCount ? `${item.matchesCount} Match` : "Match Found"}
            </span>
          )}
          {item.status === "RESOLVED" && (
            <Badge variant="resolved">Resolved</Badge>
          )}
        </div>

        {/* Category Pill on bottom right of image */}
        <div className="absolute bottom-3 right-3">
          <span className="px-2 py-1 text-[11px] font-medium bg-slate-900/75 backdrop-blur-md text-white rounded-md shadow-xs flex items-center gap-1">
            <Tag className="w-2.5 h-2.5" />
            {item.category?.name || "Uncategorized"}
          </span>
        </div>
      </div>

      {/* Card Body */}
      <div className="p-4 space-y-2.5">
        <div>
          <h3 className="font-semibold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors line-clamp-1">
            {item.itemName}
          </h3>
          {(item.brand || item.color) && (
            <p className="text-[11px] text-slate-500 line-clamp-1">
              {[item.brand, item.color].filter(Boolean).join(" • ")}
            </p>
          )}
        </div>

        <p className="text-xs text-slate-600 line-clamp-2 leading-relaxed">
          {item.description}
        </p>

        {/* Metadata Footer */}
        <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
          <div className="flex items-center gap-1 truncate max-w-[55%]">
            <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span className="truncate">{item.location}</span>
          </div>
          <div className="flex items-center gap-1 shrink-0 text-slate-400">
            <Calendar className="w-3.5 h-3.5" />
            <span>{formattedDate}</span>
          </div>
        </div>
      </div>
    </Link>
  );
};
