import type { ConsumerBooking } from "@cfc/types";
import { PRO_NAMES, SERVICE_CATALOG, seeded, pickFrom } from "./seed";

/**
 * The signed-in customer's own bookings.
 *
 * One per status, plus a couple extra, so every tab on Customer 25 has content
 * and none of the four is only reachable by editing fixtures. An empty tab
 * during review reads as a bug even when the empty state is correct.
 *
 * The states are staged deliberately, because Customers 27, 28 and 29 each
 * need a booking in a particular condition to be judged at all:
 *
 *   pending      — placed, no pro yet. Auto-assign is still offering it.
 *   assigned     — pro accepted and is travelling. Has an ETA and a position.
 *   in_progress  — pro on site. Has before photos and the completion code.
 *   completed    — done, with after photos. One rated, one not.
 *   cancelled    — for the fourth tab.
 */

const rand = seeded(20260909);
const pick = <T,>(xs: readonly T[]): T => pickFrom(rand, xs);

const ADDRESS = {
  id: "addr_01",
  label: "home" as const,
  line1: "42, Kaveri Nagar",
  line2: "Near Temple Street",
  landmark: "Opposite Saravana Stores",
  area: "Srirangam",
  city: "Tiruchirappalli",
  state: "Tamil Nadu",
  pincode: "620006",
  point: { lat: 10.8505, lng: 78.6837 },
  isDefault: true,
};

/** A six-digit code, stable per booking so it does not change on re-render. */
function otpFor(seed: number): string {
  return String(100_000 + ((seed * 7919) % 900_000));
}

function serviceAt(index: number): { name: string; variant: string | null } {
  const row = SERVICE_CATALOG[index % SERVICE_CATALOG.length];
  return { name: row?.[2] ?? "Service", variant: null };
}

function pro(index: number) {
  return {
    // Points at a real pro in the pros fixture, so the profile link resolves.
    id: `pro_${String((index % 12) + 1).padStart(4, "0")}`,
    name: pick(PRO_NAMES),
    // A real-looking number that is not a real number: the 555 range is not
    // allocated in India, so nobody's phone rings if a reviewer taps it.
    phone: `+9198555${String(10_000 + index * 137).slice(0, 5)}`,
    rating: Math.round((4.1 + rand() * 0.8) * 10) / 10,
    jobsCompleted: Math.floor(40 + rand() * 400),
  };
}

const hoursFromNow = (h: number) =>
  new Date(Date.now() + h * 3_600_000).toISOString();

export const myBookings: ConsumerBooking[] = [
  // Placed an hour ago for tomorrow. No pro yet.
  {
    id: "bkg_c01",
    reference: "CFC48210377",
    serviceName: serviceAt(0).name,
    variantName: "Standard visit",
    status: "pending",
    scheduledAt: hoursFromNow(26),
    address: ADDRESS,
    totalPaise: 159_000,
    paymentMethod: "upi",
    pro: null,
    completionOtp: null,
    etaMinutes: null,
    proPosition: null,
    beforePhotoUrls: [],
    afterPhotoUrls: [],
    events: [{ at: hoursFromNow(-1), label: "Booking placed" }],
    rated: false,
  },

  // Accepted and on the way. Customer 27 needs this one.
  {
    id: "bkg_c02",
    reference: "CFC48210341",
    serviceName: serviceAt(3).name,
    variantName: "1.5 ton split",
    status: "assigned",
    scheduledAt: hoursFromNow(1),
    address: ADDRESS,
    totalPaise: 249_000,
    paymentMethod: "card",
    pro: pro(2),
    completionOtp: otpFor(2),
    etaMinutes: 18,
    proPosition: { x: 38, y: 62 },
    beforePhotoUrls: [],
    afterPhotoUrls: [],
    events: [
      { at: hoursFromNow(-20), label: "Booking placed" },
      { at: hoursFromNow(-2), label: "Professional assigned" },
      { at: hoursFromNow(-0.3), label: "On the way" },
    ],
    rated: false,
  },

  // On site, working. Customers 28 and 29 need this one.
  {
    id: "bkg_c03",
    reference: "CFC48210298",
    serviceName: serviceAt(6).name,
    variantName: null,
    status: "in_progress",
    scheduledAt: hoursFromNow(-1),
    address: ADDRESS,
    totalPaise: 89_000,
    paymentMethod: "cash",
    pro: pro(5),
    completionOtp: otpFor(5),
    etaMinutes: null,
    proPosition: { x: 50, y: 50 },
    beforePhotoUrls: ["/mock/jobs/before-1.jpg", "/mock/jobs/before-2.jpg"],
    afterPhotoUrls: [],
    events: [
      { at: hoursFromNow(-30), label: "Booking placed" },
      { at: hoursFromNow(-5), label: "Professional assigned" },
      { at: hoursFromNow(-1.5), label: "On the way" },
      { at: hoursFromNow(-1), label: "Arrived" },
      { at: hoursFromNow(-0.8), label: "Work started" },
    ],
    rated: false,
  },

  // Finished last week, not yet rated — so Customer 30 has something to open.
  {
    id: "bkg_c04",
    reference: "CFC47990112",
    serviceName: serviceAt(9).name,
    variantName: "Deep clean",
    status: "completed",
    scheduledAt: hoursFromNow(-72),
    address: ADDRESS,
    totalPaise: 349_000,
    paymentMethod: "upi",
    pro: pro(8),
    completionOtp: null,
    etaMinutes: null,
    proPosition: null,
    beforePhotoUrls: ["/mock/jobs/before-3.jpg"],
    afterPhotoUrls: ["/mock/jobs/after-1.jpg", "/mock/jobs/after-2.jpg"],
    events: [
      { at: hoursFromNow(-96), label: "Booking placed" },
      { at: hoursFromNow(-74), label: "Professional assigned" },
      { at: hoursFromNow(-72), label: "Arrived" },
      { at: hoursFromNow(-70), label: "Work completed" },
    ],
    rated: false,
  },

  // Finished and already rated, so the list shows both completed states.
  {
    id: "bkg_c05",
    reference: "CFC47881003",
    serviceName: serviceAt(12).name,
    variantName: null,
    status: "completed",
    scheduledAt: hoursFromNow(-240),
    address: ADDRESS,
    totalPaise: 129_000,
    paymentMethod: "wallet",
    pro: pro(11),
    completionOtp: null,
    etaMinutes: null,
    proPosition: null,
    beforePhotoUrls: [],
    afterPhotoUrls: ["/mock/jobs/after-3.jpg"],
    events: [
      { at: hoursFromNow(-264), label: "Booking placed" },
      { at: hoursFromNow(-242), label: "Professional assigned" },
      { at: hoursFromNow(-240), label: "Arrived" },
      { at: hoursFromNow(-238), label: "Work completed" },
    ],
    rated: true,
  },

  // Cancelled, for the fourth tab.
  {
    id: "bkg_c06",
    reference: "CFC47770884",
    serviceName: serviceAt(2).name,
    variantName: null,
    status: "cancelled",
    scheduledAt: hoursFromNow(-120),
    address: ADDRESS,
    totalPaise: 199_000,
    paymentMethod: "upi",
    pro: null,
    completionOtp: null,
    etaMinutes: null,
    proPosition: null,
    beforePhotoUrls: [],
    afterPhotoUrls: [],
    events: [
      { at: hoursFromNow(-144), label: "Booking placed" },
      { at: hoursFromNow(-130), label: "Cancelled by you" },
    ],
    rated: false,
  },
];
