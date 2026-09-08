"use client";

import * as React from "react";
import { cn } from "../lib/cn";

/**
 * A horizontal strip on a phone, a grid on a desktop.
 *
 * This is the single component that decides whether the consumer app reads as
 * a web application or as a phone mock stretched across a monitor. A row of
 * cards that still scrolls sideways at 1280px is the tell — there is room for
 * everything, so hiding two thirds of it behind a swipe is a mobile habit
 * carried somewhere it does not belong.
 *
 * So: scroll-snap below `md`, a real grid above it. Same markup, same
 * children, no duplicated content and nothing hidden at either width.
 *
 * `scrollbar-none` hides the bar without disabling the scroll — the cards are
 * clipped at the edge, which is the affordance that says "there is more".
 */
export function SnapScroller({
  children,
  /** Columns once it becomes a grid. Below `md` this has no effect. */
  columns = 3,
  /** Card width on the scrolling axis. Ignored in grid mode. */
  itemWidth = "service",
  className,
  "aria-label": ariaLabel,
}: {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  itemWidth?: "service" | "category";
  className?: string | undefined;
  "aria-label"?: string | undefined;
}) {
  return (
    <ul
      aria-label={ariaLabel}
      className={cn(
        // Phone: one row, snapping, bleeding to the screen edge so a card is
        // visibly cut off rather than ending in tidy dead space.
        "flex snap-x snap-mandatory gap-3 overflow-x-auto scrollbar-none",
        "-mx-4 px-4 pb-1",
        // Desktop: a grid, no scrolling, no negative margin.
        "md:mx-0 md:grid md:gap-4 md:overflow-visible md:px-0",
        columns === 2 && "md:grid-cols-2",
        columns === 3 && "md:grid-cols-3",
        columns === 4 && "md:grid-cols-2 lg:grid-cols-4",
        className,
      )}
    >
      {React.Children.map(children, (child, i) => (
        <li
          key={i}
          className={cn(
            "shrink-0 snap-start md:w-full md:shrink",
            itemWidth === "service" ? "w-card-service" : "w-card-category",
          )}
        >
          {child}
        </li>
      ))}
    </ul>
  );
}
