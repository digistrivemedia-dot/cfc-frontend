"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  ArrowRight,
  BadgeCheck,
  Brush,
  ChevronRight,
  HeartPulse,
  IndianRupee,
  Scissors,
  ShieldCheck,
  Sparkles,
  Wrench,
} from "lucide-react";
import { getServices, getSubCategories } from "@cfc/mocks";
import type { ServiceDetail, SubCategory } from "@cfc/types";
import { Accordion, EmptyState, ErrorState, Skeleton, cn } from "@cfc/ui";
import { ShopServiceCard } from "@/components/shop-service-card";

/**
 * Customer 10 and 11 — category listing, and the sub-category drill-down.
 *
 * WHY THIS IS GROUPED RATHER THAN A GRID
 *
 * This screen was a flat grid of every service in the catalogue: sixteen
 * identical cards, four to a row, no rhythm and nothing to scan by. That is a
 * search RESULTS page. What Customer 10 asks for is a browsable catalogue, and
 * a catalogue is read by section — a customer arrives wanting "something
 * cleaned" or "something fixed", not wanting to compare sixteen unrelated
 * services side by side.
 *
 * So services are grouped into five THEMES, each with its own icon, eyebrow,
 * headline and row of cards. The themes are a presentation layer over the
 * sub-categories, which stay exactly as they are in the data:
 *
 *   Repairs         Electrical & AC, Plumbing, Appliance, Carpentry
 *   Cleaning        Cleaning
 *   Home care       Painting, Water, Pest control
 *   Personal care   Beauty
 *   Health at home  Nursing
 *
 * Grouping by sub-category instead would give ten sections, five of which hold
 * a single card — thin rows that read as a broken grid rather than a
 * catalogue. Themes keep every section at two to four cards.
 *
 * ONE ROUTE, TWO DEPTHS, held in the URL as `?sub=`:
 *
 *   nothing      the grouped catalogue
 *   ?sub=Name    one sub-category, with sort and filter
 *
 * Each theme's "View all" opens its sub-category page, so the drill-down is
 * OFFERED rather than forced: every card on the catalogue is already bookable,
 * which is what keeps this screen inside the three clicks the agreement
 * promises.
 */

type Theme = {
  id: string;
  eyebrow: string;
  title: string;
  icon: typeof Wrench;
  /** Sub-categories that roll up into this theme, in display order. */
  subs: string[];
};

/* Order is deliberate: repairs are the most-searched work and cleaning the
   most-booked, so they lead. Health sits last because it is the smallest and
   least browsed, not because it matters least. */
const THEMES: Theme[] = [
  {
    id: "repairs",
    eyebrow: "Repairs",
    title: "Reliable fixes, done right",
    icon: Wrench,
    subs: ["Electrical & AC", "Plumbing", "Appliance", "Carpentry"],
  },
  {
    id: "cleaning",
    eyebrow: "Cleaning",
    title: "Spotless homes, inside out",
    icon: Sparkles,
    subs: ["Cleaning"],
  },
  {
    id: "home-care",
    eyebrow: "Home care",
    title: "Looked after, inside and out",
    icon: Brush,
    subs: ["Painting", "Water", "Pest control"],
  },
  {
    id: "personal",
    eyebrow: "Personal care",
    title: "Salon days, at your door",
    icon: Scissors,
    subs: ["Beauty"],
  },
  {
    id: "health",
    eyebrow: "Health at home",
    title: "Care that comes to you",
    icon: HeartPulse,
    subs: ["Nursing"],
  },
];

/** The FAQs the agreement asks this screen to carry (Customer 10). */
const CATEGORY_FAQS = [
  {
    id: "pricing",
    question: "Is the price I see the price I pay?",
    answer:
      "Yes. Every price here is the full price for that service, including the visit. If a job needs a part, or turns out bigger than expected, the professional quotes it before starting and you approve it first.",
  },
  {
    id: "verified",
    question: "Are the professionals verified?",
    answer:
      "Every professional completes an Aadhaar check, a police verification and an in-person skill assessment before taking a single booking. They arrive in uniform carrying a CFC ID.",
  },
  {
    id: "warranty",
    question: "What does the 30-day warranty cover?",
    answer:
      "If the same problem comes back within 30 days of the visit, we send a professional again at no cost. It covers the workmanship on the job that was done, not unrelated faults.",
  },
  {
    id: "slot",
    question: "Can I choose my time slot?",
    answer:
      "Yes. Pick any date and a morning, afternoon or evening slot at checkout. You can reschedule free of charge up to two hours before the visit.",
  },
];

