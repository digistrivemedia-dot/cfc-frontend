"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  CalendarCheck,
  RotateCcw,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import {
  getActiveBooking,
  getBanners,
  getCategories,
  getConsumerProfile,
  getRebookable,
  getServices,
  getSubCategories,
} from "@cfc/mocks";
import type {
  Banner,
  Category,
  ConsumerBooking,
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
import { ActiveBookingCard } from "@/components/active-booking-card";
import { BannerCarousel } from "@/components/banner-carousel";
import { HomeHero } from "@/components/home-hero";
import { SubCategoryTile } from "@/components/subcategory-tile";
import { useSession } from "@/lib/session";

/**
 * Customer 7 — Home. Served at `/`, the site's actual front door.
 *
 * It used to live at `/home`, with `/` redirecting there. That redirect was
 * wrong twice over: a visitor typing the domain watched the URL change under
 * them, and the homepage — the most important page on a marketplace, and the
 * one search engines index — was not at the root. It is now the index of the
 * `(app)` group, so it renders directly with the header, footer and mobile tab
 * bar, and the address bar stays on the domain the visitor typed.
 *
 * Design C: utility dashboard.
 *
 * The page adapts to who is looking, because "home" means two different things
 * to two different people:
 *
 *   - Someone with a professional on the way is **not shopping**. They want to
 *     know where the pro is and how to reach them. That gets the top of the
 *     screen and the hero is dropped entirely — a marketing headline above a
 *     live job is noise.
 *   - Someone with nothing in flight is browsing, and gets the hero, the
 *     catalogue and the reasons to trust the platform.
 *
 * Between those, a returning customer gets "Book again" from their own
 * history, because the second booking of a monthly clean should take one tap
 * rather than a search.
 *
 * This is the version that stays useful after the first booking. A and B are
 * both permanent front doors — identical on day one and day one hundred.
 *
 * Everything the other two directions fixed is kept: sub-categories drive
 * browsing (the five categories are admin buckets — one holds 12 of 15
 * services, two hold none), real photographs throughout, a search field that
 * searches, and no invented testimonials.
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
 * Catalogue groupings, named for the moment a customer is in rather than for
 * the database's category table.
 */
const GROUPS: readonly {
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
    description: "Deep cleans and pest control.",
    subCategories: ["Cleaning", "Pest control"],
  },
  {
    id: "improve",
    title: "Make it yours",
    description: "Carpentry and painting, finished properly.",
    subCategories: ["Carpentry", "Painting"],
  },
  {
    id: "care",
    title: "Personal care",
    description: "Salon and nursing, at home.",
    subCategories: ["Beauty", "Nursing"],
  },
];

interface Rebookable {
  serviceName: string;
  lastBookedAt: string;
  totalPaise: number;
}

