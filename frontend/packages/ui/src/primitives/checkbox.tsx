"use client";

import * as React from "react";
import * as CheckboxPrimitive from "@radix-ui/react-checkbox";
import { Check, Minus } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * The indeterminate state is not decorative — a select-all header checkbox in a
 * table is wrong without it. Pass `checked="indeterminate"` when some but not
 * all rows are selected; Radix sets `data-state="indeterminate"` and the dash
 * renders instead of the tick.
 */
export const Checkbox = React.forwardRef<
  React.ElementRef<typeof CheckboxPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof CheckboxPrimitive.Root>
>(({ className, ...props }, ref) => (
  <CheckboxPrimitive.Root
    ref={ref}
    className={cn(
      "flex size-5 shrink-0 items-center justify-center",
      "rounded-control border border-border-strong bg-surface",
      "transition-colors duration-fast ease-out",
      "data-[state=checked]:border-action data-[state=checked]:bg-action",
      "data-[state=indeterminate]:border-action data-[state=indeterminate]:bg-action",
      "disabled:cursor-not-allowed disabled:border-border disabled:bg-disabled",
      className,
    )}
    {...props}
  >
    <CheckboxPrimitive.Indicator>
      {/* The 16px icon floor, not a fourth size — a checkbox is not the
          "dense chrome" context that would justify one.

          `on-action` rather than `surface`: the glyph sits on a filled teal
          box, so its colour is "foreground on an action fill", not "the colour
          a card happens to be". */}
      {props.checked === "indeterminate" ? (
        <Minus className="size-4 text-on-action" strokeWidth={3} />
      ) : (
        <Check className="size-4 text-on-action" strokeWidth={3} />
      )}
    </CheckboxPrimitive.Indicator>
  </CheckboxPrimitive.Root>
));
Checkbox.displayName = "Checkbox";
