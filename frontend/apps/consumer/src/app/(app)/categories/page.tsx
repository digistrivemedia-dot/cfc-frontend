"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Briefcase,
  ChevronRight,
  HeartPulse,
  PartyPopper,
  Sparkles,
  Wrench,
} from "lucide-react";
import { getCategories, getServices, getSubCategories } from "@cfc/mocks";
import type { Category, ServiceDetail, SubCategory } from "@cfc/types";
import {
  Badge,
  EmptyState,
  ErrorState,
  ServiceCard,
  Skeleton,
  cn,
} from "@cfc/ui";

/**
 * Customer 10 and 11 — category listing, and the sub-category drill-down.
 *
 * One route, three depths, held in the URL as `?cat=` and `?sub=`:
 *
 *   nothing        every category
 *   ?cat=          one category — its sub-categories, and its services
 *   ?cat=&sub=     one sub-category — its services only
 *
 * Search params rather than nested routes, because the back button then walks
 * back one level at a time, which is what a phone user expects, and any depth
 * is a shareable link. Nested routes would give the same URLs a heavier
 * navigation cost and a full remount at each level.
 *
 * The drill-down is offered but never forced. One category here has eight
 * sub-categories and two have one each — a screen that made you pick a
 * sub-category before seeing anything would be a dead step in two cases out of
 * three, so services are always listed alongside.
 */

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench,
  Sparkles,
  HeartPulse,
  PartyPopper,
  Briefcase,
};

