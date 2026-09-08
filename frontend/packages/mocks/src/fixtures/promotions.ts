import type { Banner, Coupon, TicketDetail } from "@cfc/types";
import { CUSTOMER_NAMES, PRO_NAMES, seeded, pickFrom } from "./seed";

const rand = seeded(20260910);
const pick = <T,>(xs: readonly T[]): T => pickFrom(rand, xs);

/** No limits — the common case, so it is named rather than repeated. */
const OPEN: Coupon["restrictions"] = {
  areas: [],
  serviceNames: [],
  minOrderPaise: 0,
  maxDiscountPaise: 0,
  perCustomerLimit: 0,
};

export const coupons: Coupon[] = [
  { id: "cpn_01", code: "FIRST20", discountType: "percent", discountValue: 20, maxUses: 5000, usedCount: 3120, expiresAt: "2026-12-31T18:29:59.000Z", firstBookingOnly: true, restrictions: { ...OPEN, maxDiscountPaise: 30000, perCustomerLimit: 1 }, active: true },
  { id: "cpn_02", code: "CLEAN150", discountType: "flat", discountValue: 15000, maxUses: 1000, usedCount: 640, expiresAt: "2026-10-15T18:29:59.000Z", firstBookingOnly: false, restrictions: { ...OPEN, serviceNames: ["Deep home cleaning", "Bathroom cleaning", "Sofa & carpet cleaning"], minOrderPaise: 80000 }, active: true },
  { id: "cpn_03", code: "AC10", discountType: "percent", discountValue: 10, maxUses: 2000, usedCount: 1980, expiresAt: "2026-09-20T18:29:59.000Z", firstBookingOnly: false, restrictions: { ...OPEN, serviceNames: ["AC service & repair"], maxDiscountPaise: 20000 }, active: true },
  { id: "cpn_04", code: "MONSOON25", discountType: "percent", discountValue: 25, maxUses: 800, usedCount: 800, expiresAt: "2026-08-31T18:29:59.000Z", firstBookingOnly: false, restrictions: { ...OPEN, areas: ["Srirangam", "Thillai Nagar"], minOrderPaise: 50000 }, active: false },
  { id: "cpn_05", code: "WELCOME100", discountType: "flat", discountValue: 10000, maxUses: 10000, usedCount: 6420, expiresAt: "2027-03-31T18:29:59.000Z", firstBookingOnly: true, restrictions: { ...OPEN, perCustomerLimit: 1 }, active: true },
];

export const banners: Banner[] = [
  { id: "ban_01", imageUrl: "/mock/banners/first-booking.jpg", title: "20% off your first booking", linkType: "none", linkTarget: null, sortOrder: 1, active: true, scheduledFrom: null, scheduledTo: null },
  { id: "ban_02", imageUrl: "/mock/banners/ac-service.jpg", title: "AC service — flat 10% off", linkType: "service", linkTarget: "AC service & repair", sortOrder: 2, active: true, scheduledFrom: null, scheduledTo: "2026-09-30T18:29:59.000Z" },
  { id: "ban_03", imageUrl: "/mock/banners/deep-cleaning.jpg", title: "Deep cleaning before the festival", linkType: "category", linkTarget: "Home & Maintenance", sortOrder: 3, active: false, scheduledFrom: "2026-10-01T00:00:00.000Z", scheduledTo: "2026-10-20T18:29:59.000Z" },
];

/**
 * Each subject carries its own conversation.
 *
 * A thread view that only ever holds one message cannot be judged - the
 * internal-note styling never appears, the reply spacing is never tested, and
 * a client opening Admin 44 sees a single bubble where a conversation was
 * promised. So each subject has the exchange it would really have: what the
 * person wrote, what an agent noted privately, and what the agent replied.
 *
 * `agentReply` is omitted where the ticket is still open and untouched, which
 * is what an unanswered queue actually looks like.
 */
