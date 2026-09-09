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
