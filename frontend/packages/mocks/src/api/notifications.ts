import type { AppNotification } from "@cfc/types";
import { notifications } from "../fixtures/notifications";
import { applyScenario, latency } from "../control";
import { fetchJson, isLive } from "../http";

/**
 * Customer 39 — notifications.
 *
 * Held in module state so marking one read persists to the badge and the list
 * while the session lasts, the way it will once a backend owns it.
 */

export type NotificationFilter = "all" | AppNotification["kind"];

export async function getNotifications(filter: NotificationFilter = "all") {
  if (isLive("getNotifications")) {
    return fetchJson<AppNotification[]>("/consumer/notifications", {
      query: { filter },
    });
  }
  await latency();
  const rows =
    filter === "all"
      ? notifications
      : notifications.filter((n) => n.kind === filter);

  // Newest first. A notification list is read from the top and abandoned
  // partway down.
  const sorted = [...rows].sort(
    (a, b) => Date.parse(b.at) - Date.parse(a.at),
  );
  return applyScenario(sorted, []);
}

/** Drives the bell badge in the navigation. */
export async function getUnreadNotificationCount(): Promise<number> {
  if (isLive("getUnreadNotificationCount")) {
    const r = await fetchJson<{ count: number }>(
      "/consumer/notifications/unread-count",
    );
    return r.count;
  }
  await latency();
  return applyScenario(notifications.filter((n) => !n.read).length, 0);
}

export async function markNotificationRead(id: string): Promise<void> {
  if (isLive("markNotificationRead")) {
    await fetchJson(`/consumer/notifications/${id}/read`, { method: "POST" });
    return;
  }
  await latency();
  const found = notifications.find((n) => n.id === id);
  if (found) found.read = true;
}

export async function markAllNotificationsRead(): Promise<void> {
  if (isLive("markAllNotificationsRead")) {
    await fetchJson("/consumer/notifications/read-all", { method: "POST" });
    return;
  }
  await latency();
  for (const n of notifications) n.read = true;
}