function CategoriesInner() {
  const router = useRouter();
  const params = useSearchParams();
  const catId = params.get("cat");
  const subName = params.get("sub");

  const [categories, setCategories] = React.useState<Category[] | null>(null);
  const [subs, setSubs] = React.useState<SubCategory[] | null>(null);
  const [services, setServices] = React.useState<ServiceDetail[] | null>(null);
  const [error, setError] = React.useState(false);

  const load = React.useCallback(() => {
    setError(false);
    Promise.all([getCategories(), getSubCategories(), getServices()])
      .then(([c, sc, s]) => {
        setCategories(c.filter((x) => x.active));
        setSubs(sc.filter((x) => x.active));
        setServices(s.filter((x) => x.active));
      })
      .catch(() => setError(true));
  }, []);

  React.useEffect(() => load(), [load]);

  const category = React.useMemo(
    () => categories?.find((c) => c.id === catId) ?? null,
    [categories, catId],
  );

  // Sub-categories belonging to the open category.
  const categorySubs = React.useMemo(
    () => (subs && category ? subs.filter((s) => s.categoryId === category.id) : []),
    [subs, category],
  );

  // Services narrow by whichever level is open.
  const visibleServices = React.useMemo(() => {
    if (services === null) return null;
    if (category === null) return null;
    return services.filter((s) => {
      if (s.categoryName !== category.name) return false;
      if (subName !== null && s.subCategoryName !== subName) return false;
      return true;
    });
  }, [services, category, subName]);

  const go = (next: { cat?: string | null; sub?: string | null }) => {
    const q = new URLSearchParams();
    const cat = next.cat === undefined ? catId : next.cat;
    const sub = next.sub === undefined ? subName : next.sub;
    if (cat) q.set("cat", cat);
    if (sub) q.set("sub", sub);
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
    <div className="mx-auto max-w-screen-xl px-4 pb-tab-bar pt-4 md:px-6 md:pb-12 lg:px-8">
      <Breadcrumb category={category} subName={subName} onGo={go} />

      {/* Depth 1 — every category. */}
      {catId === null && (
        <>
          <h1 className="mt-2 text-title font-semibold text-ink">
            All services
          </h1>
          <p className="mt-1 text-small text-ink-muted">
            Pick a category to see what is available.
          </p>

          {categories === null ? (
            <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 5 }, (_, i) => (
                <Skeleton key={i} className="h-block-xs rounded-card" />
              ))}
            </div>
          ) : (
            <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {categories.map((c) => (
                <li key={c.id}>
                  <CategoryRow category={c} onOpen={() => go({ cat: c.id, sub: null })} />
                </li>
              ))}
            </ul>
          )}
        </>
      )}

      {/* Depth 2 and 3 — one category, optionally narrowed to a sub-category. */}
      {catId !== null && (
        <>
          <h1 className="mt-2 text-title font-semibold text-ink">
            {subName ?? category?.name ?? "Services"}
          </h1>
          {category !== null && subName === null && (
            <p className="mt-1 text-small text-ink-muted">
              {category.description}
            </p>
          )}

          {/* The drill-down, as a filter strip rather than a separate screen.
              Scrolls on a phone; one category has eight of these. */}
          {categorySubs.length > 1 && (
            <div className="-mx-4 mt-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:flex-wrap md:px-0">
              <FilterChip
                label={`All ${category?.name ?? ""}`}
                active={subName === null}
                onClick={() => go({ sub: null })}
              />
              {categorySubs.map((s) => (
                <FilterChip
                  key={s.id}
                  label={s.name}
                  active={subName === s.name}
                  onClick={() => go({ sub: s.name })}
                />
              ))}
            </div>
          )}

          {visibleServices === null ? (
            <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} className="h-block-md rounded-card" />
              ))}
            </div>
          ) : visibleServices.length === 0 ? (
            <div className="mt-4">
              <EmptyState
                title="Nothing here yet"
                description="This part of the catalogue has no services available right now."
                action={{ label: "Browse all categories", onClick: () => go({ cat: null, sub: null }) }}
              />
            </div>
          ) : (
            <>
              <p className="tabular mt-4 text-small text-ink-muted">
                {visibleServices.length}{" "}
                {visibleServices.length === 1 ? "service" : "services"}
              </p>
              <ul className="mt-2 grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-4">
                {visibleServices.map((s) => (
                  <li key={s.id}>
                    <ServiceCard
                      name={s.name}
                      categoryName={s.subCategoryName}
                      fromPricePaise={s.basePricePaise}
                      rating={s.rating}
                      reviewCount={s.reviewCount}
                      imageUrl={s.imageUrls[0]}
                      href={`/service/${s.id}`}
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
 * A phone has a back gesture, but a breadcrumb answers a different question —
 * not "how do I leave" but "what am I looking at". Two levels deep that
 * matters, because the heading alone shows the sub-category name without the
 * category it sits under.
 */
function Breadcrumb({
  category,
  subName,
  onGo,
}: {
  category: Category | null;
  subName: string | null;
  onGo: (next: { cat?: string | null; sub?: string | null }) => void;
}) {
  if (category === null) return null;

  return (
    <nav aria-label="Breadcrumb">
      <ol className="flex flex-wrap items-center gap-1 text-caption text-ink-muted">
        <li>
          <button
            type="button"
            onClick={() => onGo({ cat: null, sub: null })}
            className="hover:text-action hover:underline"
          >
            All services
          </button>
        </li>
        <li aria-hidden="true">
          <ChevronRight className="size-3" />
        </li>
        <li>
          {subName === null ? (
            <span className="font-medium text-ink" aria-current="page">
              {category.name}
            </span>
          ) : (
            <button
              type="button"
              onClick={() => onGo({ sub: null })}
              className="hover:text-action hover:underline"
            >
              {category.name}
            </button>
          )}
        </li>
        {subName !== null && (
          <>
            <li aria-hidden="true">
              <ChevronRight className="size-3" />
            </li>
            <li>
              <span className="font-medium text-ink" aria-current="page">
                {subName}
              </span>
            </li>
          </>
        )}
      </ol>
    </nav>
  );
}

function CategoryRow({
  category,
  onOpen,
}: {
  category: Category;
  onOpen: () => void;
}) {
  const Icon = CATEGORY_ICONS[category.iconName] ?? Wrench;

  return (
    <button
      type="button"
      onClick={onOpen}
      className={cn(
        "flex w-full items-center gap-3 rounded-card border border-border bg-surface p-4 text-left",
        "transition-colors duration-fast hover:border-action-line hover:bg-action-subtle",
      )}
    >
      <span className="flex size-tile shrink-0 items-center justify-center rounded-control bg-action-subtle text-action">
        <Icon className="size-5" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-small font-semibold text-ink">
          {category.name}
        </span>
        <span className="mt-px block truncate text-caption text-ink-muted">
          {category.description}
        </span>
      </span>
      <span className="flex shrink-0 items-center gap-2">
        <Badge tone="neutral">{category.serviceCount}</Badge>
        <ChevronRight className="size-4 text-ink-faint" aria-hidden="true" />
      </span>
    </button>
  );
}

function FilterChip({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        "flex h-touch shrink-0 items-center rounded-pill border px-3 text-small",
        "transition-colors duration-fast",
        active
          ? "border-action bg-action text-on-action"
          : "border-border bg-surface text-ink hover:border-action-line hover:bg-action-subtle",
      )}
    >
      {label}
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