export default function HomePage() {
  const [categories, setCategories] = React.useState<Category[] | null>(null);
  const [subCategories, setSubCategories] = React.useState<SubCategory[] | null>(
    null,
  );
  const [services, setServices] = React.useState<ServiceDetail[] | null>(null);
  const [banners, setBanners] = React.useState<Banner[] | null>(null);
  const [profile, setProfile] = React.useState<ConsumerProfile | null>(null);
  const [active, setActive] = React.useState<ConsumerBooking | null>(null);
  const [rebookable, setRebookable] = React.useState<Rebookable[] | null>(null);
  const [error, setError] = React.useState(false);
  const { signedIn } = useSession();

  const load = React.useCallback(() => {
    // Wait until the stored session has been read. Fetching a guest's view and
    // then a customer's would flash the wrong homepage on every load.
    if (signedIn === null) return;

    setError(false);

    // The catalogue is public — it is the whole point of the page, and a
    // visitor arriving from a search result must see it without an account.
    const publicData = Promise.all([
      getCategories(),
      getSubCategories(),
      getServices(),
      getBanners(),
    ]);

    // Anything that names a person is fetched only when there is a person to
    // name. A signed-out visitor must never be shown another customer's live
    // booking, their past services, or their area.
    const personalData = signedIn
      ? Promise.all([getConsumerProfile(), getActiveBooking(), getRebookable()])
      : Promise.resolve(null);

    Promise.all([publicData, personalData])
      .then(([[c, sub, s, b], personal]) => {
        setCategories(c);
        setSubCategories(sub);
        setServices(s);
        setBanners(b.filter((x) => x.active));

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

  /** Match a past booking back to a live service, so "Book again" can link. */
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

  // Only a signed-in customer can have a live job. A guest seeing one would be
  // seeing somebody else's.
  const hasActive = signedIn === true && active !== null;

  /**
   * Someone who needs to be told how this works.
   *
   * That is a visitor who has never signed in, and a signed-in customer with no
   * history yet — both are about to make a first booking and neither knows what
   * happens after they press the button. A customer with past bookings does,
   * and repeating it to them is filler.
   *
   * `rebookable` is null while loading, so a signed-in customer does not see
   * the walkthrough flash before their history arrives.
   */
  const isNewCustomer =
    signedIn === false ||
    (!hasActive && rebookable !== null && rebookable.length === 0);

  return (
    <div>
      {/* The hero is for people who are shopping. Someone tracking a pro gets
          a compact greeting instead, because a marketing headline above a
          live job is noise. */}
      {hasActive ? (
        <div className="mx-auto max-w-screen-xl px-4 pt-6 md:px-6 lg:px-8">
          <ActiveBookingCard booking={active} />
        </div>
      ) : (
        <HomeHero area={profile?.area} startingPricePaise={startingPrice} />
      )}

      <div className="mx-auto max-w-screen-xl px-4 pb-12 md:px-6 lg:px-8">
        {/* ── First-timer walkthrough ────────────────────────────────────
            Shown only to someone with no history. A customer who has booked
            before knows how this works, and repeating it to them is filler. */}
        {isNewCustomer && <HowItWorks />}

        {/* ── Book again ─────────────────────────────────────────────────
            A returning customer's shortcut. Only completed jobs, de-duplicated
            by service, so a monthly clean appears once rather than six times. */}
        {rebookable !== null && rebookable.length > 0 && (
          <Band
            title="Book again"
            description="Services you've booked before."
          >
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

        {/* ── Browse every service ───────────────────────────────────── */}
        <Band
          title="What do you need help with?"
          description={
            startingPrice !== null
              ? `Fixed prices from ${formatCurrency(startingPrice)}, shown before you book.`
              : undefined
          }
          href="/categories"
        >
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
        </Band>

        {/* ── Most booked ─────────────────────────────────────────────── */}
        <Band
          title="Most booked"
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

        {/* ── The catalogue, filtered in place ────────────────────────── */}
        <CatalogueShelf services={live} bySubCategory={bySubCategory} />

        {/* Trust matters less to someone mid-job — they already trusted us —
            so it is only shown to a customer who is still deciding. */}
        {!hasActive && <WhyCfc />}

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
 * One past service, offered again.
 *
 * Shows the current price rather than what they paid last time — a stale
 * figure here becomes a complaint at checkout.
 */
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
        // eslint-disable-next-line @next/next/no-img-element
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

function CatalogueShelf({
  services,
  bySubCategory,
}: {
  services: ServiceDetail[] | null;
  bySubCategory: Map<string, ServiceDetail[]> | null;
}) {
  const [active, setActive] = React.useState<string>("all");

  const tabs = React.useMemo(() => {
    if (!bySubCategory) return [];
    return GROUPS.filter((r) =>
      r.subCategories.some((n) => (bySubCategory.get(n)?.length ?? 0) > 0),
    );
  }, [bySubCategory]);

  const shown = React.useMemo(() => {
    if (!services) return null;
    if (active === "all") return services;
    const row = GROUPS.find((r) => r.id === active);
    if (!row || !bySubCategory) return services;
    return row.subCategories.flatMap((n) => bySubCategory.get(n) ?? []);
  }, [services, active, bySubCategory]);

  const current = GROUPS.find((r) => r.id === active);

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
    <section className="mt-8">
      <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
        <div className="min-w-0">
          <h2 className="text-title font-semibold tracking-tight text-ink">
            {title}
          </h2>
          {description && (
            <p className="mt-1 text-small text-ink-muted">{description}</p>
          )}
        </div>
        {href && (
          <Link
            href={href}
            className={cn(
              "flex shrink-0 items-center gap-1 rounded-control text-small font-medium text-action",
              "hover:underline focus-visible:outline-none focus-visible:outline-focus",
            )}
          >
            See all
            <ArrowRight className="size-4" aria-hidden="true" />
          </Link>
        )}
      </div>
      {children}
    </section>
  );
}

/**
 * How it works — first booking only.
 *
 * The question a first-time customer actually has is not "are you good", it is
 * "what happens after I press the button — does someone call me, do I have to
 * be home, when do I pay". Three steps answer it.
 *
 * Numbered rather than iconographic: the point is that it is a short sequence
 * with an end, and a row of icons does not say that.
 */
function HowItWorks() {
  const STEPS = [
    {
      n: "1",
      title: "Pick a service and a slot",
      body: "Choose what you need and a time that suits you. The price is fixed and shown before you confirm.",
    },
    {
      n: "2",
      title: "A verified professional accepts",
      body: "We offer the job to the nearest available pros. You see who is coming, their rating, and their arrival time.",
    },
    {
      n: "3",
      title: "Pay after the work is done",
      body: "Share a code to close the job, then pay by UPI, card, wallet or cash. Every job carries a 30-day warranty.",
    },
  ];

  return (
    <section className="mt-8 rounded-card border border-border bg-surface p-6 md:p-8">
      <h2 className="text-title font-semibold tracking-tight text-ink">
        New here? This is how it works
      </h2>
      <p className="mt-1 text-small text-ink-muted">
        Three steps, no phone calls, no haggling.
      </p>

      <ol className="mt-6 grid gap-6 md:grid-cols-3">
        {STEPS.map(({ n, title, body }) => (
          <li key={n} className="flex gap-4">
            <span
              className={cn(
                "flex size-tile shrink-0 items-center justify-center rounded-full",
                "bg-action text-body font-semibold text-on-action",
              )}
              aria-hidden="true"
            >
              {n}
            </span>
            <span className="min-w-0">
              <span className="block text-small font-semibold text-ink">
                {title}
              </span>
              <span className="mt-1 block text-caption leading-relaxed text-ink-muted">
                {body}
              </span>
            </span>
          </li>
        ))}
      </ol>
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
    <section className="relative isolate mt-8 overflow-hidden rounded-card bg-structure">
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
