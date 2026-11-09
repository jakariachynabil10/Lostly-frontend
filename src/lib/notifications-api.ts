import { z } from "zod";
import { api } from "./api";
import { NotificationItem, PaginatedNotifications } from "../types";

const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(15),
});

export async function getNotifications(options: { page?: number; limit?: number } = {}) {
  const params = paginationSchema.parse(options);
  const response = await api.get("/notifications", { params });
  return response.data.data as PaginatedNotifications;
}

export async function getUnreadNotificationCount() {
  const response = await api.get("/notifications/unread-count");
  return z.object({ count: z.number().int().nonnegative() }).parse(response.data.data);
}

export async function markNotificationRead(id: string) {
  const notificationId = z.string().min(1).parse(id);
  const response = await api.patch(`/notifications/${encodeURIComponent(notificationId)}/read`);
  return response.data.data as NotificationItem;
}

export async function markAllNotificationsRead() {
  const response = await api.patch("/notifications/read-all");
  return z.object({ updatedCount: z.number().int().nonnegative() }).parse(response.data.data);
}

export function getSafeNotificationPath(link: string | null | undefined): string | null {
  if (!link || !link.startsWith("/") || link.startsWith("//") || link.includes("\\")) {
    return null;
  }

  try {
    const url = new URL(link, "https://lostly.invalid");
    if (url.origin !== "https://lostly.invalid") {
      return null;
    }

    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return null;
  }
}