type SortKey = "relevance" | "rating" | "price-low" | "price-high";
type FilterKey = "all" | "top" | "budget";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "relevance", label: "Most booked" },
  { key: "rating", label: "Highest rated" },
  { key: "price-low", label: "Price: low to high" },
  { key: "price-high", label: "Price: high to low" },
];

const FILTERS: { key: FilterKey; label: string }[] = [
  { key: "all", label: "All" },
  { key: "top", label: "4.0+ rated" },
  { key: "budget", label: "Lower priced" },
];

function isSortKey(v: string | null): v is SortKey {
  return (
    v === "relevance" || v === "rating" || v === "price-low" || v === "price-high"
  );
}

function isFilterKey(v: string | null): v is FilterKey {
  return v === "all" || v === "top" || v === "budget";
}

function CategoriesInner() {
  const params = useSearchParams();
  const subName = params.get("sub");
  const sort: SortKey = isSortKey(params.get("sort"))
    ? (params.get("sort") as SortKey)
    : "relevance";
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

  const bySub = React.useCallback(
    (name: string) => (services ?? []).filter((s) => s.subCategoryName === name),
    [services],
  );

  const hrefFor = React.useCallback(
    (next: { sub?: string | null; sort?: SortKey; filter?: FilterKey }) => {
      const q = new URLSearchParams();
      const nextSub = next.sub === undefined ? subName : next.sub;
      const nextSort = next.sort === undefined ? sort : next.sort;
      const nextFilter = next.filter === undefined ? filter : next.filter;
      if (nextSub) q.set("sub", nextSub);
      if (nextSort !== "relevance") q.set("sort", nextSort);
      if (nextFilter !== "all") q.set("filter", nextFilter);
      const qs = q.toString();
      return qs === "" ? "/categories" : `/categories?${qs}`;
    },
    [subName, sort, filter],
  );

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

  if (subName !== null) {
    return (
      <SubCategoryView
        subName={subName}
        subs={subs}
        rows={bySub(subName)}
        loading={services === null}
        sort={sort}
        filter={filter}
        hrefFor={hrefFor}
      />
    );
  }

  return (
    <div className="cfc-band-wash min-h-screen pb-12">
      <CatalogueHero />

      <div className="mx-auto max-w-screen-xl px-4 md:px-6 lg:px-8">
        {/* Jump links, not filters.
            As filter chips these emptied the page down to a single section; as
            anchors they move a customer to the part of the catalogue they came
            for and leave everything else reachable by scrolling. */}
        <nav
          className="-mx-4 flex gap-2 overflow-x-auto px-4 py-5 md:mx-0 md:px-0"
          aria-label="Jump to a section"
        >
          {THEMES.map((t) => (
            <a
              key={t.id}
              href={`#${t.id}`}
              className={cn(
                "shrink-0 whitespace-nowrap rounded-pill border border-border bg-surface px-4 py-2",
                "text-small font-bold text-ink transition-all duration-fast",
                "hover:border-action hover:text-action",
                "focus-visible:outline-none focus-visible:outline-focus",
              )}
            >
              {t.eyebrow}
            </a>
          ))}
        </nav>

        {services === null ? (
          <div className="space-y-12">
            {Array.from({ length: 3 }, (_, i) => (
              <div key={i}>
                <Skeleton className="h-4 w-line-lg" />
                <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
                  {Array.from({ length: 5 }, (__, j) => (
                    <Skeleton key={j} className="h-block-lg rounded-card" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-12">
            {THEMES.map((theme, i) => {
              const rows = theme.subs.flatMap((n) => bySub(n));
              if (rows.length === 0) return null;
              return (
                <ThemeSection
                  key={theme.id}
                  theme={theme}
                  rows={rows}
                  index={i}
                  viewAllHref={hrefFor({ sub: theme.subs[0] ?? null })}
                />
              );
            })}
          </div>
        )}

        <HowItWorks />

        <section className="mt-14">
          <h2 className="text-section text-ink">Questions we get asked</h2>
          <div className="cfc-card mt-5 overflow-hidden">
            <Accordion items={CATEGORY_FAQS} />
          </div>
        </section>
      </div>
    </div>
  );
}

function CatalogueHero() {
  return (
    <section className="cfc-band-deep">
      <div className="mx-auto flex max-w-screen-xl flex-col gap-6 px-4 py-10 md:flex-row md:items-center md:px-6 md:py-14 lg:px-8">
        <div className="min-w-0 flex-1">
          <span className="cfc-badge cfc-badge-promo">All services</span>
          <h1 className="mt-3 text-section text-white">
            What can we help you with?
          </h1>
          <p className="cfc-band-sub mt-3 max-w-line-2xl text-body">
            Fixed prices, verified professionals and a 30-day warranty on every
            job. Book in about a minute.
          </p>

          <ul className="mt-5 flex flex-wrap gap-2">
            {[
              { icon: BadgeCheck, label: "Verified professionals" },
              { icon: IndianRupee, label: "Transparent pricing" },
              { icon: ShieldCheck, label: "30-day warranty" },
            ].map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 rounded-pill bg-white/10 px-3 py-1.5 text-caption font-semibold text-white"
              >
                <Icon className="size-4 shrink-0" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>

        {/* Decoration, so it is hidden rather than shrunk on a phone: at 390px
            it would take a third of the fold from the words that do the work. */}
        <div className="hidden w-full max-w-sm shrink-0 overflow-hidden rounded-card md:block">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/mock/services/deep-home-cleaning.jpg"
            alt=""
            className="aspect-[3/2] w-full object-cover"
          />
        </div>
      </div>
    </section>
  );
}

function ThemeSection({
  theme,
  rows,
  index,
  viewAllHref,
}: {
  theme: Theme;
  rows: ServiceDetail[];
  index: number;
  viewAllHref: string;
}) {
  const Icon = theme.icon;
  // Teal / blue alternating by section, as the approved grid alternates its
  // icon plates. Blue is a tint here, not a second brand.
  const isBlue = index % 3 === 1;

  return (
    <section id={theme.id} className="scroll-mt-bar-lg">
      <div className="flex items-end justify-between gap-4">
        <div className="flex min-w-0 items-center gap-3">
          <span
            className={cn(
              "grid size-tile place-items-center rounded-control text-on-action",
              isBlue ? "bg-clock" : "bg-action",
            )}
          >
            <Icon className="size-5" aria-hidden="true" />
          </span>
          <div className="min-w-0">
            <span className="block text-caption font-bold uppercase tracking-wide text-action">
              {theme.eyebrow}
            </span>
            <h2 className="truncate text-heading font-bold text-ink md:text-heading-lg">
              {theme.title}
            </h2>
          </div>
        </div>

        {/* The drill-down, offered rather than forced. Every card in the row is
            already bookable; this is for a customer who wants the whole
            sub-category with its sort and filter controls. */}
        <Link
          href={viewAllHref}
          className={cn(
            "flex shrink-0 items-center gap-1 rounded-control px-2 py-1",
            "text-small font-bold text-action transition-colors duration-fast",
            "hover:text-action-hover",
            "focus-visible:outline-none focus-visible:outline-focus",
          )}
        >
          View all
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>

      {/* Five to a row on a wide screen, not four: the cards were oversized, so
          a 16-service catalogue read as eight enormous tiles and a scroll. */}
      <ul className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
        {rows.map((s) => (
          <li key={s.id}>
            <ShopServiceCard
              id={s.id}
              name={s.name}
              subCategoryName={s.subCategoryName}
              fromPricePaise={s.basePricePaise}
              rating={s.rating}
              reviewCount={s.reviewCount}
              {...(s.imageUrls[0] ? { imageUrl: s.imageUrls[0] } : {})}
              description={s.description}
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

function HowItWorks() {
  const steps = [
    {
      n: 1,
      title: "Pick a service",
      body: "Choose what you need and see the price before you book. No call, no haggling.",
    },
    {
      n: 2,
      title: "Choose a slot",
      body: "Any date, morning to evening. Reschedule free up to two hours before.",
    },
    {
      n: 3,
      title: "We turn up",
      body: "A verified professional arrives in uniform with an ID you can check.",
    },
  ];

  return (
    <section className="mt-14">
      <h2 className="text-section text-ink">Three steps, about a minute</h2>
      <ol className="mt-5 grid gap-4 md:grid-cols-3">
        {steps.map((s, i) => (
          <li key={s.n} className="cfc-card cfc-card-pad">
            <span
              className={cn(
                "grid size-tile place-items-center rounded-control text-body font-extrabold text-on-action",
                i === 1 ? "bg-clock" : "bg-action",
              )}
            >
              {s.n}
            </span>
            <h3 className="mt-3 text-body font-bold text-ink">{s.title}</h3>
            <p className="mt-1 text-small leading-relaxed text-ink-muted">
              {s.body}
            </p>
          </li>
        ))}
      </ol>
    </section>
  );
}

function SubCategoryView({
  subName,
  subs,
  rows,
  loading,
  sort,
  filter,
  hrefFor,
}: {
  subName: string;
  subs: SubCategory[] | null;
  rows: ServiceDetail[];
  loading: boolean;
  sort: SortKey;
  filter: FilterKey;
  hrefFor: (next: {
    sub?: string | null;
    sort?: SortKey;
    filter?: FilterKey;
  }) => string;
}) {
  /* Filter first, then sort — so "lower priced" is the cheaper half of what is
     actually showing, not of the whole catalogue. */
  const filtered = React.useMemo(() => {
    if (filter === "top") {
      return rows.filter((s) => s.reviewCount > 0 && s.rating >= 4);
    }
    if (filter === "budget") {
      if (rows.length === 0) return rows;
      const prices = rows.map((s) => s.basePricePaise).sort((a, b) => a - b);
      const median = prices[Math.floor(prices.length / 2)] ?? 0;
      return rows.filter((s) => s.basePricePaise <= median);
    }
    return rows;
  }, [rows, filter]);

  const sorted = React.useMemo(() => {
    const out = [...filtered];
    if (sort === "price-low") out.sort((a, b) => a.basePricePaise - b.basePricePaise);
    if (sort === "price-high") out.sort((a, b) => b.basePricePaise - a.basePricePaise);
    if (sort === "rating") out.sort((a, b) => b.rating - a.rating);
    return out;
  }, [filtered, sort]);

  const siblings = (subs ?? []).map((s) => s.name);

  return (
    <div className="cfc-band-wash min-h-screen pb-12">
      {/* A banded header rather than a bare heading, so arriving here from a
          "View all" does not feel like landing on a different product. */}
      <section className="cfc-band-deep">
        <div className="mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-10 lg:px-8">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 text-caption text-white/70">
              <li>
                <Link
                  href="/categories"
                  className="hover:text-white hover:underline"
                >
                  All services
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="size-3" />
              </li>
              <li className="font-semibold text-white">{subName}</li>
            </ol>
          </nav>

          <h1 className="mt-2 text-section text-white">{subName}</h1>
          <p className="cfc-band-sub mt-2 text-body">
            {rows.length} {rows.length === 1 ? "service" : "services"}, fixed
            prices, verified professionals.
          </p>
        </div>
      </section>

      <div className="mx-auto max-w-screen-xl px-4 md:px-6 lg:px-8">
        {/* Siblings, so a customer looking at Plumbing can move to Electrical
            without going back up to the catalogue. */}
        {siblings.length > 0 && (
          <nav
            className="-mx-4 flex gap-2 overflow-x-auto px-4 py-5 md:mx-0 md:px-0"
            aria-label="Switch category"
          >
            <Link
              href="/categories"
              className="shrink-0 whitespace-nowrap rounded-pill border border-border bg-surface px-4 py-2 text-small font-bold text-ink transition-all duration-fast hover:border-action hover:text-action"
            >
              All
            </Link>
            {siblings.map((name) => {
              const current = name === subName;
              return (
                <Link
                  key={name}
                  href={hrefFor({ sub: name, filter: "all" })}
                  aria-current={current ? "page" : undefined}
                  className={cn(
                    "shrink-0 whitespace-nowrap rounded-pill border px-4 py-2 text-small font-bold transition-all duration-fast",
                    current
                      ? "border-action bg-action text-on-action"
                      : "border-border bg-surface text-ink hover:border-action hover:text-action",
                  )}
                >
                  {name}
                </Link>
              );
            })}
          </nav>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-block-lg rounded-card" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <div className="py-6">
            {filter !== "all" ? (
              <EmptyState
                title="Nothing matches that filter"
                description="No service in this category fits what you picked. Try the full list."
                action={{
                  label: "Clear filter",
                  onClick: () => {
                    window.location.href = hrefFor({ filter: "all" });
                  },
                }}
              />
            ) : (
              <EmptyState
                title="Nothing here yet"
                description="This category has no services at the moment."
                action={{
                  label: "Browse all services",
                  onClick: () => {
                    window.location.href = "/categories";
                  },
                }}
              />
            )}
          </div>
        ) : (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3 pb-4">
              <div className="flex flex-wrap gap-2">
                {FILTERS.map((f) => {
                  const current = f.key === filter;
                  return (
                    <Link
                      key={f.key}
                      href={hrefFor({ filter: f.key })}
                      aria-current={current ? "true" : undefined}
                      className={cn(
                        "rounded-pill border px-3 py-1.5 text-caption font-bold transition-all duration-fast",
                        current
                          ? "border-action bg-action text-on-action"
                          : "border-border bg-surface text-ink-muted hover:border-action hover:text-action",
                      )}
                    >
                      {f.label}
                    </Link>
                  );
                })}
              </div>

              <div className="flex items-center gap-3">
                <p className="tabular text-caption text-ink-muted">
                  <span className="font-bold text-action">{sorted.length}</span>{" "}
                  {sorted.length === 1 ? "service" : "services"}
                </p>
                <div className="flex items-center gap-2">
                  <span className="shrink-0 text-caption text-ink-muted">
                    Sort
                  </span>
                  {/* Links rather than a select: a sort that changes the URL is
                      shareable and survives a back button, and on a phone these
                      are the same tap target as the filter chips above. */}
                  <select
                    aria-label="Sort services"
                    value={sort}
                    onChange={(e) => {
                      window.location.href = hrefFor({
                        sort: e.target.value as SortKey,
                      });
                    }}
                    className="h-touch rounded-control border border-border bg-surface px-2 text-small font-semibold text-ink"
                  >
                    {SORTS.map((s) => (
                      <option key={s.key} value={s.key}>
                        {s.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5">
              {sorted.map((s) => (
                <li key={s.id}>
                  <ShopServiceCard
                    id={s.id}
                    name={s.name}
                    subCategoryName={s.subCategoryName}
                    fromPricePaise={s.basePricePaise}
                    rating={s.rating}
                    reviewCount={s.reviewCount}
                    {...(s.imageUrls[0] ? { imageUrl: s.imageUrls[0] } : {})}
                    description={s.description}
                  />
                </li>
              ))}
            </ul>
          </>
        )}

        {/* Related themes, so the foot of a one-service category is a way on
            rather than a dead end. */}
        <section className="mt-14">
          <h2 className="text-section text-ink">Browse something else</h2>
          <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {THEMES.filter((t) => !t.subs.includes(subName)).map((t, i) => {
              const Icon = t.icon;
              return (
                <li key={t.id}>
                  <Link
                    href={hrefFor({ sub: t.subs[0] ?? null, filter: "all" })}
                    className={cn(
                      "cfc-card cfc-card-hover flex items-center gap-3 p-4",
                      "focus-visible:outline-none focus-visible:outline-focus",
                    )}
                  >
                    <span
                      className={cn(
                        "grid size-tile place-items-center rounded-control text-on-action",
                        i % 3 === 1 ? "bg-clock" : "bg-action",
                      )}
                    >
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block text-body font-bold text-ink">
                        {t.eyebrow}
                      </span>
                      <span className="block truncate text-caption text-ink-muted">
                        {t.title}
                      </span>
                    </span>
                    <ArrowRight
                      className="size-4 shrink-0 text-action"
                      aria-hidden="true"
                    />
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      </div>
    </div>
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
