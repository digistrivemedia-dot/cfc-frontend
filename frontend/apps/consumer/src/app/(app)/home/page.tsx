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
  formatCurrency,
} from "@cfc/ui";
import { BannerCarousel } from "@/components/banner-carousel";
import { HomeHero } from "@/components/home-hero";
import { SubCategoryTile } from "@/components/subcategory-tile";

/**
 * Customer 7 — Home.
 *
 * Design A: search-first marketplace.
 *
 * The screen a customer lands on, rebuilt around one question: what does this
 * person want to do in the first five seconds? They want to find a service and
 * see what it costs. Everything that does not serve that is either demoted or
 * gone.
 *
 * What changed, and why:
 *
 *  - **Sub-categories replace categories.** The five categories are
 *    admin-shaped buckets — "Home & Maintenance" holds twelve of the fifteen
 *    services, "Event & Function" and "Business & Others" hold none, so the
 *    old grid rendered three tiles, one of which was almost everything.
 *    Nobody needs *home and maintenance*; they need the AC fixed. The nine
 *    sub-categories (Electrical & AC, Cleaning, Plumbing, Beauty, Nursing…)
 *    are what a customer is actually shopping for, and they were not shown
 *    anywhere on the previous home screen.
 *
 *  - **Real photographs.** Fifteen service images and seven category images
 *    already sit in /public. The previous version used none of them — the
 *    category cards were gradient boxes with a 10%-opacity icon, which is the
 *    single biggest reason the page read as unfinished.
 *
 *  - **A working search field.** The old hero's "Search" button navigated to
 *    another screen to do what the hero could have done itself.
 *
 *  - **Placeholder testimonials removed.** They were flagged
 *    REVIEWS_ARE_PLACEHOLDER and rendered the words "Sample content" on the
 *    landing page. Invented social proof on the first screen a customer sees
 *    is worse than no social proof.
 *
 *  - **Nine sections down to six.** The old page stacked nine full-width rows
 *    of equal visual weight, so nothing led.
 */

