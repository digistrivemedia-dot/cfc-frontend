"use client";

import * as React from "react";
import { MapPin, Navigation } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * The shared map surface. Consumer 27, Pro 14, and Admin 9 all render through
 * this one component.
 *
 * The maps SDK is out of scope — this is deliberately not a grey box or a
 * screenshot. It draws a muted, map-styled canvas with real pins, positioned
 * from `markers`, so a screen actually reflects the booking or job it is
 * showing. Replacing the canvas with a live SDK later means swapping the
 * internals of this one file; the props already match what a real map takes.
 */

export interface MapMarker {
  id: string;
  /** 0–100, position within the canvas — not real geo coordinates. */
  x: number;
  y: number;
  kind: "customer" | "pro" | "self";
  label?: string | undefined;
}

export interface MapViewProps {
  markers: MapMarker[];
  /** Draws a route line between two marker ids, in order. */
  route?: [string, string];
  className?: string;
  children?: React.ReactNode;
}

export function MapView({ markers, route, className, children }: MapViewProps) {
  const byId = React.useMemo(
    () => new Map(markers.map((m) => [m.id, m])),
    [markers],
  );
  const from = route ? byId.get(route[0]) : undefined;
  const to = route ? byId.get(route[1]) : undefined;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-card border border-border bg-canvas",
        className,
      )}
      role="img"
      aria-label="Map showing current locations"
    >
      {/* Muted street-grid texture standing in for map tiles. */}
      <svg
        className="absolute inset-0 size-full text-border"
        aria-hidden="true"
        preserveAspectRatio="none"
      >
        <defs>
          <pattern id="cfc-grid" width="40" height="40" patternUnits="userSpaceOnUse">
            <path d="M 40 0 L 0 0 0 40" fill="none" stroke="currentColor" strokeWidth="1" />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cfc-grid)" />
      </svg>

      {from && to && (
        <svg className="absolute inset-0 size-full" aria-hidden="true">
          <line
            x1={`${from.x}%`}
            y1={`${from.y}%`}
            x2={`${to.x}%`}
            y2={`${to.y}%`}
            stroke="var(--color-action)"
            strokeWidth={3}
            strokeDasharray="2 8"
            strokeLinecap="round"
          />
        </svg>
      )}

      {markers.map((m) => (
        <div
          key={m.id}
          className="absolute -translate-x-1/2 -translate-y-full"
          style={{ left: `${m.x}%`, top: `${m.y}%` }}
        >
          <MarkerPin kind={m.kind} label={m.label} />
        </div>
      ))}

      {children}
    </div>
  );
}

function MarkerPin({
  kind,
  label,
}: {
  kind: MapMarker["kind"];
  label?: string | undefined;
}) {
  const tone =
    kind === "pro"
      ? "bg-structure text-on-structure"
      : kind === "self"
        ? "bg-go text-on-action"
        : "bg-action text-on-action";
  const Icon = kind === "self" ? Navigation : MapPin;

  return (
    <div className="flex flex-col items-center">
      {label && (
        <span className="mb-1 whitespace-nowrap rounded-pill border border-border bg-surface px-2 py-px text-caption font-medium text-ink shadow-sm">
          {label}
        </span>
      )}
      <span
        className={cn(
          "flex size-8 items-center justify-center rounded-full shadow-md",
          tone,
        )}
      >
        <Icon className="size-4" fill="currentColor" strokeWidth={1} aria-hidden="true" />
      </span>
    </div>
  );
}
