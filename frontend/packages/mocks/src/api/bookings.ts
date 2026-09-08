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
  await latency();
  const found = bookingDetails[id];
  if (!found) throw new ApiError(404, "Booking not found.");
  return applyScenario(found);
}

/**
 * Force a booking into a different state. Admin 8 — "Force status updates,
 * admin intervention on disputes".
 *
 * The mock layer is read-only by design, so this validates and returns what the
 * record WOULD become without mutating the fixture. The screen renders the
 * result; the backend team owns the write.
 */
export async function previewStatusOverride(
  id: string,
  next: BookingStatus,
  reason: string,
): Promise<BookingDetail> {
  await latency();
  const found = bookingDetails[id];
  if (!found) throw new ApiError(404, "Booking not found.");
  if (reason.trim() === "") {
    throw new ApiError(400, "An override needs a reason for the audit trail.");
  }
  return applyScenario({
    ...found,
    status: next,
    timeline: [
      ...found.timeline,
      {
        label: `Status forced to ${next.replace(/_/g, " ")}`,
        at: new Date().toISOString(),
        actor: "You",
        forced: true,
      },
    ],
  });
}
