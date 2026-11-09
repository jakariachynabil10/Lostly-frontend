"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Bell, Check, CheckCheck, ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../../context/AuthContext";
import {
  getNotifications,
  getSafeNotificationPath,
  markAllNotificationsRead,
  markNotificationRead,
} from "../../lib/notifications-api";

const PAGE_SIZE = 10;

export default function NotificationsPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [actionError, setActionError] = useState<string | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace("/login");
    }
  }, [authLoading, router, user]);

  const notificationsQuery = useQuery({
    queryKey: ["notifications", page, PAGE_SIZE],
    queryFn: () => getNotifications({ page, limit: PAGE_SIZE }),
    enabled: Boolean(user),
  });

  const invalidateNotificationQueries = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["notifications"] }),
      queryClient.invalidateQueries({ queryKey: ["notification-unread-count"] }),
      queryClient.invalidateQueries({ queryKey: ["dashboard-stats"] }),
    ]);
  };

  const markReadMutation = useMutation({
    mutationFn: markNotificationRead,
    onSuccess: invalidateNotificationQueries,
    onError: () => setActionError("Could not mark this notification as read."),
  });
  const markAllMutation = useMutation({
    mutationFn: markAllNotificationsRead,
    onSuccess: invalidateNotificationQueries,
    onError: () => setActionError("Could not mark notifications as read."),
  });

  const openNotification = async (id: string, link: string | null) => {
    setActionError(null);
    const notification = notificationsQuery.data?.notifications.find(
      (item) => item.id === id,
    );

    if (notification && !notification.read) {
      try {
        await markReadMutation.mutateAsync(id);
      } catch {
        return;
      }
    }

    const safePath = getSafeNotificationPath(link);
    if (safePath) {
      router.push(safePath);
    }
  };

  const data = notificationsQuery.data;

  return (
    <div className="flex-1 bg-gradient-to-b from-indigo-50/40 via-white to-slate-50 px-4 py-10 sm:px-6">
      <div className="mx-auto w-full max-w-3xl">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <div className="mb-2 flex items-center gap-2 text-indigo-600">
              <Bell className="h-5 w-5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Inbox</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">Notifications</h1>
            <p className="mt-1 text-sm text-slate-500">
              Updates about matches, claims, and item recovery.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setActionError(null);
              markAllMutation.mutate();
            }}
            disabled={!data?.unreadCount || markAllMutation.isPending}
            className="inline-flex items-center justify-center gap-2 rounded-xl border border-indigo-200 bg-white px-4 py-2 text-xs font-semibold text-indigo-700 shadow-sm transition hover:bg-indigo-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            Mark all as read
          </button>
        </div>

        {actionError && (
          <p role="alert" className="mb-4 rounded-xl border border-rose-200 bg-rose-50 p-3 text-sm text-rose-700">
            {actionError}
          </p>
        )}

        {notificationsQuery.isLoading || authLoading ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center text-sm text-slate-500">
            Loading notifications...
          </div>
        ) : notificationsQuery.isError ? (
          <div role="alert" className="rounded-2xl border border-rose-200 bg-rose-50 p-8 text-center text-sm text-rose-700">
            Notifications could not be loaded. Please try again.
            <button
              type="button"
              onClick={() => notificationsQuery.refetch()}
              className="ml-2 font-semibold underline"
            >
              Retry
            </button>
          </div>
        ) : !data?.notifications.length ? (
          <div className="rounded-2xl border border-slate-200 bg-white p-10 text-center">
            <Bell className="mx-auto h-8 w-8 text-slate-300" />
            <h2 className="mt-3 text-base font-semibold text-slate-800">You&apos;re all caught up</h2>
            <p className="mt-1 text-sm text-slate-500">New updates will appear here.</p>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              {data.notifications.map((notification) => (
                <article
                  key={notification.id}
                  className={`rounded-2xl border p-4 shadow-sm transition sm:p-5 ${
                    notification.read
                      ? "border-slate-200 bg-white"
                      : "border-indigo-200 bg-indigo-50/60"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    {!notification.read && (
                      <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-indigo-600" />
                    )}
                    <div className="min-w-0 flex-1">
                      <button
                        type="button"
                        onClick={() => openNotification(notification.id, notification.link)}
                        className="text-left"
                      >
                        <h2 className="text-sm font-semibold text-slate-900">
                          {notification.title}
                        </h2>
                        <p className="mt-1 text-sm leading-5 text-slate-600">
                          {notification.message}
                        </p>
                      </button>
                      <p className="mt-2 text-xs text-slate-400">
                        {new Date(notification.createdAt).toLocaleString()}
                      </p>
                    </div>
                    {!notification.read && (
                      <button
                        type="button"
                        onClick={() => {
                          setActionError(null);
                          markReadMutation.mutate(notification.id);
                        }}
                        disabled={markReadMutation.isPending}
                        aria-label={`Mark ${notification.title} as read`}
                        className="shrink-0 rounded-lg p-2 text-indigo-600 transition hover:bg-white hover:text-indigo-700 disabled:opacity-50"
                      >
                        <Check className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-5 flex items-center justify-between rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-500">
              <span>
                Page {data.page} of {Math.max(data.totalPages, 1)}
              </span>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.max(1, current - 1))}
                  disabled={page <= 1}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setPage((current) => Math.min(data.totalPages, current + 1))}
                  disabled={page >= data.totalPages}
                  className="rounded-lg border border-slate-200 p-2 text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
