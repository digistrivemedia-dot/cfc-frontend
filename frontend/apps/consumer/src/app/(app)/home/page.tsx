"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  CheckCircle2,
  Clock,
  HeartPulse,
  PartyPopper,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Wrench,
} from "lucide-react";
import {
  REVIEWS_ARE_PLACEHOLDER,
  getBanners,
  getCategories,
  getReviews,
  getServices,
} from "@cfc/mocks";
import type { Banner, Category, Review, ServiceDetail } from "@cfc/types";
import {
  Badge,
  ErrorState,
  ServiceCard,
  Skeleton,
  SnapScroller,
  StarRating,
  cn,
  formatDate,
} from "@cfc/ui";
import { BannerCarousel } from "@/components/banner-carousel";
import { QuickActions } from "@/components/quick-actions";

/**
 * Customer 7 — Home.
 *
 * Redesigned for a premium, Urban Company-grade experience.
 *
 * Flow:
 * 1. Full-bleed image hero with gradient overlay + CTA
 * 2. Quick-action pills — top 6 services
 * 3. Category cards — visual browsing
 * 4. Promo banner carousel — auto-advancing
 * 5. Most booked services — enhanced cards with ratings
 * 6. How it works — 3-step confidence builder
 * 7. Trust strip — full-width brand statement
 * 8. Testimonials — premium review cards
 * 9. Join as Pro — gradient CTA
 */

const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench,
  Sparkles,
  HeartPulse,
  PartyPopper,
  Briefcase,
};

