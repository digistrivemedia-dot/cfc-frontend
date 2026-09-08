"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "../lib/cn";

/**
 * Two heights, and the reason matters.
 *
 * `md` (44px) is the touch target consumer and pro must never go below. `sm`
 * (32px) exists so an admin filter toolbar can pair an input with
 * `Button size="sm"` and have them share a baseline — previously the input was
 * locked at 44px and every toolbar in the panel was visually mismatched, worked
 * around with a `className="h-8"` override that also had to restate the type
 * size.
 */
const inputVariants = cva(
  [
    "w-full rounded-control border bg-surface text-ink",
    "transition-colors duration-fast ease-out",
    "placeholder:text-ink-faint",
    "border-border-strong",
    // An invalid field must look invalid. `aria-invalid` was already being set
    // by FormField, but nothing styled it, so an error message appeared under a
    // field that looked untouched.
    "aria-[invalid=true]:border-critical",
    "disabled:cursor-not-allowed disabled:border-border disabled:bg-disabled",
    "disabled:text-disabled-ink disabled:placeholder:text-disabled-ink",
  ],
  {
    variants: {
      inputSize: {
        sm: "h-8 px-2 text-small",
        md: "h-touch px-3 text-body",
      },
    },
    defaultVariants: { inputSize: "md" },
  },
);

export interface InputProps
  extends Omit<React.InputHTMLAttributes<HTMLInputElement>, "size">,
    VariantProps<typeof inputVariants> {
  /** Renders a leading icon inside the field. */
  icon?: React.ReactNode | undefined;
  /** Renders after the field — a unit, a hint, a small button. */
  trailing?: React.ReactNode | undefined;
  /**
   * Shows a clear button when the field has a value. Controlled inputs only —
   * the parent owns the value, so clearing is the parent's to perform.
   */
  onClear?: (() => void) | undefined;
}

/**
 * Text input.
 *
 * Placeholders show a real valid example, never the field label repeated —
 * "Search by booking ID, customer, or phone", not "Search".
 */
export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    {
      className,
      type = "text",
      icon,
      trailing,
      onClear,
      inputSize,
      value,
      ...props
    },
    ref,
  ) => {
    const small = inputSize === "sm";
    const showClear = onClear !== undefined && value !== undefined && value !== "";
    const hasTrailing = trailing !== undefined || showClear;

    const field = (
      <input
        ref={ref}
        type={type}
        value={value}
        className={cn(
          inputVariants({ inputSize }),
          // 32px either side: the icon starts at 8 (sm) or 12 (md) and is
          // 16 wide, so anything less than 32 puts the glyph under the text.
          icon && "pl-8",
          hasTrailing && "pr-8",
          className,
        )}
        {...props}
      />
    );

    if (!icon && !hasTrailing) return field;

    return (
      <div className="relative">
        {icon && (
          <span
            className={cn(
              "pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-faint",
              small ? "left-2 [&_svg]:size-4" : "left-3 [&_svg]:size-4",
            )}
            aria-hidden="true"
          >
            {icon}
          </span>
        )}
        {field}
        {showClear ? (
          <button
            type="button"
            onClick={onClear}
            aria-label="Clear"
            className={cn(
              "absolute top-1/2 -translate-y-1/2 rounded-pill text-ink-faint",
              "transition-colors duration-fast hover:text-ink",
              small ? "right-2 [&_svg]:size-4" : "right-3 [&_svg]:size-4",
            )}
          >
            <X />
          </button>
        ) : (
          trailing && (
            <span
              className={cn(
                // The wrapper itself never eats a click — a unit or a hint
                // should not block the field. Anything interactive passed in
                // here (a reveal toggle, a small button) opts back in for
                // itself.
                "pointer-events-none absolute top-1/2 -translate-y-1/2 text-ink-faint",
                "[&_button]:pointer-events-auto [&_a]:pointer-events-auto",
                small ? "right-2 text-small" : "right-3 text-body",
              )}
            >
              {trailing}
            </span>
          )
        )}
      </div>
    );
  },
);
Input.displayName = "Input";

export { inputVariants };
