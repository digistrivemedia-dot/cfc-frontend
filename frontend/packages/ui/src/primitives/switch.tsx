"use client";

import * as React from "react";
import * as SwitchPrimitive from "@radix-ui/react-switch";
import { Check, X } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * Toggle. Active/inactive category, enable/disable service — never a checkbox
 * for a state that takes effect immediately on change.
 *
 * The thumb carries a tick when on and a cross when off. Colour alone is not
 * enough here: down a list of twenty rows a teal track and a grey track are
 * distinguishable only if you compare two of them, and someone who cannot see
 * the difference between them at all gets nothing. A glyph answers "is this on"
 * from a single row, without a legend.
 *
 * The track width and the thumb's travel are named tokens rather than Tailwind
 * default steps. `w-10` and `translate-x-5` are not on this project's closed
 * spacing scale, so both generated no CSS: the track collapsed to the thumb's
 * width and the thumb never moved, which made on and off look identical.
 */
export const Switch = React.forwardRef<
  React.ElementRef<typeof SwitchPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      "group inline-flex h-6 w-switch shrink-0 cursor-pointer items-center",
      "rounded-full border border-transparent p-px",
      "bg-neutral transition-colors duration-fast ease-out",
      "data-[state=checked]:bg-action",
      "disabled:cursor-not-allowed disabled:bg-disabled",
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        "pointer-events-none grid size-5 place-items-center rounded-full",
        "bg-surface shadow-sm",
        "translate-x-0 transition-transform duration-fast ease-out",
        "data-[state=checked]:translate-x-switch",
      )}
    >
      <Check
        className="hidden size-3 text-action group-data-[state=checked]:block"
        strokeWidth={3}
        aria-hidden="true"
      />
      <X
        className="size-3 text-neutral group-data-[state=checked]:hidden"
        strokeWidth={3}
        aria-hidden="true"
      />
    </SwitchPrimitive.Thumb>
  </SwitchPrimitive.Root>
));
Switch.displayName = "Switch";
