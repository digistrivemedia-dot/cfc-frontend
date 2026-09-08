import type {
  Page,
  ProApprovalStatus,
  ProDetail,
  ProListItem,
  WalletEntry,
} from "@cfc/types";
import { ApiError } from "@cfc/types";
import { proListItems, pros, walletEntries } from "../fixtures/pros";
import { proWarnings, payouts } from "../fixtures/discipline";
import { applyScenario, latency } from "../control";

export interface ProQuery {
  search?: string | undefined;
  approvalStatus?: ProApprovalStatus | "all" | undefined;
  area?: string | undefined;
  online?: "all" | "online" | "offline" | undefined;
  page?: number | undefined;
  pageSize?: number | undefined;
}

export async function getPros(query: ProQuery = {}): Promise<Page<ProListItem>> {
  await latency();
  const { search, approvalStatus = "all", area, online = "all", page = 1, pageSize = 20 } = query;

  let rows = proListItems;
  if (approvalStatus !== "all") rows = rows.filter((p) => p.approvalStatus === approvalStatus);
  if (area) rows = rows.filter((p) => p.area === area);
  if (online === "online") rows = rows.filter((p) => p.online);
  if (online === "offline") rows = rows.filter((p) => !p.online);
  if (search) {
    const q = search.toLowerCase();
    rows = rows.filter(
      (p) => p.name.toLowerCase().includes(q) || p.phone.includes(q),
    );
  }

  const total = rows.length;
  const start = (page - 1) * pageSize;
  const items = rows.slice(start, start + pageSize);

  return applyScenario<Page<ProListItem>>(
    { items, total, page, pageSize, hasMore: start + pageSize < total },
    { items: [], total: 0, page: 1, pageSize, hasMore: false },
  );
}

export async function getPro(id: string): Promise<ProDetail> {
  await latency();
  const found = pros.find((p) => p.id === id);
  return applyScenario(
    found ?? (() => { throw new ApiError(404, "Pro not found."); })(),
  );
}

export async function getProWarnings(proId?: string) {
  await latency();
  const rows = proId ? proWarnings.filter((w) => w.proId === proId) : proWarnings;
  return applyScenario(rows, []);
}

export async function getPayouts(status?: string) {
  await latency();
  const rows = status && status !== "all" ? payouts.filter((p) => p.status === status) : payouts;
  return applyScenario(rows, []);
}

/**
 * One pro's wallet ledger. Admin 16 — "job-wise credits".
 *
 * Newest first. The entries sum to the pending balance on the pro's record, so
 * the headline figure and the lines behind it always agree.
 */
export async function getWalletEntries(proId: string): Promise<WalletEntry[]> {
  await latency();
  return applyScenario(walletEntries[proId] ?? [], []);
}
