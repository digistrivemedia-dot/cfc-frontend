"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  AirVent,
  Bath,
  Brush,
  Bug,
  ChevronRight,
  Droplets,
  Hammer,
  HeartPulse,
  Home as HomeIcon,
  Scissors,
  Sparkles,
  WashingMachine,
} from "lucide-react";
import { getServices, getSubCategories } from "@cfc/mocks";
import type { ServiceDetail, SubCategory } from "@cfc/types";
import { EmptyState, ErrorState, Skeleton, cn } from "@cfc/ui";
import { ShopServiceCard } from "@/components/shop-service-card";

/**
 * Customer 10 and 11 - category listing, and the sub-category drill-down.
 *
 * This used to land on the five ADMIN categories ("Home & Maintenance",
 * "Business & Others") - a storage bucket used for pricing/commission rules,
 * never shown as a concept anywhere else in the app. Two of the five had no
 * services behind them at all, so a customer landed here to a screen with
 * random-looking photos and dead tiles. It also disagreed with the Home
 * screen's own "Browse by category" grid, which correctly shows the ten
 * SUB-categories - Electrical & AC, Cleaning, Plumbing, Beauty, Pest control,
 * Appliance, Carpentry, Painting, Water, Nursing - each with real photography
 * and every single one bookable.
 *
 * This screen now shows the same ten sub-categories Home does, with the same
 * photographs, so "View all 10 categories" on Home and this screen are
 * genuinely the same list rather than two different, disagreeing taxonomies.
 * The admin category grouping still exists in the data (every sub-category
 * still has a `categoryName`) but is not surfaced as a browsing layer - a
 * customer never needs to know "Plumbing" administratively lives inside
 * "Home & Maintenance".
 *
 * One route, two depths, held in the URL as `?sub=`:
 *
 *   nothing     every sub-category
 *   ?sub=       one sub-category's services
 *
 * Search params rather than nested routes, because the back button then walks
 * back one level at a time, which is what a phone user expects, and any depth
 * is a shareable link.
 */

/**
 * Sub-category glyphs, mirroring the approved home page's icon sprite.
 *
 * The tiles here were photographs under an 88%-opacity navy scrim. That is the
 * treatment the client rejected on the home page - it read as dark, and the
 * placeholder photography was miscast besides (five of six inspected showed
 * Western models in Western homes). The approved grid is bright solid-colour
 * icon tiles, teal with every third in blue, and this screen is reached by
 * "View all categories" FROM that grid: landing on a different visual language
 * makes the two read as different products.
 *
 * The service cards at depth 2 keep their own photography, which comes from the
 * catalogue rather than from this file - a real photo of the actual job is the
 * right thing there. Only the category tiles change.
 */
const SUBCATEGORY_ICON: Record<
  string,
  React.ComponentType<{ className?: string }>
> = {
  "Electrical & AC": AirVent,
  Cleaning: Sparkles,
  Plumbing: Droplets,
  Beauty: Scissors,
  "Pest control": Bug,
  Appliance: WashingMachine,
  Carpentry: Hammer,
  Painting: Brush,
  Water: Bath,
  Nursing: HeartPulse,
};

type SortKey = "relevance" | "rating" | "price-low" | "price-high" | "distance";

/**
 * `distance` is in the agreement (screen 9: "sort by rating/price/distance")
 * and is deliberately present but DISABLED.
 *
 * Sorting by distance needs two things this frontend does not have: the
 * customer's coordinates, and a location per professional. Both are backend
 * work. Leaving the option out entirely would have hidden a contracted
 * requirement from whoever picks that up; shipping it enabled would sort by
 * nothing and look broken. So it renders, it is visibly unavailable, and it
 * says why on hover.
 *
 * TO ENABLE: drop `disabled`, and sort on a real distance field.
 */
type SortDef = {
  value: SortKey;
  label: string;
  disabled?: boolean;
  note?: string;
};

