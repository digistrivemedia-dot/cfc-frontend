import type { BookingStatus } from "@cfc/types";
import { myBookings } from "../fixtures/my-bookings";
import { applyScenario, latency } from "../control";

/**
 * Customer 25 through 29 — the customer's own bookings.
 *
 * `getMyBookings` takes the tab rather than a raw status, because the four
 * tabs the inventory names do not map one-to-one onto the five statuses:
 * "Upcoming" covers both a booking with no pro yet and one with a pro
 * travelling, and that grouping belongs here rather than being reimplemented
 * on the screen.
 */

export type BookingTab = "upcoming" | "ongoing" | "completed" | "cancelled";

const TAB_STATUSES: Record<BookingTab, BookingStatus[]> = {
  upcoming: ["pending", "assigned"],
  ongoing: ["in_progress"],
  completed: ["completed"],
  cancelled: ["cancelled"],
};

export async function getMyBookings(tab?: BookingTab) {
  await latency();
  const rows = tab
    ? myBookings.filter((b) => TAB_STATUSES[tab].includes(b.status))
    : myBookings;

  // Newest first. A customer opening this screen is looking for the booking
  // they just made or the one happening now, not their oldest.
  const sorted = [...rows].sort(
    (a, b) => Date.parse(b.scheduledAt) - Date.parse(a.scheduledAt),
  );

  return applyScenario(sorted, []);
}

export async function getMyBooking(id: string) {
  await latency();
  const found = myBookings.find((b) => b.id === id || b.reference === id);
  return applyScenario(found ?? null, null);
}

/**
 * Counts per tab, for the tab labels.
 *
 * A tab strip that shows how much is behind each tab saves a customer opening
 * three empty ones. Counted from the same source the tabs read, so the number
 * and the contents cannot disagree.
 */
export async function getMyBookingCounts() {
  await latency();
  const counts: Record<BookingTab, number> = {
    upcoming: 0,
    ongoing: 0,
    completed: 0,
    cancelled: 0,
  };
  for (const b of myBookings) {
    for (const tab of Object.keys(TAB_STATUSES) as BookingTab[]) {
      if (TAB_STATUSES[tab].includes(b.status)) counts[tab] += 1;
    }
  }
  return applyScenario(counts, counts);
}

/**
 * Cancels a booking. Customer 26.
 *
 * Mutates the fixture so the list and the detail agree afterwards. There is no
 * refund logic here because the agreement documents no cancellation policy —
 * see CONSUMER-OPEN-ITEMS 1.1. The screen says what it knows and no more.
 */
export async function cancelBooking(id: string): Promise<void> {
  await latency();
  const found = myBookings.find((b) => b.id === id);
  if (!found) return;
  found.status = "cancelled";
  found.completionOtp = null;
  found.etaMinutes = null;
  found.proPosition = null;
  found.events = [
    ...found.events,
    { at: new Date().toISOString(), label: "Cancelled by you" },
  ];
}

/**
 * The one booking worth putting at the top of the home screen.
 *
 * A customer with a pro on the way does not want to browse a catalogue — they
 * want to know where the pro is. Returns the most imminent live job, or null
 * when nothing is in flight, which is the ordinary case and must render as a
 * normal home screen rather than an empty tracker.
 *
 * A job already in progress outranks one merely assigned: the pro is on site
 * now. Within the same status, the soonest wins.
 */
export async function getActiveBooking() {
  await latency();
  const live = myBookings.filter((b) =>
    (["pending", "assigned", "in_progress"] as BookingStatus[]).includes(
      b.status,
    ),
  );
  if (live.length === 0) return applyScenario(null, null);

  const rank: Record<string, number> = {
    in_progress: 0,
    assigned: 1,
    pending: 2,
  };
  const [first] = [...live].sort((a, b) => {
    const byStatus = (rank[a.status] ?? 9) - (rank[b.status] ?? 9);
    if (byStatus !== 0) return byStatus;
    return Date.parse(a.scheduledAt) - Date.parse(b.scheduledAt);
  });

  return applyScenario(first ?? null, null);
}

/**
 * Services this customer has booked before, most recent first.
 *
 * Drives "Book again" on the home screen. Only completed jobs count — offering
 * to re-book something cancelled, or happening right now, is noise.
 * De-duplicated by service name so a monthly clean appears once, not six times.
 */
export async function getRebookable() {
  await latency();
  const seen = new Set<string>();
  const out: {
    serviceName: string;
    lastBookedAt: string;
    totalPaise: number;
  }[] = [];

  for (const b of [...myBookings].sort(
    (a, b2) => Date.parse(b2.scheduledAt) - Date.parse(a.scheduledAt),
  )) {
    if (b.status !== "completed") continue;
    if (seen.has(b.serviceName)) continue;
    seen.add(b.serviceName);
    out.push({
      serviceName: b.serviceName,
      lastBookedAt: b.scheduledAt,
      totalPaise: b.totalPaise,
    });
  }

  return applyScenario(out, []);
}
