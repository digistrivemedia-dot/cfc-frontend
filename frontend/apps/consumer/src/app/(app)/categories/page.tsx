"use client";

import * as React from "react";
import { Suspense } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  AirVent,
  ArrowRight,
  Bath,
  Brush,
  Bug,
  Check,
  ChevronDown,
  ChevronRight,
  Droplets,
  Hammer,
  HeartPulse,
  Home as HomeIcon,
  Scissors,
  Sparkles,
  Star,
  WashingMachine,
} from "lucide-react";
import { getServices, getSubCategories } from "@cfc/mocks";
import type { ServiceDetail, SubCategory } from "@cfc/types";
import {
  EmptyState,
  ErrorState,
  Skeleton,
  cn,
  formatCurrency,
} from "@cfc/ui";
import { ServiceCard } from "@/components/service-card";

/**
 * Customer 10 and 11.
 *
 *   10  Category Listing      "All services under a category with pricing
 *                              preview"
 *   11  Sub-category Listing  "Drill-down into service types"
 *
 * Two depths, one route, held in the URL as `?sub=`. Nothing else: an earlier
 * version of this screen carried a hero band, a "How it works" trio and a FAQ
 * accordion, none of which the agreement asks this screen for and all of which
 * pushed the categories - the only thing a customer comes here for - below the
 * fold.
 *
 * The tiles are the SAME construction as the approved home page's category
 * grid (`.cat` / `.cat-ic` in home-page.css): a white card, a solid rounded
 * icon plate in teal, every third one blue, name, then a price preview. Not
 * photographs - the home page uses glossy icon plates for categories and
 * photographs for services, and this screen is categories.
 */

const SUBCATEGORY_ICON: Record<string, typeof HomeIcon> = {
  "Electrical & AC": AirVent,
  Cleaning: Sparkles,
  Plumbing: Droplets,
  "Pest control": Bug,
  Appliance: WashingMachine,
  Carpentry: Hammer,
  Painting: Brush,
  Water: Bath,
  Beauty: Scissors,
  Nursing: HeartPulse,
};

/** The groups the strip filters by. A category belongs to exactly one. */
const GROUPS: { id: string; label: string; subs: string[] }[] = [
  {
    id: "repairs",
    label: "Repairs",
    subs: ["Electrical & AC", "Plumbing", "Appliance", "Carpentry"],
  },
  { id: "cleaning", label: "Cleaning", subs: ["Cleaning", "Pest control"] },
  { id: "home", label: "Home care", subs: ["Painting", "Water"] },
  { id: "personal", label: "Personal care", subs: ["Beauty", "Nursing"] },
];

type SortKey = "relevance" | "rating" | "price-low" | "price-high";

const SORTS: { key: SortKey; label: string }[] = [
  { key: "relevance", label: "Most booked" },
  { key: "rating", label: "Highest rated" },
  { key: "price-low", label: "Price: low to high" },
  { key: "price-high", label: "Price: high to low" },
];

function isSortKey(v: string | null): v is SortKey {
  return (
    v === "relevance" || v === "rating" || v === "price-low" || v === "price-high"
  );
}

