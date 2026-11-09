"use client";

import React, { useState, useMemo } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { api } from "../../lib/api";
import {
  DashboardStats,
  ItemReport,
  MatchFactor,
  MatchItem,
  NotificationItem,
} from "../../types";
import {
  getSafeNotificationPath,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../lib/notifications-api";
import {
  LayoutGrid,
  List,
  FileText,
  ShieldCheck,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  Bell,
  ChevronDown,
  Shield,
  ArrowRight,
  Activity,
  ThumbsUp,
  MapPin,
  Clock,
  Zap,
  Info,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  X,
  Menu,
  Check,
  PlusCircle,
  Trash2,
  ExternalLink,
  Sparkles,
  Layers,
} from "lucide-react";

interface DisplayMatch {
  id: string;
  code: string;
  itemName: string;
  type: "LOST" | "FOUND";
  location: string;
  timeAgo: string;
  score: number;
  imageUrl: string;
  reportId?: string;
  factors?: MatchFactor[];
}

function formatTimeAgo(dateString?: string): string {
  if (!dateString) return "Recently";
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMinutes = Math.floor(diffMs / (1000 * 60));
  if (diffMinutes < 5) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes} mins ago`;
  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours === 1) return "1 hour ago";
  if (diffHours < 24) return `${diffHours} hours ago`;
  const diffDays = Math.floor(diffHours / 24);
  if (diffDays === 1) return "Yesterday";
  return `${diffDays} days ago`;
}

// Generate smooth cubic bezier SVG paths
function generateSplinePath(
  values: number[],
  width = 540,
  height = 160,
  maxY = 12
): { line: string; area: string } {
  const paddingLeft = 35;
  const paddingTop = 20;
  const usableWidth = width - 40;
  const usableHeight = height - 30;
  const step = usableWidth / Math.max(1, values.length - 1);

  const points = values.map((v, i) => {
    const x = paddingLeft + i * step;
    const clampedV = Math.min(maxY, Math.max(0, v));
    const y = paddingTop + (1 - clampedV / maxY) * usableHeight;
    return { x, y };
  });

  if (points.length < 2) return { line: "", area: "" };

  let line = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const curr = points[i];
    const next = points[i + 1];
    const cp1x = curr.x + (next.x - curr.x) / 2;
    const cp1y = curr.y;
    const cp2x = curr.x + (next.x - curr.x) / 2;
    const cp2y = next.y;
    line += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${next.x} ${next.y}`;
  }

  const baseY = paddingTop + usableHeight;
  const area = `${line} L ${points[points.length - 1].x} ${baseY} L ${points[0].x} ${baseY} Z`;

  return { line, area };
}

