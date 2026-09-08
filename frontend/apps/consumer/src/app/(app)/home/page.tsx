"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  Briefcase,
  HeartPulse,
  PartyPopper,
  Search,
  ShieldCheck,
  Sparkles,
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

/**
 * Customer 7 — Home.
 *
 * Inventory: "Service grid, promo banners, Most Booked section, Why CFC,
 * Join as Pro banner, testimonials, voice search."
 *
 * Everything on this screen comes from the mock API. The previous version held
 * its content in module constants — including three invented customers with
 * invented names — which is the specific failure this rebuild exists to undo.
 *
 * "Most Booked" is genuinely most-booked: it sorts on `bookingCount`, which
 * the catalogue already carries. It is not a hand-picked list wearing a data
 * label.
 *
 * Voice search is deliberately absent here rather than faked. The Web Speech
 * API is Chrome/Edge/Safari-only and never Firefox, so the microphone belongs
 * on the search screen behind a capability check — a dead mic button is worse
 * than no mic button.
 */

/** The five real categories, mapped to their icons by `iconName`. */
const CATEGORY_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  Wrench,
  Sparkles,
  HeartPulse,
  PartyPopper,
  Briefcase,
};

/**
 * Why CFC.
 *
 * Every line is a documented rule from the agreement — the 30-day warranty,
 * KYC verification, OTP-gated completion. Nothing here is a figure we cannot
 * point at a source for.
 */
const WHY_CFC = [
  {
    icon: ShieldCheck,
    title: "30-day warranty",
    body: "If the same problem comes back within thirty days, we return and fix it.",
  },
  {
    icon: BadgeCheck,
    title: "Verified professionals",
    body: "Every professional completes document and identity checks before taking a job.",
  },
  {
    icon: Wrench,
    title: "The price you see",
    body: "Fixed pricing shown before you book, with the platform fee itemised.",
  },
];

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

  // Most booked, from the real figure rather than a curated list.
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
    <div className="mx-auto max-w-screen-xl px-4 pb-12 md:px-6 lg:px-8">
      <MobileSearch />

      <Section
        title="What do you need?"
        description="Pick a category to see everything under it."
      >
        {categories === null ? (
          <SnapScroller columns={4} itemWidth="category" aria-label="Loading categories">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-block-sm rounded-card" />
            ))}
          </SnapScroller>
        ) : (
          <SnapScroller columns={4} itemWidth="category" aria-label="Service categories">
            {categories
              .filter((c) => c.active)
              .map((category) => (
                <CategoryTile key={category.id} category={category} />
              ))}
          </SnapScroller>
        )}
      </Section>

      {banners !== null && banners.length > 0 && (
        <Section title="Offers">
          <SnapScroller columns={2} aria-label="Current offers">
            {banners.map((banner) => (
              <PromoBanner key={banner.id} banner={banner} />
            ))}
          </SnapScroller>
        </Section>
      )}

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
                bookingCount={service.bookingCount}
                imageUrl={service.imageUrls[0]}
                href={`/service/${service.id}`}
              />
            ))}
          </SnapScroller>
        )}
      </Section>

      <Section title="Why City Family Care">
        <div className="grid gap-3 sm:grid-cols-3">
          {WHY_CFC.map(({ icon: Icon, title, body }) => (
            <div
              key={title}
              className="rounded-card border border-border bg-surface p-4"
            >
              <span className="flex size-8 items-center justify-center rounded-control bg-action-subtle text-action">
                <Icon className="size-4" />
              </span>
              <p className="mt-3 text-small font-semibold text-ink">{title}</p>
              <p className="mt-1 text-caption text-ink-muted">{body}</p>
            </div>
          ))}
        </div>
      </Section>

      <Reviews reviews={reviews} />

      <JoinAsPro />
    </div>
  );
}

/**
 * Search, on mobile only.
 *
 * The desktop header already carries a search field, so repeating it here
 * would be two controls for one job. Below `md` the header has no room for
 * one, so this is where it lives.
 */