const CONVERSATIONS: {
  subject: string;
  opening: string;
  internal?: string;
  agentReply?: string;
}[] = [
  {
    subject: "Pro did not arrive at scheduled time",
    opening:
      "I booked a deep cleaning for 10 AM today and nobody turned up. I waited the whole morning and took leave from work for this. Please tell me what happened.",
    internal:
      "Pro marked himself online but never accepted. Second no-show for him this month - flagging to pro management.",
    agentReply:
      "I am very sorry about this. I have raised a warning against the pro and your booking has been rescheduled to tomorrow 10 AM with a different professional at no extra cost.",
  },
  {
    subject: "Payment deducted twice for one booking",
    opening:
      "Rs 1,450 was debited twice from my account for booking BK-2291. My bank statement shows two entries at the same time. Please refund one.",
    internal:
      "Confirmed duplicate on the gateway - two captures against one order id. Refund raised, gateway says 5 working days.",
    agentReply:
      "You are right, there were two charges. I have processed a refund of Rs 1,450 to your original payment method. It should reflect within 5 working days.",
  },
  {
    subject: "Unable to upload documents during registration",
    opening:
      "I am trying to register as an electrician but the Aadhaar upload keeps failing. It says file too large even though the photo is normal size.",
    internal: "Camera photos are 8-12 MB, our cap is 5 MB. Asked engineering to add compression.",
  },
  {
    subject: "Requesting change in service area",
    opening:
      "I have shifted from Srirangam to Thillai Nagar. I am still getting jobs in the old area which is now too far for me. Please update my service area.",
    agentReply:
      "I have updated your service area to Thillai Nagar. New job requests will come from there starting today.",
  },
  {
    subject: "Refund not received after 5 days",
    opening:
      "My cancellation refund was approved on the 2nd and I still have not received the money. It has been more than 5 days now.",
    internal: "Gateway shows processed on the 3rd with a UTR. Likely a bank-side delay, sharing the reference.",
  },
  {
    subject: "App shows wrong booking status",
    opening:
      "The job was completed yesterday and the pro also collected payment, but the app still shows it as In progress. My rating option is not coming.",
  },
];

export const tickets: TicketDetail[] = Array.from({ length: 18 }, (_, i) => {
  const convo = CONVERSATIONS[i % CONVERSATIONS.length] as (typeof CONVERSATIONS)[number];
  // A pro raises registration and service-area problems; a customer raises
  // the rest. Picking at random produced customers complaining about their
  // own document uploads.
  const fromRole: "customer" | "pro" =
    convo.subject.includes("registration") || convo.subject.includes("service area")
      ? "pro"
      : "customer";
  const fromName = pick(fromRole === "customer" ? CUSTOMER_NAMES : PRO_NAMES);
  const status = pick(["open", "open", "in_progress", "resolved", "closed"] as const);
  const priority = pick(["low", "medium", "medium", "high"] as const);
  const agent = pick(["Vignesh T.", "Meenakshi S."]);

  // The thread runs forward in time and ends at updatedAt, so the list column
  // and the last message in the panel agree.
  const openedAt = Date.now() - (2 + Math.floor(rand() * 8)) * 86_400_000;
  const at = (step: number) => new Date(openedAt + step * 5_400_000).toISOString();

  const messages: TicketDetail["messages"] = [
    {
      id: `msg_${i}_1`,
      author: fromName,
      isInternal: false,
      body: convo.opening,
      sentAt: at(0),
    },
  ];

  // An untouched open ticket has had nothing done to it yet - that is what
  // makes it the one an agent should pick up.
  const worked = status !== "open";

  if (worked && convo.internal) {
    messages.push({
      id: `msg_${i}_2`,
      author: agent,
      isInternal: true,
      body: convo.internal,
      sentAt: at(1),
    });
  }

  if (worked && convo.agentReply) {
    messages.push({
      id: `msg_${i}_3`,
      author: agent,
      isInternal: false,
      body: convo.agentReply,
      sentAt: at(2),
    });
  }

  const lastAt = messages[messages.length - 1]?.sentAt ?? at(0);

  return {
    id: `tkt_${(i + 1).toString().padStart(4, "0")}`,
    subject: convo.subject,
    fromName,
    fromRole,
    priority,
    status,
    assignedTo: status === "open" ? null : agent,
    updatedAt: lastAt,
    messages,
  };
});
