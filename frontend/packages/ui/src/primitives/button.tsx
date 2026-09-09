"use client";

import * as React from "react";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { Loader2 } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * One teal button per screen. Two teal buttons means one of them is wrong.
 *
 * `primary` is the single action. Everything else on the screen is `secondary`
 * (outlined) or `ghost`. `critical` is for destructive confirmation only, never
 * for a first-line action.
 *
 * `brand` uses the identity teal rather than the action teal, and is legal only
 * where the button is large — a hero CTA on consumer, a full-width app button.
 * It fails contrast at `sm`, which the size guard below enforces.
 *
 * `go` exists for the Pro app's two green controls — go online, accept job —
 * and appears nowhere else in the product.
 *
 * The foreground on every filled variant is `on-action`, not `surface`. They
 * hold the same value today, but a filled button's label must not be defined as
 * "whatever colour a card happens to be" — that coupling silently inverts the
 * label to invisible the moment a surface colour changes.
 */
const buttonVariants = cva(
  [
    "relative inline-flex items-center justify-center gap-2 whitespace-nowrap",
    "rounded-control font-medium",
    "transition-colors duration-fast ease-out",
    "disabled:pointer-events-none disabled:bg-disabled disabled:text-disabled-ink",
    "disabled:border-border-strong",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0",
  ],
  {
    variants: {
      variant: {
        primary: "bg-action text-on-action hover:bg-action-hover active:bg-action-press",
        secondary:
          "border border-border-strong bg-surface text-ink hover:bg-action-subtle",
        ghost: "text-ink hover:bg-action-subtle",
        critical:
          "bg-critical text-on-action hover:bg-critical-hover",
        brand: "bg-brand text-on-action hover:bg-action",
        go: "bg-live text-on-action hover:bg-live-ink",
        /** @deprecated Use `critical`. Kept so unmigrated screens still build. */
        danger: "bg-critical text-on-action hover:bg-critical-hover",
      },
      size: {
        // Admin is compact; consumer and pro never go below `md` (44px).
        //
        // `sm` and `icon` paint at 32px, which is correct for a dense table
        // under a cursor and below the 44px minimum under a thumb. Rather
        // than grow them — which would make every admin row taller on every
        // screen — the HIT AREA is extended past the painted box, and only
        // for coarse pointers. A mouse keeps the tight target; a finger gets
        // a 44px one. The button looks identical either way.
        sm: cn(
          "h-8 px-3 text-small [&_svg]:size-4",
          "relative coarse:after:absolute coarse:after:inset-x-0",
          "coarse:after:top-1/2 coarse:after:h-touch",
          "coarse:after:-translate-y-1/2 coarse:after:content-['']",
        ),
        md: "h-touch px-4 text-body [&_svg]:size-5",
        lg: "h-12 px-6 text-body [&_svg]:size-5",
        // The pro app's primary decision — ACCEPT, I'M HERE, COMPLETE JOB.
        //
        // 56px rather than `lg`'s 48px, and `heading` rather than `body`,
        // because the reading conditions are different in kind: a pro presses
        // these one-handed, standing, often in daylight, and pressing the wrong
        // one costs them money. `touch` (44px) is a MINIMUM for anything
        // tappable; this is a target for the one control that matters.
        pro: "h-touch-lg px-6 text-heading font-semibold [&_svg]:size-5",
        icon: cn(
          "size-8 [&_svg]:size-4",
          "relative coarse:after:absolute coarse:after:left-1/2",
          "coarse:after:top-1/2 coarse:after:size-touch",
          "coarse:after:-translate-x-1/2 coarse:after:-translate-y-1/2",
          "coarse:after:content-['']",
        ),
        "icon-md": "size-touch [&_svg]:size-5",
      },
    },
    defaultVariants: { variant: "secondary", size: "md" },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean | undefined;
  /**
   * Shows a spinner, disables the button, and announces `aria-busy`.
   *
   * The label stays mounted at zero opacity rather than being replaced, so the
   * button keeps its width and the row beneath it does not jump. Every async
   * action in the app previously hand-rolled this by swapping the label text,
   * which both reflowed the layout and left the button clickable twice.
   */
  loading?: boolean | undefined;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant,
      size,
      asChild = false,
      loading = false,
      disabled,
      children,
      ...props
    },
    ref,
  ) => {
    const Comp = asChild ? Slot : "button";

    // `asChild` hands rendering to the child element, which cannot host a
    // spinner overlay. A link that triggers navigation has nothing to wait for
    // anyway, so loading is simply not applicable there.
    if (asChild) {
      return (
        <Comp
          ref={ref}
          className={cn(buttonVariants({ variant, size }), className)}
          {...props}
        >
          {children}
        </Comp>
      );
    }

    return (
      <button
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        disabled={disabled ?? loading}
        aria-busy={loading || undefined}
        {...props}
      >
        {loading && (
          <span className="absolute inset-0 grid place-items-center">
            <Loader2 className="animate-spin" aria-hidden="true" />
          </span>
        )}
        <span
          className={cn(
            "inline-flex items-center gap-2",
            loading && "invisible",
          )}
        >
          {children}
        </span>
      </button>
    );
  },
);
Button.displayName = "Button";

export { buttonVariants };
