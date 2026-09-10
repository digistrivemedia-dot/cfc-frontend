"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  BadgeCheck,
  Briefcase,
  CalendarDays,
  MapPin,
  ShieldCheck,
  Wrench,
} from "lucide-react";
import { REVIEWS_ARE_PLACEHOLDER, getProReviews, getPublicPro } from "@cfc/mocks";
import type { PublicPro, Review } from "@cfc/types";
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
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
 *
 * **Layout.** This screen was the last one in the consumer app still built as a
 * 768px column: four stacked cards, centred, with half a monitor of empty
 * canvas either side. It is now the same two-column shape the rest of the app
 * uses — who they are pinned in a rail, what they have done in the content
 * column — because the question being asked ("is this person any good?") is
 * answered by comparing the identity against the reviews, and that comparison
 * is impossible when the two are a scroll apart.
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
      <div className="mx-auto max-w-screen-xl px-4 py-12 md:px-6 lg:px-8">
        <ErrorState
          title="This profile is not available"
          description="The professional may no longer be taking bookings."
          action={{ label: "Browse services", onClick: () => router.push("/categories") }}
        />
      </div>
    );
  }

  // The skeleton mirrors the two-column layout rather than standing in for it
  // with two stacked blocks. A loading state that is a different shape from
  // the content it replaces makes the page jump when the data lands.
  if (pro === null) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-6 md:px-6 lg:px-8">
        <div className="grid gap-6 lg:grid-cols-detail">
          <div className="order-2 min-w-0 space-y-4 lg:order-1">
            <Skeleton className="h-block-sm rounded-card" />
            <Skeleton className="h-block-md rounded-card" />
          </div>
          <div className="order-1 lg:order-2">
            <Skeleton className="h-block-md rounded-card" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-screen-xl px-4 pt-4 md:px-6 md:pb-12 lg:px-8">
      <button
        type="button"
        onClick={() => router.back()}
        className={cn(
          "inline-flex h-touch items-center gap-1 text-caption text-ink-muted",
          "transition-colors duration-fast hover:text-action",
          "focus-visible:outline-none focus-visible:outline-focus",
        )}
      >
        <ArrowLeft className="size-3" aria-hidden="true" />
        Back
      </button>

      {/* The identity is the aside and comes SECOND in the DOM: a screen
          reader should reach the professional's name and record before the
          list of what other people said about them. `order-*` puts it on top
          on a phone, where a profile with no face at the top reads as a list
          of reviews belonging to nobody. */}
      <div className="mt-2 grid gap-6 lg:grid-cols-detail lg:items-start">
        {/* ── Content: what they have done ──────────────────────────── */}
        <div className="order-2 min-w-0 space-y-6 lg:order-1">
          {pro.bio.trim() !== "" && (
            <section>
              <h2 className="text-heading font-semibold text-ink md:text-heading-lg">
                About {pro.name.split(" ")[0]}
              </h2>
              <p className="mt-2 text-body leading-relaxed text-ink-muted">
                {pro.bio}
              </p>
            </section>
          )}

          {pro.services.length > 0 && (
            <section>
              <h2 className="text-heading font-semibold text-ink md:text-heading-lg">
                What they do
              </h2>
              {/* The tags name real catalogue services, so they link to them. A
                  customer reading "they do bathroom cleaning" has an obvious
                  next question, and a dead badge answered none of it. */}
              <ul className="mt-3 flex flex-wrap gap-2">
                {pro.services.map((service) => (
                  <li key={service}>
                    <Link
                      href={`/search?q=${encodeURIComponent(service)}`}
                      className={cn(
                        "flex h-field items-center rounded-pill border border-border bg-surface px-3",
                        "text-caption text-ink transition-colors duration-fast",
                        "hover:border-action-line hover:bg-action-subtle hover:text-action",
                        "focus-visible:outline-none focus-visible:outline-focus",
                      )}
                    >
                      {service}
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <ReviewSection pro={pro} reviews={reviews} />
        </div>

        {/* ── Aside: who they are ───────────────────────────────────── */}
        <aside className="order-1 lg:order-2 lg:sticky lg:top-bar-tall">
          <IdentityCard pro={pro} />
        </aside>
      </div>
    </div>
  );
}

/* ────────────────────────────────────────────────────────────────────────── */

/**
 * Who is coming.
 *
 * Photograph, name, verification, rating and the three numbers a customer
 * weighs — in one card, so on a desktop the whole answer stays on screen while
 * they read the reviews beside it.
 */
function IdentityCard({ pro }: { pro: PublicPro }) {
  return (
    <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
      {/* A navy cap so the avatar has something to sit against. Without it the
          photograph floated on white and the card had no top. */}
      <div className="relative h-block-xs bg-structure">
        <div
          aria-hidden="true"
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse 80% 140% at 20% 0%, rgba(0,184,196,0.28) 0%, transparent 60%)",
          }}
        />
      </div>

      <div className="px-4 pb-4">
        {/* Pulled up over the navy cap. */}
        <Avatar className="-mt-8 size-tile-lg border-4 border-surface">
          {/* `photoUrl` is on `PublicPro` and was simply never rendered, so
              every professional showed initials regardless of whether they
              had uploaded a photograph. */}
          {pro.photoUrl !== null && <AvatarImage src={pro.photoUrl} alt="" />}
          <AvatarFallback className="text-heading">
            {initials(pro.name)}
          </AvatarFallback>
        </Avatar>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <h1 className="text-title font-semibold tracking-tight text-ink">
            {pro.name}
          </h1>
          {/* The badge means KYC cleared, which is a real check the platform
              performs — not a marketing flourish. */}
          {pro.verified && (
            <Badge tone="live" dot>
              <BadgeCheck className="size-3" aria-hidden="true" />
              Verified
            </Badge>
          )}
        </div>

        {pro.rating > 0 ? (
          <StarRating value={pro.rating} size="md" className="mt-2" />
        ) : (
          <p className="mt-2 text-caption text-ink-muted">
            New to the platform
          </p>
        )}

        <p className="mt-2 flex items-center gap-1 text-small text-ink-muted">
          <MapPin className="size-4 shrink-0 text-action" aria-hidden="true" />
          Works in {pro.area}
        </p>

        {/* The three numbers a customer weighs. Jobs completed is the most
            persuasive of them, so it leads. Stays three across at every width:
            the labels are short and the row is never wider than the rail. */}
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
            icon={<CalendarDays />}
          />
        </dl>

        {/* No "book this professional" button.
            Auto-assign offers a job to the three nearest pros and the first to
            accept wins — a customer cannot request one, and a button implying
            otherwise would fail every time it was pressed. */}
        <div className="mt-4 rounded-control border border-border bg-canvas p-3">
          <p className="flex items-start gap-2 text-small text-ink">
            <ShieldCheck
              className="mt-px size-4 shrink-0 text-live-ink"
              aria-hidden="true"
            />
            <span>
              Book the service you need and we will match you with a verified
              professional nearby.
            </span>
          </p>
          <Link
            href="/categories"
            className={cn(
              "mt-3 flex h-touch w-full items-center justify-center rounded-control px-4",
              "bg-action text-small font-semibold text-on-action",
              "transition-colors duration-fast hover:bg-action-hover",
              "focus-visible:outline-none focus-visible:outline-focus",
            )}
          >
            Browse services
          </Link>
        </div>
      </div>
    </div>
  );
}

