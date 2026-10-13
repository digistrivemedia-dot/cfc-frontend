import type {
  MaterialRequestDetail,
  MaterialRequestStatus,
  MerchantCategory,
  MerchantDashboardSummary,
  MerchantProfile,
  Page,
} from "@cfc/types";
import { ApiError } from "@cfc/types";
import {
  materialRequests,
  merchantCategories,
  merchantProfile,
} from "../fixtures/merchant";
import { applyScenario, latency } from "../control";

/**
 * Merchant api.
 *
 * Writes mutate the in-memory fixture so a review session behaves like the
 * real thing: accept a request on the detail screen and the dashboard counts
 * move. The array is module state and resets on reload, which is the intended
 * lifetime for a mock.
 */

/** Statuses that still need the merchant to do something. */
const OPEN_STATUSES: MaterialRequestStatus[] = ["pending"];
const PREPARING_STATUSES: MaterialRequestStatus[] = [
  "accepted",
  "partially_accepted",
];

export interface MaterialRequestQuery {
  status?: MaterialRequestStatus | "all" | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export async function getMaterialRequests(
  query: MaterialRequestQuery = {},
): Promise<Page<MaterialRequestDetail>> {
  await latency();
  const { status = "all", page = 1, pageSize = 20 } = query;

  let rows = materialRequests;
  if (status !== "all") rows = rows.filter((r) => r.status === status);

  // Newest first: a shop works the top of the queue.
  rows = [...rows].sort((a, b) => b.receivedAt.localeCompare(a.receivedAt));

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const items = rows.slice(start, start + pageSize);

  return applyScenario<Page<MaterialRequestDetail>>(
    { items, total, page, pageSize, hasMore: start + pageSize < total },
    { items: [], total: 0, page: 1, pageSize, hasMore: false },
  );
}

export async function getMaterialRequest(
  id: string,
): Promise<MaterialRequestDetail> {
  await latency();
  const found = materialRequests.find((r) => r.id === id);
  return applyScenario(
    found ??
      (() => {
        throw new ApiError(404, "Material request not found.");
      })(),
  );
}

export async function getMerchantDashboard(): Promise<MerchantDashboardSummary> {
  await latency();

  const count = (statuses: MaterialRequestStatus[]): number =>
    materialRequests.filter((r) => statuses.includes(r.status)).length;

  return applyScenario<MerchantDashboardSummary>(
    {
      pending: count(OPEN_STATUSES),
      preparing: count(PREPARING_STATUSES),
      ready: count(["ready"]),
      collectedToday: count(["collected"]),
    },
    { pending: 0, preparing: 0, ready: 0, collectedToday: 0 },
  );
}

/**
 * Confirm a request.
 *
 * `unavailableLineIds` carries the lines the shop cannot supply. An empty list
 * is a full acceptance; a partial one leaves the remainder for the admin to
 * place elsewhere, which is why it is a distinct status rather than a flag.
 *
 * `prices` maps a line id to the shop's own cost per unit. A line left out
 * keeps the quotation's figure, so a shop that agrees with the estimate does
 * not have to retype it.
 */
export async function acceptMaterialRequest(
  id: string,
  unavailableLineIds: string[] = [],
  prices: Record<string, number> = {},
): Promise<MaterialRequestDetail> {
  await latency();

  const row = materialRequests.find((r) => r.id === id);
  if (!row) throw new ApiError(404, "Material request not found.");
  if (row.status !== "pending") {
    throw new ApiError(409, "This request has already been answered.");
  }

  const unavailable = new Set(unavailableLineIds);
  row.lines = row.lines.map((line) => {
    const isAvailable = !unavailable.has(line.id);
    return {
      ...line,
      available: isAvailable,
      // A line the shop cannot supply carries no price of its own.
      merchantCostPaise: isAvailable
        ? (prices[line.id] ?? line.costPaise)
        : null,
    };
  });

  if (row.lines.every((line) => !line.available)) {
    throw new ApiError(
      400,
      "Decline the request instead of marking every line unavailable.",
    );
  }

  row.status = unavailable.size > 0 ? "partially_accepted" : "accepted";
  row.expiresAt = null;

  return applyScenario(row);
}

export async function rejectMaterialRequest(
  id: string,
  reason: string,
): Promise<MaterialRequestDetail> {
  await latency();

  const row = materialRequests.find((r) => r.id === id);
  if (!row) throw new ApiError(404, "Material request not found.");
  if (row.status !== "pending") {
    throw new ApiError(409, "This request has already been answered.");
  }

  row.status = "rejected";
  row.rejectionReason = reason;
  row.expiresAt = null;

  return applyScenario(row);
}

export async function markMaterialRequestReady(
  id: string,
): Promise<MaterialRequestDetail> {
  await latency();

  const row = materialRequests.find((r) => r.id === id);
  if (!row) throw new ApiError(404, "Material request not found.");
  if (!PREPARING_STATUSES.includes(row.status)) {
    throw new ApiError(409, "Only an accepted request can be marked ready.");
  }

  row.status = "ready";
  row.readyAt = new Date().toISOString();

  return applyScenario(row);
}

export async function getMerchantProfile(): Promise<MerchantProfile> {
  await latency();
  return applyScenario(merchantProfile);
}

export async function updateMerchantProfile(
  patch: Partial<MerchantProfile>,
): Promise<MerchantProfile> {
  await latency();
  Object.assign(merchantProfile, patch);
  return applyScenario(merchantProfile);
}

export async function getMerchantCategories(): Promise<MerchantCategory[]> {
  await latency();
  return applyScenario(merchantCategories, []);
}
