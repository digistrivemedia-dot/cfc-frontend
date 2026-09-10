"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Clock,
  Image as ImageIcon,
  Minus,
  Plus,
  ShieldCheck,
} from "lucide-react";
import {
  REVIEWS_ARE_PLACEHOLDER,
  getService,
  getServiceFaqs,
  getServiceReviews,
} from "@cfc/mocks";
import type { Review, ServiceDetail, ServiceFaq, ServiceVariant } from "@cfc/types";
import {
  Accordion,
  Badge,
  Button,
  ErrorState,
  Skeleton,
  StarRating,
  cn,
  formatCurrency,
  formatDate,
  toast,
} from "@cfc/ui";
import { useCart } from "@/lib/cart";
import { useSession } from "@/lib/session";

/**
 * Customer 12 — Service detail.
 *
 * Inventory: "Description, pricing, inclusions, warranty badge, ratings,
 * FAQs."
 *
 * The variant picker lives here rather than on a separate screen. Customer 14
 * asks for "variant picker, add-ons, quantity" — but a customer choosing
 * between a 1-ton and a 2-ton AC service is still deciding *what* to book, not
 * confirming a booking, so splitting it out would add a step that answers
 * nothing. Booking starts once they have chosen.
 *
 * Layout is the 1280px rule in practice: one column with a sticky action bar
 * on a phone, two columns with a sticky price card on a desktop. The same
 * content, arranged for the room available — not a phone column in the middle
 * of a monitor.
 */

