import * as React from "react";
import { Loader2, SearchX, ShieldOff } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "../primitives/button";

/**
 * Empty, no-results, loading, error and forbidden states.
 *
 * An empty state is an invitation, not an apology. It names the space and gives
 * an action. "Nothing here yet" is never acceptable copy on its own.
 *
 * Empty-because-new and empty-because-filtered are different situations and get
 * different components. Telling someone "no pros have registered yet" when they
 * have simply typed a name that matches nothing is actively misleading, and
 * every list screen was making that mistake with one shared EmptyState.
 *
 * An error state says what happened and what to do. No apologies, no raw
 * exception text.
 */

interface StateProps {
  icon?: React.ReactNode | undefined;
  title: string;
  description?: string | undefined;
  action?: { label: string; onClick: () => void } | undefined;
  /** A quieter second action — "Clear filters" beside "Try again". */
  secondaryAction?: { label: string; onClick: () => void } | undefined;
  className?: string | undefined;
}

function StateFrame({
  icon,
  iconClassName,
  title,
  description,
  action,
  secondaryAction,
  className,
  ...rest
}: StateProps & {
  iconClassName: string;
} & React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
      {...rest}
    >
      {icon && (
        <span
          className={cn(
            "flex size-12 items-center justify-center rounded-full [&_svg]:size-6",
            iconClassName,
          )}
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <div className="space-y-1">
        <p className="text-heading font-semibold text-ink">{title}</p>
        {description && (
          <p className="mx-auto max-w-prose text-body text-ink-muted">
            {description}
          </p>
        )}
      </div>
      {(action ?? secondaryAction) && (
        <div className="flex flex-wrap items-center justify-center gap-2">
          {action && (
            <Button variant="secondary" size="sm" onClick={action.onClick}>
              {action.label}
            </Button>
          )}
          {secondaryAction && (
            <Button variant="ghost" size="sm" onClick={secondaryAction.onClick}>
              {secondaryAction.label}
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

/** Nothing exists yet. The space is new, not filtered. */
export function EmptyState(props: StateProps) {
  return <StateFrame {...props} iconClassName="bg-canvas text-ink-muted" />;
}

/**
 * Records exist, but none match the current filters.
 *
 * Always offers a way back out — an operator who has narrowed themselves into
 * an empty list needs the escape hatch in front of them, not in the toolbar
 * they have already scrolled past.
 */
export function NoResultsState({
  title = "No matches",
  description = "Try a different search, or widen the filters.",
  onClearFilters,
  className,
}: {
  title?: string;
  description?: string;
  onClearFilters?: (() => void) | undefined;
  className?: string | undefined;
}) {
  return (
    <StateFrame
      icon={<SearchX />}
      iconClassName="bg-canvas text-ink-muted"
      title={title}
      description={description}
      {...(onClearFilters
        ? { action: { label: "Clear filters", onClick: onClearFilters } }
        : {})}
      {...(className ? { className } : {})}
    />
  );
}

export function ErrorState(props: StateProps) {
  return (
    <StateFrame
      {...props}
      iconClassName="bg-critical-subtle text-critical"
      role="alert"
    />
  );
}

/**
 * The record or screen exists, but this actor may not see it.
 *
 * Deliberately not an error — nothing went wrong, and telling someone their
 * permissions are insufficient is different from telling them the server
 * failed. Names the role gate and who to ask.
 */
export function ForbiddenState({
  title = "You do not have access to this",
  description = "This area is limited to admin roles. Ask a super admin if you need access.",
  className,
}: {
  title?: string;
  description?: string;
  className?: string | undefined;
}) {
  return (
    <StateFrame
      icon={<ShieldOff />}
      iconClassName="bg-canvas text-ink-muted"
      title={title}
      description={description}
      {...(className ? { className } : {})}
    />
  );
}

/**
 * A spinner with a label, for a whole panel that has no skeleton shape to show.
 *
 * Prefer a skeleton wherever the eventual layout is known — a skeleton tells
 * someone what is coming, a spinner only tells them to wait.
 */
export function LoadingState({
  label = "Loading",
  className,
}: {
  label?: string;
  className?: string | undefined;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-3 px-6 py-12 text-center",
        className,
      )}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="size-6 animate-spin text-ink-faint" aria-hidden="true" />
      <p className="text-body text-ink-muted">{label}</p>
    </div>
  );
}
