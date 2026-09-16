"use client";

import * as React from "react";
import Link from "next/link";
import { ChevronRight, Clock, Minus, Plus, Star } from "lucide-react";
import { Button, cn, formatCurrency } from "@cfc/ui";
import { useCart } from "@/lib/cart";

/**
 * A lucide glyph.
 *
 * Declared as a named interface rather than written inline in the props: an
 * inline generic on a component type is parsed as JSX in a .tsx file, and the
 * module then fails pointing at the return statement rather than at the real
 * fault.
 */
interface IconProps {
  className?: string;
  strokeWidth?: number;
}

type IconComponent = (props: IconProps) => React.ReactNode;

/**
 * A service, as the approved home page builds one (`.bk` in home-page.css).
 *
 * WHY THIS EXISTS RATHER THAN THE PHOTO CARD
 *
 * `ShopServiceCard` leads with a photograph. On a category page that is the
 * wrong lead: the photos are stock, every service in a category gets a nearly
 * identical one, and at four-to-a-row they made the grid read as a gallery
 * rather than a price list. Worse, a category holding ONE service showed a
 * single enormous photo card marooned in white space.
 *
 * So this card leads with the same tinted icon panel the approved "Most
 * booked" rail uses, and gives the room back to the things a customer is
 * actually comparing: what it is, how long it takes, what people rate it and
 * what it costs.
 *
 *   panel    a flat tint with a large line glyph, alternating teal/blue
 *   body     name, one line of description, then a meta row
 *   foot     price and Add, divided by a dashed rule
 *
 * The dashed rule is the approved card's own (`.bk-foot`): it separates the
 * money from the description without drawing a second hard line inside a card
 * that already has a border.
 */