/**
 * Reviews, with the distribution summarised above them.
 *
 * A bare list answers "what did people say" but not "how many, and how
 * consistently" — which is the question a rating is actually shorthand for.
 *
 * The two numbers in the summary measure DIFFERENT things, and the labels say
 * so rather than implying otherwise. `pro.rating` is the professional's
 * lifetime average across every job they have completed; the bars below it
 * cover only the handful of reviews on this screen. They legitimately differ -
 * a pro rated 4.2 overall can easily have five recent reviews averaging 4.7.
 *
 * An earlier version of this comment claimed the summary "is computed from the
 * reviews on screen, so it can never disagree with the list beneath it". That
 * was simply false: the headline has always been `pro.rating`, and measured
 * drift between the two reached 0.5 stars. A wrong comment is worse than none,
 * because the next person trusts it instead of the code.
 */
function ReviewSection({
  pro,
  reviews,
}: {
  pro: PublicPro;
  reviews: Review[] | null;
}) {
  const spread = React.useMemo(() => {
    if (!reviews || reviews.length === 0) return null;
    const counts = [0, 0, 0, 0, 0];
    for (const r of reviews) {
      const i = Math.min(4, Math.max(0, Math.round(r.rating) - 1));
      counts[i] = (counts[i] ?? 0) + 1;
    }
    return counts;
  }, [reviews]);

  return (
    <section>
      <h2 className="text-heading font-semibold text-ink md:text-heading-lg">
        Reviews
      </h2>
      <p className="mt-1 text-small text-ink-muted">
        {REVIEWS_ARE_PLACEHOLDER
          ? "Sample content — real reviews appear once jobs are completed."
          : "From customers whose jobs this professional completed."}
      </p>

      {reviews === null ? (
        <div className="mt-3 space-y-3">
          {Array.from({ length: 3 }, (_, i) => (
            <Skeleton key={i} className="h-block-xs rounded-card" />
          ))}
        </div>
      ) : reviews.length === 0 ? (
        <p className="mt-3 rounded-card border border-border bg-surface p-4 text-small text-ink-muted">
          No reviews yet.
        </p>
      ) : (
        <>
          {spread !== null && pro.rating > 0 && (
            <div className="mt-3 flex flex-col gap-4 rounded-card border border-border bg-surface p-4 sm:flex-row sm:items-center">
              <div className="shrink-0 text-center sm:w-clock">
                <p className="tabular text-display font-semibold leading-none text-ink">
                  {pro.rating.toFixed(1)}
                </p>
                <StarRating
                  value={pro.rating}
                  starsOnly
                  className="mt-2 justify-center"
                />
                {/* "Overall", not a count of the reviews listed below - this
                    figure spans every job the professional has completed,
                    while the bars beside it cover only what is on screen. */}
                <p className="mt-1 text-caption text-ink-muted">
                  Overall rating
                </p>
              </div>

              {/* Five bars, highest first — the shape people expect. Scoped
                  to the reviews actually listed, which is why this carries its
                  own caption rather than borrowing the headline's. */}
              <div className="min-w-0 flex-1">
                <p className="mb-1 text-caption text-ink-muted">
                  Across {formatCount(reviews.length)}{" "}
                  {reviews.length === 1 ? "review" : "reviews"} shown
                </p>
                <ul className="space-y-1">
                {[5, 4, 3, 2, 1].map((star) => {
                  const n = spread[star - 1] ?? 0;
                  const pct =
                    reviews.length === 0 ? 0 : (n / reviews.length) * 100;
                  return (
                    <li key={star} className="flex items-center gap-2">
                      <span className="tabular w-4 shrink-0 text-caption text-ink-muted">
                        {star}
                      </span>
                      <span
                        className="h-1 min-w-0 flex-1 overflow-hidden rounded-pill bg-neutral-subtle"
                        aria-hidden="true"
                      >
                        <span
                          className="block h-full rounded-pill bg-star transition-size duration-base"
                          style={{ width: `${pct}%` }}
                        />
                      </span>
                      <span className="tabular w-4 shrink-0 text-right text-caption text-ink-faint">
                        {n}
                      </span>
                    </li>
                  );
                })}
                </ul>
              </div>
            </div>
          )}

          {/* Two columns from `md`: a review is short, and one per row down a
              wide screen wastes the space the rail freed up. */}
          <ul className="mt-3 grid gap-3 md:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
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
                <p className="mt-2 text-small leading-relaxed text-ink">
                  {r.body}
                </p>
                <p className="mt-2 text-caption text-ink-muted">
                  {r.authorName} · {r.serviceName}
                </p>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
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
