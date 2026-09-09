import type { ServiceFaq } from "@cfc/types";

/**
 * Questions asked before booking.
 *
 * Every answer here is a documented rule from the agreement — the 30-day
 * warranty, the OTP-gated completion, the 50% advance on an accepted
 * quotation, GST charged on the platform fee only. Nothing states a policy the
 * platform has not actually committed to.
 *
 * Two questions a customer certainly asks are deliberately absent, because the
 * agreement does not answer them: the cancellation/refund window, and what
 * happens if a pro does not arrive. Inventing either would put a promise on
 * screen that support would then have to honour. They go in once the client
 * confirms the policy.
 */
export const faqs: ServiceFaq[] = [
  {
    id: "faq_01",
    serviceId: null,
    question: "What does the 30-day warranty cover?",
    answer:
      "If the same problem returns within thirty days of the job being completed, we send a professional back to fix it at no extra charge.",
  },
  {
    id: "faq_02",
    serviceId: null,
    question: "Are the professionals verified?",
    answer:
      "Yes. Every professional completes document and identity verification before they can accept a single job.",
  },
  {
    id: "faq_03",
    serviceId: null,
    question: "Is the price I see the price I pay?",
    answer:
      "The price shown covers the service itself. Anything the professional finds on site that needs extra work is sent to you as a quotation first, and nothing is charged until you accept it.",
  },
  {
    id: "faq_04",
    serviceId: null,
    question: "What if the job needs more work than expected?",
    answer:
      "The professional raises a quotation with photos and a material list. You can accept it — which takes a 50% advance, with the balance due on completion — or decline and pay only for the visit.",
  },
  {
    id: "faq_05",
    serviceId: null,
    question: "How is the job marked complete?",
    answer:
      "The professional takes before and after photos and asks you for a one-time code. The job is only closed once you share that code, so nothing is marked done without you.",
  },
  {
    id: "faq_06",
    serviceId: null,
    question: "How do I pay?",
    answer:
      "UPI, card, wallet or cash. You get an invoice with the service fee and the platform fee itemised separately, with GST shown on the platform fee.",
  },
];
