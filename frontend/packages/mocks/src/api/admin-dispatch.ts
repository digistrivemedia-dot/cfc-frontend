import { fetchJson } from "../http";

/**
 * Admin 9, 10 — the live map and manual assignment.
 *
 * `ADMIN-PENDING.md` records this as the largest single gap in the admin build:
 * the one screen that never got the design rebuild, and the one an operator
 * opens precisely when dispatch has already failed.
 */

export interface LiveMapPro {
  id: string;
  name: string;
  online: boolean;
  area: string;
  rating: number;
  /** Null for a pro who has never pinged. Draw nothing rather than (0,0). */
  point: { lat: number; lng: number } | null;
}

export interface LiveMapJob {
  id: string;
  reference: string;
  serviceName: string;
  status: string;
  area: string;
  point: { lat: number; lng: number };
  /**
   * Whether that point means anything.
   *
   * False for every booking until geocoding lands — the address form sends one
   * hardcoded coordinate for everyone. Cluster these as "area only" rather than
   * drawing a dozen pins on the same wrong spot and implying precision.
   */
  locationVerified: boolean;
  proId: string | null;
  scheduledAt: string;
}

/**
 * Everything in flight, in one call.
 *
 * One endpoint rather than three: the map draws pros and jobs together, and two
 * requests would let them disagree by a poll interval. Poll every five seconds
 * — §3 of the plan chose that over a socket.
 */
export async function getLiveMap(): Promise<{
  pros: LiveMapPro[];
  jobs: LiveMapJob[];
}> {
  return fetchJson("/admin/dispatch/live");
}

export interface DispatchAlertRow {
  id: string;
  bookingId: string;
  bookingReference: string;
  serviceName: string;
  area: string;
  prosNotified: number;
  at: string;
  /** "No professional was available to ask" vs "3 notified, none accepted". */
  reason: string;
}

/** The jobs nobody took — the queue an operator actually works. */
export async function getDispatchAlerts(): Promise<DispatchAlertRow[]> {
  return fetchJson<DispatchAlertRow[]>("/admin/dispatch/alerts");
}

export interface AssignCandidate {
  id: string;
  name: string;
  phone: string;
  areas: string[];
  online: boolean;
  rating: number;
  jobsCompleted: number
  servesThisArea: boolean;
  /** `declined`, `expired`, `taken` — or null if never offered this job. */
  previousOffer: string | null;
}

/**
 * Who could take this job.
 *
 * Deliberately not filtered to the area or to online pros: an operator
 * assigning by hand usually has a phone call behind it, and a picker that hides
 * the pro they just spoke to is a picker they work around. `servesThisArea` and
 * `online` are reported so the operator can weigh it themselves.
 */
export async function getAssignCandidates(
  bookingId: string,
): Promise<AssignCandidate[]> {
  return fetchJson<AssignCandidate[]>(
    `/admin/dispatch/candidates/${bookingId}`,
  );
}

/** Admin 10 — assign by hand. Gated on `bookings.override_status`. */
export async function assignProManually(
  bookingId: string,
  proId: string,
): Promise<{ id: string; reference: string; status: string; proId: string }> {
  return fetchJson("/admin/dispatch/assign", {
    method: "POST",
    body: { bookingId, proId },
  });
}