export function ServiceCard({
  id,
  name,
  description,
  fromPricePaise,
  durationMinutes,
  rating,
  reviewCount,
  imageUrl,
  icon: Icon,
  index = 0,
}: {
  id: string;
  name: string;
  description?: string | undefined;
  fromPricePaise: number;
  durationMinutes?: number | undefined;
  rating?: number | undefined;
  reviewCount?: number | undefined;
  imageUrl?: string | undefined;
  /** The category's glyph, used only where a service has no photograph. */
  icon: IconComponent;
  index?: number;
}) {
  const { has, add, setQuantity, lines } = useCart();
  const inCart = has(id);
  const quantity = (lines ?? []).find((l) => l.serviceId === id)?.quantity ?? 0;

  const hours = durationMinutes ? Math.floor(durationMinutes / 60) : 0;
  const mins = durationMinutes ? durationMinutes % 60 : 0;
  const duration = durationMinutes
    ? hours && mins
      ? `${hours} hr ${mins} min`
      : hours
        ? `${hours} hr`
        : `${mins} min`
    : null;

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-card border bg-surface",
        "transition-all duration-base",
        inCart
          ? "border-action shadow-md"
          : "border-border hover:-translate-y-1 hover:border-action hover:shadow-md",
      )}
    >
      <Link
        href={`/service/${id}`}
        className="block focus-visible:outline-none focus-visible:outline-focus"
      >
        <div className="relative aspect-card overflow-hidden bg-canvas">
          {imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imageUrl}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform duration-base group-hover:scale-105"
            />
          ) : (
            /* The icon is the FALLBACK, not the lead. A tinted panel with a
               glyph reads as a placeholder the moment it sits beside a card
               that has a photograph, so it only appears where there is no
               photograph to show. */
            <div
              className={cn(
                "relative grid size-full place-items-center",
                index % 2 === 1
                  ? "bg-clock-subtle text-clock"
                  : "bg-action-subtle text-action",
              )}
            >
              <Icon className="size-8" strokeWidth={1.4} />
            </div>
          )}
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-4">
        <Link
          href={`/service/${id}`}
          className={cn(
            "rounded-control text-body font-bold leading-snug text-ink",
            "transition-colors duration-fast hover:text-action",
            "focus-visible:outline-none focus-visible:outline-focus",
          )}
        >
          {name}
        </Link>

        {/* One line, not two. At two lines a three-card row went ragged
            whenever one description ran longer than the others. */}
        {description && (
          <p className="mt-1 line-clamp-1 text-caption leading-relaxed text-ink-muted">
            {description}
          </p>
        )}

        {/* Rating and duration on one row, separated by a dot - the approved
            card's `.bk-meta`. Two stacked lines of metadata pushed the price
            down and made every card taller than it needed to be. */}
        {(rating !== undefined && rating > 0) || duration ? (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-caption text-ink-muted">
            {rating !== undefined && rating > 0 && (
              <span className="flex items-center gap-1 font-bold text-ink">
                <Star
                  className="size-3 fill-star text-star"
                  aria-hidden="true"
                />
                <span className="tabular">{rating.toFixed(1)}</span>
                {reviewCount !== undefined && reviewCount > 0 && (
                  <span className="tabular font-medium text-ink-muted">
                    ({reviewCount})
                  </span>
                )}
              </span>
            )}
            {rating !== undefined && rating > 0 && duration && (
              <span
                aria-hidden="true"
                className="size-1 rounded-full bg-border"
              />
            )}
            {duration && (
              <span className="flex items-center gap-1">
                <Clock className="size-3" aria-hidden="true" />
                <span className="tabular">{duration}</span>
              </span>
            )}
          </div>
        ) : null}

        {/* The whole card already links to the detail page, but nothing SAID
            so - a customer reading the grid saw only "Add" and had no reason
            to think there was more to read. This states it. It is a real
            anchor rather than a cue, so it works on a keyboard too. */}
        <Link
          href={`/service/${id}`}
          className={cn(
            "mt-2 flex w-fit items-center gap-1 rounded-control text-caption font-bold text-action",
            "transition-colors duration-fast hover:text-action-hover",
            "focus-visible:outline-none focus-visible:outline-focus",
          )}
        >
          View details
          <ChevronRight className="size-3" aria-hidden="true" />
        </Link>

        {/* The money, below a dashed rule. Pinned with mt-auto so every card in
            a row puts its price on the same line however long the name ran. */}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-dashed border-border pt-3">
          <span className="min-w-0">
            <span className="block text-caption text-ink-muted">from</span>
            <span className="cfc-price">{formatCurrency(fromPricePaise)}</span>
          </span>

          {inCart ? (
            <span className="flex h-touch shrink-0 items-center gap-1 rounded-control border border-action-line bg-surface px-1">
              <button
                type="button"
                aria-label={`Remove one ${name}`}
                onClick={() => setQuantity(id, quantity - 1)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-control text-action",
                  "transition-colors duration-fast hover:bg-action-subtle",
                  "focus-visible:outline-none focus-visible:outline-focus",
                )}
              >
                <Minus className="size-4" aria-hidden="true" />
              </button>
              <span
                className="tabular w-5 text-center text-small font-bold text-ink"
                aria-live="polite"
              >
                {quantity}
              </span>
              <button
                type="button"
                aria-label={`Add another ${name}`}
                onClick={() => setQuantity(id, quantity + 1)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-control text-action",
                  "transition-colors duration-fast hover:bg-action-subtle",
                  "focus-visible:outline-none focus-visible:outline-focus",
                )}
              >
                <Plus className="size-4" aria-hidden="true" />
              </button>
            </span>
          ) : (
            // Default `md` (44px), not `sm`: `sm` paints at 32px, which is
            // right in a dense admin table and wrong beside a 17px price under
            // a thumb - and it is below the 44px touch minimum.
            <Button
              variant="primary"
              className="shrink-0"
              onClick={() =>
                add({
                  serviceId: id,
                  serviceName: name,
                  fromPricePaise,
                  // The cart renders this; without it every line showed an
                  // empty grey square. The card already HAS the photograph
                  // on screen - it simply was not carried into the basket.
                  ...(imageUrl ? { imageUrl } : {}),
                })
              }
            >
              <Plus className="size-4" />
              Add
            </Button>
          )}
        </div>
      </div>
    </article>
  );
}
