import { faqs } from "../fixtures/faqs";
import { applyScenario, latency } from "../control";

/**
 * Customer 12 — FAQs on a service detail screen.
 *
 * Returns the questions that apply everywhere plus any specific to this
 * service. Most are platform-wide, so a service with no questions of its own
 * still shows a useful set rather than an empty section.
 */
export async function getServiceFaqs(serviceId: string) {
  await latency();
  const rows = faqs.filter((f) => f.serviceId === null || f.serviceId === serviceId);
  return applyScenario(rows, []);
}
