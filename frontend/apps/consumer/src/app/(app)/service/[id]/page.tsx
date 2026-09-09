"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  ArrowLeft,
  BadgeCheck,
  Check,
  Clock,
  ShieldCheck,
} from "lucide-react";
import { getReviews, getService, getServiceFaqs } from "@cfc/mocks";
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
} from "@cfc/ui";

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

  const load = React.useCallback(() => {
    setError(false);
    Promise.all([getService(id), getServiceFaqs(id), getReviews(4)])
      .then(([s, f, r]) => {
        // The empty scenario resolves this to null, which for a detail screen
        // means the same thing as a 404.
        if (s === null) {
          setError(true);
          return;
        }
        setService(s);
        setFaqs(f);
        setReviews(r);
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
        <Skeleton className="h-block-md rounded-card" />
        <Skeleton className="mt-4 h-4 w-line-lg" />
        <Skeleton className="mt-2 h-4 w-full max-w-line-2xl" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 pb-tab-bar pt-4 md:px-6 md:pb-12 lg:px-8">
      <Link
        href="/categories"
        className="inline-flex items-center gap-1 text-caption text-ink-muted hover:text-action"
      >
        <ArrowLeft className="size-3" aria-hidden="true" />
        {service.categoryName}
      </Link>

      <div className="mt-3 grid gap-6 lg:grid-cols-[minmax(0,1fr)_360px]">
        {/* ── Left: what it is ─────────────────────────────────────────── */}
        <div className="min-w-0 space-y-6">
          <div className="overflow-hidden rounded-card border border-border bg-canvas">
            <div className="aspect-card bg-action-subtle" aria-hidden="true" />
          </div>

          <div>
            <p className="text-caption text-ink-muted">
              {service.subCategoryName}
            </p>
            <h1 className="mt-1 text-title font-semibold text-ink">
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
              <h2 className="text-heading font-semibold text-ink">
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
              <h2 className="mb-2 text-heading font-semibold text-ink">
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
}: {
  variants: ServiceVariant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  basePricePaise: number;
  totalPaise: number;
  durationMinutes: number | null;
  onBook: () => void;
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

      <Button variant="primary" className="mt-4 hidden w-full lg:flex" onClick={onBook}>
        Book this service
      </Button>

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
}: {
  totalPaise: number;
  onBook: () => void;
}) {
  return (
    <div
      // Sits directly on top of the 56px tab bar, plus the iOS safe area.
      style={{ bottom: "calc(56px + env(safe-area-inset-bottom))" }}
      className={cn(
        "fixed inset-x-0 z-sticky border-t border-border bg-surface px-4 py-3 lg:hidden",
        "flex items-center justify-between gap-4",
      )}
    >
      <div className="min-w-0">
        <p className="text-caption text-ink-muted">Starting at</p>
        <p className="tabular text-heading font-semibold text-ink">
          {formatCurrency(totalPaise)}
        </p>
      </div>
      <Button variant="primary" className="shrink-0" onClick={onBook}>
        Book now
      </Button>
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

function ReviewList({ reviews }: { reviews: Review[] | null }) {
  if (reviews === null || reviews.length === 0) return null;

  return (
    <section>
      <h2 className="text-heading font-semibold text-ink">Recent reviews</h2>
      <ul className="mt-2 space-y-3">
        {reviews.map((r) => (
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
    </section>
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
