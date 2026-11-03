"use client";

import * as React from "react";
import { LocateFixed, MapPin, Search, TriangleAlert } from "lucide-react";
import { Button, Input, cn } from "@cfc/ui";
import {
  FALLBACK_CENTRE,
  type LocationPickerProps,
} from "@/lib/map-provider";

/**
 * An **OpenStreetMap** map with one pin the customer drags to their door.
 *
 * The default renderer, because it costs nothing and needs no key: no billing
 * account, no prepayment, no card. `GoogleLocationPicker` is the paid
 * equivalent and `LocationPicker` chooses between them.
 *
 * ## The pin does not move; the map does
 *
 * The marker is **fixed at the centre of the viewport** and the customer pans
 * the map underneath it. Not an arbitrary choice: a draggable marker on a phone
 * is a 40px target that the dragging thumb covers up, so you cannot see where
 * you are putting it. A fixed centre pin is always visible and the whole map is
 * the drag target. Same reasoning as the Google renderer, so the two behave
 * identically.
 *
 * `onSettle` fires when panning stops, not continuously — each call is a
 * reverse-geocode, and under public Nominatim that is a rate-limited request.
 *
 * ## Leaflet, not a React wrapper
 *
 * `react-leaflet` would add a dependency to do what `useEffect` does, and it
 * owns the map lifecycle — which is the part worth controlling here, because
 * the pin behaviour is the feature. Leaflet itself is ~40KB and has no
 * dependencies.
 *
 * ## Tiles
 *
 * OSM's own tile servers by default: free, no key, and their policy is fine
 * with an app of this size. Set `NEXT_PUBLIC_GEOAPIFY_API_KEY` to serve the
 * same map through Geoapify instead — better for a real deployment, since OSM's
 * tile policy does not cover heavy commercial traffic. Attribution is required
 * either way and Leaflet renders it in the corner.
 */

const GEOAPIFY_KEY = process.env.NEXT_PUBLIC_GEOAPIFY_API_KEY ?? "";