function MobileSearch() {
  return (
    <Link
      href="/search"
      className={cn(
        "mt-4 flex h-touch items-center gap-3 rounded-control md:hidden",
        "border border-border bg-surface px-4 text-small text-ink-muted",
      )}
    >
      <Search className="size-4 shrink-0" aria-hidden="true" />
      <span>Search for a service</span>
    </Link>
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
      <div className="mb-3 flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-heading font-semibold text-ink">{title}</h2>
          {description && (
            <p className="text-caption text-ink-muted">{description}</p>
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

function CategoryTile({ category }: { category: Category }) {
  const Icon = CATEGORY_ICONS[category.iconName] ?? Wrench;

  return (
    <Link
      href={`/categories?cat=${category.id}`}
      className={cn(
        "flex h-full flex-col items-center gap-2 rounded-card border border-border bg-surface p-3 text-center",
        "transition-colors duration-fast hover:border-action-line hover:bg-action-subtle",
      )}
    >
      <span className="flex size-10 items-center justify-center rounded-control bg-action-subtle text-action">
        <Icon className="size-5" />
      </span>
      <span className="text-caption font-medium leading-tight text-ink">
        {category.name}
      </span>
      <span className="tabular text-caption text-ink-faint">
        {category.serviceCount} services
      </span>
    </Link>
  );
}

function PromoBanner({ banner }: { banner: Banner }) {
  const href =
    banner.linkType === "category"
      ? `/categories?cat=${banner.linkTarget ?? ""}`
      : banner.linkType === "service"
        ? `/service/${banner.linkTarget ?? ""}`
        : "/categories";

  return (
    <Link
      href={href}
      className={cn(
        "flex aspect-banner items-end overflow-hidden rounded-card",
        "border border-border bg-brand-deep p-4",
        "transition-opacity duration-fast hover:opacity-90",
      )}
    >
      <span className="text-small font-semibold text-on-action">
        {banner.title}
      </span>
    </Link>
  );
}

/**
 * Customer reviews.
 *
 * The heading says "reviews", and while the fixture holds sample copy the
 * section says so plainly. The earlier version of this screen presented
 * invented people under a heading reading "Real reviews from real people";
 * labelling placeholder content is the difference between a mock and a claim.
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
              className="flex h-full flex-col rounded-card border border-border bg-surface p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <StarRating value={review.rating} starsOnly />
                {review.verified && !REVIEWS_ARE_PLACEHOLDER && (
                  <Badge tone="live" dot>
                    Verified
                  </Badge>
                )}
              </div>

              <p className="mt-2 flex-1 text-small text-ink">{review.body}</p>

              <footer className="mt-3 border-t border-border-soft pt-2">
                <p className="text-caption font-medium text-ink">
                  {review.authorName}
                </p>
                <p className="text-caption text-ink-muted">
                  {review.serviceName} · {formatDate(review.createdAt)}
                </p>
              </footer>
            </article>
          ))}
        </SnapScroller>
      )}
    </Section>
  );
}

/**
 * Join as Pro.
 *
 * A recruitment banner, named in the inventory. It carries the one commission
 * fact the agreement documents — the first twenty jobs at zero commission —
 * because that is the genuinely persuasive thing about the offer and it is
 * verifiable.
 */
function JoinAsPro() {
  return (
    <section className="mt-8">
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-card bg-structure p-5">
        <div className="min-w-0">
          <h2 className="text-heading font-semibold text-on-structure">
            Work with City Family Care
          </h2>
          <p className="mt-1 text-small text-on-structure-muted">
            Take jobs near you, get paid within 48 hours, and pay no commission
            on your first 20 jobs.
          </p>
        </div>
        <Link
          href="/register?role=pro"
          className={cn(
            "flex h-touch shrink-0 items-center gap-2 rounded-control px-4",
            "bg-brand text-small font-semibold text-on-action",
            "transition-opacity duration-fast hover:opacity-90",
          )}
        >
          Join as a professional
          <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </div>
    </section>
  );
}
