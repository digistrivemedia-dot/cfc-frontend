"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ChevronRight } from "lucide-react";
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
 * Sub-category artwork.
 *
 * The exact same map the Home screen's "Browse by category" grid uses -
 * kept in sync deliberately, because a customer clicking "View all" from
 * Home should land on a screen that looks like a continuation of what they
 * were just looking at, not a different product.
 */
const SUBCATEGORY_IMAGE: Record<string, string> = {
  "Electrical & AC": "/images/cat-electrical.png",
  Cleaning: "/images/cat-cleaning.png",
  Plumbing: "/images/cat-plumbing.png",
  Beauty: "/images/cat-beauty.png",
  "Pest control": "/mock/services/pest-control.jpg",
  Appliance: "/mock/services/refrigerator-repair.jpg",
  Carpentry: "/mock/services/carpentry-work.jpg",
  Painting: "/mock/services/wall-painting.jpg",
  Water: "/mock/services/ro-water-purifier-service.jpg",
  Nursing: "/mock/services/nurse-home-care-12-hr.jpg",
};

/** Same fallback as Home, for the same reason: a real photo, not a broken icon. */
const FALLBACK_IMAGE = "/mock/services/deep-home-cleaning.jpg";

type SortKey = "relevance" | "rating" | "price-low" | "price-high";

const SORTS: { value: SortKey; label: string }[] = [
  { value: "relevance", label: "Most booked" },
  { value: "rating", label: "Top rated" },
  { value: "price-low", label: "Price: low to high" },
  { value: "price-high", label: "Price: high to low" },
];

function isSortKey(v: string | null): v is SortKey {
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

  const sortedServices = React.useMemo(() => {
    if (visibleServices === null) return null;
    const rows = [...visibleServices];
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
  }, [visibleServices, sort]);

  const go = (next: { sub?: string | null; sort?: SortKey }) => {
    const q = new URLSearchParams();
    const nextSub = next.sub === undefined ? subName : next.sub;
    const nextSort = next.sort === undefined ? sort : next.sort;
    if (nextSub) q.set("sub", nextSub);
    if (nextSort !== "relevance") q.set("sort", nextSort);
    const qs = q.toString();
    router.push(qs === "" ? "/categories" : `/categories?${qs}`);
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
    <div className="mx-auto max-w-screen-xl px-4 pt-4 md:px-6 md:pb-12 lg:px-8">
      <Breadcrumb subName={subName} onGo={go} />

      {/* Depth 1 - every sub-category, same ten Home shows. */}
      {subName === null && (
        <>
          <h1 className="mt-2 text-title font-semibold tracking-tight text-ink md:text-title-lg">
            All services
          </h1>
          <p className="mt-1 text-small text-ink-muted">
            Pick a category to see what is available.
          </p>

          {browsable === null ? (
            <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 10 }, (_, i) => (
                <Skeleton key={i} className="aspect-card rounded-card" />
              ))}
            </div>
          ) : (
            <ul className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {browsable.map(({ sub: s, count }) => (
                <li key={s.id}>
                  <SubCategoryCard
                    name={s.name}
                    serviceCount={count}
                    imageUrl={SUBCATEGORY_IMAGE[s.name] ?? FALLBACK_IMAGE}
                    onOpen={() => go({ sub: s.name })}
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
          <h1 className="mt-2 text-title font-semibold tracking-tight text-ink md:text-title-lg">
            {subName}
          </h1>

          {sortedServices === null ? (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-block-md rounded-card" />
              ))}
            </div>
          ) : sortedServices.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="Nothing here yet"
                description="This category has no services available right now."
                action={{ label: "Browse all categories", onClick: () => go({ sub: null }) }}
              />
            </div>
          ) : (
            <>
              <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                <p className="tabular text-small text-ink-muted">
                  {sortedServices.length}{" "}
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
                        <option key={o.value} value={o.value}>
                          {o.label}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>
              <ul className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
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
  imageUrl,
  onOpen,
}: {
  name: string;
  serviceCount: number;
  imageUrl: string;
  onOpen: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "group relative block w-full overflow-hidden rounded-card border border-border text-left",
        "transition-all duration-base hover:border-action-line hover:shadow-md",
        "focus-visible:outline-none focus-visible:outline-focus",
      )}
    >
      <span className="relative block aspect-card bg-neutral-subtle">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          className="size-full object-cover transition-transform duration-base group-hover:scale-105"
        />
        {/* A wash, so white type stays legible whatever the photograph does. */}
        <span
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(to top, rgba(11,31,58,0.88) 0%, rgba(11,31,58,0.35) 45%, transparent 100%)",
          }}
        />
        <span className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-2 p-3">
          <span className="min-w-0 flex-1">
            <span className="block truncate text-small font-semibold text-on-structure">
              {name}
            </span>
            <span className="tabular block text-caption text-on-structure-muted">
              {serviceCount} {serviceCount === 1 ? "service" : "services"}
            </span>
          </span>
          <ChevronRight
            className="size-4 shrink-0 text-on-structure-muted"
            aria-hidden="true"
          />
        </span>
      </span>
    </button>
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