export default function HomePage() {
  const [categories, setCategories] = React.useState<Category[] | null>(null);
  const [services, setServices] = React.useState<ServiceDetail[] | null>(null);
  const [banners, setBanners] = React.useState<Banner[] | null>(null);
  const [reviews, setReviews] = React.useState<Review[] | null>(null);
  const [error, setError] = React.useState(false);

  const load = React.useCallback(() => {
    setError(false);
    Promise.all([
      getCategories(),
      getServices(),
      getBanners(),
      getReviews(6),
    ])
      .then(([c, s, b, r]) => {
        setCategories(c);
        setServices(s);
        setBanners(b.filter((x) => x.active));
        setReviews(r);
      })
      .catch(() => setError(true));
  }, []);

  React.useEffect(() => load(), [load]);

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
    <div className="min-h-screen">
      {/* ── 1. Hero ─────────────────────────────────────────────────────── */}
      <Hero />

      <div className="mx-auto max-w-screen-xl px-4 pb-12 md:px-6 lg:px-8">
        {/* ── 2. Quick actions ──────────────────────────────────────────── */}
        {services !== null && (
          <section className="-mt-8 relative z-[1]">
            <div className="rounded-card border border-border bg-surface p-4 shadow-md">
              <QuickActions services={services} />
            </div>
          </section>
        )}

        {/* ── 3. Category cards ─────────────────────────────────────────── */}
        <Section
          title="Browse by category"
          description="Find exactly what you need."
        >
          {categories === null ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {Array.from({ length: 3 }, (_, i) => (
                <Skeleton key={i} className="h-28 rounded-card" />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {categories
                .filter((c) => c.active && c.serviceCount > 0)
                .map((category) => (
                  <CategoryCard key={category.id} category={category} />
                ))}
            </div>
          )}
        </Section>

        {/* ── 4. Promo banners ─────────────────────────────────────────── */}
        {banners !== null && banners.length > 0 && (
          <Section title="Offers for you">
            <BannerCarousel banners={banners} />
          </Section>
        )}

        {/* ── 5. Most booked services ──────────────────────────────────── */}
        <Section
          title="Most booked"
          description="What people in your area book most often."
          href="/categories"
          linkLabel="See all services"
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
                  categoryName={service.categoryName}
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

        {/* ── 6. How it works ──────────────────────────────────────────── */}
        <HowItWorks />

        {/* ── 7. Trust strip ───────────────────────────────────────────── */}
        <TrustStrip />

        {/* ── 8. Testimonials ──────────────────────────────────────────── */}
        <Reviews reviews={reviews} />

        {/* ── 9. Join as Pro ───────────────────────────────────────────── */}
        <JoinAsPro />
      </div>
    </div>
  );
}

/* ════════════════════════════════════════════════════════════════════════════
   Sub-components
   ════════════════════════════════════════════════════════════════════════════ */

/**
 * Full-bleed image hero.
 *
 * Uses a banner image as background with a navy gradient overlay.
 * Prominent heading, subtitle, and CTA buttons.
 */
function Hero() {
  return (
    <section className="relative overflow-hidden bg-structure">
      {/* Background image */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mock/banners/first-booking.jpg"
        alt=""
        className="absolute inset-0 size-full object-cover opacity-60"
      />
      {/* Gradient overlay */}
      <div
        className="absolute inset-0 bg-structure"
        style={{ opacity: 0.75 }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-screen-xl px-4 md:px-6 lg:px-8">
        <div 
          className="flex flex-col justify-center py-12 md:py-16"
          style={{ minHeight: "360px" }}
        >
          <h1 
            className="max-w-lg text-display font-semibold leading-[1.1] tracking-tight text-on-structure"
          >
            Home services,{" "}
            <span className="text-brand-bright">done right.</span>
          </h1>
          <p className="mt-3 max-w-md text-body text-on-structure-muted">
            Verified professionals for repairs, cleaning, beauty and care.
            Fixed prices shown before you book.
          </p>

          {/* CTA buttons */}
          <div className="mt-6 flex flex-wrap gap-3">
            <Link
              href="/categories"
              className={cn(
                "flex items-center gap-2 rounded-control px-6",
                "bg-brand text-body font-semibold text-on-action",
                "shadow-md transition-all duration-fast",
                "hover:bg-brand-bright hover:shadow-lg",
              )}
              style={{ height: "48px" }}
            >
              Book a service
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
            <Link
              href="/search"
              className={cn(
                "flex items-center gap-2 rounded-control px-6",
                "border border-on-structure-faint text-body font-medium text-on-structure",
                "transition-all duration-fast",
                "hover:border-on-structure-muted",
              )}
              style={{ height: "48px" }}
            >
              <Search className="size-4" aria-hidden="true" />
              Search
            </Link>
          </div>

          {/* Trust badges */}
          <ul className="mt-8 flex flex-wrap gap-x-6 gap-y-2">
            {HERO_PROMISES.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-small text-on-structure-muted"
              >
                <Icon className="size-4 shrink-0 text-brand-bright" aria-hidden="true" />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

const HERO_PROMISES = [
  { icon: ShieldCheck, label: "30-day warranty on every job" },
  { icon: BadgeCheck, label: "Every professional verified" },
  { icon: Wrench, label: "Fixed price, shown upfront" },
];

/** Reusable section wrapper with title, optional description, and optional link. */
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
            className="flex shrink-0 items-center gap-1 text-small font-medium text-action hover:underline"
          >
            {linkLabel}
            <ArrowRight className="size-3" aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/** Visual category card with gradient background and icon. */
function CategoryCard({ category }: { category: Category }) {
  const Icon = CATEGORY_ICONS[category.iconName] ?? Wrench;

  // Gradient colours per category for visual variety.
  const GRADIENTS: Record<string, string> = {
    Wrench: "from-[#0e1f3d] to-[#1a3a5c]",
    Sparkles: "from-[#0a3a40] to-[#0e5a5a]",
    HeartPulse: "from-[#2d1b4e] to-[#4a2d6e]",
    PartyPopper: "from-[#3d2b1a] to-[#5c4a2d]",
    Briefcase: "from-[#1a2d3d] to-[#2d4a5c]",
  };

  return (
    <Link
      href={`/categories?cat=${category.id}`}
      className={cn(
        "group relative flex flex-col justify-end overflow-hidden rounded-card p-4",
        "bg-gradient-to-br",
        GRADIENTS[category.iconName] ?? "from-structure to-structure-raised",
        "transition-all duration-base hover:shadow-lg",
      )}
      style={{ minHeight: "120px" }}
    >
      {/* Decorative icon in background */}
      <Icon
        className="absolute -right-2 -top-2 text-on-structure-faint transition-transform duration-base group-hover:scale-110"
        style={{ width: "80px", height: "80px", opacity: 0.1 }}
        aria-hidden="true"
      />
      <span className="flex size-8 items-center justify-center rounded-control bg-structure-raised text-brand-bright">
        <Icon className="size-4" />
      </span>
      <p className="mt-2 text-small font-semibold text-on-structure">
        {category.name}
      </p>
      <p className="text-caption text-on-structure-muted">
        {category.serviceCount} services
      </p>
    </Link>
  );
}

/**
 * How it works — 3-step confidence builder.
 */
function HowItWorks() {
  const STEPS = [
    {
      icon: Search,
      number: "1",
      title: "Choose a service",
      body: "Browse our catalogue and pick exactly what you need.",
    },
    {
      icon: Clock,
      number: "2",
      title: "Pick a slot",
      body: "Select a date and time that works for you.",
    },
    {
      icon: CheckCircle2,
      number: "3",
      title: "We handle the rest",
      body: "A verified professional arrives and completes the job.",
    },
  ];

  return (
    <section className="mt-12">
      <h2 className="text-center text-title font-semibold text-ink">
        How it works
      </h2>
      <p className="mt-1 text-center text-small text-ink-muted">
        Three steps to a job done right.
      </p>

      <div className="mt-8 grid gap-6 sm:grid-cols-3">
        {STEPS.map(({ icon: Icon, number, title, body }, i) => (
          <div key={title} className="relative flex flex-col items-center text-center">
            {/* Connecting line (desktop only) */}
            {i < STEPS.length - 1 && (
              <span
                className="absolute left-1/2 top-6 hidden h-px w-full border-t-2 border-dashed border-border sm:block"
                style={{ left: "calc(50% + 24px)", width: "calc(100% - 48px)" }}
                aria-hidden="true"
              />
            )}

            <span className="flex items-center justify-center rounded-full bg-action-subtle text-action"
              style={{ width: "48px", height: "48px" }}
            >
              <span className="absolute text-caption font-semibold text-action" style={{ opacity: 0.4 }}>{number}</span>
              <Icon className="size-6" />
            </span>
            <h3 className="mt-3 text-small font-semibold text-ink">{title}</h3>
            <p className="mt-1 text-caption text-ink-muted" style={{ maxWidth: "220px" }}>{body}</p>
          </div>
        ))}
      </div>
    </section>
  );
}

/**
 * Trust strip — full-width brand statement.
 *
 * Navy-to-teal gradient background, three promises in a horizontal row.
 */
function TrustStrip() {
  const ITEMS = [
    {
      icon: ShieldCheck,
      title: "30-day warranty",
      body: "Same problem returns? We return and fix it — free.",
    },
    {
      icon: BadgeCheck,
      title: "Verified professionals",
      body: "Every pro completes identity and document checks.",
    },
    {
      icon: Wrench,
      title: "The price you see",
      body: "Fixed pricing shown before you book. No surprises.",
    },
  ];

  return (
    <section className="mt-12 -mx-4 md:-mx-6 lg:-mx-8">
      <div
        className="px-4 py-8 md:px-6 lg:px-8"
        style={{
          background: "linear-gradient(135deg, var(--color-trust-start) 0%, var(--color-trust-end) 100%)",
        }}
      >
        <div className="mx-auto grid max-w-screen-xl gap-8 sm:grid-cols-3">
          {ITEMS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="flex items-start gap-4">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-control bg-structure-raised text-brand-bright">
                <Icon className="size-6" />
              </span>
              <div className="min-w-0">
                <p className="text-small font-semibold text-on-structure">{title}</p>
                <p className="mt-1 text-caption text-on-structure-muted">{body}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

/**
 * Customer reviews — premium testimonial cards.
 */
function Reviews({ reviews }: { reviews: Review[] | null }) {
  if (reviews !== null && reviews.length === 0) return null;

  return (
    <Section
      title="What customers say"
      description={
        REVIEWS_ARE_PLACEHOLDER
          ? "Sample content — real reviews appear once jobs are completed."
          : "From customers whose jobs were completed and confirmed."
      }
    >
      {reviews === null ? (
        <SnapScroller columns={3} aria-label="Loading reviews">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-block-sm rounded-card" />
          ))}
        </SnapScroller>
      ) : (
        <SnapScroller columns={3} aria-label="Customer reviews">
          {reviews.map((review) => (
            <article
              key={review.id}
              className="flex h-full flex-col rounded-card border border-border bg-surface p-4 shadow-sm transition-shadow duration-base hover:shadow-md"
            >
              {/* Quote mark */}
              <span className="font-serif text-action" style={{ fontSize: "40px", opacity: 0.2, lineHeight: 1 }} aria-hidden="true">
                "
              </span>

              <div className="-mt-3 flex items-center justify-between gap-2">
                <StarRating value={review.rating} starsOnly />
                {review.verified && !REVIEWS_ARE_PLACEHOLDER && (
                  <Badge tone="live" dot>
                    Verified
                  </Badge>
                )}
              </div>

              <p className="mt-3 flex-1 text-small text-ink">
                {review.body}
              </p>

              <footer className="mt-4 flex items-center gap-3 border-t border-border-soft pt-3">
                {/* Avatar initials */}
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-action-subtle text-caption font-semibold text-action">
                  {review.authorName
                    .split(" ")
                    .map((w) => w[0])
                    .join("")
                    .slice(0, 2)}
                </span>
                <div className="min-w-0">
                  <p className="text-caption font-medium text-ink">
                    {review.authorName}
                  </p>
                  <p className="text-caption text-ink-muted">
                    {review.serviceName} · {formatDate(review.createdAt)}
                  </p>
                </div>
              </footer>
            </article>
          ))}
        </SnapScroller>
      )}
    </Section>
  );
}

/**
 * Join as Pro — premium gradient CTA.
 */
function JoinAsPro() {
  return (
    <section className="mt-12">
      <div
        className="relative overflow-hidden rounded-card p-6 md:p-8"
        style={{
          background: "linear-gradient(135deg, var(--color-trust-start) 0%, var(--color-trust-end) 100%)",
        }}
      >
        <div className="relative flex flex-wrap items-center justify-between gap-6">
          <div className="min-w-0">
            <h2 className="text-title font-semibold text-on-structure">
              Work with City Family Care
            </h2>
            <p className="mt-2 text-small text-on-structure-muted" style={{ maxWidth: "320px" }}>
              Take jobs near you, get paid within 48 hours, and pay no
              commission on your first 20 jobs.
            </p>
          </div>
          <Link
            href="/register?role=pro"
            className={cn(
              "flex shrink-0 items-center gap-2 rounded-control px-6",
              "bg-brand text-body font-semibold text-on-action",
              "shadow-md transition-all duration-fast",
              "hover:bg-brand-bright hover:shadow-lg",
            )}
            style={{ height: "48px" }}
          >
            Join as a professional
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}
