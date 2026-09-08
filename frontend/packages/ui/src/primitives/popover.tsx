"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "../lib/cn";

export const Popover = PopoverPrimitive.Root;
export const PopoverTrigger = PopoverPrimitive.Trigger;
export const PopoverAnchor = PopoverPrimitive.Anchor;

/**
 * Popover.
 *
 * `collisionPadding` keeps the content off the viewport edge when Radix flips
 * it: a tall popover opened low on the screen otherwise flips upward and runs
 * off the top, taking its first row with it.
 *
 * `--radix-popover-content-available-height` is what Radix measured as the
 * space actually available. Capping to it and scrolling means a popover taller
 * than the gap shows a scrollbar rather than being clipped by whatever contains
 * it — which is how a calendar inside a scrolling dialog loses its presets.
 */
export const PopoverContent = React.forwardRef<
  React.ElementRef<typeof PopoverPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof PopoverPrimitive.Content>
>(({ className, align = "start", sideOffset = 4, ...props }, ref) => (
  <PopoverPrimitive.Portal>
    <PopoverPrimitive.Content
      ref={ref}
      align={align}
      sideOffset={sideOffset}
      collisionPadding={12}
      className={cn(
        "z-popover rounded-card border border-border bg-surface p-4 shadow-lg outline-none",
        "max-h-[--radix-popover-content-available-height] overflow-y-auto",
        className,
      )}
      {...props}
    />
  </PopoverPrimitive.Portal>
));
PopoverContent.displayName = "PopoverContent";
