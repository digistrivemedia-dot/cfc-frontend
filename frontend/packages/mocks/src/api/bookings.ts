import type {
  BookingDetail,
  BookingListItem,
  BookingQuery,
  BookingStatus,
  Page,
} from "@cfc/types";
import { ApiError } from "@cfc/types";
import { bookingDetails, bookings } from "../fixtures/bookings";
import { applyScenario, latency } from "../control";
import { fetchJson, isLive } from "../http";

/**
 * Bookings api.
 *
 * Shaped exactly as the real client will be. Swapping to the backend replaces
 * the body of this function and nothing else — no screen file changes.
 */

const DEFAULT_PAGE_SIZE = 20;

export async function getBookings(
  query: BookingQuery & { area?: string | null } = {},
): Promise<Page<BookingListItem>> {
  if (isLive("getBookings")) {
    return fetchJson<Page<BookingListItem>>("/admin/bookings", {
      query: queryParams(query),
    });
  }
  await latency();

  const {
    search,
    status = "all",
    from,
    to,
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
    sortBy = "scheduledAt",
    sortDir = "desc",
    area,
  } = query;

  let rows = bookings;

  // Area scope is applied here rather than after fetch, because an Area Admin
  // must never receive rows outside their area in the first place.
  if (area) {
    rows = rows.filter((b) => b.area === area);
  }

  if (status !== "all") {
    rows = rows.filter((b) => b.status === status);
  }

  if (search) {
    const q = search.trim().toLowerCase();
    rows = rows.filter(
      (b) =>
        b.reference.toLowerCase().includes(q) ||
        b.customerName.toLowerCase().includes(q) ||
        b.serviceName.toLowerCase().includes(q) ||
        (b.proName?.toLowerCase().includes(q) ?? false),
    );
  }

  if (from) {
    const t = new Date(from).getTime();
    rows = rows.filter((b) => new Date(b.scheduledAt).getTime() >= t);
  }
  if (to) {
    const t = new Date(to).getTime();
    rows = rows.filter((b) => new Date(b.scheduledAt).getTime() <= t);
  }

  const dir = sortDir === "asc" ? 1 : -1;
  rows = [...rows].sort((a, b) => {
    if (sortBy === "totalPaise") return (a.totalPaise - b.totalPaise) * dir;
    if (sortBy === "reference") return a.reference.localeCompare(b.reference) * dir;
    return (
      (new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime()) *
      dir
    );
  });

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const items = rows.slice(start, start + pageSize);

  return applyScenario<Page<BookingListItem>>(
    { items, total, page, pageSize, hasMore: start + pageSize < total },
    { items: [], total: 0, page: 1, pageSize, hasMore: false },
  );
}

/**
 * Every row matching the current filters, ignoring pagination — the export
 * takes what the operator is looking at, not just the visible page.
 */
export async function getBookingsForExport(
  query: BookingQuery & { area?: string | null } = {},
): Promise<BookingListItem[]> {
  if (isLive("getBookings")) {
    // Its own endpoint rather than a huge page: the server caps the export and
    // skips the count query, and `bookings.export` is a permission an area
    // admin does not have.
    return fetchJson<BookingListItem[]>("/admin/bookings/export", {
      query: queryParams(query),
    });
  }
  const all = await getBookings({ ...query, page: 1, pageSize: 10_000 });
  return all.items;
}

/**
 * One booking in full. Admin 7.
 *
 * Separate from the list call because a detail view needs the timeline, the
 * contact numbers and the settlement split, and a list of sixty rows should not
 * carry any of that.
 */
export async function getBooking(id: string): Promise<BookingDetail> {
  if (isLive("getBooking")) {
    return fetchJson<BookingDetail>(`/admin/bookings/${id}`);
  }
  await latency();
  const found = bookingDetails[id];
  if (!found) throw new ApiError(404, "Booking not found.");
  return applyScenario(found);
}

/**
 * Admin 8 — force a booking into a different state.
 *
 * Replaces `previewStatusOverride`, which validated and returned what the
 * record *would* become without writing anything — the honest shape while the
 * mock layer was read-only, and a lie once there is a server to write to.
 *
 * Live-only, like the other admin writes. The server allows an override to
 * break the normal transition table (that is what forcing means) but refuses
 * to reopen a completed or cancelled booking: completion has already settled
 * money, and reopening would let a second completion pay the pro twice.
 */
export async function overrideBookingStatus(
  id: string,
  next: BookingStatus,
  reason: string,
): Promise<BookingDetail> {
  return fetchJson<BookingDetail>(`/admin/bookings/${id}/status`, {
    method: "POST",
    body: { status: next, reason },
  });
}

/** The filters, flattened for the query string. Shared by list and export. */
function queryParams(
  query: BookingQuery & { area?: string | null },
): Record<string, string | number> {
  const out: Record<string, string | number> = {};
  for (const key of ["search", "status", "from", "to", "sortBy", "sortDir"] as const) {
    const v = query[key];
    if (typeof v === "string" && v !== "") out[key] = v;
  }
  if (query.area) out["area"] = query.area;
  if (query.page !== undefined) out["page"] = query.page;
  if (query.pageSize !== undefined) out["pageSize"] = query.pageSize;
  return out;
}
