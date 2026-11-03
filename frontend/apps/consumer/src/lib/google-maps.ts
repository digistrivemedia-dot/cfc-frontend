"use client";

import * as React from "react";
import type { MapStatus } from "./map-provider";

/**
 * Loads the Google Maps JavaScript SDK, once per page.
 *
 * ## Why a hand-rolled loader
 *
 * The SDK is a `<script>` that defines a global. Every React wrapper for it is
 * a dependency that exists to do these thirty lines, and the ones that do more
 * than that do it by owning the map component too — which is the part we
 * actually want to write ourselves, because the pin behaviour is the feature.
 *
 * ## Why a module-level promise
 *
 * The SDK throws if included twice, and two components mounting at once would
 * both append a tag. The promise is created on first call and every later
 * caller awaits the same one, so the script lands exactly once no matter how
 * many maps the page has.
 *
 * Only loaded when `NEXT_PUBLIC_MAP_PROVIDER=google`. Under the default `osm`
 * nothing here runs and no Google script is ever fetched.
 *
 * ## The key is public, and that is not a mistake
 *
 * `NEXT_PUBLIC_GOOGLE_MAPS_API_KEY` ships in the page. It cannot be otherwise:
 * the browser has to call Google with it. It is protected by an HTTP-referrer
 * restriction and by being limited to Maps + Places — **not** Geocoding, which
 * runs server-side behind our own endpoint with a second IP-restricted key.
 */

export const MAPS_KEY = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY ?? "";

let loader: Promise<void> | null = null;

function load(): Promise<void> {
  if (loader) return loader;

  loader = new Promise<void>((resolve, reject) => {
    if (typeof window === "undefined") {
      reject(new Error("No window."));
      return;
    }
    // A second mount after the script already landed.
    if ((window as { google?: { maps?: unknown } }).google?.maps) {
      resolve();
      return;
    }

    const script = document.createElement("script");
    // `places` for the search box, `marker` for the advanced marker the pin
    // uses. `loading=async` is what Google asks for and silences its own
    // console warning about blocking the main thread.
    script.src =
      `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(MAPS_KEY)}` +
      `&libraries=places,marker&loading=async&language=en&region=IN`;
    script.async = true;
    script.onerror = () =>
      reject(new Error("The Maps script did not load."));
    // Google calls back on the global when it is genuinely ready; `onload`
    // alone fires before the libraries are initialised.
    script.onload = () => resolve();
    document.head.appendChild(script);
  });

  return loader;
}

/**
 * `unconfigured` when there is no key — the caller must offer typed entry
 * rather than an empty grey square, because a missing key is a setup task and
 * not something the customer can do anything about.
 */
export function useGoogleMaps(): MapStatus {
  const [status, setStatus] = React.useState<MapStatus>(
    MAPS_KEY === "" ? "unconfigured" : "loading",
  );

  React.useEffect(() => {
    if (MAPS_KEY === "") return;
    let cancelled = false;
    void load()
      .then(() => {
        if (!cancelled) setStatus("ready");
      })
      .catch(() => {
        if (!cancelled) setStatus("failed");
      });
    return () => {
      cancelled = true;
    };
  }, []);

  return status;
}
