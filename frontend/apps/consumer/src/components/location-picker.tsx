"use client";

import { GoogleLocationPicker } from "./location-picker-google";
import { OsmLocationPicker } from "./location-picker-osm";
import { MAP_PROVIDER, type LocationPickerProps } from "@/lib/map-provider";

/**
 * The map, whichever provider is configured.
 *
 * One component for the address form to render, two implementations behind it,
 * chosen by `NEXT_PUBLIC_MAP_PROVIDER`:
 *
 *   `osm`     (default) `OsmLocationPicker` — Leaflet over OpenStreetMap.
 *             Free. No key, no billing account, no prepayment.
 *   `google`  `GoogleLocationPicker` — Google Maps JavaScript API. Needs an
 *             activated billing account before anything renders.
 *
 * Both satisfy `LocationPickerProps` and behave the same way: a fixed centre
 * pin, panning to position it, a place search, and "use my location". The form
 * above does not know which one it has.
 *
 * ## Why a switch and not a replacement
 *
 * Google was built first and is kept compiled rather than deleted. Switching
 * back is an environment value and a restart — not a rewrite from memory
 * against an API that will have moved on. The cost of keeping it is this file
 * and one unused import that tree-shakes out of the bundle that does not use it.
 *
 * Reverse geocoding switches **separately**, on the server, with `GEOCODER`.
 * The two are independent on purpose: OSM's tiles are free and good, while a
 * different geocoder may read Indian localities better, and mixing them is a
 * reasonable thing to want.
 */
export function LocationPicker(props: LocationPickerProps) {
  return MAP_PROVIDER === "google" ? (
    <GoogleLocationPicker {...props} />
  ) : (
    <OsmLocationPicker {...props} />
  );
}

export type { LocationPickerProps };
