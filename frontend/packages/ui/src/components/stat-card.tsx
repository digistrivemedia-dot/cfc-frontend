"use client";

import * as React from "react";
import { ArrowRight, TrendingDown, TrendingUp } from "lucide-react";
import { cn } from "../lib/cn";
import { Skeleton } from "../primitives/skeleton";

/**
 * The KPI tile.
 *
 * Every dashboard and section header in the panel opens with a row of these,
 * and each one was previously hand-built per screen. That is how a figure ends
 * up styled three ways and a delta ends up green on one screen and grey on
 * another.
 *
 * Direction is not the same as sentiment. Pending payouts rising is not good
 * news; cancellations falling is not bad news. The caller says what a rise
 * MEANS through `goodWhen`, and the component colours accordingly — or leaves
 * it neutral when a movement carries no verdict, which is the honest default
 * for most operational counts.
 */

export interface StatCardProps {
  label: string;
  /** Formatted for display — ₹48,920, 9, 4.8. Never a raw number to format here. */
  value: React.ReactNode;
  /** Undefined renders the loading skeleton. */
  loading?: boolean | undefined;
  icon?: React.ReactNode | undefined;
  /** Sub-line under the value: "across 7 pros", "oldest 3 days". */
  hint?: React.ReactNode | undefined;
  delta?:
    | {
        /** Formatted, e.g. "2" or "12%". The arrow supplies the sign. */
        value: string;
        direction: "up" | "down" | "flat";
        /** "vs. yesterday", "this week". */
        period?: string | undefined;
      }
    | undefined;
  /**
   * Whether an upward movement is good, bad, or neither. Neutral is the
   * default because most operational figures have no inherent direction.
   */
  goodWhen?: "up" | "down" | "neither" | undefined;
  /** Values for an inline sparkline, oldest first. */
  series?: readonly number[] | undefined;
  /**
   * Makes the whole tile a link to the screen that explains the number.
   *
   * The app supplies its own anchor — `@cfc/ui` has no `next` dependency and
   * should not grow one for a single component. Pass
   * `linkAs={(p) => <Link {...p} />}` from a Next app.
   */
  href?: string | undefined;
  linkAs?:
    | ((props: {
        href: string;
        className: string;
        children: React.ReactNode;
      }) => React.ReactElement)
    | undefined;
  className?: string | undefined;
}

export function StatCard({
  label,
  value,
  loading = false,
  icon,
  hint,
  delta,
  goodWhen = "neither",
  series,
  href,
  linkAs,
  className,
}: StatCardProps) {
  const tone =
    delta === undefined || delta.direction === "flat" || goodWhen === "neither"
      ? "neutral"
      : (delta.direction === "up") === (goodWhen === "up")
        ? "good"
        : "bad";

  const inner = (
    <>
      <div className="flex items-center gap-2 text-ink-muted">
        {icon && (
          <span
            className="flex size-4 items-center justify-center [&_svg]:size-4"
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        <span className="text-caption font-medium">{label}</span>
      </div>

      <div className="mt-2 flex items-end justify-between gap-3">
        <div className="min-w-0">
          {loading ? (
            <Skeleton className="h-8 w-line-xs" />
          ) : (
            <p className="tabular text-title font-semibold leading-none text-ink">
              {value}
            </p>
          )}

          {(delta ?? hint) && !loading && (
            <p className="mt-2 flex items-center gap-1 text-caption">
              {delta && (
                <span
                  className={cn(
                    "tabular inline-flex items-center gap-1 font-medium",
                    tone === "good" && "text-live-ink",
                    tone === "bad" && "text-critical-ink",
                    tone === "neutral" && "text-ink-muted",
                  )}
                >
                  {delta.direction === "up" && (
                    <TrendingUp className="size-3" aria-hidden="true" />
                  )}
                  {delta.direction === "down" && (
                    <TrendingDown className="size-3" aria-hidden="true" />
                  )}
                  {delta.value}
                </span>
              )}
              {delta?.period && (
                <span className="text-ink-faint">{delta.period}</span>
              )}
              {hint && <span className="text-ink-faint">{hint}</span>}
            </p>
          )}
        </div>

        {series && series.length > 1 && !loading && (
          <Sparkline
            values={series}
            tone={tone}
            className="shrink-0 self-center"
          />
        )}
      </div>
    </>
  );

  const base = cn(
    "rounded-card border border-border bg-surface p-4 shadow-sm",
    className,
  );

  if (href === undefined || linkAs === undefined) {
    return <div className={base}>{inner}</div>;
  }

  return linkAs({
    href,
    className: cn(
      base,
      "group block transition-colors duration-fast hover:border-action-line hover:bg-action-subtle",
    ),
    children: (
      <>
        {inner}
        <span className="mt-2 inline-flex items-center gap-1 text-caption font-medium text-action">
          View
          <ArrowRight
            className="size-3 transition-transform duration-fast group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </>
    ),
  });
}

/**
 * Inline trend line. Hand-drawn SVG rather than a chart library — a sparkline
 * has no axes, no legend and no tooltip, so a charting dependency would add
 * weight for nothing.
 *
 * Decorative by design: it shows shape, not values. The figure beside it is the
 * accessible content, so this is aria-hidden rather than given a label that
 * would read out a meaningless list of numbers.
 */
export function Sparkline({
  values,
  tone = "neutral",
  width = 52,
  height = 20,
  className,
}: {
  values: readonly number[];
  tone?: "good" | "bad" | "neutral";
  width?: number;
  height?: number;
  className?: string | undefined;
}) {
  if (values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  // A flat series would divide by zero; draw it down the middle instead.
  const span = max - min || 1;
  const pad = 2;
  const stepX = (width - pad * 2) / (values.length - 1);

  const points = values.map((v, i) => {
    const x = pad + i * stepX;
    const y = pad + (1 - (v - min) / span) * (height - pad * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  });

  const last = points[points.length - 1]?.split(",") ?? ["0", "0"];

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <polyline
        points={points.join(" ")}
        className={cn(
          tone === "good" && "stroke-live",
          tone === "bad" && "stroke-critical",
          tone === "neutral" && "stroke-ink-faint",
        )}
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* The endpoint is where the eye should land — it is the current value. */}
      <circle
        cx={last[0]}
        cy={last[1]}
        r={1.75}
        className={cn(
          tone === "good" && "fill-live",
          tone === "bad" && "fill-critical",
          tone === "neutral" && "fill-ink-faint",
        )}
      />
    </svg>
  );
}
