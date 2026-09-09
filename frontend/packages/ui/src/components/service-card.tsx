import { cn } from "../lib/cn";
import { formatCurrency } from "../lib/format";
import { StarRating } from "./star-rating";

/**
 * One bookable service, as a card.
 *
 * The price is the reason this component exists. A customer scanning a row of
 * services is comparing two things — what it is and what it costs — so both
 * are given real weight and neither is truncated away. Everything else is
 * supporting detail.
 *
 * "From ₹X" is deliberate: a service has variants (a 1-ton split and a 2-ton
 * window are different jobs at different prices), so a single figure would be
 * a promise the booking screen then breaks.
 *
 * The whole card is one link. A card with a nested "Book" button gives a thumb
 * two targets for one intention, and the smaller one always wins by accident.
 */
export function ServiceCard({
  name,
  categoryName,
  fromPricePaise,
  rating,
  reviewCount,
  bookingCount,
  imageUrl,
  href,
  className,
}: {
  name: string;
  categoryName: string;
  fromPricePaise: number;
  rating?: number | undefined;
  reviewCount?: number | undefined;
  /** Drives the "N booked" line. Omitted when the count is not meaningful. */
  bookingCount?: number | undefined;
  imageUrl?: string | undefined;
  href: string;
  className?: string | undefined;
}) {
  return (
    <a
      href={href}
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-card border border-border bg-surface",
        "shadow-sm transition-all duration-base",
        "hover:border-action-line hover:shadow-md hover:-translate-y-0.5",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
        className,
      )}
    >
      <div className="relative aspect-card overflow-hidden bg-canvas">
        {imageUrl ? (
          <img
            src={imageUrl}
            alt=""
            loading="lazy"
            className="size-full object-cover transition-transform duration-base group-hover:scale-105"
          />
        ) : (
          // A tinted panel, not an emoji. A placeholder should look like a
          // missing photograph, not like a decision.
          <span className="block size-full bg-action-subtle" aria-hidden="true" />
        )}
      </div>

      <div className="flex min-w-0 flex-1 flex-col gap-1 p-3">
        <p className="text-caption font-medium text-action">{categoryName}</p>
        <p className="line-clamp-2 text-small font-semibold text-ink">{name}</p>

        {rating !== undefined && rating > 0 ? (
          <StarRating value={rating} count={reviewCount} />
        ) : (
          <span className="text-caption text-ink-faint">New</span>
        )}

        <div className="mt-auto flex items-baseline justify-between gap-2 pt-1">
          <span className="tabular text-small font-semibold text-ink">
            <span className="text-caption font-normal text-ink-muted">from </span>
            {formatCurrency(fromPricePaise)}
          </span>
          {bookingCount !== undefined && bookingCount > 0 && (
            <span className="tabular shrink-0 text-caption text-ink-faint">
              {bookingCount} booked
            </span>
          )}
        </div>
      </div>
    </a>
  );
}

