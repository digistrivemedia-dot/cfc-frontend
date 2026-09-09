import { categories, subCategories, services, pricingRules, commissionRules } from "../fixtures/catalog";
import { ApiError } from "@cfc/types";
import { applyScenario, latency } from "../control";

export async function getCategories() {
  await latency();
  return applyScenario(categories, []);
}

export async function getSubCategories(categoryId?: string) {
  await latency();
  const rows = categoryId
    ? subCategories.filter((s) => s.categoryId === categoryId)
    : subCategories;
  return applyScenario(rows, []);
}

export async function getServices(search?: string) {
  await latency();
  let rows = services;
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter((s) => s.name.toLowerCase().includes(q));
  }
  return applyScenario(rows, []);
}

/**
 * One service, for Customer 12.
 *
 * Throws rather than returning null: a service detail screen with no service
 * is not a state worth rendering, and a 404 is the honest answer for a link to
 * something that has been removed from the catalogue.
 */
export async function getService(id: string) {
  await latency();
  const found = services.find((s) => s.id === id);
  return applyScenario(
    found ??
      (() => {
        throw new ApiError(404, "That service is not available.");
      })(),
    null,
  );
}

export async function getPricingRules() {
  await latency();
  return applyScenario(pricingRules, []);
}

export async function getCommissionRules() {
  await latency();
  return applyScenario(commissionRules, []);
}
