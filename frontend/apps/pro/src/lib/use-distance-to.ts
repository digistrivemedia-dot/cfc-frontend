"use client";

import * as React from "react";

/**
 * How far the pro is from the customer, from the device's own GPS.
 *
 * The agreement's rule: **a pro must be within 100 m of the customer to mark a
 * job complete.** That is a real gate, not a decoration — it is the platform's
 * proof that someone actually attended — so this is built on the real
 * Geolocation API rather than faked.
 *
 * ## Every failure is a designed state
 *
 * Location can fail in four distinct ways and they need different words,
 * because "location unavailable" tells a pro standing in a customer's kitchen
 * nothing about what to do:
 *
 *   `unsupported` — the browser has no Geolocation API at all. Rare.
 *   `denied`      — the pro refused the permission, or the browser blocks it.
 *                   Recoverable, but only by the pro in their own settings.
 *   `unavailable` — permission is granted and no fix is obtainable. Indoors,
 *                   basements, thick walls. Usually temporary.
 *   `timeout`     — a fix did not arrive in time. Worth retrying.
 *
 * A pro who cannot get a fix must not simply be blocked from finishing a job
 * they have done, so the screens that use this offer a path anyway and flag it
 * for admin review. Blocking honest work because of a weak GPS signal would
 * make the rule the pro's problem rather than the platform's.
 *
 * ## Accuracy
 *
 * Browser geolocation is less accurate than a native app's — often 20-50 m on
 * a phone and far worse on desktop Wi-Fi positioning. Against a 100 m gate that
 * is a real margin, so `accuracyM` is reported and the screens show it. The
 * client may need to set a tolerance; recorded in PRO-OPEN-ITEMS 2.4.
 */

export type LocationError =
  | "unsupported"
  | "denied"
  | "unavailable"
  | "timeout";

export interface DistanceState {
  /** Metres from the target, or null before the first fix. */
  metres: number | null;
  /** The fix's own claimed accuracy, in metres. */
  accuracyM: number | null;
  loading: boolean;
  error: LocationError | null;
  /** Ask again. Useful after the pro has moved, or enabled permission. */
  retry: () => void;
}

/**
 * Great-circle distance between two points, in metres.
 *
 * The haversine formula. At the scale that matters here — under a kilometre —
 * a flat-earth approximation would be accurate too, but this costs nothing and
 * does not need a caveat about how far it stays valid.
 */
export function metresBetween(
  a: { lat: number; lng: number },
  b: { lat: number; lng: number },
): number {
  const R = 6_371_000; // Earth's mean radius, metres
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

/** The rule from the agreement. */
export const GPS_PROOF_RADIUS_M = 100;

export function useDistanceTo(
  target: { lat: number; lng: number } | null,
): DistanceState {
  const [metres, setMetres] = React.useState<number | null>(null);
  const [accuracyM, setAccuracyM] = React.useState<number | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<LocationError | null>(null);
  const [attempt, setAttempt] = React.useState(0);

  const retry = React.useCallback(() => setAttempt((n) => n + 1), []);

  React.useEffect(() => {
    if (target === null) return;

    if (typeof navigator === "undefined" || !("geolocation" in navigator)) {
      setError("unsupported");
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const watchId = navigator.geolocation.watchPosition(
      (pos) => {
        if (cancelled) return;
        setLoading(false);
        setError(null);
        setAccuracyM(pos.coords.accuracy);
        setMetres(
          metresBetween(
            { lat: pos.coords.latitude, lng: pos.coords.longitude },
            target,
          ),
        );
      },
      (err) => {
        if (cancelled) return;
        setLoading(false);
        // The DOM constants rather than magic numbers, and mapped to words a
        // screen can act on.
        setError(
          err.code === err.PERMISSION_DENIED
            ? "denied"
            : err.code === err.TIMEOUT
              ? "timeout"
              : "unavailable",
        );
      },
      {
        // Worth the battery: this decides whether a pro can close a job.
        enableHighAccuracy: true,
        // Long enough for a cold GPS fix outdoors, short enough that a pro is
        // told something is wrong rather than left watching a spinner.
        timeout: 20_000,
        // A fix from the last half-minute is fine. Anything older could be
        // from before the pro arrived, which is exactly what the rule guards
        // against.
        maximumAge: 30_000,
      },
    );

    return () => {
      cancelled = true;
      navigator.geolocation.clearWatch(watchId);
    };
    // `attempt` is in the deps so `retry()` re-runs the watch.
  }, [target, attempt]);

  return { metres, accuracyM, loading, error, retry };
}

/** Words for a failure, in the pro's terms rather than the API's. */
export const LOCATION_ERROR_MESSAGE: Record<LocationError, string> = {
  unsupported: "This browser cannot check your location.",
  denied:
    "Location permission is off. Turn it on in your browser settings to confirm you are at the job.",
  unavailable:
    "Could not get your location. Step outside or near a window and try again.",
  timeout: "Getting your location took too long. Try again.",
};