function CategoriesInner() {
  const params = useSearchParams();
  const subName = params.get("sub");
  const group = params.get("group");
  const sort: SortKey = isSortKey(params.get("sort"))
    ? (params.get("sort") as SortKey)
    : "relevance";

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

  if (error) {
    return (
      <div className="cfc-wrap py-12">
        <ErrorState
          title="We could not load the catalogue"
          description="Check your connection and try again."
          action={{ label: "Try again", onClick: load }}
        />
      </div>
    );
  }

  /* ── Customer 11 — drill-down into one category's services ─────────── */
  if (subName !== null) {
    const rows = (services ?? []).filter((s) => s.subCategoryName === subName);
    return (
      <SubCategoryView
        subName={subName}
        subs={subs}
        rows={rows}
        loading={services === null}
        sort={sort}
      />
    );
  }

  /* ── Customer 10 — the categories, with a pricing preview ──────────── */
  const cards =
    subs === null || services === null
      ? null
      : subs
          .map((s) => {
            const rows = services.filter((v) => v.subCategoryName === s.name);
            const reviews = rows.reduce((a, v) => a + v.reviewCount, 0);
            const rated = rows.filter((v) => v.reviewCount > 0);
            const rating = rated.length
              ? rated.reduce((a, v) => a + v.rating, 0) / rated.length
              : 0;

            /* Three marks, not one, and every one earned from the data.
               Marking eight of ten tiles HOT - which a single threshold did -
               means the badge says nothing: if almost everything is hot, hot
               is just decoration. They are checked in order of strength so a
               category only ever carries its best claim.

               Orange is rationed to the loudest one. Rating is a fact rather
               than a deal, so it takes the quiet teal treatment. */
            const badge: { label: string; tone: "promo" | "teal" } | null =
              reviews >= 400
                ? { label: "Most booked", tone: "promo" }
                : rating >= 4.7
                  ? { label: "Top rated", tone: "promo" }
                  : reviews === 0
                    ? { label: "New", tone: "teal" }
                    : null;

            return {
              name: s.name,
              count: rows.length,
              fromPaise: rows.length
                ? Math.min(...rows.map((v) => v.basePricePaise))
                : 0,
              badge,
            };
          })
          // A category with nothing bookable behind it is a dead tile.
          .filter((c) => c.count > 0)
          .filter((c) => {
            if (group === null) return true;
            const g = GROUPS.find((x) => x.id === group);
            return g ? g.subs.includes(c.name) : true;
          });

  return (
    /* `pb-20` rather than `pb-14`: the last row of tiles was ending almost on
       the footer's top edge, so the two read as one block. The footer needs
       clear air above it to read as chrome rather than as the end of the
       grid. */
    <div className="cfc-band-wash min-h-screen pb-20">
      <div className="cfc-wrap pt-6">
        {/* Eyebrow, headline, strapline - the construction the approved home
            page puts above its own category grid, so arriving here from that
            grid does not read as a different product. */}
        <span className="cfc-eyebrow">Browse categories</span>
        <h1 className="mt-3 text-section text-ink">
          What does your home need today?
        </h1>
        <p className="mt-2 max-w-line-2xl text-body text-ink-muted">
          Every job inside a category has a fixed price you can see before
          booking.
        </p>

        {/* The strip. Filters the grid in place - no page load, and the URL
            carries it so a filtered view is shareable. */}
        <nav
          // `scrollbar-none` hides the track. On a phone the chips overflow,
          // and the browser drew a grey scrollbar underneath them that read as
          // a stray rule between the strip and the grid.
          className="-mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none md:mx-0 md:px-0"
          aria-label="Filter categories"
        >
          <Chip href="/categories" current={group === null}>
            All categories
          </Chip>
          {GROUPS.map((g) => (
            <Chip
              key={g.id}
              href={`/categories?group=${g.id}`}
              current={group === g.id}
            >
              {g.label}
            </Chip>
          ))}
        </nav>

        {cards === null ? (
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {Array.from({ length: 10 }, (_, i) => (
              <Skeleton key={i} className="h-block-md rounded-card" />
            ))}
          </div>
        ) : cards.length === 0 ? (
          <div className="mt-6">
            <EmptyState
              title="Nothing in this group"
              description="No category here has services at the moment."
              action={{
                label: "Show all categories",
                onClick: () => {
                  window.location.href = "/categories";
                },
              }}
            />
          </div>
        ) : (
          /* Four to a row, matching the approved "Most booked" rail these
             cards are built from. Six was right for the compact chip this
             replaced; at this size it would squeeze the media panel. */
          <ul className="mt-6 grid grid-cols-2 items-stretch gap-4 md:grid-cols-3 lg:grid-cols-4">
            {cards.map((c, i) => (
              <li key={c.name}>
                <CategoryTile
                  name={c.name}
                  fromPaise={c.fromPaise}
                  count={c.count}
                  badge={c.badge}
                  index={i}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Chip({
  href,
  current,
  children,
}: {
  href: string;
  current: boolean;
  children: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      aria-current={current ? "page" : undefined}
      className={cn(
        "shrink-0 whitespace-nowrap rounded-pill border px-4 py-2",
        "text-small font-bold transition-all duration-fast",
        "focus-visible:outline-none focus-visible:outline-focus",
        current
          ? "border-action bg-action text-on-action"
          : "border-border bg-surface text-ink hover:border-action hover:text-action",
      )}
    >
      {children}
    </Link>
  );
}

/**
 * One category.
 *
 * Built to match `.cat` on the approved home page: white card, a solid rounded
 * icon plate — teal, every third one blue — centred, then the name. The price
 * preview underneath is what Customer 10 asks this screen for and what the
 * home page's version does not carry.
 */
/**
 * One category, built like the approved home page's "Most booked" card
 * (`.bk` / `.bk-media` in home-page.css) rather than as a compact chip.
 *
 * The chip version was too small to carry a price and a badge without both
 * becoming footnotes. This is the same construction the client already
 * approved for service cards: a tall tinted media panel with a large line
 * icon on a white disc, then the text below on white.
 *
 *   panel   152px tall, --panel-l teal wash, alternating to blue wash
 *   disc    104px white circle at 55% opacity behind the glyph
 *   icon    58px, light stroke - it is artwork here, not an indicator
 */
function CategoryTile({
  name,
  fromPaise,
  count,
  badge,
  index,
}: {
  name: string;
  fromPaise: number;
  count: number;
  badge: { label: string; tone: "promo" | "teal" } | null;
  index: number;
}) {
  const Icon = SUBCATEGORY_ICON[name] ?? HomeIcon;
  const isBlue = index % 2 === 1;

  return (
    <Link
      href={`/categories?sub=${encodeURIComponent(name)}`}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface",
        "transition-all duration-base",
        "hover:-translate-y-1 hover:border-action hover:shadow-md",
        "focus-visible:outline-none focus-visible:outline-focus",
      )}
    >
      <div
        className={cn(
          "relative grid h-block-sm place-items-center",
          "transition duration-base group-hover:brightness-105",
          isBlue ? "bg-clock-subtle text-clock" : "bg-action-subtle text-action",
        )}
      >
        {/* The disc. It lifts the glyph off the tint so a light stroke stays
            readable, which a large line icon on a flat wash does not.

            The size and the 55% white are arbitrary values on purpose: the
            preset has no 104px step and no white-with-opacity utility, and
            both are specific to this one construction rather than scale
            values worth adding. */}
        <span
          aria-hidden="true"
          className="absolute size-tile-lg rounded-full bg-surface opacity-60"
        />
        <Icon
          className="relative size-12"
          strokeWidth={1.3}
          aria-hidden="true"
        />

        {badge && (
          <span
            className={cn(
              "cfc-badge absolute left-3 top-3",
              badge.tone === "promo" ? "cfc-badge-promo" : "cfc-badge-teal",
            )}
          >
            {badge.label}
          </span>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <span className="block text-body font-bold leading-snug text-ink">
          {name}
        </span>
        <span className="tabular mt-1 block text-caption text-ink-muted">
          {count} {count === 1 ? "service" : "services"}
        </span>

        {/* THE PRICING PREVIEW (Customer 10). Pinned to the foot so every tile
            in a row shows its price on the same line.

            The "explore" link beside it is what tells a customer the tile
            OPENS. Without it the card read as a finished thing - a name, a
            count and a price - and nothing said that two more services sat
            behind it. It is a span, not a Link: the whole tile is already the
            anchor, and nesting one inside it would be invalid. */}
        <span className="mt-auto flex items-baseline justify-between gap-2 pt-3">
          <span className="flex items-baseline gap-1">
            <span className="text-caption text-ink-muted">from</span>
            <span className="cfc-price">{formatCurrency(fromPaise)}</span>
          </span>
          <span className="flex shrink-0 items-center gap-1 text-caption font-bold text-action">
            Explore
            <ArrowRight
              className="size-3 transition-transform duration-base group-hover:translate-x-0.5"
              aria-hidden="true"
            />
          </span>
        </span>
      </div>
    </Link>
  );
}

/**
 * The other categories, behind one chip.
 *
 * Same construction as the sort menu below, and for the same reason: the app's
 * own surface and radius rather than system chrome.
 */
function CategoryMenu({ names }: { names: string[] }) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (names.length === 0) return null;

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="menu"
        aria-expanded={open}
        className={cn(
          "flex shrink-0 items-center gap-2 whitespace-nowrap rounded-pill border px-4 py-2",
          "text-small font-bold transition-all duration-fast",
          "focus-visible:outline-none focus-visible:outline-focus",
          open
            ? "border-action bg-action-subtle text-action"
            : "border-border bg-surface text-ink hover:border-action hover:text-action",
        )}
      >
        More categories
        <ChevronDown
          className={cn(
            "size-4 shrink-0 transition-transform duration-fast",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {open && (
        <div
          role="menu"
          className={cn(
            "absolute left-0 top-full z-popover mt-2 w-line-lg overflow-hidden",
            "rounded-card border border-border bg-surface p-2 shadow-lg",
          )}
        >
          <ul className="grid gap-1 sm:grid-cols-2">
            {names.map((name) => {
              const ItemIcon = SUBCATEGORY_ICON[name] ?? HomeIcon;
              return (
                <li key={name}>
                  <Link
                    href={`/categories?sub=${encodeURIComponent(name)}`}
                    role="menuitem"
                    className={cn(
                      "flex items-center gap-2 rounded-control px-3 py-2 text-small font-medium text-ink",
                      "transition-colors duration-fast hover:bg-action-subtle hover:text-action",
                    )}
                  >
                    <ItemIcon
                      className="size-4 shrink-0 text-action"
                      aria-hidden="true"
                    />
                    <span className="truncate">{name}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * The sort control.
 *
 * A styled menu rather than a `<select>`. A native select's OPTION LIST is
 * drawn by the operating system: it cannot take a border radius, a token
 * colour, a font or any padding, so however carefully the closed control is
 * styled, the list that opens out of it arrives in system chrome - cramped,
 * square-cornered and visibly from another product.
 *
 * This keeps the app's own surface, radius and shadow all the way through, and
 * uses `role="listbox"` so it is still announced and operable as one.
 */
function SortMenu({
  subName,
  sort,
  disabled = false,
}: {
  subName: string;
  sort: SortKey;
  /** True where there is nothing to sort — see the call site. */
  disabled?: boolean;
}) {
  const [open, setOpen] = React.useState(false);
  const ref = React.useRef<HTMLDivElement | null>(null);
  const current = SORTS.find((s) => s.key === sort) ?? SORTS[0];

  // Close on an outside click or Escape - without this the menu stays open
  // while the customer reads the grid behind it.
  React.useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const hrefFor = (key: SortKey) => {
    const q = new URLSearchParams({ sub: subName });
    if (key !== "relevance") q.set("sort", key);
    return `/categories?${q.toString()}`;
  };

  return (
    <div ref={ref} className="relative flex items-center gap-3">
      <span className="shrink-0 text-small font-medium text-ink-muted">
        Sort by
      </span>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        disabled={disabled}
        aria-haspopup="listbox"
        aria-expanded={open}
        className={cn(
          "flex h-touch items-center gap-2 rounded-control border bg-surface pl-4 pr-3",
          "text-small font-semibold transition-colors duration-fast",
          "focus-visible:outline-none focus-visible:outline-focus",
          disabled
            ? "cursor-not-allowed border-border text-ink-faint"
            : open
              ? "border-action text-ink"
              : "border-border text-ink hover:border-action",
        )}
      >
        {current?.label}
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-ink-muted transition-transform duration-fast",
            open && "rotate-180",
          )}
          aria-hidden="true"
        />
      </button>

      {open && !disabled && (
        <ul
          role="listbox"
          aria-label="Sort services"
          className={cn(
            // `w-line-md` was too narrow for "Price: low to high", so every
            // option wrapped onto two lines. `w-line-lg` fits the longest
            // label, and nowrap guarantees it.
            //
            // `w-[220px]` and `py-2.5` were written here first: this preset
            // has no arbitrary-width support on this utility and no half-step
            // spacing, so both compiled to nothing - which is why the rows
            // rendered with no padding at all.
            "absolute right-0 top-full z-popover mt-2 w-line-lg overflow-hidden",
            "rounded-card border border-border bg-surface py-1 shadow-lg",
          )}
        >
          {SORTS.map((s) => {
            const selected = s.key === sort;
            return (
              <li key={s.key} role="option" aria-selected={selected}>
                <Link
                  href={hrefFor(s.key)}
                  className={cn(
                    "flex items-center justify-between gap-3 whitespace-nowrap px-4 py-3 text-small",
                    "transition-colors duration-fast",
                    selected
                      ? "bg-action-subtle font-bold text-action"
                      : "font-medium text-ink hover:bg-neutral-subtle",
                  )}
                >
                  {s.label}
                  {selected && (
                    <Check className="size-4 shrink-0" aria-hidden="true" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

/**
 * Customer 11 — "Drill-down into service types".
 *
 * Rebuilt to the same construction as the category grid rather than left as a
 * bare heading with a list under it. The shape of the screen is:
 *
 *   hero strip   the category's own icon plate, name, and what it covers
 *   siblings     move sideways without going back up
 *   controls     count and sort, in a bar rather than as loose text
 *   services     the shop card, with photo, rating, price and Add
 *   explore      the remaining categories, as tiles
 *
 * The explore block is not decoration. Five of the ten categories hold a
 * single service, so without it most drill-downs ended in a one-item list and
 * a footer.
 */
function SubCategoryView({
  subName,
  subs,
  rows,
  loading,
  sort,
}: {
  subName: string;
  subs: SubCategory[] | null;
  rows: ServiceDetail[];
  loading: boolean;
  sort: SortKey;
}) {
  const sorted = React.useMemo(() => {
    const out = [...rows];
    if (sort === "price-low") out.sort((a, b) => a.basePricePaise - b.basePricePaise);
    if (sort === "price-high") out.sort((a, b) => b.basePricePaise - a.basePricePaise);
    if (sort === "rating") out.sort((a, b) => b.rating - a.rating);
    return out;
  }, [rows, sort]);

  const siblings = (subs ?? []).map((s) => s.name);
  const others = siblings.filter((n) => n !== subName);
  const Icon = SUBCATEGORY_ICON[subName] ?? HomeIcon;

  const fromPaise = rows.length
    ? Math.min(...rows.map((r) => r.basePricePaise))
    : 0;
  const rated = rows.filter((r) => r.reviewCount > 0);
  const rating = rated.length
    ? rated.reduce((a, r) => a + r.rating, 0) / rated.length
    : 0;
  const reviews = rows.reduce((a, r) => a + r.reviewCount, 0);

  return (
    <div className="cfc-band-wash min-h-screen pb-20">
      {/* ── Hero strip ───────────────────────────────────────────────────
          White, so it separates from the wash below it without a dark slab.
          Carries the three facts a customer wants before they scroll: what
          this covers, what it starts at, and whether anyone rates it. */}
      <section className="border-b border-border bg-surface">
        <div className="cfc-wrap py-6 md:py-8">
          <nav aria-label="Breadcrumb">
            <ol className="flex flex-wrap items-center gap-1 text-caption text-ink-muted">
              <li>
                <Link
                  href="/categories"
                  className="hover:text-action hover:underline"
                >
                  All services
                </Link>
              </li>
              <li aria-hidden="true">
                <ChevronRight className="size-3" />
              </li>
              <li className="font-semibold text-ink">{subName}</li>
            </ol>
          </nav>

          {/* One row, not three stacked blocks.

              The icon plate was `size-tile-lg` beside a `text-section`
              heading, with the trust chips on their own line below - three
              bands of furniture before a customer reached a single service.
              The plate is now inline at text height, the facts sit on one
              line with the heading, and the chips only carry what the heading
              does not already say. */}
          <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
            <span className="grid size-tile shrink-0 place-items-center rounded-control bg-action text-on-action">
              <Icon className="size-5" aria-hidden="true" />
            </span>

            <h1 className="min-w-0 text-heading font-bold text-ink md:text-heading-lg">
              {subName}
            </h1>

            {/* Pills, not a line of prose.

                These were bare text sitting after the heading, so the price
                and the rating - the two facts a customer scans for - read as a
                caption rather than as figures worth trusting. Orange carries
                the price because nothing else on this screen is orange, and it
                is the number the whole page is about. */}
            {fromPaise > 0 && (
              // No border. `border-promo/30` was written here and compiles to
              // nothing - this preset does not carry opacity modifiers on
              // border colours - and the subtle promo fill is distinct enough
              // against white that the pill does not need an outline anyway.
              <span className="flex items-baseline gap-1 rounded-pill bg-promo-subtle px-3 py-1">
                <span className="text-caption font-semibold text-promo">
                  from
                </span>
                <span className="tabular text-body font-extrabold tracking-tight text-promo">
                  {formatCurrency(fromPaise)}
                </span>
              </span>
            )}

            {rating > 0 && (
              <span className="flex items-center gap-1 rounded-pill border border-border bg-surface px-3 py-1">
                <Star
                  className="size-3 shrink-0 fill-star text-star"
                  aria-hidden="true"
                />
                <span className="tabular text-small font-bold text-ink">
                  {rating.toFixed(1)}
                </span>
                <span className="tabular text-caption text-ink-muted">
                  ({reviews})
                </span>
              </span>
            )}
          </div>

          {/* Dot-separated facts, with the count carrying weight: it is the
              only one that changes per category. */}
          <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-small text-ink-muted">
            <span className="font-bold text-ink">
              {rows.length} {rows.length === 1 ? "service" : "services"}
            </span>
            <span aria-hidden="true" className="size-1 rounded-full bg-border" />
            <span>Fixed prices</span>
            <span aria-hidden="true" className="size-1 rounded-full bg-border" />
            <span>Verified professionals</span>
            <span aria-hidden="true" className="size-1 rounded-full bg-border" />
            <span>30-day warranty</span>
          </p>
        </div>
      </section>

      <div className="cfc-wrap">
        {/* Two chips and a menu, not eleven chips.

            The strip listed every category, so a customer reading Cleaning had
            nine links to categories they had not asked for spread across the
            full width - and on a phone a horizontal scroll to get past them.
            What is actually useful here is "go back up" and "where am I"; the
            rest belong behind a menu, which is also where a tenth category
            would go without making the row longer. */}
        {/* Navigation and sort share ONE row.

            Sort sat on a line of its own below this strip, which put two rows
            of controls between the header and the first card and left a band
            of empty page beside each. They do the same kind of job - narrowing
            what is shown - so they belong on the same line, pushed to opposite
            ends. */}
        {siblings.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 py-5">
            <nav
              className="flex flex-wrap items-center gap-2"
              aria-label="Switch category"
            >
              <Chip href="/categories" current={false}>
                All categories
              </Chip>
              <Chip
                href={`/categories?sub=${encodeURIComponent(subName)}`}
                current
              >
                {subName}
              </Chip>
              <CategoryMenu names={others} />
            </nav>

            {/* Always present, even where a category holds one service.

                It was hidden below two results, on the reasoning that sorting
                one thing does nothing. But the row then lost its right-hand
                control on exactly the five categories that have a single
                service, so the strip changed shape from one category to the
                next - and a customer who had just set a sort watched it vanish
                when they switched. It is disabled rather than removed: the
                layout holds, and the state is still readable. */}
            <SortMenu
              subName={subName}
              sort={sort}
              disabled={sorted.length < 2}
            />
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {Array.from({ length: 4 }, (_, i) => (
              <Skeleton key={i} className="h-block-lg rounded-card" />
            ))}
          </div>
        ) : sorted.length === 0 ? (
          <EmptyState
            title="Nothing here yet"
            description="This category has no services at the moment."
            action={{
              label: "Browse all categories",
              onClick: () => {
                window.location.href = "/categories";
              },
            }}
          />
        ) : (
          <>
            {/* Sort lives in the category strip above, beside the chips. It
                was rendered here as well, so the screen carried two identical
                controls one under the other. */}

            {/* The column count follows the CONTENT.

                A fixed grid left a two-service category with a card, a card,
                and a column of white - and a one-service category with a lone
                card beside two empty columns, which is what the Carpentry page
                looked like. Capping the track count at the number of services
                means a short category fills its row instead of advertising
                what it lacks. */}
            <ul
              className={cn(
                "grid items-stretch gap-4 sm:grid-cols-2",
                sorted.length === 1
                  ? "lg:max-w-[380px] lg:grid-cols-1"
                  : sorted.length === 2
                    ? "lg:grid-cols-2"
                    : "lg:grid-cols-3",
              )}
            >
              {sorted.map((s, i) => (
                <li key={s.id}>
                  <ServiceCard
                    id={s.id}
                    name={s.name}
                    description={s.description}
                    fromPricePaise={s.basePricePaise}
                    durationMinutes={s.variants[0]?.durationMinutes}
                    rating={s.rating}
                    reviewCount={s.reviewCount}
                    {...(s.imageUrls[0] ? { imageUrl: s.imageUrls[0] } : {})}
                    icon={Icon}
                    index={i}
                  />
                </li>
              ))}
            </ul>
          </>
        )}

        {/* ── Explore ────────────────────────────────────────────────────
            mt-16/pt-12, not mt-14/pt-10: the eyebrow was landing close enough
            to the last card that the rule read as part of the grid rather than
            as the start of a new section. */}
        {others.length > 0 && (
          <section className="mt-16 border-t border-border pt-12">
            <span className="cfc-eyebrow">More to explore</span>
            <h2 className="mt-3 text-heading font-bold text-ink md:text-heading-lg">
              Other things we look after
            </h2>
            <p className="mt-1 text-small text-ink-muted">
              Every category has fixed prices you can see before booking.
            </p>

            <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {others.map((name, i) => {
                const OtherIcon = SUBCATEGORY_ICON[name] ?? HomeIcon;
                return (
                  <li key={name}>
                    <Link
                      href={`/categories?sub=${encodeURIComponent(name)}`}
                      className={cn(
                        "group flex h-full flex-col items-center gap-2 rounded-card border border-border bg-surface",
                        "p-4 text-center transition-all duration-base",
                        "hover:-translate-y-1 hover:border-action hover:shadow-md",
                        "focus-visible:outline-none focus-visible:outline-focus",
                      )}
                    >
                      <span
                        className={cn(
                          "grid size-tile place-items-center rounded-control text-on-action",
                          "transition duration-base group-hover:brightness-110",
                          i % 3 === 1 ? "bg-clock" : "bg-action",
                        )}
                      >
                        <OtherIcon className="size-5" aria-hidden="true" />
                      </span>
                      <span className="text-small font-bold leading-tight text-ink">
                        {name}
                      </span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        )}
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
