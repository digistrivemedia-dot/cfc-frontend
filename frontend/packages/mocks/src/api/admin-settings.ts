import { fetchJson } from "../http";

/**
 * Admin 38 — platform settings.
 *
 * Live-only. There is nothing sensible for a settings *fixture* to be: the
 * whole point of the screen is to read and change what the server actually
 * holds, and a mock that remembered a change for one session would be a
 * screen that reports success over an unchanged platform — which is precisely
 * the fault this replaces.
 *
 * Only the coverage fields are modelled here so far. The rest of the settings
 * screen still runs on local state with hardcoded defaults and does not
 * persist; it is wired the same way when someone needs it.
 */

export interface PlatformSettings {
  /**
   * Area names, for labels, filters and the pro registration list.
   *
   * **Not** what decides whether a booking is allowed — see `servicePincodes`.
   */
  serviceAreas: string[];
  /**
   * The pincodes CFC accepts bookings from. The authority on coverage.
   *
   * Area names were the test before this, and they broke against a real
   * geocoder: OSM returns the area CFC calls "Thillai Nagar" as "Trichy Zone
   * IV", so an address inside a serviced area read as unserviceable. A pincode
   * is official and comes back identically from every provider.
   */
  servicePincodes: string[];
}

export async function getPlatformSettings(): Promise<PlatformSettings> {
  return fetchJson<PlatformSettings>("/admin/settings");
}

/**
 * Saves coverage. Sends whole arrays, not deltas.
 *
 * The server replaces each list with what it is given, so a caller must send
 * the complete set — which is also what makes a removal expressible at all.
 */
export async function savePlatformCoverage(patch: {
  serviceAreas?: string[];
  servicePincodes?: string[];
}): Promise<PlatformSettings> {
  return fetchJson<PlatformSettings>("/admin/settings", {
    method: "PATCH",
    body: patch,
  });
}
