import type { ServiceFaq, TicketListItem } from "@cfc/types";
import { tickets } from "../fixtures/promotions";
import { applyScenario, latency } from "../control";
import { SUPPORT_HOURS, SUPPORT_PHONE } from "./my-support";

/**
 * Pro 32 — help and support.
 *
 * The consumer FAQ set answers customer questions ("what if the professional is
 * late", "how do I get a refund") and is useless to a pro. These answer the
 * questions this build has established a pro will actually have — every one of
 * them a rule from the agreement that the app enforces somewhere and that a pro
 * would otherwise discover the hard way.
 *
 * Nothing here states a figure that is not in `PLATFORM-FACTS.md`. Where a
 * number would be needed and is not documented — the payout minimum — the
 * answer says the office sets it rather than inventing one.
 */

const PRO_FAQS: ServiceFaq[] = [
  {
    id: "pfaq_01",
    serviceId: null,
    question: "Why did I go offline after accepting a job?",
    answer:
      "That is deliberate. You go offline the moment you accept, so you are not alerted about another job while you are working, and back online automatically when you complete it. Nothing is wrong with your account.",
  },
  {
    id: "pfaq_02",
    serviceId: null,
    question: "How long do I have to accept a job?",
    answer:
      "30 seconds. The same job is sent to the three nearest professionals at once and the first to accept gets it, so the countdown is a real race rather than a formality.",
  },
  {
    id: "pfaq_03",
    serviceId: null,
    question: "When do I get paid?",
    answer:
      "Money from a completed job clears within 48 hours, and you can request a payout of your cleared balance any day to your bank account or UPI. Anything still inside that window shows on the Pending payments screen with a clock.",
  },
  {
    id: "pfaq_04",
    serviceId: null,
    question: "What does CFC take from my earning?",
    answer:
      "15% of the job value. Your first 20 jobs on the platform carry no commission at all — you keep the full amount on each. Every settlement on the Transaction history screen shows the job value, the fee and what you kept.",
  },
  {
    id: "pfaq_05",
    serviceId: null,
    question: "Is GST taken out of my payment?",
    answer:
      "No. CGST 9% and SGST 9% are charged to the customer on the CFC platform fee. They are not deducted from your earning, and you will not see them as a deduction on any settlement.",
  },
  {
    id: "pfaq_06",
    serviceId: null,
    question: "Why can I not mark a job complete?",
    answer:
      "You need three things: the customer's 4-digit code, at least one photo of the finished work, and to be within 100 metres of the job address. If your phone cannot get a location fix, you can still complete the job and CFC will see that the check did not run.",
  },
  {
    id: "pfaq_07",
    serviceId: null,
    question: "My quotation was rejected. What now?",
    answer:
      "The rejection carries the admin's reason. Most are about the material cost being above the template rate for that service. You can submit a revised quotation from the job screen and nothing you photographed is lost.",
  },
  {
    id: "pfaq_08",
    serviceId: null,
    question: "How many photos does a quotation need?",
    answer:
      "At least two photos of the site before you start. A quotation with fewer is rejected automatically, so the form will not let you submit until you have them.",
  },
  {
    id: "pfaq_09",
    serviceId: null,
    question: "Can I set my own prices?",
    answer:
      "No. Rates are set per service by the CFC office so every professional charges the same for the same work and a customer sees one price before booking. If a rate does not cover the work in your area, raise it with the office rather than declining jobs.",
  },
  {
    id: "pfaq_10",
    serviceId: null,
    question: "Why am I not getting any jobs?",
    answer:
      "Check four things: you are online, at least one of your services is switched on, holiday mode is off, and the current time falls inside your working hours. If all four are right and your account is not blocked, contact the office.",
  },
  {
    id: "pfaq_11",
    serviceId: null,
    question: "What happens if my rating drops?",
    answer:
      "Accounts are blocked automatically below 2.5. Your rating also decides which jobs you are offered first — at the same distance, the higher-rated professional is alerted before the other. If a review is unfair, dispute it with the office rather than letting it stand.",
  },
  {
    id: "pfaq_12",
    serviceId: null,
    question: "Is there a minimum before I can withdraw?",
    answer:
      "Any minimum is set by the CFC office and shown on the Withdraw screen when it applies. If no minimum is shown, you can withdraw your whole cleared balance.",
  },
];

export async function getProFaqs(): Promise<ServiceFaq[]> {
  await latency();
  return applyScenario(PRO_FAQS, []);
}

/**
 * The helpline.
 *
 * Re-exported from the consumer support module rather than duplicated: one
 * number, changed in one place. A pro and a customer ringing different numbers
 * would be a real operational problem, and two constants is how that happens.
 */
export { SUPPORT_HOURS, SUPPORT_PHONE };

/**
 * Pro 32 - this pro's own support tickets.
 *
 * NOT `getMyTickets`, which hard-filters to `fromRole === "customer"`. Calling
 * that from the pro app would have shown a professional other people's tickets,
 * subject lines and all - a cross-role leak rather than a cosmetic bug.
 *
 * The ticket fixture is admin-wide, so this filters to the pro side. The real
 * implementation filters on the signed-in pro's id; the fixture has no per-pro
 * attribution yet, which is why the id is accepted and unused rather than
 * quietly ignored.
 */
export async function getProTickets(
  _proId: string,
): Promise<TicketListItem[]> {
  await latency();

  const mine = tickets.filter((t) => t.fromRole === "pro").slice(0, 4);
  const sorted = [...mine].sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
  return applyScenario(sorted, []);
}
