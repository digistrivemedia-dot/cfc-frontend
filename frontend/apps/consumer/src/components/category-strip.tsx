"use client";

import * as React from "react";
import {
  Bug,
  Hammer,
  LayoutGrid,
  PaintRoller,
  Plug,
  Refrigerator,
  Scissors,
  Sparkles,
  Stethoscope,
  Wrench,
  type LucideIcon,
} from "lucide-react";
import { cn } from "@cfc/ui";

/**
 * The category strip.
 *
 * Pinned under the header for the whole page. This is the spine of a services
 * marketplace: whatever a customer has scrolled to, the way to jump to another
 * kind of work is always in the same place, one click away. The previous
 * version put a chip row two thousand pixels down inside one section, where it
 * filtered that section alone and was invisible from anywhere else.
 *
 * Filtering happens in place rather than by navigation. A customer narrowing to
 * "Cleaning" is still browsing, not committing, and a page load between two
 * glances is a page load too many.
 *
 * Icons rather than photographs: at this size a photograph is a smudge, and the
 * strip has to stay short enough to leave the page room to breathe.
 */

const ICONS: Record<string, LucideIcon> = {
  "Electrical & AC": Plug,
  Cleaning: Sparkles,
  Plumbing: Wrench,
  "Pest control": Bug,
  Appliance: Refrigerator,
  Carpentry: Hammer,
  Painting: PaintRoller,
  Water: Wrench,
  Beauty: Scissors,
  Nursing: Stethoscope,
};

export interface StripItem {
  name: string;
  count: number;
}

export function CategoryStrip({
  items,
  active,
  onChange,
}: {
  items: StripItem[];
  /** Null means "All". */
  active: string | null;
  onChange: (next: string | null) => void;
}) {
  return (
    <div
      /**
       * Sticks directly beneath whichever header is on screen.
       *
       * Mobile: `--cfc-mobile-bar`, published by `ConsumerMobileTopBar`, whose
       * height is a brand row plus a search-and-area row and therefore not a
       * constant. This used to be `top-0` — the same offset as the header
       * itself — so on a phone the strip slid under the header and disappeared.
       * The fallback keeps it sane for the frame before the measurement lands.
       *
       * Desktop: `md:top-bar-tall`, NOT `md:top-bar-lg`. The inset token is
       * named `bar-tall` precisely because a utility ending in a breakpoint
       * name is ambiguous to Tailwind's parser and silently generates nothing,
       * which is what left this pinned at `top-0` on desktop too.
       */
      style={{ top: "var(--cfc-mobile-bar, 104px)" }}
      className={cn(
        "sticky z-sticky border-b border-border bg-surface",
        // From `md` the mobile header is gone and the desktop one is a fixed
        // 64px, so the token takes over from the measured value.
        "md:!top-bar-tall",
        // A shadow only once it is pinned would need a scroll listener; a
        // hairline border reads as attached at every position instead.
      )}
    >
      <div className="mx-auto max-w-screen-xl px-4 md:px-6 lg:px-8">
        <div
          role="tablist"
          aria-label="Filter by kind of service"
          className="-mx-4 flex gap-2 overflow-x-auto px-4 py-3 scrollbar-none md:mx-0 md:px-0"
        >
          <Chip
            icon={LayoutGrid}
            label="All services"
            active={active === null}
            onClick={() => onChange(null)}
          />
          {items.map(({ name, count }) => (
            <Chip
              key={name}
              icon={ICONS[name] ?? Wrench}
              label={name}
              count={count}
              active={active === name}
              onClick={() => onChange(active === name ? null : name)}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

function Chip({
  icon: Icon,
  label,
  count,
  active,
  onClick,
}: {
  icon: LucideIcon;
  label: string;
  count?: number | undefined;
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
        "flex h-field shrink-0 items-center gap-2 rounded-pill border px-4",
        "text-small font-medium",
        "transition-colors duration-fast",
        "focus-visible:outline-none focus-visible:outline-focus",
        active
          ? "border-action bg-action text-on-action"
          : "border-border bg-surface text-ink hover:border-action-line hover:bg-action-subtle hover:text-action",
      )}
    >
      <Icon className="size-4 shrink-0" aria-hidden="true" />
      {label}
      {count !== undefined && (
        <span
          className={cn(
            "tabular text-caption",
            active ? "text-on-action" : "text-ink-faint",
          )}
        >
          {count}
        </span>
      )}
    </button>
  );
}
