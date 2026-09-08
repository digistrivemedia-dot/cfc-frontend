"use client";

import * as React from "react";
import * as TabsPrimitive from "@radix-ui/react-tabs";
import { cn } from "../lib/cn";

export const Tabs = TabsPrimitive.Root;

export const TabsList = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.List>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.List
    ref={ref}
    className={cn(
      // Scrolls rather than wraps. Pro management has seven tabs: at 390px a
      // wrapping strip becomes three stacked rows and eats half the screen,
      // and an inline-flex that neither wraps nor scrolls pushes the whole
      // page sideways. `flex` (not inline-flex) so the underline runs the
      // full width on desktop, unchanged from before.
      "flex items-center gap-1 overflow-x-auto border-b border-border",
      // The strip is its own scroll region, so a swipe on it does not drag
      // the page, and the scrollbar itself is not chrome worth showing.
      "scrollbar-none [&>*]:shrink-0",
      className,
    )}
    {...props}
  />
));
TabsList.displayName = "TabsList";

export const TabsTrigger = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Trigger>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Trigger>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Trigger
    ref={ref}
    className={cn(
      "relative py-2 px-1 text-small font-medium text-ink-muted",
      "border-b-2 border-transparent -mb-px",
      "hover:text-ink",
      "data-[state=active]:border-action data-[state=active]:text-ink",
      "disabled:cursor-not-allowed disabled:opacity-50",
      className,
    )}
    {...props}
  />
));
TabsTrigger.displayName = "TabsTrigger";

export const TabsContent = React.forwardRef<
  React.ElementRef<typeof TabsPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof TabsPrimitive.Content>
>(({ className, ...props }, ref) => (
  <TabsPrimitive.Content ref={ref} className={cn("pt-4", className)} {...props} />
));
TabsContent.displayName = "TabsContent";