export default function ServiceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [service, setService] = React.useState<ServiceDetail | null>(null);
  const [faqs, setFaqs] = React.useState<ServiceFaq[] | null>(null);
  const [reviews, setReviews] = React.useState<Review[] | null>(null);
  const [error, setError] = React.useState(false);
  const [variantId, setVariantId] = React.useState<string | null>(null);
  const { add, has, setQuantity, lines } = useCart();

  const load = React.useCallback(() => {
    setError(false);
    Promise.all([getService(id), getServiceFaqs(id)])
      .then(async ([s, f]) => {
        // The empty scenario resolves this to null, which for a detail screen
        // means the same thing as a 404.
        if (s === null) {
          setError(true);
          return;
        }
        setService(s);
        setFaqs(f);
        // Reviews are fetched second because they are keyed on the service
        // NAME, which only exists once the service itself has resolved.
        setReviews(await getServiceReviews(s.name));
        // The catalogue marks one variant as pre-selected; honour it rather
        // than defaulting to the first in the array.
        const preset = s.variants.find((v) => v.isDefault && v.active);
        setVariantId((preset ?? s.variants.find((v) => v.active))?.id ?? null);
      })
      .catch(() => setError(true));
  }, [id]);

  React.useEffect(() => load(), [load]);

  const variants = React.useMemo(
    () => service?.variants.filter((v) => v.active) ?? [],
    [service],
  );
  const selected = variants.find((v) => v.id === variantId) ?? null;
  const quantity =
    (lines ?? []).find((l) => l.serviceId === id)?.quantity ?? 0;

  const totalPaise =
    service && selected
      ? service.basePricePaise + selected.priceDeltaPaise
      : (service?.basePricePaise ?? 0);

  if (error) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-12 md:px-6 lg:px-8">
        <ErrorState
          title="This service is not available"
          description="It may have been removed from the catalogue."
          action={{ label: "Browse services", onClick: () => router.push("/categories") }}
        />
      </div>
    );
  }

  if (service === null) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 lg:px-8">
        {/* `aspect-card`, matching the gallery it stands in for: a fixed-height
            skeleton made the page jump the moment the photograph arrived. */}
        <Skeleton className="aspect-card w-full rounded-card" />
        <Skeleton className="mt-4 h-4 w-line-lg" />
        <Skeleton className="mt-2 h-4 w-full max-w-line-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 pt-4 md:px-6 md:pb-12 lg:px-8">
      <Link
        href="/categories"
        className="inline-flex items-center gap-1 text-caption text-ink-muted hover:text-action"
      >
        <ArrowLeft className="size-3" aria-hidden="true" />
        {service.categoryName}
      </Link>

      <div className="mt-3 grid gap-6 lg:grid-cols-detail lg:items-start">
        {/* ── Left: what it is ─────────────────────────────────────────── */}
        <div className="min-w-0 space-y-6">
          <ServiceGallery images={service.imageUrls} name={service.name} />

          <div>
            <p className="text-caption text-ink-muted">
              {service.subCategoryName}
            </p>
            <h1 className="mt-1 text-title font-semibold tracking-tight text-ink md:text-title-lg">
              {service.name}
            </h1>

            <div className="mt-2 flex flex-wrap items-center gap-3">
              {service.rating > 0 ? (
                <StarRating
                  value={service.rating}
                  count={service.reviewCount}
                  size="md"
                />
              ) : (
                <Badge tone="neutral">New service</Badge>
              )}
              {/* Spec: "warranty badge". The number is real — it comes from
                  the catalogue, per service. */}
              {service.warrantyDays > 0 && (
                <Badge tone="live" dot>
                  {service.warrantyDays}-day warranty
                </Badge>
              )}
            </div>

            <p className="mt-3 text-body leading-relaxed text-ink-muted">
              {service.description}
            </p>
          </div>

          {service.inclusions.length > 0 && (
            <section>
              <h2 className="text-heading font-semibold text-ink md:text-heading-lg">
                What is included
              </h2>
              <ul className="mt-2 space-y-2">
                {service.inclusions.map((line) => (
                  <li key={line} className="flex items-start gap-2 text-small text-ink">
                    <Check
                      className="mt-px size-4 shrink-0 text-live-ink"
                      aria-hidden="true"
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <TrustRow warrantyDays={service.warrantyDays} />

          {faqs !== null && faqs.length > 0 && (
            <section>
              <h2 className="mb-2 text-heading font-semibold text-ink md:text-heading-lg">
                Common questions
              </h2>
              <Accordion
                items={faqs.map((f) => ({
                  id: f.id,
                  question: f.question,
                  answer: f.answer,
                }))}
              />
            </section>
          )}

          <ReviewList reviews={reviews} />
        </div>

        {/* ── Right: what it costs, and booking ────────────────────────── */}
        <div className="lg:sticky lg:top-bar-tall lg:self-start">
          <BookingCard
            variants={variants}
            selectedId={variantId}
            onSelect={setVariantId}
            basePricePaise={service.basePricePaise}
            totalPaise={totalPaise}
            durationMinutes={selected?.durationMinutes ?? null}
            onBook={() =>
              router.push(
                `/book/${service.id}${variantId ? `?variant=${variantId}` : ""}`,
              )
            }
            inCart={has(service.id)}
            quantity={quantity}
            onQuantityChange={(next) => setQuantity(service.id, next)}
            onAdd={() => {
              add({
                serviceId: service.id,
                serviceName: service.name,
                fromPricePaise: service.basePricePaise,
                ...(service.imageUrls[0]
                  ? { imageUrl: service.imageUrls[0] }
                  : {}),
              });
              toast.success(`${service.name} added`);
            }}
          />
        </div>
      </div>

      {/* The phone equivalent of the sticky card: price and one action,
          sitting above the tab bar. */}
      <MobileActionBar
        totalPaise={totalPaise}
        onBook={() =>
          router.push(
            `/book/${service.id}${variantId ? `?variant=${variantId}` : ""}`,
          )
        }
        inCart={has(service.id)}
        quantity={quantity}
        onQuantityChange={(next) => setQuantity(service.id, next)}
        onAdd={() => {
          add({
            serviceId: service.id,
            serviceName: service.name,
            fromPricePaise: service.basePricePaise,
            ...(service.imageUrls[0] ? { imageUrl: service.imageUrls[0] } : {}),
          });
          toast.success(`${service.name} added`);
        }}
      />
    </div>
  );
}

/**
 * Pricing and the variant choice.
 *
 * Variant prices are shown as the total a customer would pay, not as the
 * delta the catalogue stores. "+₹300" asks someone to do arithmetic before
 * they can compare two options.
 */
function BookingCard({
  variants,
  selectedId,
  onSelect,
  basePricePaise,
  totalPaise,
  durationMinutes,
  onBook,
  onAdd,
  inCart,
  quantity,
  onQuantityChange,
}: {
  variants: ServiceVariant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  basePricePaise: number;
  totalPaise: number;
  durationMinutes: number | null;
  onBook: () => void;
  onAdd: () => void;
  inCart: boolean;
  quantity: number;
  onQuantityChange: (next: number) => void;
}) {
  return (
    <div className="rounded-card border border-border bg-surface p-4">
      <p className="text-caption text-ink-muted">Starting at</p>
      <p className="tabular text-title font-semibold text-ink">
        {formatCurrency(totalPaise)}
      </p>
      {durationMinutes !== null && (
        <p className="mt-1 flex items-center gap-1 text-caption text-ink-muted">
          <Clock className="size-3" aria-hidden="true" />
          about {formatDuration(durationMinutes)} on site
        </p>
      )}

      {variants.length > 1 && (
        <fieldset className="mt-4">
          <legend className="text-small font-medium text-ink">
            Choose an option
          </legend>
          <div className="mt-2 space-y-2">
            {variants.map((v) => {
              const price = basePricePaise + v.priceDeltaPaise;
              const isSelected = v.id === selectedId;
              return (
                <label
                  key={v.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-control border p-3",
                    "transition-colors duration-fast",
                    isSelected
                      ? "border-action bg-action-subtle"
                      : "border-border hover:border-action-line",
                  )}
                >
                  <input
                    type="radio"
                    name="variant"
                    value={v.id}
                    checked={isSelected}
                    onChange={() => onSelect(v.id)}
                    className="mt-1 size-4 shrink-0 accent-action"
                  />
                  <span className="min-w-0 flex-1">
                    <span className="block text-small font-medium text-ink">
                      {v.name}
                    </span>
                    <span className="tabular block text-caption text-ink-muted">
                      {formatDuration(v.durationMinutes)}
                    </span>
                  </span>
                  <span className="tabular shrink-0 text-small font-semibold text-ink">
                    {formatCurrency(price)}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* Two intentions, kept apart. Booking now is for someone who has
          decided; adding to the basket is for someone collecting several jobs
          — a deep clean and a plumbing visit in one visit to the site. The
          service cards on the home screen already offer Add, and this is the
          screen where the decision is actually made, so it has to offer it
          too. */}
      <Button variant="primary" className="mt-4 hidden w-full lg:flex" onClick={onBook}>
        Book this service
      </Button>
      {/* Once it is in the basket this becomes a stepper, matching every
          service card in the app. A disabled "In your basket" button — which
          is what sat here — is a dead end: booking two bathroom cleans is a
          real thing, and it forced a trip to the basket to say so. */}
      {inCart ? (
        <div className="mt-2 hidden items-center justify-between gap-3 rounded-control border border-action p-1 lg:flex">
          <button
            type="button"
            aria-label="Remove one"
            onClick={() => onQuantityChange(quantity - 1)}
            className={cn(
              "flex size-touch items-center justify-center rounded-control text-action",
              "transition-colors duration-fast hover:bg-action-subtle",
              "focus-visible:outline-none focus-visible:outline-focus",
            )}
          >
            <Minus className="size-4" aria-hidden="true" />
          </button>
          <span className="text-small font-semibold text-action" aria-live="polite">
            <span className="tabular">{quantity}</span> added
          </span>
          <button
            type="button"
            aria-label="Add another"
            onClick={() => onQuantityChange(quantity + 1)}
            className={cn(
              "flex size-touch items-center justify-center rounded-control text-action",
              "transition-colors duration-fast hover:bg-action-subtle",
              "focus-visible:outline-none focus-visible:outline-focus",
            )}
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        </div>
      ) : (
        <Button
          variant="secondary"
          className="mt-2 hidden w-full lg:flex"
          onClick={onAdd}
        >
          <Plus className="size-4" />
          Add
        </Button>
      )}

      <p className="mt-3 text-caption text-ink-faint">
        You pay after the job is done. Anything extra is quoted first.
      </p>
    </div>
  );
}

/**
 * The mobile booking bar.
 *
 * Fixed above the tab strip rather than inline, because the decision to book
 * has to be reachable from anywhere on a long page. Hidden at `lg` where the
 * sticky card does the same job with more room.
 */
function MobileActionBar({
  totalPaise,
  onBook,
  onAdd,
  inCart,
  quantity,
  onQuantityChange,
}: {
  totalPaise: number;
  onBook: () => void;
  onAdd: () => void;
  inCart: boolean;
  quantity: number;
  onQuantityChange: (next: number) => void;
}) {
  const { signedIn } = useSession();

  return (
    <div
      // Clears the iOS home indicator. Padding rather than an offset, so it
      // does not compete with the `bottom-*` class that positions the bar.
      style={{ paddingBottom: "max(12px, env(safe-area-inset-bottom))" }}
      className={cn(
        "fixed inset-x-0 z-sticky border-t border-border bg-surface px-4 pt-3 lg:hidden",
        "flex items-center justify-between gap-3",
        // The tab bar is 56px tall, exists only for a signed-in customer, and
        // is `md:hidden` — so it is present only below `md`, and only with an
        // account. This bar is `lg:hidden`, so between `md` and `lg` it is on
        // screen while the tab bar is NOT. The old inline offset keyed on
        // `signedIn` alone got that band wrong at every width: it floated the
        // bar 56px above nothing for a signed-in customer on a tablet, and an
        // inline style cannot express the breakpoint that would fix it.
        signedIn ? "bottom-tab-bar md:bottom-0" : "bottom-0",
      )}
    >
      <div className="min-w-0">
        <p className="text-caption text-ink-muted">Starting at</p>
        <p className="tabular text-heading font-semibold text-ink">
          {formatCurrency(totalPaise)}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        {/* A stepper here too, for the same reason as the desktop card. The
            icon button was disabled once in the basket, which on a phone read
            as the app having stopped working. */}
        {inCart ? (
          <span className="flex items-center rounded-control border border-action">
            <button
              type="button"
              aria-label="Remove one"
              onClick={() => onQuantityChange(quantity - 1)}
              className="flex size-touch items-center justify-center rounded-control text-action focus-visible:outline-none focus-visible:outline-focus"
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
              aria-label="Add another"
              onClick={() => onQuantityChange(quantity + 1)}
              className="flex size-touch items-center justify-center rounded-control text-action focus-visible:outline-none focus-visible:outline-focus"
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </span>
        ) : (
          <Button
            variant="secondary"
            size="icon-md"
            onClick={onAdd}
            aria-label="Add to checkout"
          >
            <Plus />
          </Button>
        )}
        <Button variant="primary" onClick={onBook}>
          Book now
        </Button>
      </div>
    </div>
  );
}

/** The three promises, each one a documented rule. */
function TrustRow({ warrantyDays }: { warrantyDays: number }) {
  const items = [
    {
      icon: ShieldCheck,
      label: warrantyDays > 0 ? `${warrantyDays}-day warranty` : "Warranty included",
    },
    { icon: BadgeCheck, label: "Verified professional" },
    { icon: Check, label: "Closed with your code" },
  ];

  return (
    <ul className="grid grid-cols-3 gap-2">
      {items.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="flex flex-col items-center gap-1 rounded-card border border-border bg-surface p-3 text-center"
        >
          <Icon className="size-4 text-action" aria-hidden="true" />
          <span className="text-caption leading-tight text-ink-muted">
            {label}
          </span>
        </li>
      ))}
    </ul>
  );
}

/**
 * Reviews for THIS service.
 *
 * Previously fed by `getReviews(4)` — the newest four reviews on the platform,
 * regardless of service. The star rating at the top of the page is
 * service-specific, so the two contradicted each other on the same screen.
 *
 * Shows four, then reveals the rest in place. A separate reviews route is not
 * in the inventory, and sending someone away from the screen where they are
 * deciding to book is the wrong direction to push them.
 */
function ReviewList({ reviews }: { reviews: Review[] | null }) {
  const [expanded, setExpanded] = React.useState(false);

  if (reviews === null) {
    return (
      <section>
        <h2 className="text-heading font-semibold text-ink md:text-heading-lg">Reviews</h2>
        <div className="mt-2 space-y-2">
          {Array.from({ length: 2 }, (_, i) => (
            <Skeleton key={i} className="h-block-xs rounded-card" />
          ))}
        </div>
      </section>
    );
  }

  if (reviews.length === 0) {
    return (
      <section>
        <h2 className="text-heading font-semibold text-ink md:text-heading-lg">Reviews</h2>
        <p className="mt-2 text-small text-ink-muted">
          No reviews for this service yet. Yours would be the first.
        </p>
      </section>
    );
  }

  const INITIAL = 4;
  const shown = expanded ? reviews : reviews.slice(0, INITIAL);

  return (
    <section>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="text-heading font-semibold text-ink md:text-heading-lg">
          Reviews{" "}
          <span className="tabular text-small font-normal text-ink-muted">
            ({reviews.length})
          </span>
        </h2>
      </div>
      {/* The same honesty the pro profile already carries. These are our words
          until the client supplies real ones, and the screen says so. */}
      {REVIEWS_ARE_PLACEHOLDER && (
        <p className="mt-1 text-caption text-ink-muted">
          Sample content — real reviews appear once jobs are completed.
        </p>
      )}
      <ul className="mt-2 space-y-3">
        {shown.map((r) => (
          <li
            key={r.id}
            className="rounded-card border border-border bg-surface p-4"
          >
            <div className="flex items-center justify-between gap-2">
              <StarRating value={r.rating} starsOnly />
              <span className="text-caption text-ink-faint">
                {formatDate(r.createdAt)}
              </span>
            </div>
            <p className="mt-2 text-small text-ink">{r.body}</p>
            <p className="mt-2 text-caption text-ink-muted">{r.authorName}</p>
          </li>
        ))}
      </ul>

      {reviews.length > INITIAL && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className={cn(
            "mt-3 rounded-control text-small font-semibold text-action",
            "transition-colors duration-fast hover:text-action-hover",
            "focus-visible:outline-none focus-visible:outline-focus",
          )}
        >
          {expanded
            ? "Show fewer reviews"
            : `Show all ${reviews.length} reviews`}
        </button>
      )}
    </section>
  );
}

/**
 * The photography.
 *
 * This was a bare `bg-action-subtle` box — an empty teal rectangle where the
 * picture should be — while `imageUrls[0]` was sitting right there and being
 * passed to the basket two hundred lines below. Every list in the app sells a
 * service with a photograph; opening one showed a blank.
 *
 * Written to take an array because the catalogue field is one. It renders a
 * single image as a plain frame and only earns its thumbnail strip when there
 * is genuinely more than one, rather than showing a row of one thumbnail.
 */
function ServiceGallery({ images, name }: { images: string[]; name: string }) {
  const [index, setIndex] = React.useState(0);
  // A photo can 404 — the catalogue derives filenames from service names, so a
  // renamed service silently loses its image. A broken-image glyph is worse
  // than the placeholder, so failures fall back deliberately.
  const [failed, setFailed] = React.useState(false);

  const shown = images[index];
  const hasPhoto = shown !== undefined && !failed;

  return (
    <div>
      <div className="overflow-hidden rounded-card border border-border bg-canvas">
        {hasPhoto ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={shown}
            alt={name}
            /* The hero image of the screen a customer decided to open, so it
               is the one image on the page that must not be lazy. */
            className="aspect-card w-full object-cover"
            onError={() => setFailed(true)}
          />
        ) : (
          <div
            className="flex aspect-card items-center justify-center bg-action-subtle"
            aria-hidden="true"
          >
            <ImageIcon className="size-8 text-action" />
          </div>
        )}
      </div>

      {images.length > 1 && (
        <ul className="mt-2 flex gap-2 overflow-x-auto scrollbar-none">
          {images.map((src, i) => (
            <li key={src}>
              <button
                type="button"
                onClick={() => {
                  setIndex(i);
                  setFailed(false);
                }}
                aria-label={`Show photo ${i + 1} of ${images.length}`}
                aria-current={i === index}
                className={cn(
                  "size-tile-lg shrink-0 overflow-hidden rounded-control border",
                  "transition-colors duration-fast",
                  "focus-visible:outline-none focus-visible:outline-focus",
                  i === index ? "border-action" : "border-border hover:border-action-line",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={src} alt="" loading="lazy" className="size-full object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** "90 min" reads worse than "1 hr 30 min" once past an hour. */
function formatDuration(minutes: number): string {
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const rest = minutes % 60;
  if (rest === 0) return `${hours} hr`;
  return `${hours} hr ${rest} min`;
}
