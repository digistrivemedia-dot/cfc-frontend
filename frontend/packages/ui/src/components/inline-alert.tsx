import * as React from "react";
import { CircleAlert, CircleCheck, Info, TriangleAlert, X } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "../primitives/button";

/**
 * A message that stays on the page.
 *
 * There was no inline messaging component at all — every non-blocking message
 * had to be a toast, which is exactly wrong for anything the operator needs to
 * still be able to read after four seconds. "This booking was force-completed
 * by an admin", "GST filing is due in 3 days", "2 documents were rejected" all
 * belong on the page, next to the thing they are about.
 *
 * Tones follow the same rationing as status badges: `info` is neutral and
 * carries no colour beyond a tinted icon, because most messages are not urgent.
 */
const TONE = {
  info: {
    icon: Info,
    frame: "border-border bg-canvas",
    accent: "text-ink-muted",
  },
  /**
   * Something completed successfully and the customer should keep reading it —
   * "advance paid, balance due on completion" is the case this exists for.
   * Rationed the same way as the badges: green means done, not merely good.
   */
  live: {
    icon: CircleCheck,
    frame: "border-live-line bg-live-subtle",
    accent: "text-live-ink",
  },
  clock: {
    icon: TriangleAlert,
    frame: "border-clock-line bg-clock-subtle",
    accent: "text-clock-ink",
  },
  critical: {
    icon: CircleAlert,
    frame: "border-critical-line bg-critical-subtle",
    accent: "text-critical-ink",
  },
} as const;

export interface InlineAlertProps {
  tone?: keyof typeof TONE;
  title?: React.ReactNode | undefined;
  children?: React.ReactNode;
  /** A single inline action — "Review documents", "File now". */
  action?: React.ReactNode | undefined;
  onDismiss?: (() => void) | undefined;
  className?: string | undefined;
}

export function InlineAlert({
  tone = "info",
  title,
  children,
  action,
  onDismiss,
  className,
}: InlineAlertProps) {
  const { icon: Icon, frame, accent } = TONE[tone];

  return (
    <div
      // Only a critical message interrupts a screen reader mid-task. An
      // informational note is read when reached, like any other content.
      role={tone === "critical" ? "alert" : "status"}
      className={cn(
        "flex items-start gap-3 rounded-card border p-3 text-small",
        frame,
        className,
      )}
    >
      <Icon className={cn("mt-px size-4 shrink-0", accent)} aria-hidden="true" />

      <div className="min-w-0 flex-1 space-y-1">
        {title && <p className={cn("font-semibold", accent)}>{title}</p>}
        {children && <div className="text-ink-muted">{children}</div>}
      </div>

      {action && <div className="shrink-0">{action}</div>}

      {onDismiss && (
        <Button
          variant="ghost"
          size="icon"
          onClick={onDismiss}
          aria-label="Dismiss"
          className="-my-1 -mr-1 shrink-0"
        >
          <X />
        </Button>
      )}
    </div>
  );
}
