import type {
  Banner,
  Coupon,
  TicketDetail,
  TicketListItem,
  TicketMessage,
} from "@cfc/types";
import { ApiError } from "@cfc/types";
import { coupons, banners, tickets } from "../fixtures/promotions";
import { applyScenario, latency } from "../control";
import { fetchJson, isLive } from "../http";

export async function getCoupons() {
  if (isLive("getCoupons")) {
    return fetchJson<Coupon[]>("/admin/promotions/coupons");
  }
  await latency();
  return applyScenario(coupons, []);
}

export async function getBanners() {
  if (isLive("getBanners")) {
    return fetchJson<Banner[]>("/admin/promotions/banners");
  }
  await latency();
  return applyScenario(banners, []);
}

export async function getTickets(status?: string) {
  if (isLive("getTickets")) {
    return fetchJson<TicketListItem[]>("/admin/tickets", {
      query: { status: status ?? "all" },
    });
  }
  await latency();
  const rows = status && status !== "all" ? tickets.filter((t) => t.status === status) : tickets;
  return applyScenario(rows, []);
}

export async function getTicket(id: string) {
  if (isLive("getTicket")) {
    // The admin view carries the whole thread, internal notes included.
    return fetchJson<TicketDetail>(`/admin/tickets/${id}`);
  }
  await latency();
  const found = tickets.find((t) => t.id === id);
  return applyScenario(
    found ?? (() => { throw new ApiError(404, "Ticket not found."); })(),
  );
}

/**
 * Admin 35–37 writes. Live-only, like every other admin write — a toast over
 * an unchanged database is the failure these replace.
 *
 * `usedCount` is never sent: redemptions are the coupon's history and an edit
 * must not reset them. The server ignores it too.
 */
export interface CouponInput {
  code: string;
  discountType: "percent" | "flat";
  discountValue: number;
  maxUses: number;
  expiresAt: string;
  firstBookingOnly: boolean;
  restrictions: {
    areas: string[];
    serviceIds: string[];
    minOrderPaise: number;
    maxDiscountPaise: number;
    perCustomerLimit: number;
  };
  active: boolean;
}

export async function createCoupon(input: CouponInput): Promise<Coupon> {
  return fetchJson("/admin/promotions/coupons", { method: "POST", body: input });
}

export async function updateCoupon(id: string, input: CouponInput): Promise<Coupon> {
  return fetchJson(`/admin/promotions/coupons/${id}`, { method: "PATCH", body: input });
}

/** Switched off, never deleted — redeemed coupons are referenced by bookings. */
export async function toggleCoupon(id: string): Promise<{ id: string; active: boolean }> {
  return fetchJson(`/admin/promotions/coupons/${id}/toggle`, { method: "POST" });
}

export interface BannerInput {
  imagePath: string;
  title: string;
  linkType: "category" | "service" | "none";
  linkTarget: string | null;
  sortOrder: number;
  active: boolean;
  /** Null means no bound — live immediately, or until switched off. */
  scheduledFrom: string | null;
  scheduledTo: string | null;
}

export async function createBanner(input: BannerInput): Promise<Banner> {
  return fetchJson("/admin/promotions/banners", { method: "POST", body: input });
}

export async function updateBanner(id: string, input: BannerInput): Promise<Banner> {
  return fetchJson(`/admin/promotions/banners/${id}`, { method: "PATCH", body: input });
}

export async function deleteBanner(id: string): Promise<void> {
  await fetchJson(`/admin/promotions/banners/${id}`, { method: "DELETE" });
}

/** Admin 44 — reply, or leave an internal note. Live-only. */
export async function replyToAdminTicket(
  id: string,
  body: string,
  isInternal = false,
): Promise<TicketMessage> {
  return fetchJson(`/admin/tickets/${id}/reply`, {
    method: "POST",
    body: { body, isInternal },
  });
}

/** Admin 43 — priority, status and assignment. Live-only. */
export async function updateTicket(
  id: string,
  input: {
    priority?: "low" | "medium" | "high";
    status?: "open" | "in_progress" | "resolved" | "closed";
    assignedToId?: string | null;
  },
): Promise<TicketDetail> {
  return fetchJson(`/admin/tickets/${id}`, { method: "PATCH", body: input });
}
