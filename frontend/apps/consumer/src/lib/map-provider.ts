"use client";

/**
 * Which map renders, and the bits both renderers share.
 *
 * ## Two providers, one interface
 *
 *   `osm`     (default) OpenStreetMap through Leaflet. Free, no key, no
 *             billing account. Tiles from OSM's own servers, or from Geoapify
 *             when a key is set.
 *   `google`  Google Maps JavaScript API. Needs an **activated** billing
 *             account — in India a ₹1,000 prepayment before anything renders.
 *
 * Switching is `NEXT_PUBLIC_MAP_PROVIDER` plus a restart. Both implementations
 * satisfy `LocationPickerProps`, so the address form does not know which one it
 * is rendering, and the one not selected stays compiled rather than deleted.
 *
 * ## Why rendering and geocoding switch separately
 *
 * This value picks the **map**. `GEOCODER` on the server picks what turns a pin
 * into an address. They are deliberately independent: OSM's tiles are excellent
 * and free, while a paid geocoder may be more accurate on Indian localities, and
 * mixing the two is a reasonable thing to want.
 */

export type MapProvider = "osm" | "google";

/**
 * Defaults to `osm` — the one that works with no key and no payment.
 *
 * Anything other than the literal `google` is treated as `osm`, so a typo
 * degrades to the free provider rather than to a blank screen.
 */
export const MAP_PROVIDER: MapProvider =
  process.env.NEXT_PUBLIC_MAP_PROVIDER === "google" ? "google" : "osm";

/** Loader status, shared by both renderers so the form reads one shape. */
export type MapStatus = "unconfigured" | "loading" | "ready" | "failed";

/** What the address form needs from whichever picker is rendered. */
export interface LocationPickerProps {
  /** The current point. The map follows it when it changes from outside. */
  value: { lat: number; lng: number } | null;
  /** Panning stopped. One reverse-geocode per call — do not poll it. */
  onSettle: (point: { lat: number; lng: number }) => void;
  /** Shown under the map: the provider's rendering of what is under the pin. */
  caption?: string | undefined;
  /** Set when the pin is outside every service area. */
  warning?: string | undefined;
  busy?: boolean | undefined;
}

/** Trichy. Where the platform operates, so a reasonable place to open. */
export const FALLBACK_CENTRE = { lat: 10.7905, lng: 78.7047 };

/** Metres between two points. Haversine — good to a few metres at city scale. */
export function metresBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_000;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/**
 * How close a device reading has to be to count as "you are at this address".
 *
 * 200 m, because browser geolocation in a building is routinely 50–150 m out
 * and a flat is not 200 m wide. Too tight and someone standing in their own
 * kitchen is not matched to their own home; too loose and Home matches Office
 * two streets away. This is the knob to turn if matching feels wrong — it is a
 * property of real GPS, not of the code.
 */
export const MATCH_RADIUS_M = 200;
