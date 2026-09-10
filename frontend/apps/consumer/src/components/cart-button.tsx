"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { cn } from "@cfc/ui";
import { useCart } from "@/lib/cart";

/**
 * Checkout, in the header.
 *
 * Always present, so a customer can see what they have collected from any
 * screen — an icon that only appears once something is in it teaches
 * nobody that the site works this way. Not a shopping "basket": this is a
 * services marketplace, and the icon takes a customer straight to checkout.
 *
 * The count sits on the icon rather than beside it: it has to be readable at a
 * glance while scrolling, and a number that shifts the layout each time it
 * changes is worse than one that does not.
 */
export function CartButton() {
  const { count } = useCart();

  return (
    <Link
      href="/cart"
      aria-label={
        count > 0 ? `Checkout, ${count} service${count === 1 ? "" : "s"}` : "Checkout"
      }
      className={cn(
        "relative flex size-8 items-center justify-center rounded-full",
        "text-ink-muted transition-colors duration-fast",
        "hover:bg-action-subtle hover:text-action",
        "focus-visible:outline-none focus-visible:outline-focus",
      )}
    >
      <ShoppingCart className="size-4" aria-hidden="true" />
      {count > 0 && (
        <span
          className={cn(
            "tabular absolute -right-1 -top-1 flex size-4 items-center justify-center",
            "rounded-full bg-action text-caption font-semibold leading-none text-on-action",
          )}
          aria-hidden="true"
        >
          {count > 9 ? "9+" : count}
        </span>
      )}
    </Link>
  );
}
