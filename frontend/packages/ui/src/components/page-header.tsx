import * as React from "react";
import { ChevronRight } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * Page header.
 *
 * Title, optional context, and the screen's actions. Detail screens in this
 * panel sit two or three levels deep — People → Pro management → Murugan V. —
 * and previously nothing on the page said so. The breadcrumb is the only thing
 * telling an operator where they are and how to get back up.
 *
 * `title` accepts a node rather than a string so a status pill can sit inline
 * with the heading, which is where it belongs on a detail screen.
 */

export interface Crumb {
  label: string;
  /** Omit on the last crumb — the current page is not a link to itself. */
  href?: string | undefined;
}

export interface PageHeaderProps {
  title: React.ReactNode;
  description?: React.ReactNode | undefined;
  /** Trail above the title. The current page should be the final entry. */
  breadcrumbs?: readonly Crumb[] | undefined;
  /**
   * Renders a crumb's link. The app supplies its own anchor — `@cfc/ui` has no
   * `next` dependency. Without this, crumbs render as plain text.
   */
  linkAs?:
    | ((props: {
        href: string;
        className: string;
        children: React.ReactNode;
      }) => React.ReactElement)
    | undefined;
  /** Small facts under the title — an ID, a joined date, a count. */
  meta?: React.ReactNode | undefined;
  /** The screen's actions. One primary at most; the rest secondary. */
  actions?: React.ReactNode | undefined;
  /** @deprecated Use `actions`. */
  action?: React.ReactNode | undefined;
  /** Tabs belonging to this screen, rendered below the header. */
  tabs?: React.ReactNode | undefined;
  className?: string | undefined;
}

export function PageHeader({
  title,
  description,
  breadcrumbs,
  linkAs,
  meta,
  actions,
  action,
  tabs,
  className,
}: PageHeaderProps) {
  const trailing = actions ?? action;

  return (
    <div className={cn("space-y-3", className)}>
      {breadcrumbs && breadcrumbs.length > 0 && (
        <nav aria-label="Breadcrumb">
          <ol className="flex flex-wrap items-center gap-1 text-caption text-ink-muted">
            {breadcrumbs.map((crumb, i) => {
              const last = i === breadcrumbs.length - 1;
              return (
                <li key={`${crumb.label}-${i}`} className="flex items-center gap-1">
                  {i > 0 && (
                    <ChevronRight
                      className="size-3 text-ink-faint"
                      aria-hidden="true"
                    />
                  )}
                  {crumb.href !== undefined && linkAs !== undefined && !last ? (
                    linkAs({
                      href: crumb.href,
                      className:
                        "rounded-pill transition-colors duration-fast hover:text-ink",
                      children: crumb.label,
                    })
                  ) : (
                    <span
                      className={cn(last && "font-medium text-ink")}
                      aria-current={last ? "page" : undefined}
                    >
                      {crumb.label}
                    </span>
                  )}
                </li>
              );
            })}
          </ol>
        </nav>
      )}

      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <h1 className="flex flex-wrap items-center gap-2 text-title font-semibold text-ink">
            {title}
          </h1>
          {description && (
            <p className="max-w-prose text-body text-ink-muted">{description}</p>
          )}
          {meta && (
            <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-caption text-ink-faint">
              {meta}
            </p>
          )}
        </div>
        {trailing && (
          <div className="flex shrink-0 flex-wrap items-center gap-2">
            {trailing}
          </div>
        )}
      </div>

      {tabs}
    </div>
  );
}
