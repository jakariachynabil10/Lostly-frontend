"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getNotifications,
  getSafeNotificationPath,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../lib/notifications-api";

export const NotificationBell: React.FC = () => {
  const { user } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [isOpen, setIsOpen] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);

  const unreadQuery = useQuery({
    queryKey: ["notification-unread-count"],
    queryFn: getUnreadNotificationCount,
    enabled: Boolean(user),
    refetchInterval: () =>
      typeof document !== "undefined" && document.visibilityState === "visible"
        ? 45_000
        : false,
  });

  const notificationsQuery = useQuery({
    queryKey: ["notifications", 1, 5],
    queryFn: () => getNotifications({ page: 1, limit: 5 }),
    enabled: Boolean(user && isOpen),
  });

  const refreshNotifications = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] }),
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
    ]);
  };

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: refreshNotifications,
    onError: () => setActionError("Could not update the notification."),
  });
  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: refreshNotifications,
    onError: () => setActionError("Could not update notifications."),
  });

  if (!user) return null;

  const openNotification = async (id: string, link: string | null) => {
    setActionError(null);
    const notification = notificationsQuery.data?.notifications.find(
      (item) => item.id === id,
    );
    try {
      if (notification && !notification.read) {
        await markReadMutation.mutateAsync(id);
      }
    } catch {
      return;
    }

    setIsOpen(false);
    router.push(getSafeNotificationPath(link) || "/notifications");
  };

  const unreadCount = unreadQuery.data?.count ?? 0;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        aria-label={`Notifications${unreadCount ? `, ${unreadCount} unread` : ""}`}
        aria-expanded={isOpen}
        className="relative flex h-9 w-9 items-center justify-center rounded-full text-slate-600 transition hover:bg-slate-100 hover:text-indigo-600"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 min-w-4 rounded-full bg-rose-500 px-1 text-center text-[9px] font-bold leading-4 text-white ring-2 ring-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div
          className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-xl"
          role="dialog"
          aria-label="Notifications"
        >
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-900">Notifications</h2>
            <button
              type="button"
              onClick={() => markAllMutation.mutate()}
              disabled={!unreadCount || markAllMutation.isPending}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-indigo-600 hover:text-indigo-700 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              <CheckCheck className="h-3.5 w-3.5" />
              Mark all as read
            </button>
          </div>

          <div className="max-h-80 overflow-y-auto p-2">
            {actionError && (
              <p role="alert" className="px-3 py-2 text-[11px] text-rose-600">
                {actionError}
              </p>
            )}
            {notificationsQuery.isLoading ? (
              <p className="p-4 text-center text-xs text-slate-500">Loading notifications...</p>
            ) : notificationsQuery.isError ? (
              <p role="alert" className="p-4 text-center text-xs text-rose-600">
                Notifications could not be loaded.
              </p>
            ) : notificationsQuery.data?.notifications.length ? (
              notificationsQuery.data.notifications.map((notification) => (
                <button
                  type="button"
                  key={notification.id}
                  onClick={() => openNotification(notification.id, notification.link)}
                  className={`w-full rounded-xl p-3 text-left transition hover:bg-slate-50 ${
                    notification.read ? "bg-white" : "bg-indigo-50/70"
                  }`}
                >
                  <span className="flex items-start gap-2">
                    {!notification.read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-indigo-600" />
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
                    {notification.read && <Check className="h-3.5 w-3.5 text-emerald-500" />}
                  </span>
                </button>
              ))
            ) : (
              <p className="p-4 text-center text-xs text-slate-500">You are all caught up.</p>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              router.push("/notifications");
            }}
            className="w-full border-t border-slate-100 px-4 py-3 text-center text-xs font-semibold text-indigo-600 hover:bg-slate-50"
          >
            View all notifications
          </button>
        </div>
      )}
    </div>
  );
};
