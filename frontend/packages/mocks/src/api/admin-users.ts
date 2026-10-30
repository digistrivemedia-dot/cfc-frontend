import type { SubAdmin } from "@cfc/types";
import { applyScenario, latency } from "../control";
import { fetchJson, isLive } from "../http";

const subAdmins: SubAdmin[] = [
  {
    id: "adm_0002",
    name: "Meenakshi S.",
    role: "area_admin",
    area: "Srirangam",
    // "Local pro management and job oversight only" — the work queues in one
    // area, nothing platform-wide.
    sections: ["bookings", "quotations", "pros"],
    active: true,
  },
  {
    id: "adm_0003",
    name: "Vignesh T.",
    role: "sub_admin",
    // "Bookings, support tickets, quotation queue, vendor approvals."
    sections: ["bookings", "quotations", "pros", "support"],
    active: true,
  },
];

export async function getSubAdmins(): Promise<SubAdmin[]> {
  if (isLive("getSubAdmins")) {
    return fetchJson<SubAdmin[]>("/admin/users");
  }
  await latency();
  return applyScenario(subAdmins, []);
}

/**
 * Admin 49 — delegated admins. Live-only.
 *
 * The password is sent once and never returned by anything. `sections` can
 * narrow a role but never widen it: `canOpen` intersects the stored list with
 * the role's own, so granting "settings" to a sub admin grants nothing.
 */
export async function createSubAdmin(input: {
  name: string;
  email: string;
  password: string;
  role: "sub_admin" | "area_admin";
  area?: string;
  sections: string[];
}): Promise<SubAdmin> {
  return fetchJson("/admin/users", { method: "POST", body: input });
}

export async function updateSubAdmin(
  id: string,
  input: { name?: string; area?: string; sections?: string[] },
): Promise<SubAdmin> {
  return fetchJson(`/admin/users/${id}`, { method: "PATCH", body: input });
}

/** Revoked, not deleted — the audit log's actor must still resolve to a person. */
export async function revokeSubAdmin(id: string): Promise<SubAdmin> {
  return fetchJson(`/admin/users/${id}/revoke`, { method: "POST" });
}

export async function restoreSubAdmin(id: string): Promise<SubAdmin> {
  return fetchJson(`/admin/users/${id}/restore`, { method: "POST" });
}
