"use client";

import * as React from "react";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * Side panel — slides in from the right, list/page stays visible behind it.
 *
 * Built on the same Radix Dialog primitive as `Dialog`, with a different
 * position/transform. Used for the "list + detail-for-one-record" pattern:
 * clicking a row opens the record's full detail without leaving the list, and
 * without giving the detail screen its own permanent nav entry or full-page
 * route. The list underneath stays mounted and visible at the left.
 */
export const Sheet = DialogPrimitive.Root;
export const SheetTrigger = DialogPrimitive.Trigger;
export const SheetClose = DialogPrimitive.Close;

/**
 * Radix ships no built-in slide transition, and this repo has no animation
 * plugin. Rather than pull one in for a single component, the transform is
 * driven directly off Radix's own `data-state` attribute with a plain
 * transition — one clear, orchestrated moment, respecting reduced motion via
 * the global `prefers-reduced-motion` rule already applied at the app root.
 */
export const SheetContent = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Content>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Content> & {
    hideClose?: boolean;
  }
>(({ className, children, hideClose, ...props }, ref) => (
  <DialogPrimitive.Portal>
    <DialogPrimitive.Overlay className="fixed inset-0 z-drawer-scrim bg-scrim transition-opacity data-[state=closed]:opacity-0 data-[state=open]:opacity-100" />
    <DialogPrimitive.Content
      ref={ref}
      className={cn(
        "fixed inset-y-0 right-0 z-drawer flex w-full max-w-md flex-col",
        "border-l border-border bg-surface shadow-lg",
        "transition-transform duration-200 ease-out",
        "data-[state=closed]:translate-x-full data-[state=open]:translate-x-0",
        className,
      )}
      {...props}
    >
      {children}
      {!hideClose && (
        <DialogPrimitive.Close
          className="absolute right-4 top-4 rounded-control p-1 text-ink-muted hover:bg-action-subtle hover:text-ink"
          aria-label="Close"
        >
          <X className="size-5" />
        </DialogPrimitive.Close>
      )}
    </DialogPrimitive.Content>
  </DialogPrimitive.Portal>
));
SheetContent.displayName = "SheetContent";

export function SheetHeader({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "shrink-0 space-y-1 border-b border-border p-6 pr-12",
        className,
      )}
      {...props}
    />
  );
}

export const SheetTitle = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Title>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Title>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Title
    ref={ref}
    className={cn("text-heading font-semibold text-ink", className)}
    {...props}
  />
));
SheetTitle.displayName = "SheetTitle";

export const SheetDescription = React.forwardRef<
  React.ElementRef<typeof DialogPrimitive.Description>,
  React.ComponentPropsWithoutRef<typeof DialogPrimitive.Description>
>(({ className, ...props }, ref) => (
  <DialogPrimitive.Description
    ref={ref}
    className={cn("text-body text-ink-muted", className)}
    {...props}
  />
));
SheetDescription.displayName = "SheetDescription";

/** Scrollable body between the fixed header and footer. */
export function SheetBody({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("min-h-0 flex-1 overflow-y-auto p-6", className)}
      {...props}
    />
  );
}

export function SheetFooter({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "flex shrink-0 flex-wrap justify-end gap-2 border-t border-border p-4",
        className,
      )}
      {...props}
    />
  );
}
