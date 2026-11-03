"use client";

import * as React from "react";
import { cn } from "../lib/cn";

/**
 * A read-only map with real pins at real coordinates.
 *
 * ## What it replaced
 *
 * `MapView` — a hand-drawn canvas that took **percentages instead of
 * coordinates**. Every screen using it therefore invented positions: the
 * consumer's booking summary pinned every address at dead centre, and the
 * pro's job screen drew the customer at `(62, 40)`, the pro at `(22, 68)` and a
 * route line between two numbers that meant nothing. It looked like a map and
 * showed nothing true.
 *
 * `MapView` is still exported for the screens not yet moved across; new work
 * should use this.
 *
 * ## Read-only on purpose
 *
 * Every interaction is disabled. These are confirmation views — the customer
 * placed their pin when they saved the address, and the pro navigates with
 * their phone's own maps app. A map that can be dragged here suggests dragging
 * it changes something, and it does not.
 *
 * ## OpenStreetMap tiles
 *
 * Free, no key, no billing account. Attribution is a licence condition and
 * Leaflet renders it in the corner — do not hide it.
 */

export interface PinMapMarker {
  id: string;
  point: { lat: number; lng: number };
  /** `self` renders in a muted tone; the others in the brand action colour. */
  kind?: "customer" | "pro" | "self" | undefined;
  /** Shown on hover and to screen readers. */
  label?: string | undefined;
}

export interface PinMapProps {
  markers: PinMapMarker[];
  /** Height comes from the caller — a card and a full-bleed panel differ. */
  className?: string | undefined;
  /** Overrides the automatic fit. Ignored when there are several markers. */
  zoom?: number | undefined;
}

/**
 * Drawn from markup rather than an image file.
 *
 * Leaflet's default marker loads its icon from a path relative to the
 * stylesheet, which bundlers rewrite — so it 404s and no pin appears at all.
 */
function pinHtml(kind: PinMapMarker["kind"]): string {
  const colour =
    kind === "self" ? "var(--color-ink-muted)" : "var(--color-action)";
  return `<span style="
    display:block;width:18px;height:18px;border-radius:9999px;
    background:${colour};border:3px solid #fff;
    box-shadow:0 1px 4px rgb(0 0 0 / 0.4);
  "></span>`;
}

export function PinMap({ markers, className, zoom }: PinMapProps) {
  const holder = React.useRef<HTMLDivElement | null>(null);
  const map = React.useRef<L.Map | null>(null);
  const layer = React.useRef<L.LayerGroup | null>(null);

  // The marker list is rebuilt on every render by most callers, so the effect
  // keys on the coordinates rather than the array identity — otherwise it tears
  // down and rebuilds the pins continuously.
  const signature = markers
    .map((m) => `${m.id}:${m.point.lat},${m.point.lng}:${m.kind ?? ""}`)
    .join("|");

  React.useEffect(() => {
    if (!holder.current) return;
    let cancelled = false;

    // Imported here, not at module scope: Leaflet touches `window` as it loads,
    // which throws during a server render.
    void import("leaflet").then((L) => {
      if (cancelled || !holder.current) return;

      const points = markers.map((m) => m.point);
      if (points.length === 0) return;

      if (!map.current) {
        map.current = L.map(holder.current, {
          center: [points[0]!.lat, points[0]!.lng],
          zoom: zoom ?? 16,
          dragging: false,
          scrollWheelZoom: false,
          doubleClickZoom: false,
          touchZoom: false,
          boxZoom: false,
          keyboard: false,
          zoomControl: false,
          attributionControl: true,
        });

        L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution:
            '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19,
        }).addTo(map.current);
      }

      // Replaced wholesale rather than diffed: a handful of pins makes the
      // bookkeeping cost more than the redraw.
      layer.current?.remove();
      layer.current = L.layerGroup().addTo(map.current);

      for (const m of markers) {
        const marker = L.marker([m.point.lat, m.point.lng], {
          icon: L.divIcon({
            className: "",
            html: pinHtml(m.kind),
            iconSize: [18, 18],
            iconAnchor: [9, 9],
          }),
          // Non-interactive to match the rest of the map.
          interactive: Boolean(m.label),
          ...(m.label ? { alt: m.label } : {}),
        });
        if (m.label) marker.bindTooltip(m.label, { direction: "top" });
        marker.addTo(layer.current);
      }

      // Several pins: frame all of them, with room so none sits on the edge.
      // One pin: centre it, because a bounds fit on a single point zooms to
      // the maximum and shows a street with no context.
      if (points.length > 1) {
        map.current.fitBounds(
          L.latLngBounds(points.map((p) => [p.lat, p.lng])),
          { padding: [32, 32], maxZoom: 17 },
        );
      } else {
        map.current.setView([points[0]!.lat, points[0]!.lng], zoom ?? 16);
      }
    });

    return () => {
      cancelled = true;
    };
    // `markers` is intentionally absent — `signature` stands in for it.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature, zoom]);

  // Torn down only on unmount, not on every marker change.
  React.useEffect(
    () => () => {
      map.current?.remove();
      map.current = null;
      layer.current = null;
    },
    [],
  );

  return (
    // `isolate` is load-bearing: Leaflet gives its panes z-index 400 and its
    // controls 800, while this design system's scale tops out at 100. Without a
    // stacking context the map paints over anything positioned near it.
    <div className={cn("isolate w-full bg-canvas", className)} ref={holder} />
  );
}
