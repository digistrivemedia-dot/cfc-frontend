"use client";

import Link from "next/link";
import { Check, Plus, Minus, Star } from "lucide-react";
import { cn, formatCurrency, toast } from "@cfc/ui";
import { useCart } from "@/lib/cart";

/**
 * One service, as a shop card.
 *
 * The card carries two intentions and keeps them apart. The photograph and the
 * name open the service, where variants, inclusions and slots live. The Add
 * button puts the base variant straight in the basket for someone who already
 * knows what they want — which, for "AC service" or "bathroom cleaning", is
 * most people.
 *
 * Once a service is in the basket the button becomes a stepper. Adding a second
 * bathroom clean is a real thing a customer does, and making them open the
 * basket to say so is friction for no reason.
 *
 * The price is "from", never a flat figure: every service has variants at
 * different prices, and a single number here is a promise the checkout screen
 * then breaks.
 */
export function ShopServiceCard({
  id,
  name,
  subCategoryName,
  fromPricePaise,
  rating,
  reviewCount,
  imageUrl,
  description,
}: {
  id: string;
  name: string;
  subCategoryName: string;
  fromPricePaise: number;
  rating?: number | undefined;
  reviewCount?: number | undefined;
  imageUrl?: string | undefined;
  description?: string | undefined;
}) {
  const { has, add, setQuantity, lines } = useCart();
  const inCart = has(id);
  const quantity = (lines ?? []).find((l) => l.serviceId === id)?.quantity ?? 0;

  return (
    <article
      className={cn(
        "group flex h-full flex-col overflow-hidden rounded-card border bg-surface",
        "transition-all duration-base",
        inCart
          ? "border-action shadow-md"
          : "border-border shadow-sm hover:border-action-line hover:shadow-md",
      )}
    >
      <Link
        href={`/service/${id}`}
        className={cn(
          "block focus-visible:outline-none focus-visible:outline-focus",
        )}
      >
        <div className="relative aspect-card overflow-hidden bg-canvas">
          {imageUrl ? (
            /* eslint-disable-next-line @next/next/no-img-element */
            <img
              src={imageUrl}
              alt=""
              loading="lazy"
              className="size-full object-cover transition-transform duration-base group-hover:scale-105"
            />
          ) : (
            <div className="size-full bg-neutral-subtle" />
          )}

          {/* The sub-category, as a label on the image. It tells a customer
              scanning a mixed grid what kind of work this is without adding a
              line of text under every card. */}
          <span className="absolute left-2 top-2 rounded-pill bg-structure px-2 py-1 text-caption font-semibold uppercase tracking-wide text-on-structure">
            {subCategoryName}
          </span>
        </div>
      </Link>

      <div className="flex flex-1 flex-col p-3">
        <Link
          href={`/service/${id}`}
          className={cn(
            "rounded-control text-small font-semibold text-ink",
            "transition-colors duration-fast hover:text-action",
            "focus-visible:outline-none focus-visible:outline-focus",
          )}
        >
          {name}
        </Link>

        {description && (
          <p className="mt-1 line-clamp-2 text-caption leading-relaxed text-ink-muted">
            {description}
          </p>
        )}

        {rating !== undefined && rating > 0 && (
          <p className="mt-2 flex items-center gap-1 text-caption text-ink-muted">
            <Star className="size-3 text-star" fill="currentColor" aria-hidden="true" />
            <span className="tabular font-medium text-ink">
              {rating.toFixed(1)}
            </span>
            {reviewCount !== undefined && reviewCount > 0 && (
              <span className="tabular">({reviewCount})</span>
            )}
          </p>
        )}

        {/* Price and action share the last line, pinned to the bottom so cards
            of different text lengths still line up. */}
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <span className="min-w-0">
            <span className="block text-caption text-ink-muted">from</span>
            <span className="tabular block text-body font-semibold text-ink width-condensed">
              {formatCurrency(fromPricePaise)}
            </span>
          </span>

          {inCart ? (
            <span className="flex shrink-0 items-center gap-1 rounded-control border border-action">
              <button
                type="button"
                aria-label={`Remove one ${name}`}
                onClick={() => setQuantity(id, quantity - 1)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-control text-action",
                  "transition-colors duration-fast hover:bg-action-subtle",
                  "focus-visible:outline-none focus-visible:outline-focus",
                )}
              >
                <Minus className="size-4" aria-hidden="true" />
              </button>
              <span
                className="tabular w-4 text-center text-small font-semibold text-action"
                aria-live="polite"
              >
                {quantity}
              </span>
              <button
                type="button"
                aria-label={`Add another ${name}`}
                onClick={() => setQuantity(id, quantity + 1)}
                className={cn(
                  "flex size-8 items-center justify-center rounded-control text-action",
                  "transition-colors duration-fast hover:bg-action-subtle",
                  "focus-visible:outline-none focus-visible:outline-focus",
                )}
              >
                <Plus className="size-4" aria-hidden="true" />
              </button>
            </span>
          ) : (
            <button
              type="button"
              onClick={() => {
                add({
                  serviceId: id,
                  serviceName: name,
                  fromPricePaise,
                  ...(imageUrl ? { imageUrl } : {}),
                });
                // Adding used to be silent — the row changed shape and a
                // number in the header went up, which is not enough to tell
                // someone their action worked. The toast confirms it, and the
                // checkout bar that appears underneath gives them somewhere
                // to go.
                toast.success(`${name} added`);
              }}
              className={cn(
                "flex h-8 shrink-0 items-center gap-1 rounded-control border border-action px-3",
                "text-small font-semibold text-action",
                "transition-colors duration-fast hover:bg-action hover:text-on-action",
                "focus-visible:outline-none focus-visible:outline-focus",
              )}
            >
              <Plus className="size-4" aria-hidden="true" />
              Add
            </button>
          )}
        </div>
      </div>

      {/* A quiet confirmation, so the state is readable without counting. */}
      {inCart && (
        <p className="flex items-center gap-1 bg-action-subtle px-3 py-1 text-caption font-medium text-action">
          <Check className="size-3" aria-hidden="true" />
          Added
        </p>
      )}
    </article>
  );
}
