import Link from "next/link";
import { cn } from "@cfc/ui";

/**
 * One sub-category, as a photographic tile.
 *
 * Sub-categories are what a customer actually wants — "Electrical & AC",
 * "Plumbing", "Beauty" — as opposed to the five admin-shaped categories
 * ("Home & Maintenance", "Business & Others") which are storage buckets, not
 * intentions. Nobody wakes up needing *home and maintenance*; they need the
 * AC fixed.
 *
 * The tile is a photograph rather than an icon on a gradient. A customer
 * deciding between "Cleaning" and "Pest control" is picking a real-world job,
 * and a photograph of that job is read faster than a wrench glyph. The images
 * already exist in /public; the previous home screen shipped without using
 * a single one of them.
 */
export function SubCategoryTile({
  name,
  serviceCount,
  imageUrl,
  href,
}: {
  name: string;
  /** Omitted when the count would read as noise (a single service). */
  serviceCount?: number | undefined;
  imageUrl: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className={cn(
        "group relative flex aspect-card flex-col justify-end overflow-hidden rounded-card",
        "border border-border bg-structure shadow-sm",
        "transition-all duration-base",
        "hover:border-action-line hover:shadow-md",
        "focus-visible:outline-none focus-visible:outline-focus",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={imageUrl}
        alt=""
        loading="lazy"
        className="absolute inset-0 size-full object-cover transition-transform duration-base group-hover:scale-105"
      />

      {/* Legibility scrim. A photograph alone cannot guarantee contrast for
          the label, and the label is the part that has to be readable. */}
      <div
        aria-hidden="true"
        className="absolute inset-0"
        style={{
          background:
            "linear-gradient(to top, rgba(23,26,60,0.88) 0%, rgba(23,26,60,0.35) 40%, rgba(23,26,60,0) 72%)",
        }}
      />

      <div className="relative p-3">
        <p className="text-small font-semibold leading-tight text-on-structure">
          {name}
        </p>
        {serviceCount !== undefined && serviceCount > 1 && (
          <p className="mt-px text-caption text-on-structure-muted">
            {serviceCount} services
          </p>
        )}
      </div>
    </Link>
  );
}