const SORTS: SortDef[] = [
  { value: "relevance", label: "Most booked" },
  { value: "rating", label: "Top rated" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
  {
    value: "distance",
    label: "Nearest first",
    disabled: true,
    note: "Needs your location - coming with the live pro tracking",
  },
];

/**
 * Screen 9 asks for a "filtered list", and the screen had sorting only.
 *
 * Both filters are computed from data already in memory - no extra fetch, and
 * nothing claimed that the catalogue cannot back. `top` uses 4.0 because that
 * is what "top rated" means to a customer scanning a list, and `budget` uses
 * the median of what is on screen rather than a hardcoded rupee figure, so it
 * stays meaningful whether a category starts at Rs49 or Rs4,499.
 */
type FilterKey = "all" | "top" | "budget";

const FILTERS: { value: FilterKey; label: string }[] = [
  { value: "all", label: "All" },
  { value: "top", label: "4.0+ rated" },
  { value: "budget", label: "Lower priced" },
];

function isFilterKey(v: string | null): v is FilterKey {
  return v === "all" || v === "top" || v === "budget";
}

function isSortKey(v: string | null): v is SortKey {
  // `distance` is intentionally absent: it is not selectable yet, so a URL
  // carrying ?sort=distance falls back to the default rather than producing
  // an unsorted list.
  return (
    v === "relevance" || v === "rating" || v === "price-low" || v === "price-high"
  );
}

function CategoriesInner() {
  const router = useRouter();
  const params = useSearchParams();
  const subName = params.get("sub");
  // In the URL for the same reason as on the search screen: a shared link to
  // a sub-category should arrive ordered the way the sender left it.
  const sort: SortKey = isSortKey(params.get("sort")) ? (params.get("sort") as SortKey) : "relevance";
  const filter: FilterKey = isFilterKey(params.get("filter"))
    ? (params.get("filter") as FilterKey)
    : "all";

  const [subs, setSubs] = React.useState<SubCategory[] | null>(null);
  const [services, setServices] = React.useState<ServiceDetail[] | null>(null);
  const [error, setError] = React.useState(false);

  const load = React.useCallback(() => {
    setError(false);
    Promise.all([getSubCategories(), getServices()])
      .then(([sc, s]) => {
        setSubs(sc.filter((x) => x.active));
        setServices(s.filter((x) => x.active));
      })
      .catch(() => setError(true));
  }, []);

  React.useEffect(() => load(), [load]);

  /** How many active services sit under each sub-category, counted live -
   *  the same way Home counts them, so the two screens can never disagree
   *  about the same sub-category in the same session. */
  const countFor = React.useCallback(
    (name: string) => (services ?? []).filter((s) => s.subCategoryName === name).length,
    [services],
  );

  // Sub-categories that actually have something bookable. Ten exist in the
  // catalogue today and all ten do, but a sub-category admin adds tomorrow
  // with no services yet should not appear as a clickable dead end.
  const browsable = React.useMemo(() => {
    if (subs === null || services === null) return null;
    return subs
      .map((s) => ({ sub: s, count: countFor(s.name) }))
      .filter(({ count }) => count > 0);
  }, [subs, services, countFor]);

  const visibleServices = React.useMemo(() => {
    if (services === null || subName === null) return null;
    return services.filter((s) => s.subCategoryName === subName);
  }, [services, subName]);

  /** Filter first, then sort - so "lower priced" is the cheaper half of what
   *  is actually showing, not of the whole catalogue. */
  const filteredServices = React.useMemo(() => {
    if (visibleServices === null) return null;
    if (filter === "top") {
      return visibleServices.filter((s) => s.reviewCount > 0 && s.rating >= 4);
    }
    if (filter === "budget") {
      if (visibleServices.length === 0) return visibleServices;
      const prices = visibleServices
        .map((s) => s.basePricePaise)
        .sort((a, b) => a - b);
      const median = prices[Math.floor(prices.length / 2)] ?? 0;
      return visibleServices.filter((s) => s.basePricePaise <= median);
    }
    return visibleServices;
  }, [visibleServices, filter]);

  const sortedServices = React.useMemo(() => {
    if (filteredServices === null) return null;
    const rows = [...filteredServices];
    switch (sort) {
      case "rating":
        return rows.sort((a, b) => b.rating - a.rating);
      case "price-low":
        return rows.sort((a, b) => a.basePricePaise - b.basePricePaise);
      case "price-high":
        return rows.sort((a, b) => b.basePricePaise - a.basePricePaise);
      default:
        return rows.sort((a, b) => b.bookingCount - a.bookingCount);
    }
  }, [filteredServices, sort]);

  /**
   * The URL a given navigation would produce. Split out of `go` so the tiles
   * can render it as a real `href` while the sort control still pushes it
   * imperatively - both paths build the query string the same way, so the two
   * cannot drift apart.
   */
  const hrefFor = (next: {
    sub?: string | null;
    sort?: SortKey;
    filter?: FilterKey;
  }) => {
    const q = new URLSearchParams();
    const nextSub = next.sub === undefined ? subName : next.sub;
    const nextSort = next.sort === undefined ? sort : next.sort;
    const nextFilter = next.filter === undefined ? filter : next.filter;
    if (nextSub) q.set("sub", nextSub);
    if (nextSort !== "relevance") q.set("sort", nextSort);
    // `filter` has to be carried here too, or choosing a sort would silently
    // reset the filter the customer had already applied.
    if (nextFilter !== "all") q.set("filter", nextFilter);
    const qs = q.toString();
    return qs === "" ? "/categories" : `/categories?${qs}`;
  };

  const go = (next: {
    sub?: string | null;
    sort?: SortKey;
    filter?: FilterKey;
  }) => {
    router.push(hrefFor(next));
  };

  if (error) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-12 md:px-6 lg:px-8">
        <ErrorState
          title="We could not load the catalogue"
          description="Check your connection and try again."
          action={{ label: "Try again", onClick: load }}
        />
      </div>
    );
  }

  return (
    <div className="cfc-band-wash min-h-screen px-4 pt-4 md:px-6 md:pb-12 lg:px-8 mx-auto max-w-screen-xl">
      <Breadcrumb subName={subName} onGo={go} />

      {/* Depth 1 - every sub-category, same ten Home shows. */}
      {subName === null && (
        <>
          {/* The eyebrow pill the approved home page puts above every section
              heading. This screen is reached straight from that grid, so
              arriving at a bare heading made it read as a different product. */}
          <span className="mt-2 inline-flex items-center gap-2 rounded-pill bg-action-subtle px-3 py-1 text-caption font-bold uppercase tracking-wide text-action">
            <Sparkles className="size-3" aria-hidden="true" />
            Browse by category
          </span>
          <h1 className="mt-2 text-title font-extrabold tracking-tight text-ink md:text-title-lg">
            All services
          </h1>
          <p className="mt-1 text-small text-ink-muted">
            Pick a category to see what is available.
          </p>

          {browsable === null ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {/* matches the icon tile's real height, not the old photo card's
                  aspect ratio, so nothing jumps when the data lands */}
              {Array.from({ length: 10 }, (_, i) => (
                <Skeleton key={i} className="h-block-md rounded-card" />
              ))}
            </div>
          ) : (
            /* The grid sits on white, on the page's wash. Without this the
               screen was one flat tinted sheet from the header to the footer -
               the thing that made it read as unfinished next to the home page,
               which never runs two identical grounds together. */
            <ul className="cfc-card mt-5 grid grid-cols-2 gap-3 p-4 sm:grid-cols-3 md:p-6 lg:grid-cols-5">
              {browsable.map(({ sub: s, count }, i) => (
                <li key={s.id}>
                  <SubCategoryCard
                    name={s.name}
                    serviceCount={count}
                    href={hrefFor({ sub: s.name })}
                    index={i}
                  />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Depth 2 - one sub-category's services. */}
      {subName !== null && (
        <>
          {/* The sub-category switcher. This is where it earns its place: a
              customer looking at Plumbing can move straight to Electrical
              without going back up to the grid and picking again. The current
              one is marked, so the row also answers "where am I".

              It is NOT on the home screen - there the grid already shows every
              category at full size, so a strip above it would be the same list
              twice. */}
          {browsable !== null && browsable.length > 0 && (
            <nav
              className="-mx-4 mt-3 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0"
              aria-label="Switch category"
            >
              <Link
                href="/categories"
                className="shrink-0 whitespace-nowrap rounded-pill border border-border bg-surface px-4 py-2 text-small font-bold text-ink transition-all duration-fast hover:border-action hover:text-action"
              >
                All
              </Link>
              {browsable.map(({ sub: s }) => {
                const isCurrent = s.name === subName;
                return (
                  <Link
                    key={s.id}
                    href={hrefFor({ sub: s.name })}
                    aria-current={isCurrent ? "page" : undefined}
                    className={cn(
                      "shrink-0 whitespace-nowrap rounded-pill border px-4 py-2 text-small font-bold",
                      "transition-all duration-fast",
                      isCurrent
                        ? "border-action bg-action text-on-action shadow-sm"
                        : "border-border bg-surface text-ink hover:border-action hover:text-action",
                    )}
                  >
                    {s.name}
                  </Link>
                );
              })}
            </nav>
          )}

          <h1 className="mt-3 text-title font-extrabold tracking-tight text-ink md:text-title-lg">
            {subName}
          </h1>

          {sortedServices === null ? (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-block-md rounded-card" />
              ))}
            </div>
          ) : sortedServices.length === 0 ? (
            /* Two different empty states. Now that a filter can empty the
               list, "this category has no services" would be a lie when the
               category is full and the filter is simply narrow - and
               "browse all categories" would throw away the customer's place
               instead of loosening the filter that caused it. */
            <div className="mt-4">
              {filter !== "all" ? (
                <EmptyState
                  title="Nothing matches that filter"
                  description="No service in this category fits what you picked. Try the full list."
                  action={{
                    label: "Clear filter",
                    onClick: () => go({ filter: "all" }),
                  }}
                />
              ) : (
                <EmptyState
                  title="Nothing here yet"
                  description="This category has no services available right now."
                  action={{
                    label: "Browse all categories",
                    onClick: () => go({ sub: null }),
                  }}
                />
              )}
            </div>
          ) : (
            <>
              {/* Screen 9 asks for a filtered list. These are computed from the
                  services already on screen, so nothing extra is fetched and
                  no claim is made the catalogue cannot back. */}
              <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 md:mx-0 md:px-0">
                {FILTERS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    onClick={() => go({ filter: f.value })}
                    className={cn(
                      "shrink-0 rounded-pill border px-4 py-2 text-small font-bold",
                      "transition-all duration-fast",
                      filter === f.value
                        ? "border-action bg-action text-on-action shadow-sm"
                        : "border-border bg-surface text-ink hover:border-action hover:text-action",
                    )}
                  >
                    {f.label}
                  </button>
                ))}
              </div>

              <div className="mt-5 flex flex-wrap items-center justify-between gap-2">
                {/* the count leads in teal - it is the answer to "what is in
                    here", which is why the customer opened the category */}
                <p className="tabular text-small text-ink-muted">
                  <span className="font-bold text-action">
                    {sortedServices.length}
                  </span>{" "}
                  {sortedServices.length === 1 ? "service" : "services"}
                </p>

                {/* Only worth offering once there is enough to reorder. */}
                {sortedServices.length > 1 && (
                  <label className="flex items-center gap-2 text-small text-ink-muted">
                    <span className="shrink-0">Sort</span>
                    <select
                      value={sort}
                      onChange={(e) => go({ sort: e.target.value as SortKey })}
                      className={cn(
                        "h-field rounded-control border border-border bg-surface px-2",
                        "text-small text-ink focus:border-action focus:outline-none",
                      )}
                    >
                      {SORTS.map((o) => (
                        <option
                          key={o.value}
                          value={o.value}
                          disabled={o.disabled ?? false}
                          title={o.note ?? ""}
                        >
                          {o.label}
                          {o.disabled ? " (soon)" : ""}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              <ul className="cfc-card mt-3 grid grid-cols-2 gap-3 p-4 md:grid-cols-3 md:p-6 lg:grid-cols-4">
                {sortedServices.map((s) => (
                  <li key={s.id}>
                    {/* The shop card rather than the plain one: this is the
                        browse screen, and a catalogue a customer cannot add
                        from sends them into a detail page and back for every
                        service they want. */}
                    <ShopServiceCard
                      id={s.id}
                      name={s.name}
                      subCategoryName={s.subCategoryName}
                      fromPricePaise={s.basePricePaise}
                      rating={s.rating}
                      reviewCount={s.reviewCount}
                      imageUrl={s.imageUrls[0]}
                      description={s.description}
                    />
                  </li>
                ))}
              </ul>
            </>
          )}
        </>
      )}
    </div>
  );
}

/**
 * Where you are, and the way back up.
 *
 * A phone has a back gesture, but a breadcrumb answers a different question -
 * not "how do I leave" but "what am I looking at".
 */
function Breadcrumb({
  subName,
  onGo,
}: {
  subName: string | null;
  onGo: (next: { sub?: string | null }) => void;
}) {
  if (subName === null) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-caption text-ink-muted">
        <li>
          <button
            type="button"
            onClick={() => onGo({ sub: null })}
            className="hover:text-action hover:underline"
          >
            All services
          </button>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="size-3" />
        </li>
        <li>
          <span className="font-medium text-ink" aria-current="page">
            {subName}
          </span>
        </li>
      </ol>
    </nav>
  );
}

/**
 * One sub-category, as a picture card.
 *
 * Deliberately the same visual language as `SubCategoryTile` on Home (a
 * photograph, a legibility scrim, the name and count over the bottom) rather
 * than importing that component directly - this card is a grid tile at a
 * larger min-width (5 columns on desktop vs Home's tighter strip) and carries
 * its own hover chevron, so it earns being a sibling rather than a reuse.
 */
function SubCategoryCard({
  name,
  serviceCount,
  href,
  index,
}: {
  name: string;
  serviceCount: number;
  href: string;
  index: number;
}) {
  const Icon = SUBCATEGORY_ICON[name] ?? HomeIcon;
  // Every third tile in blue, as the approved grid does (.cat-ic on 3n+2), so
  // a ten-tile grid is not monotone teal.
  const isBlue = index % 3 === 1;

  return (
    /* A Link, not a button with router.push. Next prefetches the destination
     * once the tile is in view, so opening a category is instant rather than
     * starting its fetch on click - and it restores middle-click, ctrl-click
     * and "open in new tab", which a button silently swallows. */
    <Link
      href={href}
      className={cn(
        "group flex w-full flex-col items-center gap-3 rounded-card border border-border bg-canvas p-5 text-center",
        "transition-all duration-base",
        "hover:-translate-y-1 hover:border-action hover:bg-surface hover:shadow-md",
        "focus-visible:outline-none focus-visible:outline-focus",
      )}
    >
      <span
        className={cn(
          "grid size-tile-lg place-items-center rounded-control text-on-action",
          isBlue ? "bg-clock" : "bg-action",
        )}
      >
        <Icon className="size-6" />
      </span>
      <span className="min-w-0">
        <span className="block truncate text-small font-bold text-ink">
          {name}
        </span>
        <span className="tabular mt-1 block text-caption text-ink-muted">
          {serviceCount} {serviceCount === 1 ? "service" : "services"}
        </span>
      </span>
    </Link>
  );
}

export default function CategoriesPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 lg:px-8">
          <Skeleton className="h-block-md rounded-card" />
        </div>
      }
    >
      <CategoriesInner />
    </Suspense>
  );
}
