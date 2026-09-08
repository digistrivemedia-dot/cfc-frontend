import { categories, subCategories, services, pricingRules, commissionRules } from "../fixtures/catalog";
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

export async function getPricingRules() {
  await latency();
  return applyScenario(pricingRules, []);
}

export async function getCommissionRules() {
  await latency();
  return applyScenario(commissionRules, []);
}
