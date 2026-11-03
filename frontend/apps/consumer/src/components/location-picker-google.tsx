"use client";

import * as React from "react";
import { LocateFixed, MapPin, Search, TriangleAlert } from "lucide-react";
import { Button, InlineAlert, Input, Skeleton, cn } from "@cfc/ui";
import { useGoogleMaps } from "@/lib/google-maps";
import {
  FALLBACK_CENTRE,
  type LocationPickerProps,
} from "@/lib/map-provider";

/**
 * A **Google** map with one pin the customer drags to their door.
 *
 * Rendered only when `NEXT_PUBLIC_MAP_PROVIDER=google`. `OsmLocationPicker` is
 * the free equivalent and `LocationPicker` chooses between them — this file
 * stays compiled either way, so switching back is a config value and not a
 * rewrite.
 *
 * ## The pin does not move; the map does
 *
 * The marker is **fixed at the centre of the viewport** and the customer pans
 * the map underneath it, which is how every delivery app does this and is not
 * an arbitrary choice: a draggable marker on a phone is a 40px target that the
 * dragging thumb covers up, so you cannot see where you are putting it. A
 * fixed centre pin is always visible and the whole map is the drag target.
 *
 * `onSettle` fires when panning stops, not continuously — each call is a
 * reverse-geocode, which is a paid request.
 *
 * ## Without a key
 *
 * Renders an explanation and nothing else. A missing key is a setup task, so
 * saying "the map needs a Google Maps key" beats an empty grey box that looks
 * like a bug, and the form it sits in stays usable by typing.
 */

export function GoogleLocationPicker({
  value,
  onSettle,
  caption,
  warning,
  busy,
}: LocationPickerProps) {
  const status = useGoogleMaps();
  const holder = React.useRef<HTMLDivElement | null>(null);
  const searchBox = React.useRef<HTMLInputElement | null>(null);
  const map = React.useRef<google.maps.Map | null>(null);
  const [locating, setLocating] = React.useState(false);

  // Held in a ref so the `idle` listener, registered once, always calls the
  // latest callback instead of the one captured when the map was built.
  const settle = React.useRef(onSettle);
  React.useEffect(() => {
    settle.current = onSettle;
  }, [onSettle]);

  /** Build the map once the SDK is in. */
  React.useEffect(() => {
    if (status !== "ready" || !holder.current || map.current) return;

    const instance = new google.maps.Map(holder.current, {
      center: value ?? FALLBACK_CENTRE,
      zoom: value ? 18 : 14,
      disableDefaultUI: true,
      zoomControl: true,
      gestureHandling: "greedy",
      clickableIcons: false,
      // Points of interest off: the customer is placing their own door, and a
      // map full of restaurant pins makes it harder to see the one that counts.
      styles: [
        {
          featureType: "poi",
          stylers: [{ visibility: "off" }],
        },
      ],
    });
    map.current = instance;

    // `idle` rather than `dragend`: it also covers a zoom, a double-tap and a
    // programmatic pan, all of which change what is under the pin.
    instance.addListener("idle", () => {
      const c = instance.getCenter();
      if (c) settle.current({ lat: c.lat(), lng: c.lng() });
    });

    // Places search. Biased to what is on screen, so "temple" finds the one
    // nearby rather than one in another state.
    if (searchBox.current && google.maps.places?.Autocomplete) {
      const auto = new google.maps.places.Autocomplete(searchBox.current, {
        fields: ["geometry"],
        componentRestrictions: { country: "in" },
      });
      auto.bindTo("bounds", instance);
      auto.addListener("place_changed", () => {
        const spot = auto.getPlace()?.geometry?.location;
        if (!spot) return;
        instance.panTo(spot);
        instance.setZoom(18);
      });
    }
  }, [status, value]);

  /** Follow an externally-set point — "use my location", or an edit. */
  React.useEffect(() => {
    if (!map.current || !value) return;
    const c = map.current.getCenter();
    // Only when it genuinely moved, or this fights the customer's own panning:
    // every `idle` would re-centre on the value it just reported.
    if (c && Math.abs(c.lat() - value.lat) < 1e-6 && Math.abs(c.lng() - value.lng) < 1e-6) {
      return;
    }
    map.current.panTo(value);
  }, [value]);

  const locate = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        const here = { lat: p.coords.latitude, lng: p.coords.longitude };
        map.current?.panTo(here);
        map.current?.setZoom(18);
        // Also reported directly: if the map is not up yet there is no `idle`
        // to carry it, and the form should still get the point.
        settle.current(here);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

  if (status === "unconfigured" || status === "failed") {
    return (
      <InlineAlert
        tone={status === "failed" ? "critical" : "info"}
        title={
          status === "failed"
            ? "The map could not load"
            : "The map needs a Google Maps key"
        }
      >
        {status === "failed" ? (
          <>
            Check that the key allows this site and that the Maps JavaScript API
            is enabled. You can still type your address below.
          </>
        ) : (
          <>
            Set <code>NEXT_PUBLIC_GOOGLE_MAPS_API_KEY</code> in{" "}
            <code>apps/consumer/.env.local</code> to place your address on a
            map. You can still type it below.
          </>
        )}
      </InlineAlert>
    );
  }

  return (
    <div className="space-y-2">
      {/* Search sits above the map, not over it: overlaying it means the
          suggestion list covers the thing you are trying to aim at. */}
      <div className="relative">
        <Search
          className="pointer-events-none absolute left-3 top-3 size-4 text-ink-muted"
          aria-hidden="true"
        />
        <Input
          ref={searchBox}
          placeholder="Search for your area, street or landmark"
          aria-label="Search for a place"
          className="pl-8"
          // Enter would submit the form this sits in, before a suggestion is
          // chosen. Places listens for its own selection.
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
        />
      </div>

      <div className="relative overflow-hidden rounded-card border border-border">
        {status === "loading" && (
          <Skeleton className="absolute inset-0 z-sticky" />
        )}
        <div ref={holder} className="h-block-lg w-full" />

        {/* The fixed centre pin. `pointer-events-none` so it never eats a drag
            meant for the map underneath it. */}
        <div
          className="pointer-events-none absolute inset-0 flex items-center justify-center"
          aria-hidden="true"
        >
          <MapPin
            className={cn(
              "size-8 -translate-y-4 text-action drop-shadow",
              busy && "animate-pulse",
            )}
            strokeWidth={2.5}
          />
        </div>

        <div className="absolute bottom-3 right-3">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={locate}
            disabled={locating}
          >
            <LocateFixed className={cn(locating && "animate-spin")} />
            {locating ? "Locating…" : "Use my location"}
          </Button>
        </div>
      </div>

      <p className="text-caption text-ink-muted">
        Drag the map so the pin sits on your building.
      </p>

      {caption !== undefined && caption !== "" && (
        <p className="flex items-start gap-2 text-caption text-ink">
          <MapPin className="mt-px size-4 shrink-0 text-action" aria-hidden="true" />
          {busy ? "Finding this place…" : caption}
        </p>
      )}

      {warning !== undefined && warning !== "" && (
        <p className="flex items-start gap-2 text-caption text-clock-ink">
          <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
          {warning}
        </p>
      )}
    </div>
  );
}
