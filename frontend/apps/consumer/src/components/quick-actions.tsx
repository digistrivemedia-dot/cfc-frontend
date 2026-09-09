"use client";

import * as React from "react";
import Link from "next/link";
import {
  AirVent,
  Bath,
  Cable,
  Droplets,
  Scissors,
  Stethoscope,
  PaintBucket,
  Wrench,
  Bug,
  Sofa,
  WashingMachine,
} from "lucide-react";
import type { ServiceDetail } from "@cfc/types";
import { cn } from "@cfc/ui";

/**
 * Quick-action pills for the top services.
 *
 * Six most-booked services shown as rounded pill buttons with a teal icon and
 * service name. Each links directly to the service page, skipping the category
 * browse step. Scrollable on mobile, centered row on desktop.
 */

/** Map service names to appropriate icons. */
const SERVICE_ICONS: Record<string, React.ComponentType<{ className?: string }>> = {
  "AC service & repair": AirVent,
  "Deep home cleaning": Bath,
  "Electrical repair": Cable,
  "Plumbing — tap & pipe": Droplets,
  "Salon at home — women": Scissors,
  "Nurse home care — 12 hr": Stethoscope,
  "Wall painting": PaintBucket,
  "Carpentry work": Wrench,
  "Pest control": Bug,
  "Sofa & carpet cleaning": Sofa,
  "Washing machine repair": WashingMachine,
  "Bathroom cleaning": Bath,
  "RO water purifier service": Droplets,
  "Men's grooming": Scissors,
};

/** Shorten long service names for the pill labels. */
function shortLabel(name: string): string {
  return name
    .replace(/ — .+/, "")
    .replace(/ & .+/, "")
    .replace("service", "")
    .replace("repair", "")
    .trim();
}

export function QuickActions({ services }: { services: ServiceDetail[] }) {
  // Top 6 by booking count.
  const top = React.useMemo(
    () =>
      [...services]
        .filter((s) => s.active)
        .sort((a, b) => b.bookingCount - a.bookingCount)
        .slice(0, 6),
    [services],
  );

  return (
    <div className="relative">
      <ul
        className={cn(
          /* Mobile: scrollable row */
          "flex gap-2 overflow-x-auto scrollbar-none -mx-4 px-4 pb-1",
          /* Desktop: centered wrap */
          "md:mx-0 md:flex-wrap md:justify-center md:gap-3 md:overflow-visible md:px-0",
        )}
      >
        {top.map((service) => {
          const Icon = SERVICE_ICONS[service.name] ?? Wrench;
          return (
            <li key={service.id} className="shrink-0">
              <Link
                href={`/service/${service.id}`}
                className={cn(
                  "flex items-center gap-2 rounded-full border border-border bg-surface",
                  "px-3 py-2 text-small font-medium text-ink",
                  "shadow-sm transition-all duration-fast",
                  "hover:border-action-line hover:shadow-md hover:text-action",
                )}
              >
                <span className="flex size-tile items-center justify-center rounded-full bg-action-subtle text-action"
                  style={{ width: "32px", height: "32px", minWidth: "32px" }}
                >
                  <Icon className="size-4" />
                </span>
                <span className="whitespace-nowrap">{shortLabel(service.name)}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
