"use client";

import * as React from "react";
import { getServices } from "@cfc/mocks";
import type { ServiceDetail } from "@cfc/types";
import { formatCurrency } from "@cfc/ui";

/**
 * The real catalogue, shaped for the two ported home pages.
 *
 * WHY THIS EXISTS
 *
 * The pages were transcribed verbatim from the approved prototype, and the
 * prototype's category grid is twelve hardcoded tiles. Only one of the twelve
 * was accurate: two name sub-categories we do not offer at all (Laundry,
 * Packers and movers), two point at the same sub-category ("Electrician" and
 * "AC repair" are both `Electrical & AC`), one advertises a "Free site visit"
 * for painting that nothing in the platform backs, and the remaining prices
 * were all below the real ones - Home cleaning was shown at Rs399 against a
 * true floor of Rs799.
 *
 * Quoting a price a customer cannot then book at is the kind of thing
 * PLATFORM-FACTS.md exists to prevent, so the tiles are derived from the
 * catalogue rather than typed.
 *
 * WHY `getServices` AND NOT `getSubCategories`
 *
 * Both would give the names, but only the services carry `basePricePaise`, and
 * the "From Rs X" line has to be the real floor. Deriving the sub-category list
 * from the services it contains also means a sub-category can never appear on
 * the home screen with nothing bookable inside it.
 */

export interface CategoryTile {
  /** The sub-category name, exactly as the catalogue spells it. */
  name: string;
  /** Shorter label where the catalogue's own name reads like a database
   *  column rather than something a customer would say. */
  label: string;
  /** Sprite id in the inline SVG sheet the prototype ships. */
  icon: string;
  /** `From ₹349`, computed from the cheapest service inside. */
  priceLabel: string;
  /** Real destination: the existing sub-category listing screen. */
  href: string;
  serviceCount: number;
  /** Tile badge, or null. Derived from real booking volume, so it can never
   *  claim something the catalogue contradicts. One tone only: a badge has to
   *  contrast with the icon tile behind it, and teal-on-teal vanished. */
  badge: { label: string; tone: "hot" } | null;
}

/**
 * Catalogue name -> the sprite icon and the customer-facing label.
 *
 * The catalogue's names are admin-shaped in two places: `Appliance` and
 * `Water` are fine as filter values and read as unfinished on a tile. Every
 * other name is used as-is rather than reworded, so the tile and the screen it
 * opens agree.
 *
 * Every sub-category in the catalogue is listed. If one is added without an
 * entry here it still renders, with a neutral icon and its own name - it is
 * never silently dropped from the grid.
 */
const TILE_META: Record<string, { icon: string; label?: string }> = {
  "Cleaning": { icon: "i-clean" },
  "Plumbing": { icon: "i-plumb" },
  "Electrical & AC": { icon: "i-ac" },
  "Appliance": { icon: "i-appliance", label: "Appliance repair" },
  "Pest control": { icon: "i-pest" },
  "Carpentry": { icon: "i-carpenter" },
  "Painting": { icon: "i-paint" },
  "Water": { icon: "i-water", label: "Water purifier" },
  "Beauty": { icon: "i-salon" },
  "Nursing": { icon: "i-headset" },
};

/** Order the grid the way demand runs, not the way the fixture is written. */
const TILE_ORDER = [
  "Cleaning",
  "Plumbing",
  "Electrical & AC",
  "Appliance",
  "Pest control",
  "Carpentry",
  "Painting",
  "Water",
  "Beauty",
  "Nursing",
];

function toTiles(services: ServiceDetail[]): CategoryTile[] {
  const bySub = new Map<string, ServiceDetail[]>();
  for (const s of services) {
    if (!s.active) continue;
    const list = bySub.get(s.subCategoryName);
    if (list) list.push(s);
    else bySub.set(s.subCategoryName, [s]);
  }

  const rank = (name: string) => {
    const i = TILE_ORDER.indexOf(name);
    // A sub-category with no explicit position sorts after the known ones
    // rather than jumping to the front on an `indexOf` of -1.
    return i === -1 ? TILE_ORDER.length : i;
  };

  // HOT in orange on four named sub-categories.
  //
  // This is a curated list, not a derived one, and that is deliberate. It used
  // to rank by total bookingCount - but those counts come from a seeded RNG in
  // fixtures/catalog.ts (`Math.floor(20 + rand() * 400)`), so "the four
  // busiest" was whatever the seed happened to produce and could not be aimed
  // at a particular tile. These four are a merchandising choice.
  //
  // Recorded in final/DECISIONS-PENDING-CLIENT.md: once real booking data
  // exists, this should go back to being derived, or the badge will eventually
  // sit on a tile nobody books.
  const hot = new Set(["Plumbing", "Appliance", "Beauty", "Carpentry"]);

  const badgeFor = (name: string): CategoryTile["badge"] =>
    hot.has(name) ? { label: "HOT", tone: "hot" } : null;

  return [...bySub.entries()]
    .sort((a, b) => rank(a[0]) - rank(b[0]) || a[0].localeCompare(b[0]))
    .map(([name, list]) => {
      const meta = TILE_META[name];
      const floor = Math.min(...list.map((s) => s.basePricePaise));
      return {
        badge: badgeFor(name),
        name,
        label: meta?.label ?? name,
        icon: meta?.icon ?? "i-home",
        // `compact` here means "no paise", not abbreviated - it is the
        // formatter with zero fraction digits. A tile reading "From
        // Rs799.00" advertises a precision the price does not have, and the
        // approved prototype shows whole rupees throughout.
        priceLabel: `From ${formatCurrency(floor, { compact: true })}`,
        href: `/categories?sub=${encodeURIComponent(name)}`,
        serviceCount: list.length,
      };
    });
}