/**
 * Sub-category imagery.
 *
 * Four have a dedicated category image; the rest borrow the photograph of
 * their most representative service, which is a real photograph of that work
 * rather than a placeholder. Keyed by the sub-category names in
 * SERVICE_CATALOG.
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

  /**
   * Sub-categories that actually have services behind them, each carrying its
   * own service count. A tile leading to an empty list is a dead end, and the
   * old category grid had two of them.
   */
  const browsable = React.useMemo(() => {
    if (!subCategories || !services) return null;
    const live = services.filter((s) => s.active);
    return subCategories
      .filter((sub) => sub.active)
      .map((sub) => ({
        sub,
        count: live.filter((s) => s.subCategoryName === sub.name).length,
      }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [subCategories, services]);

  const mostBooked = React.useMemo(
    () =>
      services
        ? [...services]
            .filter((s) => s.active)
            .sort((a, b) => b.bookingCount - a.bookingCount)
            .slice(0, 8)
        : null,
    [services],
  );

  /** The cheapest live service, so the price claim below is a real one. */
  const startingPrice = React.useMemo(() => {
    if (!services) return null;
    const live = services.filter((s) => s.active);
    if (live.length === 0) return null;
    return Math.min(...live.map((s) => s.basePricePaise));
  }, [services]);

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
      <HomeHero area={profile?.area} />

      <div className="mx-auto max-w-screen-xl px-4 pb-12 md:px-6 lg:px-8">
        {/* ── What do you need? ──────────────────────────────────────────
            The primary navigation of the whole app, directly under the fold.
            A customer should reach a service list in one tap from here. */}
        <Section
          title="What do you need help with?"
          description={
            startingPrice !== null
              ? `Fixed prices from ${formatCurrency(startingPrice)}. No call-out charge to see them.`
              : undefined
          }
          href="/categories"
          linkLabel="All services"
        >
          {browsable === null ? (
            <TileGrid>
              {Array.from({ length: 10 }, (_, i) => (
                <Skeleton key={i} className="aspect-card rounded-card" />
              ))}
            </TileGrid>
          ) : (
            <TileGrid>
              {browsable.map(({ sub, count }) => (
                <SubCategoryTile
                  key={sub.id}
                  name={sub.name}
                  serviceCount={count}
                  imageUrl={SUBCATEGORY_IMAGE[sub.name] ?? FALLBACK_IMAGE}
                  href={`/categories?sub=${encodeURIComponent(sub.name)}`}
                />
              ))}
            </TileGrid>
          )}
        </Section>

        {/* ── Most booked ───────────────────────────────────────────────── */}
        <Section
          title="Most booked"
          description="What people book most often."
          href="/categories"
          linkLabel="See all"
        >
          {mostBooked === null ? (
            <SnapScroller columns={4} aria-label="Loading services">
              {Array.from({ length: 4 }, (_, i) => (
                <Skeleton key={i} className="h-block-md rounded-card" />
              ))}
            </SnapScroller>
          ) : (
            <SnapScroller columns={4} aria-label="Most booked services">
              {mostBooked.map((service) => (
                <ServiceCard
                  key={service.id}
                  name={service.name}
                  categoryName={service.subCategoryName}
                  fromPricePaise={service.basePricePaise}
                  rating={service.rating}
                  reviewCount={service.reviewCount}
                  bookingCount={service.bookingCount}
                  imageUrl={service.imageUrls[0]}
                  href={`/service/${service.id}`}
                />
              ))}
            </SnapScroller>
          )}
        </Section>

        {/* ── Offers ────────────────────────────────────────────────────── */}
        {banners !== null && banners.length > 0 && (
          <Section title="Offers for you">
            <BannerCarousel banners={banners} />
          </Section>
        )}

        {/* ── Browse by category ────────────────────────────────────────
            Kept, but demoted below the sub-category grid and the services —
            it is the broad-browse path for someone who does not yet know what
            they want, not the primary one. */}
        {categories !== null && (
          <Section title="Browse by category">
            <div className="flex flex-wrap gap-2">
              {categories
                .filter((c) => c.active && c.serviceCount > 0)
                .map((category) => (
                  <Link
                    key={category.id}
                    href={`/categories?cat=${category.id}`}
                    className={cn(
                      "flex items-center gap-2 rounded-pill border border-border bg-surface px-4 py-2",
                      "text-small font-medium text-ink",
                      "transition-colors duration-fast",
                      "hover:border-action-line hover:bg-action-subtle hover:text-action",
                      "focus-visible:outline-none focus-visible:outline-focus",
                    )}
                  >
                    {category.name}
                    <span className="text-caption text-ink-faint">
                      {category.serviceCount}
                    </span>
                  </Link>
                ))}
            </div>
          </Section>
        )}

        <TrustStrip />
        <JoinAsPro />
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

/**
 * The sub-category grid.
 *
 * Two columns on a phone, scaling to five on a desktop. Dense on purpose —
 * the whole point is to show the full range of work without a scroll.
 */
function TileGrid({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
      {children}
    </div>
  );
}

function Section({
  title,
  description,
  href,
  linkLabel,
  children,
}: {
  title: string;
  description?: string | undefined;
  href?: string | undefined;
  linkLabel?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-title font-semibold text-ink">{title}</h2>
          {description && (
            <p className="mt-1 text-small text-ink-muted">{description}</p>
          )}
        </div>
        {href && linkLabel && (
          <Link
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-control text-small font-medium text-action",
              "hover:underline focus-visible:outline-none focus-visible:outline-focus",
            )}
          >
            {linkLabel}
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * The three commitments, as a quiet band rather than a full-bleed gradient.
 *
 * These are the platform's documented promises. They earn a place on the home
 * screen because they are the reason to book here rather than call a number
 * from a poster — but they are reassurance, not the product, so they sit below
 * the services.
 */
function TrustStrip() {
  const ITEMS = [
    {
      icon: ShieldCheck,
      title: "30-day warranty",
      body: "Same problem returns? We come back and fix it, free.",
    },
    {
      icon: BadgeCheck,
      title: "Verified professionals",
      body: "Every pro completes identity and document checks.",
    },
    {
      icon: Wallet,
      title: "The price you see",
      body: "Fixed pricing shown before you book. No surprises.",
    },
    {
      icon: CalendarCheck,
      title: "Slots that suit you",
      body: "Pick a date and time window when you book.",
    },
  ];

  return (
    <section className="mt-12 rounded-card border border-border bg-surface p-6">
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {ITEMS.map(({ icon: Icon, title, body }) => (
          <div key={title} className="flex items-start gap-3">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-control bg-action-subtle text-action">
              <Icon className="size-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="text-small font-semibold text-ink">{title}</p>
              <p className="mt-1 text-caption text-ink-muted">{body}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

function JoinAsPro() {
  return (
    <section className="mt-6 overflow-hidden rounded-card bg-structure">
      <div className="flex flex-wrap items-center justify-between gap-4 p-6">
        <div className="min-w-0">
          <h2 className="text-heading font-semibold text-on-structure">
            Work with City Family Care
          </h2>
          <p className="mt-1 max-w-line-lg text-small text-on-structure-muted">
            Take jobs near you, get paid within 48 hours, and pay no commission
            on your first 20 jobs.
          </p>
        </div>
        <Link
          href="/register?role=pro"
          className={cn(
            "flex h-touch shrink-0 items-center gap-2 rounded-control bg-brand px-6",
            "text-body font-semibold text-on-action",
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
