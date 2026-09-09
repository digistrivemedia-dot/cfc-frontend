import type { AppNotification } from "@cfc/types";

/**
 * The customer's notifications.
 *
 * Every one points at something that exists — a real booking reference, the
 * quotation route, the categories page. A notification that opens nothing
 * tells a customer something happened and then abandons them, which is worse
 * than not sending it.
 *
 * Two are unread and six are read, so the badge, the unread styling and the
 * "mark all read" action all have something to act on. A list where everything
 * is unread cannot show the difference.
 */

const minsAgo = (m: number) =>
  new Date(Date.now() - m * 60_000).toISOString();

export const notifications: AppNotification[] = [
  {
    id: "ntf_01",
    kind: "quotation",
    title: "Extra work needs your approval",
    body: "Your professional found work beyond the original booking. Nothing is charged until you accept.",
    at: minsAgo(25),
    read: false,
    href: "/quotes/quo_0002",
  },
  {
    id: "ntf_02",
    kind: "booking",
    title: "Your professional is on the way",
    body: "Arriving in about 18 minutes for AC service & repair.",
    at: minsAgo(40),
    read: false,
    href: "/bookings/bkg_c02",
  },
  {
    id: "ntf_03",
    kind: "reminder",
    title: "Rate your deep home cleaning",
    body: "Your rating helps other customers choose.",
    at: minsAgo(60 * 26),
    read: true,
    href: "/bookings/bkg_c04/review",
  },
  {
    id: "ntf_04",
    kind: "booking",
    title: "Work completed",
    body: "Deep home cleaning is done. Your invoice is ready.",
    at: minsAgo(60 * 70),
    read: true,
    href: "/bookings/bkg_c04",
  },
  {
    id: "ntf_05",
    kind: "offer",
    title: "20% off your next booking",
    body: "Use code FIRST20 at checkout. Capped at ₹300.",
    at: minsAgo(60 * 96),
    read: true,
    href: "/categories",
  },
  {
    id: "ntf_06",
    kind: "reminder",
    title: "Your referral reward arrived",
    body: "₹100 has been added to your wallet.",
    at: minsAgo(60 * 48),
    read: true,
    href: "/wallet",
  },
  {
    id: "ntf_07",
    kind: "booking",
    title: "Booking confirmed",
    body: "We are finding a professional near you for tomorrow morning.",
    at: minsAgo(60 * 1),
    read: true,
    href: "/bookings/bkg_c01",
  },
  {
    id: "ntf_08",
    kind: "booking",
    title: "Booking cancelled",
    body: "Your booking CFC47770884 was cancelled and refunded to your wallet.",
    at: minsAgo(60 * 130),
    read: true,
    href: "/bookings/bkg_c06",
  },
];
