import type {
  BookingDetail,
  BookingEvent,
  BookingListItem,
  BookingStatus,
} from "@cfc/types";

/**
 * Bookings fixture.
 *
 * Real Trichy areas, Tamil names, and amounts that match the service — an AC
 * service is not ₹200 and a tap washer is not ₹4,000. Believable data is the
 * difference between a screen that reads as finished and one that reads as a
 * template.
 *
 * Screens never import this. They call the api functions in ../api.
 */

import { AREAS, CUSTOMER_NAMES as CUSTOMERS, PRO_NAMES as PROS, seeded, pickFrom } from "./seed";

/** Service, with the price band it realistically falls in (paise). */
const SERVICES: readonly [string, number, number][] = [
  ["AC service & repair", 49900, 129900],
  ["Deep home cleaning", 189900, 449900],
  ["Plumbing — tap & pipe", 29900, 89900],
  ["Electrical repair", 34900, 99900],
  ["Bathroom cleaning", 79900, 149900],
  ["Sofa & carpet cleaning", 99900, 259900],
  ["Pest control", 129900, 349900],
  ["Refrigerator repair", 44900, 179900],
  ["Washing machine repair", 44900, 169900],
  ["Carpentry work", 39900, 199900],
  ["Wall painting", 449900, 1899900],
  ["RO water purifier service", 39900, 119900],
  ["Salon at home — women", 59900, 249900],
  ["Men's grooming", 29900, 99900],
  ["Nurse home care — 12 hr", 129900, 199900],
];

function build(): BookingListItem[] {
  const rand = seeded(20260904);
  const pick = <T,>(xs: readonly T[]): T => pickFrom(rand, xs);

  // Anchored so relative labels ("Today", "Tomorrow") stay meaningful.
  const now = Date.now();
  const rows: BookingListItem[] = [];

  // Reserved so "today" is never thin by chance. A 29-day uniform spread
  // across 60 rows puts only ~2 on any single day — good for the list screens,
  // but it means the main dashboard's "New bookings today" / "Total earning
  // today" KPIs can land on zero purely by luck, which reads as a broken
  // dashboard even though the number is technically correct. These five rows
  // guarantee today has a believable mix: some money already earned, some
  // work in flight, one still needing a pro.
  const RESERVED_TODAY = 5;

  for (let i = 0; i < 60; i++) {
    const [serviceName, lo, hi] = pick(SERVICES);
    const totalPaise = Math.round((lo + rand() * (hi - lo)) / 100) * 100;

    const isReservedToday = i < RESERVED_TODAY;

    // Spread from 21 days back to 7 days ahead, weighted toward recent.
    const dayOffset = isReservedToday ? 0 : Math.floor(rand() * 29) - 21;
    const hour = 8 + Math.floor(rand() * 11);
    const minute = pick([0, 30]);
    const scheduled = new Date(now + dayOffset * 86_400_000);
    scheduled.setHours(hour, minute, 0, 0);

    // Status follows time: past bookings resolved, future ones not yet started.
    let status: BookingStatus;
    if (isReservedToday) {
      // 3 completed (real earnings on the dashboard), 1 in progress, 1 pending.
      status = ([
        "completed", "completed", "completed", "in_progress", "pending",
      ] as const)[i] as BookingStatus;
    } else if (dayOffset > 0) {
      status = rand() < 0.75 ? "assigned" : "pending";
    } else if (dayOffset === 0) {
      status = pick<BookingStatus>(["in_progress", "assigned", "completed"]);
    } else {
      status = rand() < 0.85 ? "completed" : "cancelled";
    }

    const needsPro = status !== "pending" && status !== "cancelled";

    rows.push({
      id: `bk_${(i + 1).toString().padStart(4, "0")}`,
      reference: `CFC${(10_000_000 + Math.floor(rand() * 89_999_999)).toString()}`,
      customerName: pick(CUSTOMERS),
      proName: needsPro ? pick(PROS) : null,
      serviceName,
      status,
      scheduledAt: scheduled.toISOString(),
      totalPaise,
      area: pick(AREAS),
    });
  }

  return rows.sort(
    (a, b) =>
      new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
  );
}

export const bookings: BookingListItem[] = build();

export const AREA_OPTIONS = AREAS;

/**
 * Booking detail, derived from the list row rather than generated separately.
 *
 * Everything here is a pure function of the row it expands, so the amount on
 * Admin 6 and the amount on Admin 7 can never disagree — which is exactly the
 * class of bug a client finds by adding up a column.
 *
 * The money split follows the agreement: CFC takes 15% commission, and GST is
 * CGST 9% + SGST 9% on the platform fee ONLY, never on the pro's professional
 * fee.
 */

