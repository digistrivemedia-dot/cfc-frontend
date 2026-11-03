"use client";

import * as React from "react";
import { Plus, X } from "lucide-react";
import { cn } from "../lib/cn";
import { Button } from "../primitives/button";
import { Input } from "../primitives/input";

/**
 * An editable list of short strings, as removable chips plus an add box.
 *
 * Built because three screens need the same control and were going to grow
 * three versions of it: the admin's service areas, the admin's serviced
 * pincodes, and the pro's own pincodes.
 *
 * ## Validation belongs to the caller
 *
 * A pincode and an area name have nothing in common except being short
 * strings, so `validate` is passed in and returns the reason a value is
 * refused. Returning a *reason* rather than a boolean is deliberate: "that is
 * not a six-digit pincode" tells someone what to do, and a silently ignored
 * keystroke does not.
 *
 * ## Duplicates are refused, not deduplicated
 *
 * Quietly dropping a repeat looks identical to the control being broken. It
 * says so instead.
 */
export interface ChipEditorProps {
  values: string[];
  onChange: (next: string[]) => void;
  /** Placeholder for the add box — "620006", "Srirangam". */
  placeholder?: string | undefined;
  /** Returns an error message, or null when the value is acceptable. */
  validate?: ((value: string) => string | null) | undefined;
  /** Shown instead of the chips when the list is empty. */
  emptyText?: string | undefined;
  /** Normalises before storing — trimming, upper-casing. */
  normalise?: ((value: string) => string) | undefined;
  disabled?: boolean | undefined;
  /** Labels the add box for screen readers. */
  label?: string | undefined;
  className?: string | undefined;
}

export function ChipEditor({
  values,
  onChange,
  placeholder,
  validate,
  emptyText = "Nothing added yet.",
  normalise = (v) => v.trim(),
  disabled = false,
  label = "Add an item",
  className,
}: ChipEditorProps) {
  const [draft, setDraft] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const add = () => {
    const value = normalise(draft);
    if (value === "") return;

    const reason = validate?.(value) ?? null;
    if (reason !== null) {
      setError(reason);
      return;
    }
    if (values.includes(value)) {
      setError(`${value} is already in the list.`);
      return;
    }

    onChange([...values, value]);
    setDraft("");
    setError(null);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {values.length === 0 ? (
        <p className="text-caption text-ink-muted">{emptyText}</p>
      ) : (
        <ul className="flex flex-wrap gap-2">
          {values.map((value) => (
            <li key={value}>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-pill border border-border",
                  "bg-surface py-1 pl-3 pr-1 text-caption text-ink",
                )}
              >
                {value}
                <button
                  type="button"
                  disabled={disabled}
                  onClick={() => onChange(values.filter((v) => v !== value))}
                  aria-label={`Remove ${value}`}
                  className={cn(
                    "rounded-pill p-1 text-ink-muted transition-colors duration-fast",
                    "hover:bg-critical-subtle hover:text-critical-ink",
                    "disabled:cursor-not-allowed disabled:opacity-60",
                  )}
                >
                  <X className="size-3" aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex items-start gap-2">
        <div className="min-w-0 flex-1">
          <Input
            value={draft}
            onChange={(e) => {
              setDraft(e.target.value);
              if (error !== null) setError(null);
            }}
            // Enter adds, and never submits a surrounding form — which would
            // save the page while the customer was still adding to the list.
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                add();
              }
            }}
            placeholder={placeholder}
            aria-label={label}
            disabled={disabled}
            {...(error !== null ? { "aria-invalid": true } : {})}
          />
          {error !== null && (
            <p className="mt-1 text-caption text-critical-ink">{error}</p>
          )}
        </div>
        <Button
          type="button"
          variant="secondary"
          onClick={add}
          disabled={disabled || normalise(draft) === ""}
        >
          <Plus />
          Add
        </Button>
      </div>
    </div>
  );
}

/** Six digits, not starting zero. The shape of an Indian pincode. */
export function validatePincode(value: string): string | null {
  return /^[1-9]\d{5}$/.test(value)
    ? null
    : "A pincode is six digits and does not start with zero.";
}