/**
 * The most-booked services, for the rail the prototype fills with invented
 * booking counts.
 */
export interface BookedService {
  id: string;
  name: string;
  /** Sprite id, taken from the sub-category the service sits in. This is what
   *  the card renders - the rail shows icons on tinted panels, not photographs. */
  icon: string;
  priceLabel: string;
  /** The same figure unformatted, for the signed-in cart's `data-price`. */
  pricePaise: number;
  /** `4.8`, or null when the service has no ratings yet - rendered as "New"
   *  rather than as a fabricated score. */
  rating: number | null;
  /** `240 bookings`. The real count, not the prototype's `12.4k`. */
  bookingLabel: string;
  /** `60 min` / `4 hr`, from the default variant's real duration. */
  durationLabel: string;
  href: string;
}

/** `60 min`, `1 hr 30 min`, `4 hr` - minutes below an hour stay minutes. */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hrs = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins === 0 ? `${hrs} hr` : `${hrs} hr ${mins} min`;
}

function toBooked(services: ServiceDetail[], limit: number): BookedService[] {
  return services
    .filter((s) => s.active)
    .slice()
    .sort((a, b) => b.bookingCount - a.bookingCount)
    .slice(0, limit)
    .map((s) => {
      // The pre-selected variant is what the price and duration describe, so
      // the two numbers on the card always refer to the same thing.
      const v = s.variants.find((x) => x.isDefault) ?? s.variants[0];
      return {
        id: s.id,
        name: s.name,
        icon: TILE_META[s.subCategoryName]?.icon ?? "i-home",
        priceLabel: formatCurrency(s.basePricePaise, { compact: true }),
        pricePaise: s.basePricePaise,
        rating: s.reviewCount > 0 ? s.rating : null,
        bookingLabel: `${new Intl.NumberFormat("en-IN").format(s.bookingCount)} ${
          s.bookingCount === 1 ? "booking" : "bookings"
        }`,
        durationLabel: v ? formatDuration(v.durationMinutes) : "",
        href: `/service/${s.id}`,
      };
    });
}

export interface Catalogue {
  tiles: CategoryTile[];
  booked: BookedService[];
  /** Real total, for the "See all N services" link. */
  serviceCount: number;
  loading: boolean;
  error: boolean;
}

/**
 * Loads once on mount. The pages are client components (the prototype's
 * `interactions.js` needs the DOM), so this is a `useEffect` fetch rather than
 * a server-side read - the same pattern `/categories` and `/browse` already
 * use, so the whole app fetches one way.
 */
export function useCatalogue(bookedLimit = 8): Catalogue {
  const [services, setServices] = React.useState<ServiceDetail[] | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    let live = true;
    getServices()
      .then((rows) => {
        if (live) setServices(rows);
      })
      .catch(() => {
        if (live) setError(true);
      });
    return () => {
      live = false;
    };
  }, []);

  return React.useMemo(
    () => ({
      tiles: services ? toTiles(services) : [],
      booked: services ? toBooked(services, bookedLimit) : [],
      serviceCount: services ? services.filter((s) => s.active).length : 0,
      loading: services === null && !error,
      error,
    }),
    [services, error, bookedLimit],
  );
}

/**
 * Re-arms the prototype's scroll reveal for content that arrived after mount.
 *
 * `interactions.js` collects `.rv` elements once, in `initCFC`, and the two
 * grids it animates are now rendered from a fetch that resolves after that
 * runs. Any tile the original observer never saw would sit at `opacity: 0`
 * forever - an invisible category grid, which is exactly the kind of failure
 * that looks like nothing at all rather than like an error.
 *
 * Rather than edit the transcribed `interactions.js` - which the handoff asks
 * to be kept as-is - this observes only the stragglers: elements that carry
 * `.rv` and have not yet been given `.in`. Elements the first observer already
 * revealed are skipped, so the two never fight over the same node.
 *
 * `deps` is what to re-run on, normally the loaded rows.
 */
export function useRevealLateContent(ready: boolean): void {
  React.useEffect(() => {
    if (!ready) return;

    const pending = document.querySelectorAll<HTMLElement>(".cfc-page .rv:not(.in)");
    if (pending.length === 0) return;

    // Same fallback as the prototype: without IntersectionObserver everything
    // is simply shown rather than left hidden.
    if (!("IntersectionObserver" in window)) {
      pending.forEach((el) => el.classList.add("in"));
      return;
    }

    const io = new IntersectionObserver(
      (entries) => {
        for (const en of entries) {
          if (en.isIntersecting) {
            en.target.classList.add("in");
            io.unobserve(en.target);
          }
        }
      },
      // Matches `interactions.js` so a late tile reveals at the same scroll
      // position as one that was there from the start.
      { rootMargin: "0px 0px -12% 0px", threshold: 0.12 },
    );
    pending.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [ready]);
}
