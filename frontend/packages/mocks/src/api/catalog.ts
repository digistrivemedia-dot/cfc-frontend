import { categories, subCategories, services, pricingRules, commissionRules } from "../fixtures/catalog";
import type {
  Category,
  CommissionRule,
  PricingRule,
  ServiceDetail,
  ServiceVariant,
  SubCategory,
} from "@cfc/types";
import { ApiError } from "@cfc/types";
import { applyScenario, latency } from "../control";
import { API_BASE, fetchJson, isAdminToken, isLive } from "../http";

/**
 * Admin 22–29 and the customer's view of the same catalogue.
 *
 * Reads have a fixture fallback so the screens stay reviewable without a
 * server. **Writes do not** — there is nothing for a write to fall back to, and
 * a "saved" toast over an unchanged database is how the admin panel came to
 * have twenty-six handlers that only called `setState` (BACKEND-PLAN.md §0.8).
 *
 * Reads hit `/public/catalog/*` or `/admin/catalog/*` depending on who is
 * asking, and the difference is not cosmetic: the public routes return only
 * active rows. An admin who switched a category off must still see it to switch
 * it back on; a customer must not see it at all.
 */

/**
 * Which catalogue endpoints to read from.
 *
 * Decided by the token's **role**, not by whether a token exists. The first
 * version used presence, which held only while the admin was the one app with
 * a token — once Phase 5 signed customers in, a customer browsing the catalogue
 * was routed to the admin endpoint and got a 403.
 *
 * Role rather than a per-app build flag, because a flag can be set wrong and
 * would then silently show a customer the unpublished catalogue. This cannot:
 * an admin token reads the admin view, everything else reads the public one,
 * and the server enforces that independently.
 */
function catalogBase(): string {
  return isAdminToken() ? "/admin/catalog" : "/public/catalog";
}

export async function getCategories(): Promise<Category[]> {
  if (isLive("getCategories")) {
    return fetchJson<Category[]>(`${catalogBase()}/categories`);
  }
  await latency();
  return applyScenario(categories, []);
}

export async function getSubCategories(categoryId?: string) {
  if (isLive("getSubCategories")) {
    return fetchJson<SubCategory[]>(`${catalogBase()}/sub-categories`, {
      query: { categoryId },
    });
  }
  await latency();
  const rows = categoryId
    ? subCategories.filter((s) => s.categoryId === categoryId)
    : subCategories;
  return applyScenario(rows, []);
}

export async function getServices(search?: string) {
  if (isLive("getServices")) {
    return fetchJson<ServiceDetail[]>(`${catalogBase()}/services`, {
      query: { search },
    });
  }
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
  if (isLive("getService")) {
    return fetchJson<ServiceDetail>(`${catalogBase()}/services/${id}`);
  }
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
  if (isLive("getPricingRules")) {
    return fetchJson<PricingRule[]>("/admin/catalog/pricing");
  }
  await latency();
  return applyScenario(pricingRules, []);
}

export async function getCommissionRules() {
  if (isLive("getCommissionRules")) {
    return fetchJson<CommissionRule[]>("/admin/catalog/commission");
  }
  await latency();
  return applyScenario(commissionRules, []);
}

// -- Writes. Admin only, and live-only. ---------------------------------------

export interface CategoryInput {
  name: string;
  iconName: string;
  description: string;
  active: boolean;
}

export async function createCategory(input: CategoryInput): Promise<Category> {
  return fetchJson<Category>("/admin/catalog/categories", { body: input });
}

export async function updateCategory(
  id: string,
  patch: Partial<CategoryInput> & { sortOrder?: number },
): Promise<Category> {
  return fetchJson<Category>(`/admin/catalog/categories/${id}`, {
    method: "PATCH",
    body: patch,
  });
}

/**
 * Admin 22 — drag-to-reorder.
 *
 * Sends the **whole ordered list**, not one move. The screen renumbers from
 * position on every change anyway, and a full list cannot leave two categories
 * sharing position 3 the way a sequence of individual moves can if one fails.
 */
export async function reorderCategories(ids: string[]): Promise<Category[]> {
  return fetchJson<Category[]>("/admin/catalog/categories/reorder", {
    method: "PATCH",
    body: { ids },
  });
}

