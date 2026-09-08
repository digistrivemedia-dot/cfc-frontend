"use client";

import * as React from "react";
import { cn } from "../lib/cn";
import { Button } from "../primitives/button";

/**
 * The add/edit screen shell.
 *
 * A single-column form in a card, with a sticky action bar — used by every
 * "Add / edit X" screen (category, sub-category, service, coupon...). The
 * fields differ per screen; the frame, spacing, and save/cancel behaviour do
 * not.
 */
export function FormShell({
  title,
  description,
  children,
  onSave,
  onCancel,
  saveLabel = "Save",
  saving,
  className,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  /**
   * Required. `FormShell` renders a real `<form>` with `type="submit"` on the
   * save button — omitting this leaves that button doing nothing on click,
   * the same failure a screen that never called `onSave` shipped with once
   * already. If there is genuinely nothing to persist yet, pass a handler
   * that shows a toast saying so rather than leaving this out.
   */
  onSave: () => void;
  onCancel?: () => void;
  saveLabel?: string;
  saving?: boolean;
  className?: string;
}) {
  return (
    <form
      className={cn("space-y-4", className)}
      onSubmit={(e) => {
        e.preventDefault();
        onSave();
      }}
    >
      <div>
        <h1 className="text-title font-semibold text-ink">{title}</h1>
        {description && <p className="mt-1 text-body text-ink-muted">{description}</p>}
      </div>

      <div className="max-w-prose space-y-4 rounded-card border border-border bg-surface p-4">
        {children}
      </div>

      <div className="flex justify-end gap-2">
        {onCancel && (
          <Button variant="secondary" onClick={onCancel} type="button">
            Cancel
          </Button>
        )}
        <Button variant="primary" disabled={saving} type="submit">
          {saving ? "Saving…" : saveLabel}
        </Button>
      </div>
    </form>
  );
}