/** SRS 3.4 — CFC commission on a completed job. */
const COMMISSION_RATE = 0.15;

/** SRS 3.4 — CGST 9% + SGST 9%, applied to the platform fee alone. */
const GST_RATE = 0.18;

const STREETS = [
  "Bharathi Salai",
  "Anna Nagar 3rd Cross",
  "Salai Road",
  "West Boulevard Road",
  "Kamarajar Street",
  "Periyar Nagar 2nd Street",
  "Gandhi Market Road",
  "Race Course Road",
];

const LANDMARKS = [
  "Opposite the water tank",
  "Near Saravana Stores",
  "Behind the government school",
  "Next to the Murugan temple",
  null,
];

const CUSTOMER_NOTES = [
  "Please call before arriving, the gate is locked.",
  "Second floor, no lift.",
  "Outdoor unit is on the terrace.",
  null,
  null,
];

function phone(rand: () => number): string {
  const n = 6_000_000_000 + Math.floor(rand() * 3_999_999_999);
  return `+91 ${String(n).slice(0, 5)} ${String(n).slice(5)}`;
}

/**
 * The history a booking has accumulated, working backwards from its status.
 *
 * Times are spaced realistically — a pro is assigned within a couple of
 * minutes of an order, arrives near the scheduled slot, and finishes an hour
 * or two later — because a timeline where every entry shares a timestamp reads
 * as generated.
 */
function buildTimeline(
  b: BookingListItem,
  rand: () => number,
): BookingEvent[] {
  const scheduled = new Date(b.scheduledAt).getTime();
  const placed = scheduled - (18 + Math.floor(rand() * 40)) * 3_600_000;
  const events: BookingEvent[] = [
    {
      label: "Booking placed",
      at: new Date(placed).toISOString(),
      actor: b.customerName,
    },
  ];

  if (b.status === "cancelled") {
    events.push({
      label: "Cancelled by customer",
      at: new Date(placed + 2 * 3_600_000).toISOString(),
      actor: b.customerName,
    });
    return events;
  }

  if (b.proName) {
    events.push({
      label: `Assigned to ${b.proName}`,
      at: new Date(placed + (1 + Math.floor(rand() * 4)) * 60_000).toISOString(),
      actor: "Auto-assign",
    });
  }

  if (b.status === "in_progress" || b.status === "completed") {
    events.push({
      label: "Pro arrived on site",
      at: new Date(scheduled + Math.floor(rand() * 15) * 60_000).toISOString(),
      actor: b.proName ?? "Pro",
    });
    events.push({
      label: "Work started",
      at: new Date(scheduled + (15 + Math.floor(rand() * 15)) * 60_000).toISOString(),
      actor: b.proName ?? "Pro",
    });
  }

  if (b.status === "completed") {
    const done = scheduled + (60 + Math.floor(rand() * 120)) * 60_000;
    events.push({
      label: "Completed with customer OTP",
      at: new Date(done).toISOString(),
      actor: b.proName ?? "Pro",
    });
    events.push({
      label: "Payment settled",
      at: new Date(done + 5 * 60_000).toISOString(),
      actor: "System",
    });
  }

  return events;
}

function buildDetail(b: BookingListItem, rand: () => number): BookingDetail {
  // Platform fee is CFC's commission; GST rides on that fee alone, and the pro
  // is paid the remainder. This is the Admin 32 settlement, computed once here
  // so every screen that shows a split shows the same one.
  const platformFeePaise = Math.round(b.totalPaise * COMMISSION_RATE);
  const gstPaise = Math.round(platformFeePaise * GST_RATE);
  const proPayoutPaise = b.totalPaise - platformFeePaise;

  const method = pickFrom(rand, ["upi", "upi", "card", "cash", "wallet"] as const);

  return {
    ...b,
    customerPhone: phone(rand),
    proPhone: b.proName ? phone(rand) : null,
    address: `${1 + Math.floor(rand() * 120)}, ${pickFrom(rand, STREETS)}, ${b.area}`,
    landmark: pickFrom(rand, LANDMARKS),
    notes: pickFrom(rand, CUSTOMER_NOTES),
    timeline: buildTimeline(b, rand),
    platformFeePaise,
    gstPaise,
    proPayoutPaise,
    paymentMethod: method,
    // Cash is collected on completion; everything else is paid up front.
    paid: b.status === "completed" || method !== "cash",
  };
}

/**
 * Details keyed by booking id. Built once, with a fixed seed, so a booking
 * shows the same address and phone number on every visit.
 */
export const bookingDetails: Record<string, BookingDetail> = (() => {
  const rand = seeded(20260905);
  return Object.fromEntries(
    bookings.map((b) => [b.id, buildDetail(b, rand)]),
  );
})();
