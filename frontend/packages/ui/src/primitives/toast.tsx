"use client";

import { Toaster as Sonner, toast } from "sonner";

/**
 * Toast host. One instance, mounted once near the root of each app.
 *
 * Styled to match every other overlay in the system — surface card, hairline
 * border, indigo-tinted shadow — via Sonner's class-based theming rather than
 * its own inline styles, so it inherits tokens instead of hardcoding colour.
 *
 * Per the copy rules: the same action keeps the same name through the flow. A
 * "Save" button produces a "Saved" toast, not "Success" or "Done".
 */
export function Toaster() {
  return (
    <Sonner
      position="bottom-right"
      toastOptions={{
        unstyled: true,
        classNames: {
          toast:
            "flex items-center gap-2 rounded-card border border-border bg-surface px-4 py-3 shadow-lg text-body text-ink w-full",
          success: "border-success",
          error: "border-danger",
        },
      }}
    />
  );
}

export { toast };
