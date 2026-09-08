import * as React from "react";
import { cn } from "../lib/cn";

/**
 * Loading placeholder.
 *
 * A skeleton matches the real layout — same row height, same column widths —
 * so the page does not jump when data arrives. A spinner is never used in its
 * place; a spinner says "wait" while a skeleton says "here is what is coming".
 *
 * The pulse is disabled under prefers-reduced-motion by the global rule in
 * styles.css.
 */
export function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-control bg-canvas", className)}
      aria-hidden="true"
      {...props}
    />
  );
}
