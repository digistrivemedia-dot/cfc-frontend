"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  getBanners,
  getCategories,
  getConsumerProfile,
  getServices,
  getSubCategories,
} from "@cfc/mocks";
import type {
  Banner,
  Category,
  ConsumerProfile,
  ServiceDetail,
  SubCategory,
} from "@cfc/types";
import {
  ErrorState,
  ServiceCard,
  Skeleton,
  SnapScroller,
  cn,
} from "@cfc/ui";
import { BannerCarousel } from "@/components/banner-carousel";
import { HomeHero } from "@/components/home-hero";
import { SubCategoryTile } from "@/components/subcategory-tile";

/**
 * Customer 7 — Home.
 *
 * Design B: editorial storefront.
 *
 * Where Design A answered "what can I search for", this answers "what does
 * this business do, and is it any good" — then gets out of the way. The
 * difference is not decoration; it is the order of the page and the size of
 * the things on it.
 *
 * The organising idea is **curated rows grouped by intent**. A customer does
 * not think in the platform's taxonomy — they think "something in my house is
 * broken" or "I want to look good on Saturday". So the rows are named for
 * those moments (Home essentials, Personal care, Deep cleaning) rather than
 * for the database's category table, and each row is a horizontal band of real
 * photographs at a size where the photograph actually reads.
 *
 * What that fixes from the original screen:
 *
 *  - Nine equal-weight stacked sections became a hero plus four bands, so the
 *    eye has somewhere to land first.
 *  - The five admin categories ("Business & Others", holding nothing) no
 *    longer drive the primary browse. The nine sub-categories do, because
 *    those are the jobs people actually book.
 *  - Every photograph in /public is now used. The old page shipped gradient
 *    boxes with 10%-opacity icons while 22 real images sat unused.
 *  - The placeholder testimonials — which rendered the words "Sample content"
 *    on the landing page — are gone.
 */

/**
 * Sub-category imagery. Four have a dedicated category image; the rest borrow
 * the photograph of their most representative service, which is still a real
 * photograph of that work.
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

const FALLBACK_IMAGE = "/images/cat-home-maintenance.png";

/**
 * The editorial rows.
 *
 * Each is a human moment rather than a taxonomy node, mapped to the
 * sub-categories that serve it. A sub-category may appear in more than one row
 * — "Cleaning" is both an essential and the heart of a deep clean — because a
 * customer's intent is not a partition.
 */
const ROWS: readonly {
  id: string;
  title: string;
  description: string;
  subCategories: readonly string[];
}[] = [
  {
    id: "essentials",
    title: "Home essentials",
    description: "The jobs that cannot wait — power, water, appliances.",
    subCategories: ["Electrical & AC", "Plumbing", "Appliance", "Water"],
  },
  {
    id: "clean",
    title: "A cleaner home",
    description: "Deep cleans, pest control and everything after a long week.",
    subCategories: ["Cleaning", "Pest control"],
  },
  {
    id: "improve",
    title: "Make it yours",
    description: "Carpentry and painting, done by people who finish properly.",
    subCategories: ["Carpentry", "Painting"],
  },
  {
    id: "care",
    title: "Personal care",
    description: "Salon and nursing, at home, on your schedule.",
    subCategories: ["Beauty", "Nursing"],
  },
];

