"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingCart,
  Trash2,
} from "lucide-react";
import {
  Button,
  EmptyState,
  cn,
  formatCurrency,
  toast,
} from "@cfc/ui";
import { AuthDialog } from "@/components/auth-dialog";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/session";

/**
 * The basket.
 *
 * The header has carried a basket button since the Add controls went onto the
 * service cards, and it pointed at this route — which did not exist. Adding a
 * service worked, the count went up, and clicking it produced a 404. This is
 * the missing half.
 *
 * It is also where the "browsing is public, committing needs an account" rule
 * finally bites. Everything up to here works signed out: browse, search, open
 * a service, collect a basket. Checkout is the commitment, so this is where
 * `AuthDialog` is raised — over the page, so a guest who signs in lands back
 * here with their basket intact rather than being thrown to /login and losing
 * it.
 *
 * The prices shown are "from" prices, the same ones the cards show. The real
 * total depends on variant, slot and address, which the booking flow collects —
 * so this screen is explicit that it is an estimate rather than quietly
 * presenting a number that will change at checkout.
 */
export default function CartPage() {
  const router = useRouter();
  const { lines, count, subtotalPaise, setQuantity, remove } = useCart();
  const { signedIn } = useSession();
  const [authOpen, setAuthOpen] = React.useState(false);

  /**
   * Checkout.
   *
   * The booking flow takes one service at a time — it collects a slot and an
   * address per job, which is correct: two services rarely want the same
   * window. So the basket hands off the first line and keeps the rest, and
   * says so rather than silently dropping them.
   */
  const checkout = React.useCallback(() => {
    const first = lines?.[0];
    if (!first) return;
    // The quantity set here is the quantity meant — carrying it into the flow
    // saves the customer setting it a second time on Customer 14.
    const qs = first.quantity > 1 ? `?qty=${first.quantity}` : "";
    router.push(`/book/${first.serviceId}${qs}`);
  }, [lines, router]);

  const onCheckoutClick = () => {
    if (signedIn) {
      checkout();
      return;
    }
    setAuthOpen(true);
  };

  // Null while the stored basket is being read. Rendering "empty" first and
  // then the contents would flash for anyone who has something in it.
  if (lines === null) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-8 md:px-6 lg:px-8">
        <div className="h-block-lg animate-pulse rounded-card bg-neutral-subtle" />
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-8 md:px-6 lg:px-8">
        <h1 className="text-title font-semibold tracking-tight text-ink">
          Checkout
        </h1>
        <div className="mt-4 rounded-card border border-border bg-surface">
          <EmptyState
            icon={<ShoppingCart />}
            title="Nothing to check out yet"
            description="Add a service and it will wait here until you are ready to book."
            action={{
              label: "Browse services",
              onClick: () => router.push("/categories"),
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-lg px-4 py-8 md:px-6 lg:px-8">
      <h1 className="text-title font-semibold tracking-tight text-ink">
        Checkout
      </h1>
      <p className="mt-1 text-small text-ink-muted">
        {count} {count === 1 ? "service" : "services"} ready to book.
      </p>

      {/* Two columns from `lg`, lines beside a summary. `lg:grid-cols-3` with
          the list spanning two of them rather than an arbitrary `[1fr_320px]`:
          the design system's scale is closed, and an arbitrary track is the
          kind of one-off that quietly becomes the house style. */}
      <div className="mt-6 grid gap-6 lg:grid-cols-3 lg:items-start">
        {/* ── Lines ──────────────────────────────────────────────────── */}
        <ul className="space-y-3 lg:col-span-2">
          {lines.map((line) => (
            <li
              key={line.serviceId}
              className="flex gap-3 rounded-card border border-border bg-surface p-3"
            >
              <Link
                href={`/service/${line.serviceId}`}
                className="shrink-0 overflow-hidden rounded-control focus-visible:outline-none focus-visible:outline-focus"
              >
                {line.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={line.imageUrl}
                    alt=""
                    loading="lazy"
                    className="size-tile-lg object-cover"
                  />
                ) : (
                  <span className="block size-tile-lg bg-neutral-subtle" />
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/service/${line.serviceId}`}
                  className={cn(
                    "block truncate rounded-control text-small font-semibold text-ink",
                    "transition-colors duration-fast hover:text-action",
                    "focus-visible:outline-none focus-visible:outline-focus",
                  )}
                >
                  {line.serviceName}
                </Link>
                <p className="mt-1 text-caption text-ink-muted">
                  from{" "}
                  <span className="tabular font-medium text-ink">
                    {formatCurrency(line.fromPricePaise)}
                  </span>
                </p>

                <div className="mt-3 flex items-center justify-between gap-2">
                  <span className="flex items-center gap-1 rounded-control border border-border">
                    <button
                      type="button"
                      aria-label={`Remove one ${line.serviceName}`}
                      onClick={() =>
                        setQuantity(line.serviceId, line.quantity - 1)
                      }
                      className={cn(
                        "flex size-8 items-center justify-center rounded-control text-ink",
                        "transition-colors duration-fast hover:bg-action-subtle hover:text-action",
                        "focus-visible:outline-none focus-visible:outline-focus",
                      )}
                    >
                      <Minus className="size-4" aria-hidden="true" />
                    </button>
                    <span
                      className="tabular w-6 text-center text-small font-semibold text-ink"
                      aria-live="polite"
                    >
                      {line.quantity}
                    </span>
                    <button
                      type="button"
                      aria-label={`Add another ${line.serviceName}`}
                      onClick={() =>
                        setQuantity(line.serviceId, line.quantity + 1)
                      }
                      className={cn(
                        "flex size-8 items-center justify-center rounded-control text-ink",
                        "transition-colors duration-fast hover:bg-action-subtle hover:text-action",
                        "focus-visible:outline-none focus-visible:outline-focus",
                      )}
                    >
                      <Plus className="size-4" aria-hidden="true" />
                    </button>
                  </span>

                  <button
                    type="button"
                    onClick={() => {
                      remove(line.serviceId);
                      toast.success(`${line.serviceName} removed`);
                    }}
                    className={cn(
                      "flex items-center gap-1 rounded-control px-2 py-1",
                      "text-caption font-medium text-ink-muted",
                      "transition-colors duration-fast hover:text-critical-ink",
                      "focus-visible:outline-none focus-visible:outline-focus",
                    )}
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                    Remove
                  </button>
                </div>
              </div>
            </li>
          ))}

          {/* A basket with no way back to the catalogue is a dead end: the
              only forward action is checkout, and a customer who remembers
              one more thing has to find the header or the back button. */}
          <li>
            <Link
              href="/categories"
              className={cn(
                "flex items-center justify-center gap-2 rounded-card border border-dashed border-border-strong p-4",
                "text-small font-medium text-action",
                "transition-colors duration-fast hover:border-action hover:bg-action-subtle",
                "focus-visible:outline-none focus-visible:outline-focus",
              )}
            >
              <Plus className="size-4" aria-hidden="true" />
              Add more services
            </Link>
          </li>
        </ul>

        {/* ── Summary ────────────────────────────────────────────────── */}
        <div className="rounded-card border border-border bg-surface p-4 lg:sticky lg:top-bar-tall">
          <h2 className="text-heading font-semibold text-ink">Estimate</h2>

          <dl className="mt-3 space-y-2">
            <div className="flex items-baseline justify-between gap-2">
              <dt className="text-small text-ink-muted">
                Services ({count})
              </dt>
              <dd className="tabular text-small font-medium text-ink">
                {formatCurrency(subtotalPaise)}
              </dd>
            </div>
          </dl>

          {/* Honest about what this number is. The real total needs a variant,
              a slot and an address, and the booking flow collects all three —
              quietly showing a figure that then changes is how a checkout
              loses trust. */}
          <p className="mt-3 rounded-control bg-canvas p-3 text-caption leading-relaxed text-ink-muted">
            A starting estimate. Visit charge, platform fee and GST are
            confirmed on the next step, before you pay.
          </p>

          <Button
            variant="primary"
            size="lg"
            className="mt-4 w-full"
            onClick={onCheckoutClick}
          >
            {signedIn ? "Continue to booking" : "Sign in to book"}
            <ArrowRight className="size-4" />
          </Button>

          {lines.length > 1 && (
            <p className="mt-3 text-caption leading-relaxed text-ink-muted">
              Each service is booked with its own slot and address. We will
              start with <strong className="font-medium text-ink">{lines[0]?.serviceName}</strong>{" "}
              and keep the rest for checkout.
            </p>
          )}

          <p className="mt-4 flex items-start gap-2 border-t border-border pt-4 text-caption text-ink-muted">
            <ShieldCheck
              className="mt-px size-4 shrink-0 text-action"
              aria-hidden="true"
            />
            Every job carries a 30-day warranty.
          </p>
        </div>
      </div>

      {/* Raised at the point of commitment, not at the door. Signing in here
          returns the customer to their basket rather than throwing the page
          away. */}
      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onDone={checkout}
        reason="Sign in to book"
      />
    </div>
  );
}
