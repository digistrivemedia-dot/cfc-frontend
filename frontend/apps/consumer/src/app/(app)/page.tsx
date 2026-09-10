"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  ChevronRight,
  Quote,
  RotateCcw,
  ShieldCheck,
  Sparkles,
  Star,
  Wallet,
  X,
} from "lucide-react";
import {
  getActiveBooking,
  getBanners,
  getCategories,
  getConsumerProfile,
  getRebookable,
  getReviews,
  getServices,
  getSubCategories,
  REVIEWS_ARE_PLACEHOLDER,
} from "@cfc/mocks";
import type {
  Banner,
  ConsumerBooking,
  ConsumerProfile,
  Review,
  ServiceDetail,
  SubCategory,
} from "@cfc/types";
import {
  EmptyState,
  ErrorState,
  Skeleton,
  SnapScroller,
  cn,
  formatCurrency,
} from "@cfc/ui";
import { ActiveBookingCard } from "@/components/active-booking-card";
import { BannerCarousel } from "@/components/banner-carousel";
import { CategoryStrip } from "@/components/category-strip";
import { HomeHero } from "@/components/home-hero";
import { ShopServiceCard } from "@/components/shop-service-card";
import { SubCategoryTile } from "@/components/subcategory-tile";
import { useSession } from "@/lib/session";

/**
 * Customer 7 — Home. Served at `/`, the site's front door.
 *
 * Rebuilt around hierarchy. The previous version stacked nine sections of
 * roughly equal weight and showed the same fifteen services twice — once as
 * "Most booked" near the top and again as "Every service we offer" below it —
 * so the page was long, repetitive, and led nowhere in particular.
 *
 * The order now follows what a stranger actually needs, in order:
 *
 *   1. What is this and what does it cost      — hero
 *   2. What kinds of work do you do            — sticky category strip
 *   3. Show me a few                           — five categories, then View all
 *   4. Let me shop                             — services in labelled groups
 *   5. Anything on offer                       — promotions
 *   6. What do others book                     — most booked, far down
 *   7. How does this actually work             — three steps
 *   8. Why should I trust you                  — the guarantees
 *   9. Can I do this on my phone               — app links
 *
 * The category strip is the spine: pinned under the header for the whole page,
 * filtering in place, so whatever a customer has scrolled to, changing subject
 * is always one click away in the same spot.
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

// `cat-home-maintenance.png` was a flat icon-in-a-circle placeholder, not a
// photograph - visibly different from every other tile on this screen, which
// are all real service photography. All ten sub-categories in today's
// catalogue are mapped above, so this path is not hit right now, but it is
// the thing that renders the moment a new sub-category ships without an
// entry in SUBCATEGORY_IMAGE - a real photo here means that day is a
// slightly generic tile, not a visibly broken one.
const FALLBACK_IMAGE = "/mock/services/deep-home-cleaning.jpg";

/** How many category tiles before "View all". Ten at once is a wall. */
const TILES_SHOWN = 5;

/**
 * Service groups, named for the moment rather than the taxonomy.
 *
 * A customer thinks "something is broken" or "the house needs a clean", not
 * "Home & Maintenance". Each group is a labelled shelf, the way a shop is laid
 * out — which is also what makes a long catalogue scannable rather than a grid
 * of forty identical tiles.
 */
const GROUPS: readonly {
  id: string;
  eyebrow: string;
  title: string;
  description: string;
  subCategories: readonly string[];
}[] = [
  {
    id: "repair",
    eyebrow: "Repairs",
    title: "Reliable fixes, done right",
    description: "Power, water and appliances — sorted the same day where we can.",
    subCategories: ["Electrical & AC", "Plumbing", "Appliance", "Water"],
  },
  {
    id: "clean",
    eyebrow: "Cleaning",
    title: "Spotless homes, inside out",
    description: "Deep cleans, bathrooms, sofas — and pests shown the door.",
    subCategories: ["Cleaning", "Pest control"],
  },
  {
    id: "improve",
    eyebrow: "Improve",
    title: "Make the place yours",
    description: "Carpentry and painting by people who finish properly.",
    subCategories: ["Carpentry", "Painting"],
  },
  {
    id: "care",
    eyebrow: "Personal care",
    title: "Looking after you, at home",
    description: "Salon appointments and qualified nursing, on your schedule.",
    subCategories: ["Beauty", "Nursing"],
  },
];