export default function DashboardPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, logout, loading: authLoading } = useAuth();

  // Navigation & UI States
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [profileDropdownOpen, setProfileDropdownOpen] = useState(false);
  const [notificationOpen, setNotificationOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeViewTab, setActiveViewTab] = useState<"matches" | "reports">("matches");
  const [dismissedMatchIds, setDismissedMatchIds] = useState<Set<string>>(new Set());

  // Modal States
  const [selectedMatchModal, setSelectedMatchModal] = useState<DisplayMatch | null>(null);
  const [trustModalOpen, setTrustModalOpen] = useState(false);
  const [assistanceModalOpen, setAssistanceModalOpen] = useState(false);
  const [reportToDelete, setReportToDelete] = useState<ItemReport | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch Dynamic Dashboard Stats
  const {
    data: stats,
    isLoading: statsLoading,
    isError: statsError,
  } = useQuery<DashboardStats>({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const res = await api.get("/dashboard/stats");
      return res.data?.data;
    },
    enabled: !!user,
  });

  const unreadNotificationsQuery = useQuery({
    queryKey: ["notification-unread-count"],
    queryFn: getUnreadNotificationCount,
    enabled: Boolean(user),
    refetchInterval: () =>
      typeof document !== "undefined" && document.visibilityState === "visible"
        ? 45_000
        : false,
  });

  const refreshNotificationData = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] }),
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
    ]);
  };

  const markNotificationReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: refreshNotificationData,
    onError: () => showToast("Could not update the notification."),
  });
  const markAllNotificationsReadMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: refreshNotificationData,
    onError: () => showToast("Could not update notifications."),
  });

  const openDashboardNotification = async (notification: NotificationItem) => {
    try {
      if (!notification.read) {
        await markNotificationReadMutation.mutateAsync(notification.id);
      }
      setNotificationOpen(false);
      router.push(
        getSafeNotificationPath(notification.link) || "/notifications",
      );
    } catch {
      showToast("Could not open this notification. Please try again.");
    }
  };

  // 2. Fetch User's Own Reports
  const { data: myReports } = useQuery<ItemReport[]>({
    queryKey: ["my-reports"],
    queryFn: async () => {
      const res = await api.get("/reports/my");
      return res.data?.data;
    },
    enabled: !!user,
  });

  // 3. Fetch User's Matches Feed
  const { data: myMatches, isLoading: matchesLoading } = useQuery<MatchItem[]>({
    queryKey: ["my-matches"],
    queryFn: async () => {
      const res = await api.get("/matches/my");
      return res.data?.data;
    },
    enabled: !!user,
  });

  // Mutations
  const markResolvedMutation = useMutation({
    mutationFn: async (reportId: string) => {
      await api.put(`/reports/${reportId}`, { status: "RESOLVED" });
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      showToast("Item marked as successfully resolved!");
    },
  });

  const deleteReportMutation = useMutation({
    mutationFn: async (reportId: string) => {
      await api.delete(`/reports/${reportId}`);
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries();
      setReportToDelete(null);
      showToast("Report deleted successfully.");
    },
  });

  // Baseline Mockup Matches (shown if user has 0 matches so design is never empty)
  const fallbackMatches: DisplayMatch[] = [
    {
      id: "demo-match-1",
      code: "N-7821",
      itemName: "Leather Wallet",
      type: "LOST",
      location: "Central Park North",
      timeAgo: "2 hours ago",
      score: 94,
      imageUrl:
        "https://images.unsplash.com/photo-1627123424574-724758594e93?w=300&auto=format&fit=crop&q=80",
    },
    {
      id: "demo-match-2",
      code: "N-7019",
      itemName: "Silver Keys",
      type: "LOST",
      location: "Starbucks 5th Ave",
      timeAgo: "5 hours ago",
      score: 81,
      imageUrl:
        "https://images.unsplash.com/photo-1582139329536-e7284fece509?w=300&auto=format&fit=crop&q=80",
    },
  ];

  // Dynamic Matches List
  const allMatches: DisplayMatch[] = useMemo(() => {
    if (myMatches && myMatches.length > 0) {
      return myMatches.map((m) => {
        const counterpart = m.matchedItem || m.counterpart || m.myItem;
        const codeSuffix = counterpart?.id ? counterpart.id.slice(0, 4).toUpperCase() : "8820";
        return {
          id: m.id,
          code: `N-${codeSuffix}`,
          itemName: counterpart?.itemName || "Reported Belonging",
          type: (counterpart?.type as "LOST" | "FOUND") || "LOST",
          location: counterpart?.location || "Reported Area",
          timeAgo: formatTimeAgo(m.createdAt || counterpart?.date),
          score: Math.round(m.similarityScore),
          imageUrl:
            counterpart?.imageUrl ||
            "https://images.unsplash.com/photo-1627123424574-724758594e93?w=300&auto=format&fit=crop&q=80",
          reportId: counterpart?.id,
          factors: m.matchingFactors,
        };
      });
    }
    return fallbackMatches;
  }, [myMatches]);

  // Active filtered matches (excluding dismissed)
  const filteredMatches = useMemo(() => {
    return allMatches
      .filter((m) => !dismissedMatchIds.has(m.id))
      .filter(
        (m) =>
          m.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
          m.code.toLowerCase().includes(searchQuery.toLowerCase())
      );
  }, [allMatches, dismissedMatchIds, searchQuery]);

  // Filtered reports for "My Reports" view
  const filteredReports = useMemo(() => {
    if (!myReports) return [];
    return myReports.filter(
      (r) =>
        r.itemName.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.location.toLowerCase().includes(searchQuery.toLowerCase()) ||
        r.category?.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [myReports, searchQuery]);

  // Top high-confidence match for AI Intelligence Box
  const topMatch = useMemo(() => {
    if (filteredMatches.length === 0) return fallbackMatches[0];
    return [...filteredMatches].sort((a, b) => b.score - a.score)[0];
  }, [filteredMatches]);

  // Handlers
  const handleDismissMatch = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setDismissedMatchIds((prev) => new Set(prev).add(id));
    showToast("Match removed from active queue.");
  };

  const handleConfirmMatch = (match: DisplayMatch, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedMatchModal(match);
  };

  const handleLogout = async () => {
    await logout();
    router.push("/login");
  };

  // Dynamic user details
  const displayName = user?.name ? user.name.split(" ")[0] : "Ahmed";
  const fullName = user?.name || "Alex Rivers";
  const userInitials = user?.name
    ? user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "UN";
  const userAvatar =
    user?.profileImage ||
    "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80";

  // Dynamic Stat Values
  const activeReportsCount = useMemo(() => {
    if (stats?.userStats) {
      const active =
        stats.userStats.totalLost +
        stats.userStats.totalFound -
        stats.userStats.resolvedItems;
      return Math.max(0, active);
    }
    if (myReports) {
      return myReports.filter((r) => r.status === "ACTIVE" || r.status === "MATCH_FOUND").length;
    }
    return 4;
  }, [stats, myReports]);

  const potentialMatchesCount = useMemo(() => {
    if (stats?.userStats?.activeMatches !== undefined) {
      return stats.userStats.activeMatches;
    }
    if (myMatches) return myMatches.length;
    return 12;
  }, [stats, myMatches]);

  const recoveredItemsCount = useMemo(() => {
    if (stats?.userStats?.resolvedItems !== undefined) {
      return stats.userStats.resolvedItems;
    }
    if (myReports) {
      return myReports.filter((r) => r.status === "RESOLVED").length;
    }
    return 2;
  }, [stats, myReports]);

  // Dynamic Spline Curves
  const weeklyTrends = stats?.weeklyTrends || {
    days: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    reports: [2, 4, 5, 8, 7, 10, 12],
    matches: [1, 2, 2, 3, 3, 4, 3],
    percentIncrease: 24,
  };

  const maxYValue = Math.max(
    12,
    Math.max(...weeklyTrends.reports, ...weeklyTrends.matches) + 2
  );

  const reportSpline = useMemo(
    () => generateSplinePath(weeklyTrends.reports, 550, 170, maxYValue),
    [weeklyTrends.reports, maxYValue]
  );

  const matchSpline = useMemo(
    () => generateSplinePath(weeklyTrends.matches, 550, 170, maxYValue),
    [weeklyTrends.matches, maxYValue]
  );

  return (
    <div className="min-h-screen bg-[#f8fafc] text-slate-800 flex font-sans antialiased">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white text-xs font-medium px-4 py-3 rounded-xl shadow-xl flex items-center gap-2 animate-fade-in border border-slate-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Mobile Sidebar Overlay */}
      {mobileSidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm md:hidden"
          onClick={() => setMobileSidebarOpen(false)}
        />
      )}

      {/* ========================================================= */}
      {/* LEFT SIDEBAR                                              */}
      {/* ========================================================= */}
      <aside
        className={`fixed md:sticky top-0 left-0 z-50 h-screen w-60 bg-white border-r border-slate-200/80 flex flex-col justify-between py-6 px-4 transition-transform duration-200 ease-in-out ${
          mobileSidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}
      >
        <div className="space-y-8">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 px-3 group">
            <div className="w-9 h-9 rounded-xl bg-[#4338ca] flex items-center justify-center text-white shadow-sm shadow-indigo-500/20 group-hover:scale-105 transition-transform">
              <Search className="w-4 h-4 text-white stroke-[2.6]" />
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">
              Lostly
            </span>
          </Link>

          {/* Main Navigation */}
          <nav className="space-y-1.5">
            <button
              onClick={() => setActiveViewTab("matches")}
              className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-semibold transition-colors text-left ${
                activeViewTab === "matches"
                  ? "bg-slate-100 text-slate-900"
                  : "text-slate-500 hover:text-slate-900 hover:bg-slate-50 font-medium"
              }`}
            >
              <LayoutGrid className="w-4 h-4 text-slate-700" />
              <span>Dashboard</span>
            </button>

            <Link
              href="/lost-items"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium transition-colors"
            >
              <List className="w-4 h-4 text-slate-400" />
              <span>Browse Items</span>
            </Link>

            <Link
              href="/report/lost"
              className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium transition-colors"
            >
              <FileText className="w-4 h-4 text-slate-400" />
              <span>Report Item</span>
            </Link>

            <button
              onClick={() => setTrustModalOpen(true)}
              className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium transition-colors text-left"
            >
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              <span>Trust & Safety</span>
            </button>
          </nav>
        </div>

        {/* Bottom Navigation */}
        <div className="space-y-1.5 pt-6 border-t border-slate-100">
          <Link
            href="/profile"
            className="flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium transition-colors"
          >
            <Settings className="w-4 h-4 text-slate-400" />
            <span>Settings</span>
          </Link>

          <button
            onClick={() => setAssistanceModalOpen(true)}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-slate-500 hover:text-slate-900 hover:bg-slate-50 text-xs font-medium transition-colors text-left"
          >
            <HelpCircle className="w-4 h-4 text-slate-400" />
            <span>Help Center</span>
          </button>

          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-rose-500 hover:text-rose-600 hover:bg-rose-50/70 text-xs font-medium transition-colors text-left cursor-pointer"
          >
            <LogOut className="w-4 h-4 text-rose-500" />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* ========================================================= */}
      {/* MAIN LAYOUT WRAPPER                                       */}
      {/* ========================================================= */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Header Bar */}
        <header className="sticky top-0 z-30 h-16 bg-white border-b border-slate-200/80 px-6 sm:px-8 flex items-center justify-between gap-4">
          {/* Left: Mobile hamburger & Breadcrumb */}
          <div className="flex items-center gap-4">
            <button
              onClick={() => setMobileSidebarOpen(true)}
              className="p-1.5 rounded-lg text-slate-500 hover:bg-slate-100 md:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-1.5 text-xs">
              <span className="text-slate-400 font-medium">Dashboard</span>
              <span className="text-slate-300">/</span>
              <span className="text-slate-700 font-medium">
                {activeViewTab === "matches" ? "My Reported Items" : "My Reports Catalog"}
              </span>
            </div>
          </div>

          {/* Right: Search, Notifications, Profile Pill */}
          <div className="flex items-center gap-4 sm:gap-6">
            {/* Search Pill */}
            <div className="relative hidden sm:block w-64 lg:w-80">
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search items, locations, or reports..."
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-slate-50/80 hover:bg-slate-100/60 focus:bg-white border border-slate-200/80 rounded-full text-slate-700 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
              />
            </div>

            {/* Notification Bell */}
            <div className="relative">
              <button
                onClick={() => setNotificationOpen(!notificationOpen)}
                className="w-8 h-8 rounded-full hover:bg-slate-100 text-slate-600 flex items-center justify-center relative transition-colors cursor-pointer"
                id="bell-notifications-btn"
              >
                <Bell className="w-4 h-4 text-slate-600" />
                {(unreadNotificationsQuery.data?.count || 0) > 0 && (
                  <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[9px] font-bold leading-4 text-white ring-2 ring-white">
                    {(unreadNotificationsQuery.data?.count || 0) > 99
                      ? "99+"
                      : unreadNotificationsQuery.data?.count}
                  </span>
                )}
              </button>

              {/* Notification Popover */}
              {notificationOpen && (
                <div
                  className="absolute right-0 mt-2 w-80 bg-white rounded-2xl shadow-xl border border-slate-200/80 p-3.5 z-50 animate-fade-in space-y-2"
                  onMouseLeave={() => setNotificationOpen(false)}
                >
                  <div className="flex items-center justify-between pb-2 border-b border-slate-100 px-1">
                    <span className="text-xs font-bold text-slate-900">Notifications</span>
                    <button
                      type="button"
                      onClick={() => markAllNotificationsReadMutation.mutate()}
                      disabled={
                        !(unreadNotificationsQuery.data?.count || 0) ||
                        markAllNotificationsReadMutation.isPending
                      }
                      className="text-[10px] font-semibold text-indigo-600 disabled:text-slate-400"
                    >
                      Mark all as read
                    </button>
                  </div>
                  <div className="space-y-1.5 max-h-60 overflow-y-auto">
                    {statsLoading ? (
                      <p className="p-3 text-center text-[11px] text-slate-500">
                        Loading notifications...
                      </p>
                    ) : stats?.recentNotifications?.length ? (
                      stats.recentNotifications.slice(0, 5).map((notification) => (
                        <button
                          type="button"
                          key={notification.id}
                          onClick={() => openDashboardNotification(notification)}
                          className={`w-full rounded-xl p-2.5 text-left text-xs transition hover:bg-indigo-50 ${
                            notification.read ? "bg-white" : "bg-indigo-50/50"
                          }`}
                        >
                          <span className="block font-semibold text-slate-900">
                            {notification.title}
                          </span>
                          <span className="mt-0.5 block truncate text-[11px] text-slate-500">
                            {notification.message}
                          </span>
                        </button>
                      ))
                    ) : (
                      <p className="p-3 text-center text-[11px] text-slate-500">
                        No notifications yet.
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setNotificationOpen(false);
                      router.push("/notifications");
                    }}
                    className="w-full border-t border-slate-100 pt-2 text-center text-[11px] font-semibold text-indigo-600"
                  >
                    View all notifications
                  </button>
                </div>
              )}
            </div>

            {/* User Profile Pill */}
            <div className="relative">
              <button
                onClick={() => setProfileDropdownOpen(!profileDropdownOpen)}
                className="flex items-center gap-2.5 pl-1 pr-2 py-1 rounded-full hover:bg-slate-100 transition-colors cursor-pointer"
                id="header-user-profile-btn"
              >
                <div className="w-8 h-8 rounded-full bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                  {user?.profileImage ? (
                    <img
                      src={user.profileImage}
                      alt={fullName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-xs font-bold text-slate-700">{userInitials}</span>
                  )}
                </div>
                <div className="text-left hidden lg:block leading-tight pr-1">
                  <p className="text-xs font-semibold text-slate-800">{fullName}</p>
                  <p className="text-[10px] text-slate-400">Verified Member</p>
                </div>
                <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
              </button>

              {/* User Dropdown */}
              {profileDropdownOpen && (
                <div
                  className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-200/80 py-2 z-50 animate-fade-in"
                  onMouseLeave={() => setProfileDropdownOpen(false)}
                >
                  <div className="px-4 py-2 border-b border-slate-100">
                    <p className="text-xs font-semibold text-slate-900">{fullName}</p>
                    <p className="text-[11px] text-slate-500 truncate">
                      {user?.email || "alex.rivers@lostly.com"}
                    </p>
                  </div>
                  <Link
                    href="/profile"
                    onClick={() => setProfileDropdownOpen(false)}
                    className="flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50"
                  >
                    <Settings className="w-3.5 h-3.5 text-slate-400" />
                    Account Settings
                  </Link>
                  <button
                    onClick={() => {
                      setTrustModalOpen(true);
                      setProfileDropdownOpen(false);
                    }}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-slate-700 hover:bg-slate-50 text-left cursor-pointer"
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
                    Trust Rating
                  </button>
                  <div className="border-t border-slate-100 my-1" />
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-2.5 px-4 py-2 text-xs text-rose-600 hover:bg-rose-50 text-left cursor-pointer"
                  >
                    <LogOut className="w-3.5 h-3.5 text-rose-500" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Dashboard Body Content */}
        <main className="flex-1 p-6 sm:p-8 max-w-[1500px] w-full mx-auto space-y-7">
          {/* Guest Warning Banner if not logged in */}
          {!authLoading && !user && (
            <div className="p-3.5 rounded-2xl bg-indigo-50 border border-indigo-200/70 flex items-center justify-between text-xs text-indigo-900">
              <span className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-indigo-600 shrink-0" />
                Viewing live interactive demo dashboard. Log in to track your personal reports.
              </span>
              <Link
                href="/login"
                className="px-3 py-1 rounded-lg bg-indigo-600 text-white font-semibold hover:bg-indigo-700 shrink-0 ml-2"
              >
                Sign In
              </Link>
            </div>
          )}

          {/* ======================================================= */}
          {/* ROW 1: WELCOME BANNER & SECURITY STATUS CARD             */}
          {/* ======================================================= */}
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            {/* Left: Avatar & Welcome text */}
            <div className="flex items-center gap-3.5">
              <div className="relative">
                <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-800 ring-2 ring-slate-100 shrink-0">
                  <img
                    src={userAvatar}
                    alt={displayName}
                    className="w-full h-full object-cover"
                  />
                </div>
                {/* Active online green dot */}
                <span className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 ring-2 ring-white" />
              </div>
              <div>
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900">
                  Welcome back, {displayName}
                </h1>
                <p className="text-xs text-slate-500 mt-0.5">
                  You have{" "}
                  <strong className="text-indigo-600 font-semibold">
                    {potentialMatchesCount} new
                  </strong>{" "}
                  high-confidence matches today.
                </p>
              </div>
            </div>

            {/* Right: Security Status Card */}
            <div
              onClick={() => setTrustModalOpen(true)}
              className="flex items-center gap-4 bg-[#f3f4fd] hover:bg-[#eef0fc] border border-indigo-100/90 rounded-2xl px-5 py-3.5 transition-all cursor-pointer shadow-2xs self-start lg:self-auto"
            >
              <div className="w-10 h-10 rounded-xl bg-[#4338ca] text-white flex items-center justify-center shrink-0 shadow-sm shadow-indigo-600/20">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Security Status
                  </span>
                  <span className="bg-[#4338ca] text-white text-[9px] font-semibold px-2 py-0.5 rounded-full">
                    Verified
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900">Elite Trust Rating</p>
                <p className="text-[11px] text-slate-500">Your account is fully verified.</p>
              </div>
              <ArrowRight className="w-4 h-4 text-[#4338ca] ml-2 shrink-0" />
            </div>
          </div>

          {/* ======================================================= */}
          {/* ROW 2: 6 STAT METRIC CARDS                              */}
          {/* ======================================================= */}
          <div className="grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-6">
            {/* Card 1: Active Reports */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <Activity className="w-5 h-5 text-[#6366f1]" />
                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  +1 this week
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Active Reports</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  {statsLoading ? "..." : activeReportsCount}
                </p>
              </div>
            </div>

            {/* Card 2: Potential Matches */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <Search className="w-5 h-5 text-[#06b6d4]" />
                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  High Confidence
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Potential Matches</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  {matchesLoading ? "..." : potentialMatchesCount}
                </p>
              </div>
            </div>

            {/* Card 3: Items Recovered */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <ThumbsUp className="w-5 h-5 text-[#10b981]" />
                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Last: June 12
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Items Recovered</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  {statsLoading ? "..." : recoveredItemsCount}
                </p>
              </div>
            </div>

            {/* Card 4: Trust Score */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <ShieldCheck className="w-5 h-5 text-[#3b82f6]" />
                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Trust Score</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  98%
                </p>
              </div>
            </div>

            {/* Card 5: Pending Claims */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <Clock className="w-5 h-5 text-amber-500" />
                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  In progress
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Pending Claims</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  {statsLoading ? "..." : stats?.userStats.pendingClaims ?? "-"}
                </p>
              </div>
            </div>

            {/* Card 6: Successful Recoveries */}
            <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <span className="text-[10px] font-medium text-slate-500 bg-slate-100 px-2 py-0.5 rounded-full">
                  Completed
                </span>
              </div>
              <div>
                <p className="text-xs text-slate-500 font-medium">Successful Recoveries</p>
                <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-0.5">
                  {statsLoading ? "..." : stats?.userStats.successfulRecoveries ?? "-"}
                </p>
              </div>
            </div>
          </div>

          {/* ======================================================= */}
          {/* ROW 3: TWO-COLUMN MAIN CONTENT (LEFT 8 COLS, RIGHT 4)   */}
          {/* ======================================================= */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-7">
            {/* ----------------------------------------------------- */}
            {/* LEFT COLUMN (COL 1 TO 8)                              */}
            {/* ----------------------------------------------------- */}
            <div className="lg:col-span-8 space-y-7">
              {/* Section Header with View Mode Switcher */}
              <div className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <h2 className="text-base font-bold text-slate-900">
                      {activeViewTab === "matches"
                        ? "Recent AI Matches"
                        : "My Filed Reports"}
                    </h2>
                    {activeViewTab === "reports" && (
                      <span className="text-xs bg-indigo-50 text-indigo-700 font-semibold px-2 py-0.5 rounded-full">
                        {myReports?.length || 0} Total
                      </span>
                    )}
                  </div>

                  {/* Toggle Button */}
                  <button
                    onClick={() =>
                      setActiveViewTab(activeViewTab === "matches" ? "reports" : "matches")
                    }
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors cursor-pointer"
                  >
                    {activeViewTab === "matches" ? "View all reports" : "Back to matches"}
                  </button>
                </div>

                {/* VIEW 1: RECENT AI MATCHES */}
                {activeViewTab === "matches" && (
                  <div className="space-y-3">
                    {filteredMatches.length === 0 ? (
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-2">
                        <p className="text-xs text-slate-500">No active matches found.</p>
                        <Link
                          href="/report/lost"
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-indigo-600 text-white rounded-xl text-xs font-semibold hover:bg-indigo-700"
                        >
                          <PlusCircle className="w-3.5 h-3.5" />
                          File New Report
                        </Link>
                      </div>
                    ) : (
                      filteredMatches.map((item) => {
                        const isHigh = item.score >= 90;
                        return (
                          <div
                            key={item.id}
                            className="bg-white border border-slate-200/80 rounded-2xl p-4 sm:p-4.5 shadow-2xs hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                          >
                            {/* Item Left: Image & Metadata */}
                            <div className="flex items-center gap-3.5">
                              {/* Thumbnail */}
                              <div className="relative w-16 h-16 rounded-xl overflow-hidden bg-slate-100 border border-slate-200/60 shrink-0">
                                <img
                                  src={item.imageUrl}
                                  alt={item.itemName}
                                  className="w-full h-full object-cover"
                                />
                                <span className="absolute top-1 left-1 bg-black/60 backdrop-blur-sm text-white text-[8px] font-mono px-1 py-0.5 rounded leading-none">
                                  {item.code}
                                </span>
                              </div>

                              {/* Info */}
                              <div className="space-y-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="text-sm font-bold text-slate-900">
                                    {item.itemName}
                                  </h3>
                                  <span className="text-[9px] font-semibold text-slate-500 bg-slate-100 px-1.5 py-0.5 rounded uppercase">
                                    {item.type}
                                  </span>
                                </div>
                                <div className="flex items-center gap-3 text-[11px] text-slate-500">
                                  <span className="flex items-center gap-1">
                                    <MapPin className="w-3 h-3 text-slate-400" />
                                    {item.location}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="w-3 h-3 text-slate-400" />
                                    {item.timeAgo}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Item Right: Score & Actions */}
                            <div className="flex items-center justify-between sm:justify-end gap-5">
                              {/* Score & Gauge */}
                              <div className="text-right space-y-1 shrink-0">
                                <div className="flex items-center justify-end gap-1.5">
                                  <span className="text-[10px] font-bold text-slate-400">
                                    AI MATCH
                                  </span>
                                  <span
                                    className={`text-xs font-black ${
                                      isHigh ? "text-emerald-500" : "text-amber-500"
                                    }`}
                                  >
                                    {item.score}%
                                  </span>
                                </div>
                                <div className="w-24 sm:w-28 h-1 bg-slate-100 rounded-full overflow-hidden">
                                  <div
                                    className={`h-full rounded-full ${
                                      isHigh ? "bg-emerald-500" : "bg-amber-500"
                                    }`}
                                    style={{ width: `${item.score}%` }}
                                  />
                                </div>
                              </div>

                              {/* Buttons */}
                              <div className="flex items-center gap-2">
                                <button
                                  onClick={(e) => handleDismissMatch(item.id, e)}
                                  className="px-3.5 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
                                >
                                  Dismiss
                                </button>
                                <button
                                  onClick={(e) => handleConfirmMatch(item, e)}
                                  className="px-4 py-1.5 text-xs font-semibold text-white bg-[#4338ca] hover:bg-[#3730a3] rounded-lg shadow-sm shadow-indigo-600/20 transition-all cursor-pointer"
                                >
                                  Confirm Match
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                )}

                {/* VIEW 2: MY FILED REPORTS CATALOG */}
                {activeViewTab === "reports" && (
                  <div className="space-y-3">
                    {filteredReports.length === 0 ? (
                      <div className="bg-white border border-slate-200/80 rounded-2xl p-8 text-center space-y-2">
                        <p className="text-xs text-slate-500">You haven&apos;t submitted any reports yet.</p>
                        <div className="flex justify-center gap-2 pt-2">
                          <Link
                            href="/report/lost"
                            className="px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 text-xs font-semibold"
                          >
                            + Report Lost
                          </Link>
                          <Link
                            href="/report/found"
                            className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 text-xs font-semibold"
                          >
                            + Report Found
                          </Link>
                        </div>
                      </div>
                    ) : (
                      filteredReports.map((report) => (
                        <div
                          key={report.id}
                          className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-2xs hover:shadow-md transition-shadow flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                        >
                          <div className="flex items-center gap-3.5">
                            {report.imageUrl ? (
                              <img
                                src={report.imageUrl}
                                alt={report.itemName}
                                className="w-14 h-14 rounded-xl object-cover border border-slate-200 shrink-0"
                              />
                            ) : (
                              <div className="w-14 h-14 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center shrink-0 text-slate-400">
                                <Layers className="w-5 h-5" />
                              </div>
                            )}

                            <div className="space-y-1">
                              <div className="flex items-center gap-2">
                                <h3 className="text-sm font-bold text-slate-900">
                                  {report.itemName}
                                </h3>
                                <span
                                  className={`text-[9px] font-bold px-1.5 py-0.5 rounded uppercase ${
                                    report.type === "LOST"
                                      ? "bg-rose-50 text-rose-600"
                                      : "bg-emerald-50 text-emerald-600"
                                  }`}
                                >
                                  {report.type}
                                </span>
                                <span
                                  className={`text-[9px] font-semibold px-2 py-0.5 rounded-full ${
                                    report.status === "RESOLVED"
                                      ? "bg-emerald-100 text-emerald-800"
                                      : report.status === "MATCH_FOUND"
                                      ? "bg-indigo-100 text-indigo-800"
                                      : "bg-slate-100 text-slate-600"
                                  }`}
                                >
                                  {report.status.replace("_", " ")}
                                </span>
                              </div>
                              <p className="text-[11px] text-slate-500">
                                {report.category?.name} • {report.location} •{" "}
                                {formatTimeAgo(report.createdAt)}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center gap-2 self-end sm:self-center">
                            <Link
                              href={`/items/${report.id}`}
                              className="px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-50 rounded-lg flex items-center gap-1"
                            >
                              View Details
                              <ExternalLink className="w-3 h-3" />
                            </Link>

                            {report.status !== "RESOLVED" && (
                              <button
                                onClick={() => markResolvedMutation.mutate(report.id)}
                                className="px-3 py-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 rounded-lg cursor-pointer"
                              >
                                Mark Resolved
                              </button>
                            )}

                            <button
                              onClick={() => setReportToDelete(report)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg cursor-pointer"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Section: Matching Activity (Weekly Trends Spline Chart) */}
              <div className="space-y-3.5">
                <h2 className="text-base font-bold text-slate-900">
                  Matching Activity
                </h2>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-6 shadow-2xs space-y-6">
                  {/* Card Header */}
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-sm font-bold text-slate-900">
                        Weekly Trends
                      </h3>
                      <p className="text-xs text-slate-400 mt-0.5">
                        Visualizing report vs match correlations
                      </p>
                    </div>

                    <div className="inline-flex items-center gap-1 bg-indigo-50 text-indigo-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                      <TrendingUp className="w-3.5 h-3.5 text-indigo-600" />
                      <span>{weeklyTrends.percentIncrease}% increase</span>
                    </div>
                  </div>

                  {/* SVG Spline Area Chart */}
                  <div className="relative w-full overflow-hidden">
                    <svg
                      viewBox="0 0 600 200"
                      className="w-full h-44 sm:h-52 overflow-visible"
                    >
                      <defs>
                        {/* Reports Teal Gradient */}
                        <linearGradient id="tealGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.32" />
                          <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.01" />
                        </linearGradient>

                        {/* Matches Indigo Gradient */}
                        <linearGradient id="indigoGrad" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#4338ca" stopOpacity="0.35" />
                          <stop offset="100%" stopColor="#4338ca" stopOpacity="0.01" />
                        </linearGradient>
                      </defs>

                      {/* Horizontal Grid Lines */}
                      <line x1="30" y1="160" x2="590" y2="160" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="30" y1="120" x2="590" y2="120" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="30" y1="80" x2="590" y2="80" stroke="#f1f5f9" strokeWidth="1" />
                      <line x1="30" y1="40" x2="590" y2="40" stroke="#f1f5f9" strokeWidth="1" />

                      {/* Y-axis Labels */}
                      <text x="15" y="44" fill="#94a3b8" fontSize="10" textAnchor="middle">
                        {maxYValue}
                      </text>
                      <text x="15" y="84" fill="#94a3b8" fontSize="10" textAnchor="middle">
                        {Math.round((maxYValue * 3) / 4)}
                      </text>
                      <text x="15" y="124" fill="#94a3b8" fontSize="10" textAnchor="middle">
                        {Math.round(maxYValue / 2)}
                      </text>
                      <text x="15" y="164" fill="#94a3b8" fontSize="10" textAnchor="middle">
                        {Math.round(maxYValue / 4)}
                      </text>

                      {/* Teal Spline Area (Reports) */}
                      {reportSpline.area && (
                        <path d={reportSpline.area} fill="url(#tealGrad)" />
                      )}
                      {reportSpline.line && (
                        <path
                          d={reportSpline.line}
                          fill="none"
                          stroke="#06b6d4"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      )}

                      {/* Indigo Spline Area (Matches) */}
                      {matchSpline.area && (
                        <path d={matchSpline.area} fill="url(#indigoGrad)" />
                      )}
                      {matchSpline.line && (
                        <path
                          d={matchSpline.line}
                          fill="none"
                          stroke="#4338ca"
                          strokeWidth="2.5"
                          strokeLinecap="round"
                        />
                      )}

                      {/* X-axis Day Labels */}
                      {weeklyTrends.days.map((day, idx) => {
                        const stepX = (550 - 40) / (weeklyTrends.days.length - 1);
                        const posX = 35 + idx * stepX;
                        return (
                          <text
                            key={idx}
                            x={posX}
                            y="185"
                            fill="#94a3b8"
                            fontSize="10"
                            textAnchor="middle"
                          >
                            {day}
                          </text>
                        );
                      })}
                    </svg>
                  </div>

                  {/* Chart Legend */}
                  <div className="flex items-center justify-center gap-6 pt-2 border-t border-slate-50 text-xs">
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#06b6d4]" />
                      <span className="text-slate-600 font-medium">Reports</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="w-2.5 h-2.5 rounded-full bg-[#4338ca]" />
                      <span className="text-slate-600 font-medium">Matches</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* ----------------------------------------------------- */}
            {/* RIGHT COLUMN (COL 9 TO 12)                            */}
            {/* ----------------------------------------------------- */}
            <div className="lg:col-span-4 space-y-7">
              {/* Section: Recent Notifications */}
              <section className="space-y-3.5">
                <div className="flex items-center justify-between">
                  <h2 className="text-base font-bold text-slate-900">
                    Recent Notifications
                  </h2>
                  <button
                    type="button"
                    onClick={() => router.push("/notifications")}
                    className="text-xs font-semibold text-indigo-600 hover:text-indigo-700"
                  >
                    View all
                  </button>
                </div>
                <div className="rounded-2xl border border-slate-200/80 bg-white p-3 shadow-2xs">
                  {statsLoading ? (
                    <p className="p-3 text-center text-xs text-slate-500">
                      Loading notifications...
                    </p>
                  ) : statsError ? (
                    <p role="alert" className="p-3 text-center text-xs text-rose-600">
                      Recent notifications could not be loaded.
                    </p>
                  ) : stats?.recentNotifications?.length ? (
                    <div className="space-y-1">
                      {stats.recentNotifications.slice(0, 5).map((notification) => (
                        <button
                          type="button"
                          key={notification.id}
                          onClick={() => openDashboardNotification(notification)}
                          className={`w-full rounded-xl p-3 text-left transition hover:bg-slate-50 ${
                            notification.read ? "" : "bg-indigo-50/70"
                          }`}
                        >
                          <span className="flex items-start gap-2">
                            {!notification.read && (
                              <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
                            )}
                            <span className="min-w-0 flex-1">
                              <span className="block text-xs font-semibold text-slate-900">
                                {notification.title}
                              </span>
                              <span className="mt-1 block text-[11px] leading-4 text-slate-600">
                                {notification.message}
                              </span>
                              <span className="mt-1 block text-[10px] text-slate-400">
                                {new Date(notification.createdAt).toLocaleString()}
                              </span>
                            </span>
                          </span>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <p className="p-3 text-center text-xs text-slate-500">
                      You&apos;re all caught up.
                    </p>
                  )}
                </div>
              </section>

              {/* Section: AI Intelligence */}
              <div className="space-y-3.5">
                <h2 className="text-base font-bold text-slate-900">
                  AI Intelligence
                </h2>

                {/* Deep Royal Indigo Card */}
                <div className="relative bg-gradient-to-b from-[#2e26db] to-[#1c14b5] text-white rounded-3xl p-6 shadow-xl shadow-indigo-600/15 overflow-hidden">
                  {/* Decorative Swirl Watermark */}
                  <div className="absolute -top-10 -right-10 w-44 h-44 rounded-full border-[18px] border-white/10 pointer-events-none" />
                  <div className="absolute top-12 right-2 w-28 h-28 rounded-full border-[10px] border-white/5 pointer-events-none" />

                  {/* Top Badge */}
                  <div className="flex items-center gap-1.5 text-indigo-200">
                    <Zap className="w-3.5 h-3.5 text-indigo-200 fill-indigo-200" />
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Smart Match Insights
                    </span>
                  </div>

                  {/* Headings */}
                  <h3 className="text-xl font-bold tracking-tight text-white mt-3">
                    Probability Analytics
                  </h3>
                  <p className="text-xs text-indigo-100/80 leading-relaxed mt-1">
                    Based on your location history and item metadata.
                  </p>

                  {/* Density Indicator */}
                  <div className="mt-5 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="text-indigo-200">Local Search Density</span>
                      <span className="font-bold text-white">
                        {topMatch.score >= 90 ? "High" : "Optimal"}
                      </span>
                    </div>
                    <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-white rounded-full transition-all duration-500"
                        style={{ width: `${topMatch.score}%` }}
                      />
                    </div>
                  </div>

                  {/* Translucent Callout Box */}
                  <div className="mt-6 bg-white/10 backdrop-blur-md border border-white/20 rounded-2xl p-4 space-y-3.5">
                    <div className="flex items-start gap-2.5">
                      <Info className="w-4 h-4 text-white shrink-0 mt-0.5" />
                      <p className="text-xs text-white/95 leading-relaxed">
                        We found a {topMatch.score}% match for your{" "}
                        <strong>{topMatch.itemName}</strong> near {topMatch.location}. The item was reported {topMatch.timeAgo}.
                      </p>
                    </div>

                    <button
                      onClick={() => setSelectedMatchModal(topMatch)}
                      className="w-full py-2.5 rounded-xl bg-white text-[#2e26db] font-bold text-xs hover:bg-slate-50 transition-colors shadow-xs text-center block cursor-pointer"
                    >
                      Confirm Identity
                    </button>
                  </div>
                </div>
              </div>

              {/* Section: Identity & Trust */}
              <div className="space-y-3.5">
                <h2 className="text-base font-bold text-slate-900">
                  Identity & Trust
                </h2>

                <div className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-2xs space-y-4">
                  {/* Item 1: Verified ID */}
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Verified ID</p>
                        <p className="text-[11px] text-slate-400">
                          {user?.email ? "Email Verified" : "Passport Confirmed"}
                        </p>
                      </div>
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      Active
                    </span>
                  </div>

                  {/* Item 2: Ownership History */}
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Ownership History</p>
                        <p className="text-[11px] text-slate-400">
                          {recoveredItemsCount > 0 ? "Clean Recovery Record" : "Standard Rating"}
                        </p>
                      </div>
                    </div>
                    <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      Excellent
                    </span>
                  </div>

                  {/* Item 3: Location Access */}
                  <div className="flex items-center justify-between py-1">
                    <div className="flex items-center gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />
                      <div>
                        <p className="text-xs font-bold text-slate-900">Location Access</p>
                        <p className="text-[11px] text-slate-400">Background Sync</p>
                      </div>
                    </div>
                    <span className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-0.5 rounded-full">
                      Pending
                    </span>
                  </div>

                  {/* Action Button */}
                  <button
                    onClick={() => setTrustModalOpen(true)}
                    className="w-full mt-2 py-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 text-xs font-semibold transition-colors text-center block cursor-pointer"
                  >
                    View Trust Settings
                  </button>
                </div>
              </div>

              {/* Section: Need Assistance? */}
              <div className="bg-slate-50/70 border border-slate-200/60 rounded-2xl p-5 text-center space-y-2">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 text-slate-500 flex items-center justify-center mx-auto">
                  <Info className="w-4 h-4 text-slate-600" />
                </div>
                <h4 className="text-xs font-bold text-slate-900">Need Assistance?</h4>
                <p className="text-[11px] text-slate-500 leading-relaxed max-w-xs mx-auto">
                  Our community managers are available 24/7 to help you recover your items.
                </p>
                <button
                  onClick={() => setAssistanceModalOpen(true)}
                  className="text-xs font-bold text-[#4338ca] hover:underline cursor-pointer block mx-auto pt-1"
                >
                  Contact Recovery Team
                </button>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* ========================================================= */}
      {/* INTERACTIVE MODALS                                        */}
      {/* ========================================================= */}

      {/* Modal: Confirm Match Details */}
      {selectedMatchModal && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                <h3 className="text-base font-bold text-slate-900">Confirm Match</h3>
              </div>
              <button
                onClick={() => setSelectedMatchModal(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex items-center gap-4">
              <img
                src={selectedMatchModal.imageUrl}
                alt={selectedMatchModal.itemName}
                className="w-20 h-20 rounded-2xl object-cover border border-slate-200 shrink-0"
              />
              <div className="space-y-1">
                <p className="text-xs font-mono text-slate-400">{selectedMatchModal.code}</p>
                <h4 className="text-sm font-bold text-slate-900">
                  {selectedMatchModal.itemName}
                </h4>
                <p className="text-xs text-slate-500">{selectedMatchModal.location}</p>
                <span className="inline-block px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 font-bold text-[10px]">
                  {selectedMatchModal.score}% Algorithmic Match
                </span>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Confirming this match will notify the finder and initiate safe recovery verification. You can view the full factor analysis and coordinate handover safely.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <button
                onClick={() => setSelectedMatchModal(null)}
                className="flex-1 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 cursor-pointer"
              >
                Cancel
              </button>
              {selectedMatchModal.reportId ? (
                <Link
                  href={`/items/${selectedMatchModal.reportId}`}
                  className="flex-1 py-2.5 rounded-xl bg-[#4338ca] text-white text-xs font-bold hover:bg-[#3730a3] shadow-md shadow-indigo-600/20 text-center"
                >
                  View & Claim Item
                </Link>
              ) : (
                <button
                  onClick={() => {
                    setSelectedMatchModal(null);
                    showToast(`Match for ${selectedMatchModal.itemName} confirmed! Notification sent.`);
                  }}
                  className="flex-1 py-2.5 rounded-xl bg-[#4338ca] text-white text-xs font-bold hover:bg-[#3730a3] shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  Verify & Claim
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modal: Delete Report Confirmation */}
      {reportToDelete && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full p-6 shadow-2xl space-y-4 animate-slide-up">
            <h3 className="text-sm font-bold text-slate-900">Delete Report?</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to delete <strong>{reportToDelete.itemName}</strong>? This action cannot be undone.
            </p>
            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setReportToDelete(null)}
                className="flex-1 py-2 rounded-xl border border-slate-200 text-xs font-semibold"
              >
                Cancel
              </button>
              <button
                onClick={() => deleteReportMutation.mutate(reportToDelete.id)}
                className="flex-1 py-2 rounded-xl bg-rose-600 text-white text-xs font-semibold hover:bg-rose-700"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal: Trust Settings Profile */}
      {trustModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Trust & Safety Profile</h3>
              </div>
              <button
                onClick={() => setTrustModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="p-4 rounded-2xl bg-indigo-50/70 border border-indigo-100 text-xs space-y-1">
              <p className="font-bold text-indigo-900">Elite Trust Rating: 98%</p>
              <p className="text-indigo-700 text-[11px] leading-relaxed">
                Your trust rating gives your reports priority in algorithmic matching queues and fast-tracks recovery verification.
              </p>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-slate-800 font-medium">User Account</p>
                  <p className="text-[11px] text-slate-400">{user?.email || "alex.rivers@lostly.com"}</p>
                </div>
                <span className="text-emerald-600 font-bold flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" /> Active
                </span>
              </div>
              <div className="flex items-center justify-between p-3 rounded-xl bg-slate-50 border border-slate-100">
                <div>
                  <p className="text-slate-800 font-medium">Verified Recoveries</p>
                  <p className="text-[11px] text-slate-400">{recoveredItemsCount} items recovered</p>
                </div>
                <span className="text-emerald-600 font-bold">100% Rate</span>
              </div>
            </div>

            <button
              onClick={() => setTrustModalOpen(false)}
              className="w-full py-2.5 rounded-xl bg-[#4338ca] text-white text-xs font-bold hover:bg-[#3730a3] cursor-pointer"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Modal: Recovery Assistance Support */}
      {assistanceModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl space-y-5 animate-slide-up">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 text-indigo-600" />
                <h3 className="text-base font-bold text-slate-900">Recovery Support</h3>
              </div>
              <button
                onClick={() => setAssistanceModalOpen(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-400 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed">
              Our 24/7 community recovery team can assist in contacting venues, checking airport or transit lost-and-found desks, and arbitrating claims.
            </p>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-100 text-xs space-y-1">
              <p className="font-semibold text-slate-800">Support Hotline: (800) 555-LOST</p>
              <p className="text-slate-500 text-[11px]">Email: recovery-support@lostly.com</p>
            </div>

            <button
              onClick={() => {
                setAssistanceModalOpen(false);
                showToast("Support ticket created. A manager will reply shortly.");
              }}
              className="w-full py-2.5 rounded-xl bg-[#4338ca] text-white text-xs font-bold hover:bg-[#3730a3] cursor-pointer"
            >
              Start Urgent Recovery Chat
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
