"use client";

import * as React from "react";
import { cn } from "@cfc/ui";

/**
 * The one decision a pro screen ends in.
 *
 * Almost every screen in this app resolves to a single action — Accept, I'm
 * Here, Complete Job, Submit for Approval, Request Payout. Where that control
 * lives is a layout decision, and making it once here is what stops 20 screens
 * each inventing their own answer:
 *
 *   Mobile (`< lg`)  — fixed to the bottom edge, above the tab strip. A pro
 *                      holding a phone one-handed reaches the bottom, and the
 *                      action must not require scrolling to find.
 *   Desktop (`lg+`)  — a sticky card docked to the right of the content. A
 *                      1280px screen with a button glued to the window's bottom
 *                      edge is a phone layout wearing a desktop, which is the
 *                      exact failure this app is meant to avoid.
 *
 * ## How a screen uses it
 *
 * ```tsx
 * <ProActionLayout
 *   action={
 *     <ProAction>
 *       <SummaryRow … />
 *       <Button size="lg">Complete job</Button>
 *     </ProAction>
 *   }
 * >
 *   …page content…
 * </ProActionLayout>
 * ```
 *
 * `ProActionLayout` owns the two-column grid and the mobile bottom padding.
 * `ProAction` owns the panel's own chrome in each mode. They are separate
 * because the layout must wrap the content, and the panel must be able to sit
 * inside a `<form>` the content also lives in.
 */

/**
 * Content left, action docked right at `lg:`.
 *
 * The grid is a plain two-column split rather than a container query, because
 * this is the page's own width — there is no parent that could be narrower
 * than the viewport. (The opposite mistake, using a viewport query inside a
 * drawer, is what crushed the admin support detail to 40px.)
 */
export function ProActionLayout({
  children,
  action,
  className,
}: {
  children: React.ReactNode;
  action: React.ReactNode;
  className?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "mx-auto max-w-screen-xl px-4 md:px-6 lg:px-8",
        // The mobile action bar is fixed, so the last of the content would sit
        // underneath it without this. `action-bar` is 88px: a 56px button plus
        // its padding. The tab strip's own clearance is added by the layout.
        "pb-action-bar lg:pb-12",
        // `grid-cols-action` is a named template in the preset. Written as an
        // arbitrary value it would both trip the lint rule and duplicate the
        // panel width in every screen that docks something.
        "lg:grid lg:grid-cols-action lg:items-start lg:gap-8",
        className,
      )}
    >
      <div className="min-w-0">{children}</div>
      {action}
    </div>
  );
}

/**
 * The action panel itself.
 *
 * One element that is a fixed bottom bar below `lg` and a sticky card at and
 * above it. Rendering two copies and hiding one would double every button in
 * the accessibility tree and, worse, submit twice inside a form.
 */
export function ProAction({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string | undefined;
}) {
  return (
    <div
      // `env(safe-area-inset-bottom)` clears the iOS home indicator. A device
      // value, so inline rather than a token — and it must not apply in the
      // docked desktop mode, where the panel is not at the viewport edge.
      className={cn(
        // Mobile: fixed above the tab strip, full width, its own top border.
        "fixed inset-x-0 bottom-tab-bar z-sticky border-t border-border bg-surface p-4",
        // Desktop: leaves the viewport edge and becomes a card beside the
        // content, sticking below the top of the scroll container.
        "lg:sticky lg:inset-x-auto lg:bottom-auto lg:top-6 lg:z-auto",
        "lg:rounded-card lg:border lg:shadow-sm",
        className,
      )}
    >
      {children}
    </div>
  );
}

/**
 * A labelled figure inside the action panel — "You earn", "Total", "Balance".
 *
 * `emphasis` is the one line a pro actually reads before pressing the button.
 * Money is `tabular` so digits do not shift width, and never smaller than
 * `text-body`: this app is read at arm's length, outdoors, in daylight.
 */
export function ProActionSummary({
  label,
  value,
  hint,
  emphasis = false,
}: {
  label: string;
  value: string;
  hint?: string | undefined;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-baseline justify-between gap-3">
      <span className="min-w-0">
        <span
          className={cn(
            "block truncate",
            emphasis
              ? "text-small font-medium text-ink"
              : "text-small text-ink-muted",
          )}
        >
          {label}
        </span>
        {hint !== undefined && (
          <span className="mt-px block text-caption text-ink-muted">
            {hint}
          </span>
        )}
      </span>
      <span
        className={cn(
          "shrink-0 tabular",
          emphasis
            ? "text-title font-semibold text-ink"
            : "text-body font-medium text-ink",
        )}
      >
        {value}
      </span>
    </div>
  );
}