export default function HomePage() {
  const [categories, setCategories] = React.useState<Category[] | null>(null);
  const [subCategories, setSubCategories] = React.useState<SubCategory[] | null>(
    null,
  );
  const [services, setServices] = React.useState<ServiceDetail[] | null>(null);
  const [banners, setBanners] = React.useState<Banner[] | null>(null);
  const [profile, setProfile] = React.useState<ConsumerProfile | null>(null);
  const [error, setError] = React.useState(false);

  const load = React.useCallback(() => {
    setError(false);
    Promise.all([
      getCategories(),
      getSubCategories(),
      getServices(),
      getBanners(),
      getConsumerProfile(),
    ])
      .then(([c, sub, s, b, p]) => {
        setCategories(c);
        setSubCategories(sub);
        setServices(s);
        setBanners(b.filter((x) => x.active));
        setProfile(p);
      })
      .catch(() => setError(true));
  }, []);

  React.useEffect(() => load(), [load]);

  const live = React.useMemo(
    () => (services ? services.filter((s) => s.active) : null),
    [services],
  );

  /** Services grouped by their sub-category, for the editorial rows. */
  const bySubCategory = React.useMemo(() => {
    if (!live) return null;
    const map = new Map<string, ServiceDetail[]>();
    for (const s of live) {
      const existing = map.get(s.subCategoryName);
      if (existing) existing.push(s);
      else map.set(s.subCategoryName, [s]);
    }
    return map;
  }, [live]);

  /** Sub-categories that actually have services, for the browse strip. */
  const browsable = React.useMemo(() => {
    if (!subCategories || !live) return null;
    return subCategories
      .filter((sub) => sub.active)
      .map((sub) => ({
        sub,
        count: live.filter((s) => s.subCategoryName === sub.name).length,
      }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [subCategories, live]);

  const mostBooked = React.useMemo(
    () =>
      live
        ? [...live].sort((a, b) => b.bookingCount - a.bookingCount).slice(0, 8)
        : null,
    [live],
  );

  const startingPrice = React.useMemo(() => {
    if (!live || live.length === 0) return null;
    return Math.min(...live.map((s) => s.basePricePaise));
  }, [live]);

  if (error) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-12 md:px-6 lg:px-8">
        <ErrorState
          title="We could not load this"
          description="Check your connection and try again."
          action={{ label: "Try again", onClick: load }}
        />
      </div>
    );
  }

  return (
    <div>
      <HomeHero area={profile?.area} startingPricePaise={startingPrice} />

      {/* ── Browse strip ────────────────────────────────────────────────
          Every kind of work, in one glance, immediately under the hero. A
          customer who already knows what they want should not have to read
          four editorial rows to find it. */}
      <section className="border-b border-border bg-surface">
        <div className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 lg:px-8">
          <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
            <h2 className="text-heading font-semibold text-ink">
              Browse every service
            </h2>
            <SeeAll href="/categories" label="All services" />
          </div>

          {browsable === null ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: 10 }, (_, i) => (
                <Skeleton key={i} className="aspect-card rounded-card" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {browsable.map(({ sub, count }) => (
                <SubCategoryTile
                  key={sub.id}
                  name={sub.name}
                  serviceCount={count}
                  imageUrl={SUBCATEGORY_IMAGE[sub.name] ?? FALLBACK_IMAGE}
                  href={`/categories?sub=${encodeURIComponent(sub.name)}`}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <div className="mx-auto max-w-screen-xl px-4 pb-12 md:px-6 lg:px-8">
        {/* ── Most booked ─────────────────────────────────────────────── */}
        <Band
          title="Most booked this month"
          description="What people in your area book most often."
          href="/categories"
        >
          {mostBooked === null ? (
            <SnapScroller columns={4} aria-label="Loading services">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-block-md rounded-card" />
              ))}
            </SnapScroller>
          ) : (
            <SnapScroller columns={4} aria-label="Most booked services">
              {mostBooked.map((s) => (
                <HomeServiceCard key={s.id} service={s} />
              ))}
            </SnapScroller>
          )}
        </Band>

        {/* ── Offers ──────────────────────────────────────────────────── */}
        {banners !== null && banners.length > 0 && (
          <Band title="Offers for you">
            <BannerCarousel banners={banners} />
          </Band>
        )}

        {/* ── The catalogue, filtered in place ────────────────────────────
            One shelf with tabs rather than four stacked shelves. With fifteen
            services the four-band version repeated the same cards under
            different headings — "Salon at home" appeared in both Most booked
            and Personal care — and left ragged half-empty rows where a group
            held two services. Filtering one grid keeps every grouping reachable
            without paying four screens of height for it. */}
        <CatalogueShelf services={live} bySubCategory={bySubCategory} />

        <WhyCfc />

        {/* ── Categories, demoted to a quiet strip ────────────────────── */}
        {categories !== null && (
          <section className="mt-8">
            <h2 className="text-small font-semibold text-ink-muted">
              Browse by category
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {categories
                .filter((c) => c.active && c.serviceCount > 0)
                .map((c) => (
                  <Link
                    key={c.id}
                    href={`/categories?cat=${c.id}`}
                    className={cn(
                      "flex items-center gap-2 rounded-pill border border-border bg-surface px-4 py-2",
                      "text-small font-medium text-ink",
                      "transition-colors duration-fast",
                      "hover:border-action-line hover:bg-action-subtle hover:text-action",
                      "focus-visible:outline-none focus-visible:outline-focus",
                    )}
                  >
                    {c.name}
                    <span className="text-caption text-ink-faint">
                      {c.serviceCount}
                    </span>
                  </Link>
                ))}
            </div>
          </section>
        )}

        <JoinAsPro />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

/**
 * The catalogue, as one filterable grid.
 *
 * The groupings are still the human ones — "Home essentials", "Personal care"
 * — but they are tabs across a single shelf rather than four separate bands.
 * A customer sees the whole catalogue at once and narrows it if they want to,
 * instead of scrolling four near-identical rows of the same photographs.
 *
 * A grid rather than a horizontal scroller: with a dozen services the whole
 * set fits on screen, and a scroller would hide half of it behind a gesture.
 */
function CatalogueShelf({
  services,
  bySubCategory,
}: {
  services: ServiceDetail[] | null;
  bySubCategory: Map<string, ServiceDetail[]> | null;
}) {
  const [active, setActive] = React.useState<string>("all");

  // Only offer a filter that has something behind it.
  const tabs = React.useMemo(() => {
    if (!bySubCategory) return [];
    return ROWS.filter((r) =>
      r.subCategories.some((n) => (bySubCategory.get(n)?.length ?? 0) > 0),
    );
  }, [bySubCategory]);

  const shown = React.useMemo(() => {
    if (!services) return null;
    if (active === "all") return services;
    const row = ROWS.find((r) => r.id === active);
    if (!row || !bySubCategory) return services;
    return row.subCategories.flatMap((n) => bySubCategory.get(n) ?? []);
  }, [services, active, bySubCategory]);

  const current = ROWS.find((r) => r.id === active);

  return (
    <section className="mt-12">
      <div className="mb-4">
        <h2 className="text-title font-semibold tracking-tight text-ink">
          Every service we offer
        </h2>
        <p className="mt-1 text-small text-ink-muted">
          {current
            ? current.description
            : "Fixed prices, verified professionals, 30-day warranty."}
        </p>
      </div>

      {/* Filters. Horizontally scrollable on a phone rather than wrapping to
          three lines and pushing the grid off screen. */}
      <div
        role="tablist"
        aria-label="Filter services"
        className="-mx-4 mb-5 flex gap-2 overflow-x-auto px-4 scrollbar-none md:mx-0 md:px-0"
      >
        <FilterChip
          label="All services"
          active={active === "all"}
          onClick={() => setActive("all")}
        />
        {tabs.map((r) => (
          <FilterChip
            key={r.id}
            label={r.title}
            active={active === r.id}
            onClick={() => setActive(r.id)}
          />
        ))}
      </div>

      {shown === null ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="h-block-md rounded-card" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          {shown.map((s) => (
            <HomeServiceCard key={s.id} service={s} />
          ))}
        </div>
      )}
    </section>
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
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={cn(
        "shrink-0 rounded-pill border px-4 py-2 text-small font-medium",
        "transition-colors duration-fast",
        "focus-visible:outline-none focus-visible:outline-focus",
        active
          ? "border-action bg-action text-on-action"
          : "border-border bg-surface text-ink hover:border-action-line hover:text-action",
      )}
    >
      {label}
    </button>
  );
}

function HomeServiceCard({ service }: { service: ServiceDetail }) {
  return (
    <ServiceCard
      name={service.name}
      categoryName={service.subCategoryName}
      fromPricePaise={service.basePricePaise}
      rating={service.rating}
      reviewCount={service.reviewCount}
      bookingCount={service.bookingCount}
      imageUrl={service.imageUrls[0]}
      href={`/service/${service.id}`}
    />
  );
}

function SeeAll({ href, label }: { href: string; label: string }) {
  return (
    <Link
      href={href}
      className={cn(
        "flex shrink-0 items-center gap-1 rounded-control text-small font-medium text-action",
        "hover:underline focus-visible:outline-none focus-visible:outline-focus",
      )}
    >
      {label}
      <ArrowRight className="size-4" aria-hidden="true" />
    </Link>
  );
}

/** One editorial band: a titled shelf of services. */
function Band({
  title,
  description,
  href,
  children,
}: {
  title: string;
  description?: string | undefined;
  href?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-title font-semibold tracking-tight text-ink">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-small text-ink-muted">{description}</p>
          )}
        </div>
        {href && <SeeAll href={href} label="See all" />}
      </div>
      {children}
    </section>
  );
}

/**
 * Why CFC — the reassurance band.
 *
 * Placed after the customer has seen the services and prices, which is when
 * "can I trust these people with my address" actually becomes the question.
 */
function WhyCfc() {
  const ITEMS = [
    {
      icon: ShieldCheck,
      title: "30-day warranty",
      body: "If the same problem returns within a month, we come back and fix it free.",
    },
    {
      icon: BadgeCheck,
      title: "Verified professionals",
      body: "Every pro completes identity and document verification before their first job.",
    },
    {
      icon: Wallet,
      title: "The price you were shown",
      body: "Fixed pricing confirmed before the booking. No call-out fee to get a number.",
    },
    {
      icon: CalendarCheck,
      title: "Slots that suit you",
      body: "Choose the date and time window when you book, and track the pro on the way.",
    },
  ];

  return (
    <section className="mt-12 overflow-hidden rounded-card border border-border bg-surface">
      <div className="border-b border-border px-6 py-5">
        <h2 className="text-title font-semibold tracking-tight text-ink">
          Why City Family Care
        </h2>
        <p className="mt-1 text-small text-ink-muted">
          What every booking includes, as standard.
        </p>
      </div>
      <div className="grid gap-px bg-border sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="bg-surface p-6">
            <span className="flex size-tile items-center justify-center rounded-control bg-action-subtle text-action">
              <Icon className="size-5" aria-hidden="true" />
            </span>
            <p className="mt-4 text-small font-semibold text-ink">{title}</p>
            <p className="mt-2 text-caption leading-relaxed text-ink-muted">
              {body}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

function JoinAsPro() {
  return (
    <section className="relative mt-8 isolate overflow-hidden rounded-card bg-structure">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 60% 120% at 85% 50%, rgba(37,99,235,0.35) 0%, transparent 70%)",
        }}
      />
      <div className="flex flex-wrap items-center justify-between gap-4 p-6 md:p-8">
        <div className="min-w-0">
          <h2 className="text-title font-semibold tracking-tight text-on-structure">
            Work with City Family Care
          </h2>
          <p className="mt-2 max-w-screen-sm text-small text-on-structure-muted">
            Take jobs near you, get paid within 48 hours, and pay no commission
            on your first 20 jobs.
          </p>
        </div>
        <Link
          href="/register?role=pro"
          className={cn(
            "flex h-touch shrink-0 items-center gap-2 rounded-control bg-brand px-6",
            "text-body font-semibold text-on-action shadow-md",
            "transition-colors duration-fast hover:bg-brand-bright",
            "focus-visible:outline-none focus-visible:outline-focus",
          )}
        >
          Join as a professional
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