interface Rebookable {
  serviceName: string;
  lastBookedAt: string;
  totalPaise: number;
}

export default function HomePage() {
  const [subCategories, setSubCategories] = React.useState<SubCategory[] | null>(
    null,
  );
  const [services, setServices] = React.useState<ServiceDetail[] | null>(null);
  const [banners, setBanners] = React.useState<Banner[] | null>(null);
  const [profile, setProfile] = React.useState<ConsumerProfile | null>(null);
  const [active, setActive] = React.useState<ConsumerBooking | null>(null);
  const [rebookable, setRebookable] = React.useState<Rebookable[] | null>(null);
  const [reviews, setReviews] = React.useState<Review[] | null>(null);
  const [error, setError] = React.useState(false);
  const [filter, setFilter] = React.useState<string | null>(null);
  const { signedIn } = useSession();

  const load = React.useCallback(() => {
    if (signedIn === null) return;
    setError(false);

    const publicData = Promise.all([
      getCategories(),
      getSubCategories(),
      getServices(),
      getBanners(),
      // Testimonials are shown to everyone, signed in or not — social proof
      // is exactly the thing a stranger deciding whether to trust the site
      // needs before they have any bookings of their own.
      getReviews(6),
    ]);

    const personalData = signedIn
      ? Promise.all([getConsumerProfile(), getActiveBooking(), getRebookable()])
      : Promise.resolve(null);

    Promise.all([publicData, personalData])
      .then(([[, sub, s, b, rv], personal]) => {
        setSubCategories(sub);
        setServices(s);
        setBanners(b.filter((x) => x.active));
        setReviews(rv);

        if (personal) {
          const [p, act, re] = personal;
          setProfile(p);
          setActive(act);
          setRebookable(re);
        } else {
          setProfile(null);
          setActive(null);
          setRebookable(null);
        }
      })
      .catch(() => setError(true));
  }, [signedIn]);

  React.useEffect(() => load(), [load]);

  const live = React.useMemo(
    () => (services ? services.filter((s) => s.active) : null),
    [services],
  );

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

  /** Sub-categories with something behind them, biggest first. */
  const browsable = React.useMemo(() => {
    if (!subCategories || !live) return null;
    return subCategories
      .filter((sub) => sub.active)
      .map((sub) => ({
        name: sub.name,
        id: sub.id,
        count: live.filter((s) => s.subCategoryName === sub.name).length,
      }))
      .filter((x) => x.count > 0)
      .sort((a, b) => b.count - a.count);
  }, [subCategories, live]);

  /**
   * Most booked.
   *
   * The shelves above already show every service in the catalogue, so an
   * unfiltered "most booked" repeated four cards a customer had just scrolled
   * past — the same Tap washer replacement, AC service and Washing machine
   * repair appearing twice on one page.
   *
   * It stays, because social proof is worth showing, but as a compact ranked
   * strip rather than four more full cards. Different shape, different job:
   * "what is popular" rather than "here is the catalogue again".
   */
  const mostBooked = React.useMemo(() => {
    if (!live) return null;
    return [...live]
      .sort((a, b) => b.bookingCount - a.bookingCount)
      .slice(0, 5);
  }, [live]);

  const startingPrice = React.useMemo(() => {
    if (!live || live.length === 0) return null;
    return Math.min(...live.map((s) => s.basePricePaise));
  }, [live]);

  const findService = React.useCallback(
    (name: string) => live?.find((s) => s.name === name) ?? null,
    [live],
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

  const hasActive = signedIn === true && active !== null;
  const isNewCustomer =
    signedIn === false ||
    (!hasActive && rebookable !== null && rebookable.length === 0);

  /** Groups that survive the strip filter, and still have services in them. */
  const visibleGroups = GROUPS.map((group) => {
    const subs = filter
      ? group.subCategories.filter((n) => n === filter)
      : group.subCategories;
    const items = bySubCategory
      ? subs.flatMap((n) => bySubCategory.get(n) ?? [])
      : null;
    return { group, items };
  }).filter(({ items }) => items === null || items.length > 0);

  /**
   * How many services the current filter leaves.
   *
   * Needed because filtering used to be silent: five sections below the grid
   * (offers, most booked, how it works, why CFC, the app band) simply vanished
   * with no explanation, and there was no count and no way back except finding
   * the same chip again in the strip.
   */
  const filteredCount = filter
    ? visibleGroups.reduce((n, g) => n + (g.items?.length ?? 0), 0)
    : null;

  // Always capped at TILES_SHOWN. This used to expand in place when
  // "View all" was clicked, which is not what the label promised - a button
  // that says "View all N categories" and then just grows a grid on the same
  // page is not viewing all categories, it is a slightly longer version of
  // the same five. The real browsing screen already exists at /categories,
  // with sort and the "Coming soon" handling for empty categories, so the
  // button now takes you there instead of duplicating a worse copy of it here.
  const tiles = browsable ? browsable.slice(0, TILES_SHOWN) : null;

  return (
    <div>
      {hasActive ? (
        <div className="mx-auto max-w-screen-xl px-4 pt-6 md:px-6 lg:px-8">
          <ActiveBookingCard booking={active} />
        </div>
      ) : (
        <HomeHero
          area={profile?.area}
          startingPricePaise={startingPrice}
          topServiceId={mostBooked?.[0]?.id}
        />
      )}

      {/* ── The spine ─────────────────────────────────────────────────── */}
      {browsable !== null && (
        <CategoryStrip
          items={browsable.map(({ name, count }) => ({ name, count }))}
          active={filter}
          onChange={setFilter}
        />
      )}

      <div className="mx-auto max-w-screen-xl px-4 pb-12 md:px-6 lg:px-8">
        {/* ── Book again — a returning customer's shortcut ─────────────── */}
        {rebookable !== null && rebookable.length > 0 && (
          <Band title="Book again" description="Services you've booked before.">
            <SnapScroller columns={4} aria-label="Book again">
              {rebookable.map((r) => {
                const svc = findService(r.serviceName);
                return (
                  <RebookCard
                    key={r.serviceName}
                    serviceName={r.serviceName}
                    pricePaise={svc?.basePricePaise ?? r.totalPaise}
                    imageUrl={svc?.imageUrls[0]}
                    href={svc ? `/service/${svc.id}` : "/categories"}
                  />
                );
              })}
            </SnapScroller>
          </Band>
        )}

        {/* ── Categories: five, then View all ──────────────────────────── */}
        <Band
          // The hero already asks "What can we help you with?" and already
          // quotes the starting price, so this heading names the thing itself
          // rather than repeating the question two hundred pixels below it.
          title="Browse by category"
          description="Every kind of work we do, and how many services sit behind each."
        >
          {tiles === null ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {Array.from({ length: TILES_SHOWN }, (_, i) => (
                <Skeleton key={i} className="aspect-card rounded-card" />
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                {tiles.map(({ id, name, count }) => (
                  <SubCategoryTile
                    key={id}
                    name={name}
                    serviceCount={count}
                    imageUrl={SUBCATEGORY_IMAGE[name] ?? FALLBACK_IMAGE}
                    href={`/categories?sub=${encodeURIComponent(name)}`}
                  />
                ))}
              </div>

              {browsable && browsable.length > TILES_SHOWN && (
                <Link
                  href="/categories"
                  className={cn(
                    "mt-4 flex items-center gap-1 rounded-control text-small font-semibold text-action",
                    "transition-colors duration-fast hover:text-action-hover",
                    "focus-visible:outline-none focus-visible:outline-focus",
                  )}
                >
                  {`View all ${browsable.length} categories`}
                  <ChevronRight className="size-4" aria-hidden="true" />
                </Link>
              )}
            </>
          )}
        </Band>

        {/* ── What the filter is doing, said out loud ──────────────────── */}
        {filter !== null && (
          <div className="mt-8 flex flex-wrap items-center justify-between gap-3 rounded-card border border-action-line bg-action-subtle px-4 py-3">
            <p className="text-small text-ink">
              Showing{" "}
              <span className="tabular font-semibold">
                {filteredCount ?? 0}
              </span>{" "}
              {filteredCount === 1 ? "service" : "services"} in{" "}
              <span className="font-semibold">{filter}</span>
            </p>
            <button
              type="button"
              onClick={() => setFilter(null)}
              className={cn(
                "inline-flex h-field shrink-0 items-center gap-1 rounded-pill",
                "border border-action bg-surface px-3 text-small font-semibold text-action",
                "transition-colors duration-fast hover:bg-action hover:text-on-action",
                "focus-visible:outline-none focus-visible:outline-focus",
              )}
            >
              <X className="size-3" aria-hidden="true" />
              Clear filter
            </button>
          </div>
        )}

        {/* ── The catalogue, as labelled shelves ───────────────────────── */}
        {visibleGroups.map(({ group, items }) => (
          <section key={group.id} className="mt-12">
            <div className="mb-4">
              <p className="text-caption font-semibold uppercase tracking-wide text-action">
                {group.eyebrow}
              </p>
              <h2 className="mt-1 text-title font-semibold tracking-tight text-ink md:text-title-lg">
                {group.title}
              </h2>
              <p className="mt-1 text-small text-ink-muted">
                {group.description}
              </p>
            </div>

            {items === null ? (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {Array.from({ length: 4 }, (_, i) => (
                  <Skeleton key={i} className="h-block-lg rounded-card" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {items.map((s) => (
                  <ShopServiceCard
                    key={s.id}
                    id={s.id}
                    name={s.name}
                    subCategoryName={s.subCategoryName}
                    fromPricePaise={s.basePricePaise}
                    rating={s.rating}
                    reviewCount={s.reviewCount}
                    imageUrl={s.imageUrls[0]}
                    description={s.description}
                  />
                ))}
              </div>
            )}
          </section>
        ))}

        {/* ── Offers ──────────────────────────────────────────────────── */}
        {banners !== null && banners.length > 0 && filter === null && (
          <Band title="Offers for you">
            <BannerCarousel banners={banners} />
          </Band>
        )}

        {/* ── Most booked — moved far down. It is social proof, not the
            way anybody navigates a catalogue they have already been shown. */}
        {filter === null && mostBooked !== null && mostBooked.length > 0 && (
          <Band
            title="Most booked this month"
            description="What people in your area choose most often."
          >
            <ol className="grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {mostBooked.map((s, i) => (
                <li key={s.id}>
                  <RankedServiceRow
                    rank={i + 1}
                    id={s.id}
                    name={s.name}
                    subCategoryName={s.subCategoryName}
                    fromPricePaise={s.basePricePaise}
                    rating={s.rating}
                    imageUrl={s.imageUrls[0]}
                  />
                </li>
              ))}
            </ol>
          </Band>
        )}

        {/* A filter that matches nothing must say so rather than ending the
            page early with no explanation. */}
        {filter !== null && filteredCount === 0 && (
          <div className="mt-6">
            <EmptyState
              title={`Nothing in ${filter} right now`}
              description="This category has no services available at the moment. Try another, or browse everything."
              action={{ label: "Show all services", onClick: () => setFilter(null) }}
            />
          </div>
        )}

        {filter === null && isNewCustomer && <HowItWorks />}
        {filter === null && <WhyCfc />}
        {filter === null && reviews !== null && reviews.length > 0 && (
          <Testimonials reviews={reviews} />
        )}
        {filter === null && <JoinAsPro />}
        {filter === null && <GetTheApp />}
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

function Band({
  title,
  description,
  children,
}: {
  title: string;
  description?: string | undefined;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-12">
      <div className="mb-4">
        <h2 className="text-title font-semibold tracking-tight text-ink md:text-title-lg">
          {title}
        </h2>
        {description && (
          <p className="mt-1 text-small text-ink-muted">{description}</p>
        )}
      </div>
      {children}
    </section>
  );
}

function RebookCard({
  serviceName,
  pricePaise,
  imageUrl,
  href,
}: {
  serviceName: string;
  pricePaise: number;
  imageUrl?: string | undefined;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group flex h-full items-center gap-3 overflow-hidden rounded-card",
        "border border-border bg-surface p-3 shadow-sm",
        "transition-all duration-base hover:border-action-line hover:shadow-md",
        "focus-visible:outline-none focus-visible:outline-focus",
      )}
    >
      {imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          className="size-tile-lg shrink-0 rounded-control object-cover"
        />
      ) : (
        <span className="flex size-tile-lg shrink-0 items-center justify-center rounded-control bg-action-subtle text-action">
          <RotateCcw className="size-5" aria-hidden="true" />
        </span>
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-small font-semibold text-ink">
          {serviceName}
        </span>
        <span className="mt-1 block text-caption text-ink-muted">
          from{" "}
          <span className="tabular font-medium text-ink">
            {formatCurrency(pricePaise)}
          </span>
        </span>
      </span>
      <ArrowRight
        className="size-4 shrink-0 text-ink-faint transition-colors duration-fast group-hover:text-action"
        aria-hidden="true"
      />
    </Link>
  );
}

/**
 * A ranked row for "most booked".
 *
 * Deliberately not a `ShopServiceCard`: those already fill the shelves above,
 * and repeating the identical card in a second grid made the page look like it
 * had run out of things to say. A numbered row reads as a chart, which is what
 * this section actually is.
 */
function RankedServiceRow({
  rank,
  id,
  name,
  subCategoryName,
  fromPricePaise,
  rating,
  imageUrl,
}: {
  rank: number;
  id: string;
  name: string;
  subCategoryName: string;
  fromPricePaise: number;
  rating?: number | undefined;
  imageUrl?: string | undefined;
}) {
  return (
    <Link
      href={`/service/${id}`}
      className={cn(
        "group flex items-center gap-3 rounded-card border border-border bg-surface p-2",
        "transition-all duration-base hover:border-action-line hover:shadow-sm",
        "focus-visible:outline-none focus-visible:outline-focus",
      )}
    >
      <span className="tabular w-4 shrink-0 text-center text-small font-semibold text-ink-faint">
        {rank}
      </span>
      {imageUrl ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img
          src={imageUrl}
          alt=""
          loading="lazy"
          className="size-tile shrink-0 rounded-control object-cover"
        />
      ) : (
        <span className="size-tile shrink-0 rounded-control bg-neutral-subtle" />
      )}
      <span className="min-w-0 flex-1">
        <span className="block truncate text-small font-semibold text-ink transition-colors duration-fast group-hover:text-action">
          {name}
        </span>
        <span className="block truncate text-caption text-ink-muted">
          {subCategoryName}
          {rating !== undefined && rating > 0 && (
            <> · <span className="tabular">{rating.toFixed(1)}★</span></>
          )}
        </span>
      </span>
      <span className="tabular shrink-0 text-small font-semibold text-ink">
        {formatCurrency(fromPricePaise)}
      </span>
    </Link>
  );
}

/**
 * How it works.
 *
 * Rebuilt as a dark band with the steps connected. The old version was three
 * circled numbers on white with grey body text — generic enough to belong to
 * any company, which is the opposite of what this section is for. A customer
 * reads it once, before their first booking, to answer one question: what
 * happens after I press the button.
 */
function HowItWorks() {
  const STEPS = [
    {
      n: "01",
      title: "Pick a service and a slot",
      body: "Add what you need and choose a time. The price is fixed and shown before you confirm.",
    },
    {
      n: "02",
      title: "A verified pro accepts",
      body: "We offer the job to the three nearest available professionals. You see who is coming, their rating, and their arrival time.",
    },
    {
      n: "03",
      title: "Pay once it's done",
      body: "Share a code to close the job, then pay by UPI, card, wallet or cash. Every job carries a 30-day warranty.",
    },
  ];

  return (
    <section className="relative isolate mt-12 overflow-hidden rounded-card bg-structure">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 70% 130% at 12% 0%, rgba(0,184,196,0.22) 0%, transparent 62%)",
        }}
      />

      <div className="p-6 md:p-panel">
        <p className="text-caption font-semibold uppercase tracking-wide text-brand-bright">
          How it works
        </p>
        <h2 className="mt-2 max-w-screen-sm text-title font-semibold tracking-tight text-on-structure md:text-title-lg">
          Three steps, no phone calls, no haggling.
        </h2>

        <ol className="mt-8 grid gap-6 md:grid-cols-3">
          {STEPS.map(({ n, title, body }, i) => (
            <li key={n} className="relative">
              {/* A hairline joining the steps, so they read as a sequence
                  rather than three unrelated boxes. */}
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden="true"
                  className="absolute left-0 top-6 hidden h-px w-full bg-structure-muted md:block"
                />
              )}
              <span className="relative flex size-tile items-center justify-center rounded-full bg-brand text-caption font-semibold text-structure">
                {n}
              </span>
              <p className="mt-4 text-body font-semibold text-on-structure">
                {title}
              </p>
              <p className="mt-2 text-small leading-relaxed text-on-structure-muted">
                {body}
              </p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

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
      body: "Every pro completes identity and document checks before their first job.",
    },
    {
      icon: Wallet,
      title: "The price you were shown",
      body: "Fixed pricing confirmed before booking. No call-out fee to get a number.",
    },
    {
      icon: CalendarCheck,
      title: "Slots that suit you",
      body: "Pick the date and window when you book, and track the pro on the way.",
    },
  ];

  return (
    <section className="mt-12 overflow-hidden rounded-card border border-border bg-surface">
      <div className="border-b border-border px-6 py-5">
        <h2 className="text-title font-semibold tracking-tight text-ink md:text-title-lg">
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

/**
 * Testimonials.
 *
 * Screen inventory for Customer 7 calls for a testimonials section, and the
 * data for it — `getReviews`, platform-wide reviews sorted newest first — was
 * already built and documented as feeding "the home screen", but nothing on
 * the home screen ever called it. This is that missing wire-up.
 *
 * Carries the same honesty the service-detail and pro-profile screens already
 * use: `REVIEWS_ARE_PLACEHOLDER` labels the copy as sample content until real
 * customer reviews replace the fixture, rather than presenting written-by-us
 * quotes as if a customer said them.
 */
function Testimonials({ reviews }: { reviews: Review[] }) {
  return (
    <section className="mt-12">
      <div className="mb-4">
        <h2 className="text-title font-semibold tracking-tight text-ink md:text-title-lg">
          What customers say
        </h2>
        {REVIEWS_ARE_PLACEHOLDER ? (
          <p className="mt-1 text-small text-ink-muted">
            Sample content — real reviews appear here once jobs are completed.
          </p>
        ) : (
          <p className="mt-1 text-small text-ink-muted">
            From customers whose jobs were completed and confirmed.
          </p>
        )}
      </div>

      <SnapScroller columns={3} aria-label="Customer testimonials">
        {reviews.map((r) => (
          <TestimonialCard key={r.id} review={r} />
        ))}
      </SnapScroller>
    </section>
  );
}

function TestimonialCard({ review }: { review: Review }) {
  return (
    <figure className="flex h-full flex-col rounded-card border border-border bg-surface p-5">
      <Quote
        className="size-5 shrink-0 text-action-line"
        aria-hidden="true"
        fill="currentColor"
      />

      <div className="mt-3 flex items-center gap-1" aria-hidden="true">
        {Array.from({ length: 5 }, (_, i) => (
          <Star
            key={i}
            className={cn(
              "size-4",
              i < review.rating ? "text-star" : "text-border-strong",
            )}
            fill="currentColor"
          />
        ))}
      </div>

      <blockquote className="mt-3 flex-1 text-small leading-relaxed text-ink">
        “{review.body}”
      </blockquote>

      <figcaption className="mt-4 border-t border-border pt-3">
        <p className="text-small font-semibold text-ink">{review.authorName}</p>
        <p className="text-caption text-ink-muted">
          {review.serviceName} · {review.area}
        </p>
      </figcaption>
    </figure>
  );
}

/**
 * Join as a professional.
 *
 * In the Customer 7 screen inventory and was previously pulled off the home
 * page on the reasoning that it was a recruitment ad interrupting a shopping
 * trip. Restored per spec, but kept to a single, skippable band rather than
 * the full-width interruption it used to be — a customer who is not a
 * tradesperson loses one section's height of scrolling, not a detour.
 */
function JoinAsPro() {
  return (
    <section className="relative isolate mt-12 overflow-hidden rounded-card bg-structure">
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 70% 130% at 88% 100%, rgba(0,184,196,0.22) 0%, transparent 62%)",
        }}
      />

      <div className="flex flex-col items-start gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-panel">
        <div className="min-w-0">
          <p className="flex items-center gap-1 text-caption font-semibold uppercase tracking-wide text-brand-bright">
            <Sparkles className="size-4" aria-hidden="true" />
            For professionals
          </p>
          <h2 className="mt-2 max-w-screen-sm text-title font-semibold tracking-tight text-on-structure">
            Good at a trade? Get matched with paying jobs near you.
          </h2>
          <p className="mt-2 max-w-screen-sm text-small leading-relaxed text-on-structure-muted">
            Set your own hours, get paid after every job, and grow with a
            platform that verifies you once and vouches for you every time.
          </p>
        </div>

        {/* Same destination as the footer's "Work with us as a
            professional" link — one route for the one signup flow, not a
            second guessed-at domain. */}
        <Link
          href="/register?role=pro"
          className={cn(
            "flex h-touch shrink-0 items-center gap-2 rounded-control bg-brand px-6",
            "text-small font-semibold text-structure",
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

/**
 * The apps.
 *
 * The store links are placeholders until the apps ship; they are marked as
 * such rather than dressed up as live downloads.
 */
function GetTheApp() {
  return (
    <section className="mt-12 overflow-hidden rounded-card border border-border bg-surface">
      <div className="grid items-center gap-6 p-6 md:grid-cols-2 md:p-8">
        <div className="min-w-0">
          <p className="text-caption font-semibold uppercase tracking-wide text-action">
            Coming soon
          </p>
          <h2 className="mt-2 text-title font-semibold tracking-tight text-ink md:text-title-lg">
            Book on the go
          </h2>
          <p className="mt-2 max-w-screen-sm text-small leading-relaxed text-ink-muted">
            Track your professional live on a map, get arrival alerts, and keep
            every invoice in one place. The CFC app is on its way to Android and
            iOS.
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <StoreBadge store="App Store" />
            <StoreBadge store="Google Play" />
          </div>
        </div>

        <ul className="grid gap-3 sm:grid-cols-2">
          {[
            "Live tracking with arrival time",
            "One-tap rebooking",
            "Every invoice, saved",
            "Wallet and refunds",
          ].map((line) => (
            <li
              key={line}
              className="flex items-start gap-2 rounded-control bg-canvas p-3 text-caption text-ink"
            >
              <BadgeCheck
                className="mt-px size-4 shrink-0 text-action"
                aria-hidden="true"
              />
              {line}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

/**
 * A store badge for an app that does not exist yet.
 *
 * These were styled as buttons and did nothing — a customer tapping one got no
 * response at all, which reads as broken rather than as "not yet". They are now
 * plainly labelled as pending, with no affordance suggesting otherwise.
 */
function StoreBadge({ store }: { store: string }) {
  return (
    <span
      className={cn(
        "flex h-touch items-center gap-2 rounded-control border border-border bg-canvas px-4",
        "text-small font-medium text-ink-muted",
      )}
    >
      {store}
      <span className="rounded-pill bg-neutral-subtle px-2 py-px text-caption font-semibold uppercase tracking-wide text-ink-faint">
        Soon
      </span>
    </span>
  );
}