const TILES = GEOAPIFY_KEY
  ? {
      url: `https://maps.geoapify.com/v1/tile/osm-bright/{z}/{x}/{y}.png?apiKey=${GEOAPIFY_KEY}`,
      attribution:
        '© <a href="https://www.geoapify.com/">Geoapify</a> © <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }
  : {
      url: "https://tile.openstreetmap.org/{z}/{x}/{y}.png",
      attribution:
        '© <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    };

/** One Nominatim/Geoapify search hit, narrowed to what the list needs. */
interface Suggestion {
  label: string;
  lat: number;
  lng: number;
}

export function OsmLocationPicker({
  value,
  onSettle,
  caption,
  warning,
  busy,
}: LocationPickerProps) {
  const holder = React.useRef<HTMLDivElement | null>(null);
  const map = React.useRef<L.Map | null>(null);
  const [ready, setReady] = React.useState(false);
  const [locating, setLocating] = React.useState(false);

  const [query, setQuery] = React.useState("");
  const [suggestions, setSuggestions] = React.useState<Suggestion[]>([]);

  // Held in a ref so the `moveend` listener, registered once, always calls the
  // latest callback rather than the one captured when the map was built.
  const settle = React.useRef(onSettle);
  React.useEffect(() => {
    settle.current = onSettle;
  }, [onSettle]);

  /** Build the map once, on mount. */
  React.useEffect(() => {
    if (!holder.current || map.current) return;
    let cancelled = false;

    // Imported here rather than at module scope: Leaflet touches `window` as it
    // loads, which throws during Next's server render.
    void import("leaflet").then((L) => {
      if (cancelled || !holder.current || map.current) return;

      const instance = L.map(holder.current, {
        center: [
          value?.lat ?? FALLBACK_CENTRE.lat,
          value?.lng ?? FALLBACK_CENTRE.lng,
        ],
        zoom: value ? 18 : 14,
        zoomControl: true,
        attributionControl: true,
      });

      L.tileLayer(TILES.url, {
        attribution: TILES.attribution,
        maxZoom: 19,
      }).addTo(instance);

      // `moveend` is Leaflet's equivalent of Google's `idle`: it covers a drag,
      // a zoom, a double-tap and a programmatic pan, all of which change what
      // is under the pin.
      instance.on("moveend", () => {
        const c = instance.getCenter();
        settle.current({ lat: c.lat, lng: c.lng });
      });

      map.current = instance;
      setReady(true);
    });

    return () => {
      cancelled = true;
      map.current?.remove();
      map.current = null;
    };
    // Mount only. `value` is read for the initial centre; the effect below
    // handles later changes, and re-running this would rebuild the map.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  /** Follow an externally-set point — "use my location", or an edit. */
  React.useEffect(() => {
    if (!map.current || !value) return;
    const c = map.current.getCenter();
    // Only when it genuinely moved, or this fights the customer's own panning:
    // every `moveend` would re-centre on the value it just reported.
    if (
      Math.abs(c.lat - value.lat) < 1e-6 &&
      Math.abs(c.lng - value.lng) < 1e-6
    ) {
      return;
    }
    map.current.panTo([value.lat, value.lng]);
  }, [value]);

  /**
   * Search, debounced.
   *
   * 400ms because each keystroke would otherwise be a request, and public
   * Nominatim's policy is about one per second. Bounded to India and biased to
   * nothing else — a customer searching "temple" wants theirs, but Nominatim
   * has no viewport bias, so the city name usually has to be part of the query.
   */
  React.useEffect(() => {
    const text = query.trim();
    if (text.length < 3) {
      setSuggestions([]);
      return;
    }

    const timer = window.setTimeout(() => {
      const url = GEOAPIFY_KEY
        ? `https://api.geoapify.com/v1/geocode/autocomplete?text=${encodeURIComponent(text)}&filter=countrycode:in&format=json&limit=5&apiKey=${GEOAPIFY_KEY}`
        : `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(text)}&countrycodes=in&format=jsonv2&limit=5&accept-language=en`;

      void fetch(url)
        .then((r) => r.json())
        .then((body: unknown) => {
          const rows = GEOAPIFY_KEY
            ? ((body as { results?: unknown[] }).results ?? [])
            : (body as unknown[]);
          setSuggestions(
            (rows as Record<string, unknown>[])
              .map((r) => ({
                label: String(r["formatted"] ?? r["display_name"] ?? ""),
                lat: Number(r["lat"]),
                lng: Number(r["lon"] ?? r["lng"] ?? r["longitude"]),
              }))
              .filter(
                (r) =>
                  r.label !== "" &&
                  Number.isFinite(r.lat) &&
                  Number.isFinite(r.lng),
              ),
          );
        })
        .catch(() => setSuggestions([]));
    }, 400);

    return () => window.clearTimeout(timer);
  }, [query]);

  const goTo = (s: Suggestion) => {
    setQuery("");
    setSuggestions([]);
    map.current?.setView([s.lat, s.lng], 18);
  };

  const locate = () => {
    if (!("geolocation" in navigator)) return;
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      (p) => {
        setLocating(false);
        const here = { lat: p.coords.latitude, lng: p.coords.longitude };
        map.current?.setView([here.lat, here.lng], 18);
        // Also reported directly: if the map is not up yet there is no
        // `moveend` to carry it, and the form should still get the point.
        settle.current(here);
      },
      () => setLocating(false),
      { enableHighAccuracy: true, timeout: 10_000 },
    );
  };

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
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for your area, street or landmark"
          aria-label="Search for a place"
          className="pl-8"
          // Enter would submit the form this sits in before a suggestion is
          // chosen. Selection happens from the list below.
          onKeyDown={(e) => {
            if (e.key === "Enter") e.preventDefault();
          }}
        />
        {suggestions.length > 0 && (
          <ul
            className={cn(
              "absolute inset-x-0 top-full z-popover mt-1 overflow-hidden",
              "rounded-card border border-border bg-surface shadow-lg",
            )}
          >
            {suggestions.map((s) => (
              <li key={`${s.lat},${s.lng},${s.label}`}>
                <button
                  type="button"
                  onClick={() => goTo(s)}
                  className="flex w-full items-start gap-2 px-3 py-2 text-left hover:bg-canvas"
                >
                  <MapPin
                    className="mt-px size-4 shrink-0 text-ink-muted"
                    aria-hidden="true"
                  />
                  <span className="text-caption text-ink">{s.label}</span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="relative overflow-hidden rounded-card border border-border">
        {/* `isolate` is load-bearing, not decoration.
            Leaflet gives its own panes z-index 400 and its controls 800, while
            this design system's whole scale tops out at 100. Without a
            stacking context here, the pin and the button below render BEHIND
            the map tiles — present in the DOM, invisible on screen. Isolating
            the container keeps Leaflet's numbers inside it, so a sibling at
            z-sticky paints above the whole map.

            Leaflet also needs a sized element before it initialises, so the
            holder carries the height rather than being sized by its content. */}
        <div ref={holder} className="isolate h-block-lg w-full bg-canvas" />

        {/* The fixed centre pin. `pointer-events-none` so it never eats a drag
            meant for the map underneath it. */}
        <div
          className="pointer-events-none absolute inset-0 z-sticky flex items-center justify-center"
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

        <div className="absolute bottom-3 right-3 z-sticky">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            onClick={locate}
            disabled={locating || !ready}
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
          <MapPin
            className="mt-px size-4 shrink-0 text-action"
            aria-hidden="true"
          />
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
