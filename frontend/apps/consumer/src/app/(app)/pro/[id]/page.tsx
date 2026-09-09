"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, BadgeCheck, Briefcase, MapPin, Wrench } from "lucide-react";
import { REVIEWS_ARE_PLACEHOLDER, getProReviews, getPublicPro } from "@cfc/mocks";
import type { PublicPro, Review } from "@cfc/types";
import {
  Avatar,
  AvatarFallback,
  Badge,
  ErrorState,
  Skeleton,
  StarRating,
  cn,
  formatCount,
  formatDate,
  initials,
} from "@cfc/ui";

/**
 * Customer 13 — Pro profile.
 *
 * Inventory: "Bio, skill tags, rating, reviews, job count, verified badge."
 *
 * Reached from a booking or a service, never from a directory — there is no
 * "browse professionals" screen in the inventory, and a customer does not pick
 * their own pro: auto-assign offers the job to the three nearest and the first
 * to accept wins. So this answers "who is coming?", not "who should I choose?".
 *
 * The data comes from `getPublicPro`, a deliberate projection. The admin shape
 * for the same professional carries their bank account, IFSC, UPI id, total
 * earnings, pending payout and warning count — none of which is a customer's
 * business, and all of which would be one network-tab click away if this screen
 * fetched the admin object and rendered part of it.
 */

export default function ProProfilePage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const id = params.id;

  const [pro, setPro] = React.useState<PublicPro | null>(null);
  const [reviews, setReviews] = React.useState<Review[] | null>(null);
  const [error, setError] = React.useState(false);

  React.useEffect(() => {
    Promise.all([getPublicPro(id), getProReviews(id)])
      .then(([p, r]) => {
        if (p === null) {
          setError(true);
          return;
        }
        setPro(p);
        setReviews(r);
      })
      .catch(() => setError(true));
  }, [id]);

  if (error) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-12 md:px-6">
        <ErrorState
          title="This profile is not available"
          description="The professional may no longer be taking bookings."
          action={{ label: "Browse services", onClick: () => router.push("/categories") }}
        />
      </div>
    );
  }

  if (pro === null) {
    return (
      <div className="mx-auto max-w-screen-md px-4 py-6 md:px-6">
        <Skeleton className="h-block-md rounded-card" />
        <Skeleton className="mt-3 h-block-sm rounded-card" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-md px-4 pb-tab-bar pt-4 md:px-6 md:pb-12">
      <button
        type="button"
        onClick={() => router.back()}
        className="inline-flex items-center gap-1 text-caption text-ink-muted hover:text-action"
      >
        <ArrowLeft className="size-3" aria-hidden="true" />
        Back
      </button>

      {/* Identity. */}
      <section className="mt-3 rounded-card border border-border bg-surface p-4">
        <div className="flex items-start gap-4">
          <Avatar className="size-tile-lg shrink-0">
            <AvatarFallback className="text-heading">
              {initials(pro.name)}
            </AvatarFallback>
          </Avatar>

          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-heading font-semibold text-ink">{pro.name}</h1>
              {/* The badge means KYC cleared, which is a real check the
                  platform performs — not a marketing flourish. */}
              {pro.verified && (
                <Badge tone="live" dot>
                  <BadgeCheck className="size-3" aria-hidden="true" />
                  Verified
                </Badge>
              )}
            </div>

            {pro.rating > 0 ? (
              <StarRating value={pro.rating} size="md" className="mt-1" />
            ) : (
              <p className="mt-1 text-caption text-ink-muted">
                New to the platform
              </p>
            )}

            <p className="mt-1 flex items-center gap-1 text-caption text-ink-muted">
              <MapPin className="size-3 shrink-0" aria-hidden="true" />
              Works in {pro.area}
            </p>
          </div>
        </div>

        {/* The three numbers a customer weighs. Jobs completed is the most
            persuasive of them, so it leads. */}
        <dl className="mt-4 grid grid-cols-3 gap-px overflow-hidden rounded-control border border-border bg-border">
          <Stat
            label="Jobs done"
            value={formatCount(pro.jobsCompleted)}
            icon={<Briefcase />}
          />
          <Stat
            label={pro.experienceYears === 1 ? "Year of work" : "Years of work"}
            value={String(pro.experienceYears)}
            icon={<Wrench />}
          />
          <Stat
            label="With CFC since"
            value={formatDate(pro.joinedAt, "monthYear")}
          />
        </dl>
      </section>

      {/* Bio. */}
      {pro.bio.trim() !== "" && (
        <section className="mt-4 rounded-card border border-border bg-surface p-4">
          <h2 className="text-small font-semibold text-ink">About</h2>
          <p className="mt-2 text-small leading-relaxed text-ink-muted">
            {pro.bio}
          </p>
        </section>
      )}

      {/* Skill tags. */}
      {pro.services.length > 0 && (
        <section className="mt-4 rounded-card border border-border bg-surface p-4">
          <h2 className="text-small font-semibold text-ink">What they do</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {pro.services.map((service) => (
              <li key={service}>
                <Badge tone="neutral">{service}</Badge>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Reviews. */}
      <section className="mt-4">
        <h2 className="text-heading font-semibold text-ink">Reviews</h2>
        <p className="text-caption text-ink-muted">
          {REVIEWS_ARE_PLACEHOLDER
            ? "Sample content — real reviews appear once jobs are completed."
            : "From customers whose jobs this professional completed."}
        </p>

        {reviews === null ? (
          <div className="mt-2 space-y-2">
            {Array.from({ length: 3 }, (_, i) => (
              <Skeleton key={i} className="h-block-xs rounded-card" />
            ))}
          </div>
        ) : reviews.length === 0 ? (
          <p className="mt-2 text-small text-ink-muted">
            No reviews yet.
          </p>
        ) : (
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
                <p className="mt-2 text-caption text-ink-muted">
                  {r.authorName} · {r.serviceName}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* No "book this professional" button.
          Auto-assign offers a job to the three nearest pros and the first to
          accept wins — a customer cannot request one, and a button implying
          otherwise would fail every time it was pressed. */}
      <div className="mt-6 rounded-card border border-border bg-canvas p-4">
        <p className="text-small text-ink">
          Book the service you need and we will match you with a verified
          professional nearby.
        </p>
        <Link
          href="/categories"
          className={cn(
            "mt-2 inline-flex h-touch items-center rounded-control px-4",
            "bg-action text-small font-medium text-on-action",
            "transition-opacity duration-fast hover:opacity-90",
          )}
        >
          Browse services
        </Link>
      </div>
    </div>
  );
}

function Stat({
  label,
  value,
  icon,
}: {
  label: string;
  value: string;
  icon?: React.ReactNode | undefined;
}) {
  return (
    <div className="bg-surface p-3 text-center">
      {icon !== undefined && (
        <span
          className="mx-auto mb-1 flex size-4 items-center justify-center text-ink-faint [&>svg]:size-4"
          aria-hidden="true"
        >
          {icon}
        </span>
      )}
      <dd className="tabular text-small font-semibold text-ink">{value}</dd>
      <dt className="text-caption leading-tight text-ink-muted">{label}</dt>
    </div>
  );
}
