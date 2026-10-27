import { fetchJson } from "../http";

/**
 * Pro 11 — going online, and the location ping while on a job.
 *
 * Live-only. Online state is **dispatch behaviour, not a UI preference**: an
 * online pro is in the pool that gets alerted, so a local-only toggle would
 * show a pro as available while the server never offered them anything.
 *
 * The pro app held this in `sessionStorage` and nothing else knew about it —
 * which was right with no server, and is now the thing that has to change.
 */

/**
 * Sets whether this pro is taking work.
 *
 * Refused with 403 for a pro who is not approved, or who is blocked. The server
 * decides, because a pending pro sitting in the dispatch pool would be alerted
 * for jobs they cannot legally accept.
 */
export async function setProOnline(online: boolean): Promise<{ online: boolean }> {
  return fetchJson<{ online: boolean }>("/pro/online", {
    method: "PUT",
    body: { online },
  });
}

/**
 * Reports where the pro is.
 *
 * Called every 15–30 seconds while on a job, **not every second**: it is the
 * pro's battery and their data. Feeds the customer's tracking screen and the
 * admin live map.
 */
export async function pingProLocation(
  lat: number,
  lng: number,
): Promise<void> {
  return fetchJson<void>("/pro/location", {
    method: "PUT",
    body: { lat, lng },
  });
}