export async function deleteCategory(id: string): Promise<void> {
  return fetchJson<void>(`/admin/catalog/categories/${id}`, {
    method: "DELETE",
  });
}

export interface SubCategoryInput {
  name: string;
  categoryId: string;
  iconName: string;
  active: boolean;
}

export async function createSubCategory(
  input: SubCategoryInput,
): Promise<SubCategory> {
  return fetchJson<SubCategory>("/admin/catalog/sub-categories", {
    body: input,
  });
}

export async function updateSubCategory(
  id: string,
  patch: Partial<SubCategoryInput>,
): Promise<SubCategory> {
  return fetchJson<SubCategory>(`/admin/catalog/sub-categories/${id}`, {
    method: "PATCH",
    body: patch,
  });
}

export async function deleteSubCategory(id: string): Promise<void> {
  return fetchJson<void>(`/admin/catalog/sub-categories/${id}`, {
    method: "DELETE",
  });
}

/**
 * What Admin 27 can set on a service.
 *
 * `subCategoryId` is **required on create** and is the field the built dialog
 * was missing entirely (§0.8) — without it a new service belongs to no
 * category, so it exists in the admin table and appears nowhere a customer can
 * reach it.
 *
 * Prices are absent: they live on the Pricing tab (Admin 28) and go through
 * `updatePricingRule`, gated on `services.edit_pricing`. One exception —
 * `basePricePaise` on create, because a service with no price is not bookable
 * and making an operator visit a second tab to make their new service usable is
 * a trap rather than a workflow.
 */
export interface ServiceInput {
  name: string;
  subCategoryId: string;
  description: string;
  inclusions: string[];
  warrantyDays: number;
  active: boolean;
  variants: ServiceVariant[];
  imagePaths?: string[];
  basePricePaise?: number;
}

export async function createService(
  input: ServiceInput,
): Promise<ServiceDetail> {
  return fetchJson<ServiceDetail>("/admin/catalog/services", { body: input });
}

export async function updateService(
  id: string,
  patch: Partial<ServiceInput>,
): Promise<ServiceDetail> {
  return fetchJson<ServiceDetail>(`/admin/catalog/services/${id}`, {
    method: "PATCH",
    body: patch,
  });
}

export async function deleteService(id: string): Promise<void> {
  return fetchJson<void>(`/admin/catalog/services/${id}`, { method: "DELETE" });
}

/** Admin 28. Gated server-side on `services.edit_pricing`. */
export async function updatePricingRule(
  serviceId: string,
  patch: {
    basePricePaise: number;
    platformFeePaise: number;
    visitChargePaise: number;
    nightSurchargePaise: number;
    /** `null` clears an existing override; omit to leave it untouched. */
    cityOverride?: { city: string; basePricePaise: number } | null;
  },
): Promise<PricingRule> {
  return fetchJson<PricingRule>(`/admin/catalog/pricing/${serviceId}`, {
    method: "PATCH",
    body: patch,
  });
}

/** Admin 29. Gated server-side on `services.edit_commission`. */
export async function updateCommissionRule(input: {
  scope: "category" | "pro" | "partner";
  targetId: string;
  commissionBps: number;
  note?: string;
}): Promise<CommissionRule[]> {
  return fetchJson<CommissionRule[]>("/admin/catalog/commission", {
    method: "PUT",
    body: input,
  });
}

/**
 * Uploads one catalogue image and returns the path to store on the service.
 *
 * `FormData`, so the browser sets the multipart boundary — `fetchJson` skips
 * its own content-type header when given a form for exactly this reason.
 *
 * The returned path is relative (`/uploads/...`). Each Next app proxies that
 * prefix to the API, so nothing in a component needs to know the API host.
 */
export async function uploadCatalogImage(
  file: File,
): Promise<{ path: string; url: string }> {
  const form = new FormData();
  form.append("file", file);
  return fetchJson<{ path: string; url: string }>("/admin/catalog/images", {
    method: "POST",
    form,
  });
}

/** Where uploads are served from, for building a preview before saving. */
export { API_BASE };
