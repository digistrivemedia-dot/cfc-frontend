import type {
  BookingStatus,
  CustomerBooking,
  CustomerComplaint,
  CustomerDetail,
} from "@cfc/types";
import { AREAS, CUSTOMER_NAMES, PRO_NAMES, seeded, pickFrom } from "./seed";

function build(): CustomerDetail[] {
  const rand = seeded(20260906);
  const pick = <T,>(xs: readonly T[]): T => pickFrom(rand, xs);

  return CUSTOMER_NAMES.map((name, i) => {
    const totalBookings = Math.floor(1 + rand() * 24);
    const totalSpentPaise = totalBookings * Math.floor(50000 + rand() * 150000);
    const blocked = rand() < 0.04;

    return {
      id: `cust_${(i + 1).toString().padStart(4, "0")}`,
      name,
      phone: `+91 ${9_000_000_000 + Math.floor(rand() * 999_999_999)}`,
      area: pick(AREAS),
      totalBookings,
      totalSpentPaise,
      walletPaise: Math.floor(rand() * 80000),
      blocked,
      joinedAt: new Date(
        Date.now() - Math.floor(rand() * 500) * 86_400_000,
      ).toISOString(),
      email: rand() < 0.6
        ? `${name.split(" ")[0]?.toLowerCase()}${Math.floor(rand() * 99)}@gmail.com`
        : null,
      addresses: [
        `${Math.floor(1 + rand() * 40)}, ${pick(AREAS)}, Trichy`,
      ],
      complaintCount: rand() < 0.15 ? Math.floor(1 + rand() * 3) : 0,
      noShowCount: rand() < 0.1 ? Math.floor(1 + rand() * 2) : 0,
    };
  });
}

export const customers: CustomerDetail[] = build();

/**
 * Booking history and complaints per customer. Admin 20.
 *
 * Both are derived from the customer's own record so the counts already on the
 * list — total bookings, complaint count, no-shows — match what the detail
 * shows. A screen where the summary says 4 complaints and the list shows 2 is
 * the kind of thing a client finds in the first minute.
 */

const COMPLAINT_SUBJECTS = [
  "Pro arrived over an hour late",
  "Work left unfinished",
  "Charged more than the quoted amount",
  "Pro was unprofessional",
  "Damage to property during the job",
  "Service did not fix the problem",
];

const COMPLAINT_OUTCOMES = [
  "Partial refund issued and the pro was warned.",
  "Pro sent back to redo the work at no charge.",
  "Investigated — no fault found, customer informed.",
  "Full refund issued.",
];

const HISTORY_SERVICES = [
  "AC service & repair",
  "Deep home cleaning",
  "Plumbing — tap & pipe",
  "Electrical repair",
  "Bathroom cleaning",
  "Pest control",
  "Carpentry work",
  "Washing machine repair",
];

function historyFor(
  c: CustomerDetail,
  rand: () => number,
): CustomerBooking[] {
  const now = Date.now();
  // Show up to a dozen; the count on the record is the true total and the
  // panel says so rather than pretending this is all of them.
  const shown = Math.min(c.totalBookings, 12);
  const rows: CustomerBooking[] = [];

  for (let i = 0; i < shown; i++) {
    const daysAgo = Math.floor(rand() * 180);
    // A customer with recorded no-shows should actually have some in their
    // history, otherwise the count on the summary is unsupported.
    const isNoShow = i < c.noShowCount;
    const status: BookingStatus = isNoShow
      ? "cancelled"
      : rand() < 0.9
        ? "completed"
        : "cancelled";

    rows.push({
      id: `cbk_${c.id}_${i}`,
      reference: `CFC${(10_000_000 + Math.floor(rand() * 89_999_999)).toString()}`,
      serviceName: pickFrom(rand, HISTORY_SERVICES),
      proName: status === "cancelled" && isNoShow ? null : pickFrom(rand, PRO_NAMES),
      status,
      scheduledAt: new Date(now - daysAgo * 86_400_000).toISOString(),
      totalPaise: 30_000 + Math.floor(rand() * 300_000),
    });
  }

  return rows.sort(
    (a, b) => new Date(b.scheduledAt).getTime() - new Date(a.scheduledAt).getTime(),
  );
}

function complaintsFor(
  c: CustomerDetail,
  rand: () => number,
): CustomerComplaint[] {
  return Array.from({ length: c.complaintCount }, (_, i) => {
    // Older complaints are settled; the most recent one may still be open.
    const resolved = i > 0 || rand() < 0.6;
    return {
      id: `cmp_${c.id}_${i}`,
      bookingRef: `CFC${(10_000_000 + Math.floor(rand() * 89_999_999)).toString()}`,
      subject: pickFrom(rand, COMPLAINT_SUBJECTS),
      raisedAt: new Date(
        Date.now() - (10 + Math.floor(rand() * 200)) * 86_400_000,
      ).toISOString(),
      resolved,
      ...(resolved ? { outcome: pickFrom(rand, COMPLAINT_OUTCOMES) } : {}),
    };
  }).sort(
    (a, b) => new Date(b.raisedAt).getTime() - new Date(a.raisedAt).getTime(),
  );
}

export const customerBookings: Record<string, CustomerBooking[]> = (() => {
  const rand = seeded(20260907);
  return Object.fromEntries(customers.map((c) => [c.id, historyFor(c, rand)]));
})();

export const customerComplaints: Record<string, CustomerComplaint[]> = (() => {
  const rand = seeded(20260908);
  return Object.fromEntries(customers.map((c) => [c.id, complaintsFor(c, rand)]));
})();
