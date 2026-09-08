"use client";

import * as React from "react";
import { cn } from "../lib/cn";

/**
 * Label, control, help text, and error — one shape for every form field in the
 * system. Errors are inline, next to the field, and describe the fix.
 *
 * The control is cloned so the label, the help text and the error are wired to
 * it without every caller repeating four ids by hand. That works for a single
 * element child; a fragment or a Radix composite (`<Select>` wrapping its own
 * `<SelectTrigger>`) cannot be reached this way, so those pass `htmlFor` and
 * set the id on the trigger themselves.
 */
export function FormField({
  label,
  htmlFor,
  help,
  error,
  required,
  children,
  className,
}: {
  label: string;
  htmlFor?: string | undefined;
  help?: string | undefined;
  error?: string | undefined;
  required?: boolean | undefined;
  children: React.ReactNode;
  className?: string | undefined;
}) {
  const generated = React.useId();
  const id = htmlFor ?? generated;
  const helpId = help ? `${id}-help` : undefined;
  const errorId = error ? `${id}-error` : undefined;

  return (
    <div className={cn("space-y-2", className)}>
      <label htmlFor={id} className="block text-small font-medium text-ink">
        {label}
        {required && (
          <span className="ml-1 text-critical" aria-hidden="true">
            *
          </span>
        )}
      </label>

      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<any>, {
            id,
            "aria-describedby":
              [helpId, errorId].filter(Boolean).join(" ") || undefined,
            "aria-invalid": error ? true : undefined,
            // The asterisk is decorative and hidden from assistive tech, so
            // without this a screen reader is never told the field is required
            // at all. `aria-required` rather than `required` so the browser's
            // own validation bubble does not fight the inline error.
            "aria-required": required ? true : undefined,
          })
        : children}

      {help && !error && (
        <p id={helpId} className="text-caption text-ink-muted">
          {help}
        </p>
      )}
      {error && (
        <p id={errorId} className="text-caption text-critical-ink" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
