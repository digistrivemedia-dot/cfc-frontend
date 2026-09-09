import type { ServiceFaq, TicketDetail, TicketMessage } from "@cfc/types";
import { tickets } from "../fixtures/promotions";
import { faqs } from "../fixtures/faqs";
import { applyScenario, latency } from "../control";

/**
 * Customer 40, 41, 42 — help, a ticket thread, and the assistant.
 *
 * The safety-critical part of this file is `stripInternal`. A support ticket
 * carries **internal notes** — an agent writing "second no-show for this pro,
 * flagging to pro management" — and those are staff-only. Sending the whole
 * thread to a customer screen would expose them, so they are removed here
 * rather than filtered in the UI, where a later refactor could drop the
 * filter and nobody would notice.
 */

/** A customer sees their own messages and the agent's replies. Never notes. */
function stripInternal(ticket: TicketDetail): TicketDetail {
  return {
    ...ticket,
    messages: ticket.messages.filter((m) => !m.isInternal),
  };
}

/** Customer 40 — the FAQ accordion. Reuses the service FAQs. */
export async function getSupportFaqs(): Promise<ServiceFaq[]> {
  await latency();
  return applyScenario(faqs, []);
}

/** Customer 41 — the customer's own tickets. */
export async function getMyTickets() {
  await latency();
  // The fixture is admin-wide; a customer sees only theirs. Filtered on the
  // seeded customer rather than every row.
  const mine = tickets.filter((t) => t.fromRole === "customer").slice(0, 3);
  const sorted = [...mine].sort(
    (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt),
  );
  return applyScenario(sorted.map(stripInternal), []);
}

export async function getMyTicket(id: string) {
  await latency();
  const found = tickets.find((t) => t.id === id);
  return applyScenario(found ? stripInternal(found) : null, null);
}

/** Customer 41 — replying on a ticket. */
export async function replyToTicket(
  id: string,
  body: string,
): Promise<TicketMessage | null> {
  await latency();
  const found = tickets.find((t) => t.id === id);
  if (!found) return null;

  const message: TicketMessage = {
    id: `msg_${Date.now().toString(36)}`,
    author: "You",
    isInternal: false,
    body: body.trim(),
    sentAt: new Date().toISOString(),
  };
  found.messages = [...found.messages, message];
  found.updatedAt = message.sentAt;
  if (found.status === "resolved" || found.status === "closed") {
    // A customer replying to a closed ticket reopens it. Otherwise the reply
    // lands somewhere nobody is looking.
    found.status = "open";
  }
  return message;
}

/** Customer 40 — raising a new ticket. */
export async function raiseTicket(subject: string, body: string) {
  await latency();
  const ticket: TicketDetail = {
    id: `tkt_${Date.now().toString(36)}`,
    subject: subject.trim(),
    fromName: "You",
    fromRole: "customer",
    priority: "medium",
    status: "open",
    assignedTo: null,
    updatedAt: new Date().toISOString(),
    messages: [
      {
        id: `msg_${Date.now().toString(36)}`,
        author: "You",
        isInternal: false,
        body: body.trim(),
        sentAt: new Date().toISOString(),
      },
    ],
  };
  tickets.unshift(ticket);
  return applyScenario(ticket, ticket);
}

/** The helpline, from the platform's app config. */
export const SUPPORT_PHONE = "+919000012345";
export const SUPPORT_HOURS = "9:00 AM - 9:00 PM";

/**
 * Customer 42 — the AI assistant.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * THIS IS A UI SHELL. There is no model, no endpoint and no budget stated
 * anywhere in the agreement.
 *
 * The replies below are scripted keyword matches, not an assistant. The screen
 * says so, because a customer who believes they are talking to something that
 * can act on their booking and is not will end up in support.
 * ────────────────────────────────────────────────────────────────────────────
 */
export const AI_ASSISTANT_IS_SHELL = true;

const SCRIPTED: { match: RegExp; reply: string }[] = [
  {
    match: /price|cost|charge|fee/i,
    reply:
      "Prices are shown before you book, with the platform fee itemised. Anything a professional finds on site is quoted first, and nothing extra is charged until you accept it.",
  },
  {
    match: /cancel|reschedul/i,
    reply:
      "You can cancel or reschedule from the booking itself while nobody is on site. Open My bookings and pick the one you mean.",
  },
  {
    match: /warrant|guarantee|redo/i,
    reply:
      "Every job carries a 30-day warranty. If the same problem comes back within thirty days, we send someone to fix it at no extra charge.",
  },
  {
    match: /otp|code|complete/i,
    reply:
      "The professional asks for a one-time code when the work is done. Only share it once you are happy — the job cannot be closed without it.",
  },
  {
    match: /clean|ac|plumb|electric|paint|salon|nurse/i,
    reply:
      "You can browse everything under Categories, or search for the service by name. Each listing shows the price, what is included, and the warranty.",
  },
];

export async function askAssistant(question: string): Promise<string> {
  await latency();
  const hit = SCRIPTED.find((s) => s.match.test(question));
  if (hit) return hit.reply;
  return "I can help with prices, cancellations, the warranty, and finding a service. For anything else, our team is on the Help screen — they answer faster than I can.";
}
