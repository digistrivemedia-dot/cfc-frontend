"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  Info,
  Minus,
  Plus,
  IndianRupee,
  Sparkles,
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
      <div className="min-h-screen bg-surface pb-20 pt-6">
        <div className="cfc-wrap">
          <div className="h-block-lg animate-pulse rounded-card bg-neutral-subtle" />
        </div>
      </div>
    );
  }

  if (lines.length === 0) {
    return (
      <div className="min-h-screen bg-surface pb-20 pt-6">
        <div className="cfc-wrap">
          <h1 className="text-section text-ink">Your cart</h1>
          <div className="cfc-card mt-5">
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-surface pb-20 pt-6">
      <div className="cfc-wrap">
      {/* ORANGE on the eyebrow.

          The teal eyebrow was one more teal thing on a screen that already had
          three, and the page spent seven greys against it - which is what made
          it read as washed out rather than as quiet. Orange appears exactly
          once here, at the top, on the label that says where you are. */}
      <span className="cfc-badge cfc-badge-promo">Your cart</span>
      <h1 className="mt-3 text-section text-ink">Ready to book</h1>
      <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-body text-ink-muted">
        <span className="font-bold text-ink">
          {count} {count === 1 ? "service" : "services"}
        </span>
        <span aria-hidden="true" className="size-1 rounded-full bg-border" />
        <span>Fixed prices</span>
        <span aria-hidden="true" className="size-1 rounded-full bg-border" />
        <span>30-day warranty</span>
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
              /* `--teal-wash` (#E2F7F7), the tint the client's mockup puts behind
                 its cards. `bg-canvas` is #F1FAFB - within four points of the
                 page itself, so the card had a border and nothing else
                 separating it. This is a real step darker and reads as a
                 surface rather than as a hairline on the page. */
              style={{ backgroundColor: "var(--teal-wash)" }}
              className="cfc-card flex gap-3 border-action-line p-4 transition-all duration-base hover:border-action hover:shadow-md"
            >
              {/* The photo sits on a tinted panel, as the client's mockup sets
                  its media (`--panel-l`). A photograph on white has nothing
                  holding it, so a service card read as an image dropped onto
                  the page rather than as part of the card. */}
              {/* `size-tile-lg` on the LINK, not only on the child.

                  The link had no size of its own, so the tinted panel took
                  whatever width the flex row gave it - and on a service with
                  no photograph that meant the plate stretched under the text
                  beside it. Fixing the box means the media is always the same
                  square whether it holds a photo or a glyph. */}
              <Link
                href={`/service/${line.serviceId}`}
                /* `--panel-l` (#C3E9F2) is the exact colour the client's
                   mockup uses behind its card media - the one sampled from
                   the AC-repair screen's hero panel. `bg-clock-subtle` was a
                   near-white blue that read as an empty box rather than as a
                   panel holding something. Written as a CSS variable because
                   the preset carries no colour key for it. */
                style={{ backgroundColor: "var(--panel-l)" }}
                className="size-tile-lg shrink-0 overflow-hidden rounded-control focus-visible:outline-none focus-visible:outline-focus"
              >
                {line.imageUrl ? (
                  /* eslint-disable-next-line @next/next/no-img-element */
                  <img
                    src={line.imageUrl}
                    alt=""
                    loading="lazy"
                    className="size-full object-cover"
                  />
                ) : (
                  /* A glyph on a white disc, not a bare icon on a tint.

                     `size-6` was 24px inside an 80px square, so it floated in
                     the middle of a large empty panel and read as a
                     placeholder that had failed to load. The disc gives it
                     something to sit on - the same construction the category
                     tiles use - so it reads as artwork rather than as a fault. */
                  <span className="grid size-full place-items-center">
                    <span className="grid size-touch place-items-center rounded-full bg-[rgba(255,255,255,0.6)] text-clock">
                      <Sparkles className="size-5" aria-hidden="true" />
                    </span>
                  </span>
                )}
              </Link>

              <div className="min-w-0 flex-1">
                <Link
                  href={`/service/${line.serviceId}`}
                  className={cn(
                    // No colour change on hover. The whole card already lifts
                    // and takes a teal edge, so recolouring the title as well
                    // was a second signal for one action - and it pulled the
                    // service name off the ink every other title is set in.
                    "block truncate rounded-control text-body font-bold text-ink",
                    "focus-visible:outline-none focus-visible:outline-focus",
                  )}
                >
                  {line.serviceName}
                </Link>
                {/* Per-line total, not the unit price alone.

                    This showed "from ₹499" whatever the quantity, so two
                    bathroom cleans read as ₹499 in the list and ₹998 in the
                    summary - the same basket contradicting itself. The unit
                    price stays beside it once there is more than one. */}
                <p className="mt-1 flex flex-wrap items-baseline gap-x-2">
                  <span className="cfc-price">
                    {formatCurrency(line.fromPricePaise * line.quantity)}
                  </span>
                  {line.quantity > 1 && (
                    <span className="tabular text-caption text-ink-muted">
                      {formatCurrency(line.fromPricePaise)} each
                    </span>
                  )}
                </p>

                <div className="mt-3 flex items-center justify-between gap-2">
                  {/* Teal edge and wash, matching the stepper on Service
                      Detail. A hairline on white read as three loose controls
                      rather than one. */}
                  <span className="flex h-touch items-center gap-1 rounded-control border border-action-line bg-surface px-1">
                    <button
                      type="button"
                      aria-label={`Remove one ${line.serviceName}`}
                      onClick={() =>
                        setQuantity(line.serviceId, line.quantity - 1)
                      }
                      className={cn(
                        "flex size-8 items-center justify-center rounded-control text-action",
                        "transition-colors duration-fast hover:bg-action-subtle",
                        "focus-visible:outline-none focus-visible:outline-focus",
                      )}
                    >
                      <Minus className="size-4" aria-hidden="true" />
                    </button>
                    <span
                      className="tabular w-5 text-center text-body font-bold text-ink"
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
                        "flex size-8 items-center justify-center rounded-control text-action",
                        "transition-colors duration-fast hover:bg-action-subtle",
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
          {/* A real control, not a dashed placeholder.

              A dashed outline is the convention for an empty drop target, so
              this read as disabled - the one route back to the catalogue on a
              screen whose only other action is checkout. It is now a solid
              card with a teal plate, matching every other actionable card in
              the app. */}
          <li>
            <Link
              href="/categories"
              style={{ backgroundColor: "var(--teal-wash)" }}
              className={cn(
                "cfc-card group flex items-center gap-3 border-action-line p-4",
                "transition-all duration-base hover:-translate-y-1 hover:border-action hover:bg-surface hover:shadow-md",
                "focus-visible:outline-none focus-visible:outline-focus",
              )}
            >
              <span className="grid size-tile shrink-0 place-items-center rounded-control bg-action text-on-action">
                <Plus className="size-5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-body font-bold text-ink">
                  Add more services
                </span>
                <span className="block text-caption text-ink-muted">
                  Book a deep clean and a plumbing visit in one go
                </span>
              </span>
              <ArrowRight
                className="size-4 shrink-0 text-action transition-transform duration-base group-hover:translate-x-0.5"
                aria-hidden="true"
              />
            </Link>
          </li>
        </ul>

        {/* ── Summary ────────────────────────────────────────────────── */}
        {/* The summary carries a coloured head.

            It was a white card among white cards on a tinted page - three
            surfaces of the same value, with nothing saying which one holds the
            decision. A teal head marks it as the panel that matters, which is
            how the approved home page separates its own bands. */}
        <div className="cfc-card overflow-hidden shadow-md lg:sticky lg:top-bar-tall">
          {/* BLUE, not teal.

              A teal head sat directly above a teal Continue button, so the
              panel had two saturated teal blocks reading as one - and the
              button, which is the decision, lost its place as the only filled
              action. Blue is the app's tint and its one non-teal surface, so
              it marks the panel without competing. */}
          <div className="flex items-center gap-2 bg-clock px-5 py-3 text-on-action">
            <IndianRupee className="size-4 shrink-0" aria-hidden="true" />
            <h2 className="text-body font-bold">Estimate</h2>
          </div>

          <div className="p-5">

          {/* Each line named, then the total on its own row above a rule. A
              single figure with no breakdown asks a customer to trust a number
              they cannot check - and this screen's whole job is that the total
              is never a surprise. */}
          <dl className="mt-4 space-y-2">
            {lines.map((line) => (
              <div
                key={line.serviceId}
                className="flex items-baseline justify-between gap-3"
              >
                <dt className="min-w-0 truncate text-small text-ink-muted">
                  {line.serviceName}
                  {line.quantity > 1 && (
                    <span className="tabular"> × {line.quantity}</span>
                  )}
                </dt>
                <dd className="tabular shrink-0 text-small font-semibold text-ink">
                  {formatCurrency(line.fromPricePaise * line.quantity)}
                </dd>
              </div>
            ))}
          </dl>

          <div className="mt-4 flex items-baseline justify-between gap-2 border-t border-border pt-4">
            <span className="text-body font-bold text-ink">
              Estimated total
            </span>
            <span className="cfc-price-lg">{formatCurrency(subtotalPaise)}</span>
          </div>

          {/* Honest about what this number is. The real total needs a variant,
              a slot and an address, and the booking flow collects all three —
              quietly showing a figure that then changes is how a checkout
              loses trust.

              An info banner rather than grey text on a grey ground: it is the
              one caveat on the screen and it was the quietest thing on it. */}
          <p className="cfc-info mt-4">
            <Info className="cfc-info-ic size-4" aria-hidden="true" />
            <span>
              Visit charge, platform fee and GST are confirmed on the next step,
              before you pay.
            </span>
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
      </div>

      {/* Raised at the point of commitment, not at the door. Signing in here
          returns the customer to their basket rather than throwing the page
          away. */}
      </div>

      <AuthDialog
        open={authOpen}
        onOpenChange={setAuthOpen}
        onDone={checkout}
        reason="Sign in to book"
      />
    </div>
  );
}
