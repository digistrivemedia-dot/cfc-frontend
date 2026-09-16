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
} from "@cfc/ui";
import { useCart } from "@/lib/cart";

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

  /* The booking card renders inline on phones, below the photograph, because
     there is no right column there for it to sit in. Same component, same
     controls as the desktop card - only its position differs.

     There is deliberately NO sticky action bar on this screen any more. The
     floating checkout bar is the one fixed element, exactly as on desktop:
     the card is where a customer chooses and books, and the bar appears only
     once something is in the cart. Two fixed bars competing for the bottom of
     a phone screen was the whole problem. */

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
      <div className="cfc-wrap py-12">
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
      <div className="cfc-wrap py-6">
        {/* `aspect-card`, matching the gallery it stands in for: a fixed-height
            skeleton made the page jump the moment the photograph arrived. */}
        <Skeleton className="aspect-card w-full rounded-card" />
        <Skeleton className="mt-4 h-4 w-line-lg" />
        <Skeleton className="mt-2 h-4 w-full max-w-line-2xl" />
      </div>
    );
  }

  return (
    /* `cfc-band-wash` is the home page's pale-teal ground. White cards on a
       tinted ground is the construction that makes a card read as PLACED on
       the page rather than outlined on it. */
    <div className="cfc-band cfc-band-wash min-h-screen pt-4 md:pb-12">
      <div className="cfc-wrap">
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
          {/* TITLE BEFORE PHOTO.

              It used to be photo first, and at 1360px that meant the first
              glance landed on a stock picture of a technician: the service
              name, the price and the rating were all below the fold. A
              customer who clicked "AC service & repair" already knows what an
              AC looks like - what they came to check is what it is, what it
              costs and whether other people rate it. The photo supports that
              answer; it is not the answer. */}
          <div>
            <p className="text-caption text-ink-muted">
              {service.subCategoryName}
            </p>
            <h1 className="mt-1 text-title font-bold tracking-tight text-ink md:text-title-lg">
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
              {service.warrantyDays > 0 && (
                <span className="cfc-badge cfc-badge-teal">
                  {service.warrantyDays}-day warranty
                </span>
              )}
              {/* ORANGE, and the only orange on the screen. The approved home
                  page spends it in four places across 6,000px; this screen
                  spends it once, on the thing that actually persuades - that
                  other people book this. A second orange mark would halve the
                  value of the first. */}
              {service.reviewCount >= 100 && (
                <span className="cfc-badge cfc-badge-promo">Most booked</span>
              )}
            </div>

            <p className="mt-3 text-body leading-relaxed text-ink-muted">
              {service.description}
            </p>
          </div>

          {/* Nothing is drawn over the photograph.

              Badges on the image were tried and removed: a stock photo is an
              unknown background, so a badge on it needs a scrim to stay
              legible, and the scrim dims the picture to carry text that reads
              better beside the title anyway. Marketplaces that do this own
              their photography and shoot for it. We do not. */}
          <ServiceGallery images={service.imageUrls} name={service.name} />

          {/* The booking card, inline, on phones only. The desktop renders the
              same component in the right column below. */}
          <div className="lg:hidden">
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
              }}
            />
          </div>

          {service.inclusions.length > 0 && (
            /* A white card on the page's wash ground, the way the home page
               builds every list. Flat text on flat white was the single
               biggest reason this screen read duller than the home page. */
            <section className="cfc-card cfc-card-pad">
              <h2 className="text-heading font-semibold text-ink md:text-heading-lg">
                What is included
              </h2>
              <ul className="mt-3 space-y-2">
                {service.inclusions.map((line) => (
                  <li key={line} className="flex items-start gap-2 text-small text-ink">
                    <Check
                      className="mt-px size-4 shrink-0 text-action"
                      aria-hidden="true"
                    />
                    <span>{line}</span>
                  </li>
                ))}
              </ul>

              {/* The trust chips belong to this card.

                  They used to float between two cards, owned by neither, and
                  read as debris left on the page. They are claims ABOUT what
                  is included, so they sit under the list they qualify. */}
              <div className="mt-4 border-t border-border pt-4">
                <TrustRow />
              </div>
            </section>
          )}

          {faqs !== null && faqs.length > 0 && (
            <section className="cfc-card cfc-card-pad">
              <h2 className="mb-3 text-heading font-semibold text-ink md:text-heading-lg">
                Common questions
              </h2>
              {/* S4: the shared Accordion already divides its rows, but it
                  also draws its own card border - inside ours that is two
                  frames around one list. The negative margin cancels the
                  outer padding so the rows run the full width of the card,
                  and the ring removes the duplicate border. */}
              <div className="-mx-4 -mb-4 [&>*]:rounded-none [&>*]:border-0 [&>*]:border-t">
              <Accordion
                items={faqs.map((f) => ({
                  id: f.id,
                  question: f.question,
                  answer: f.answer,
                }))}
              />
              </div>
            </section>
          )}

          <ReviewList reviews={reviews} />
        </div>

        {/* ── Right: what it costs, and booking ────────────────────────── */}
        <div className="hidden lg:sticky lg:top-bar-tall lg:block lg:self-start">
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
            }}
          />
        </div>
      </div>

      {/* The phone equivalent of the sticky card: price and one action,
          sitting above the tab bar. */}
      </div>
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
    /* P3: a heavier shadow than a content card. This is the most important
       element on the screen and it had the lightest treatment of anything on
       it. */
    <div className="cfc-card p-4 shadow-md">
      {/* C3: "Starting at" is only true before a choice is made. Once an
          option is selected this shows that option's price - and on the 2-ton
          window unit, the DEAREST one, it was still labelled "Starting at".
          The label now follows the number it describes. */}
      <p className="text-caption text-ink-muted">
        {selectedId === null ? "Starting at" : "Total"}
      </p>
      {/* The price is the second thing a customer looks for after the name,
          so it carries the weight the home page's booked rail gives it. */}
      <p className="cfc-price-lg">{formatCurrency(totalPaise)}</p>
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
                /* The native radio is hidden rather than styled.
                   `accent-action` only recolours the DOT; the ring around it
                   stays the browser's own dark grey, which is the black ring
                   that showed on every unselected option. A drawn dot is the
                   only way to control both. The input stays in the DOM,
                   focusable and announced, so keyboard and screen-reader
                   behaviour is unchanged. */
                <label
                  key={v.id}
                  className={cn("cfc-row", isSelected && "is-selected")}
                >
                  <input
                    type="radio"
                    name="variant"
                    value={v.id}
                    checked={isSelected}
                    onChange={() => onSelect(v.id)}
                    className="sr-only"
                  />
                  <span className="cfc-radio" aria-hidden="true" />
                  <span className="min-w-0 flex-1">
                    <span className="block text-small font-semibold text-ink">
                      {v.name}
                    </span>
                    <span className="tabular block text-caption text-ink-muted">
                      {formatDuration(v.durationMinutes)}
                    </span>
                  </span>
                  <span className="cfc-price shrink-0">
                    {formatCurrency(price)}
                  </span>
                </label>
              );
            })}
          </div>
        </fieldset>
      )}

      {/* ONE ROW: quantity on the left, the decision on the right.

          These were stacked - a full-width Book button with a stepper on its
          own line beneath. Two full-width controls one above the other read as
          two competing decisions, and the stack cost a whole row of height in
          a card that has to stay above the fold.

          Side by side, the hierarchy is stated by width rather than by order:
          the stepper takes only what it needs, Book takes the rest. */}
      {/* `hidden lg:flex` before: the Add button, the quantity stepper and
          Book were DESKTOP ONLY, because a separate fixed bar used to carry
          them on a phone. That bar is gone, so this row has to serve both -
          and without it a mobile customer saw a price and three variants with
          no way to add anything at all. */}
      <div className="mt-4 flex items-center gap-2">
        {inCart && (
          /* A teal edge and a teal wash, matching the selected option rows
             directly above it. `border-border` on `bg-canvas` was a near-white
             line on a near-white ground - invisible at this size, so the minus,
             the number and the plus read as three loose controls floating in
             the card rather than one stepper. It also has to hold its own
             beside a solid teal button; a hairline could not. */
          <div className="flex h-12 shrink-0 items-center gap-1 rounded-control border border-action-line bg-surface px-1">
            <button
              type="button"
              aria-label="Remove one"
              onClick={() => onQuantityChange(quantity - 1)}
              className={cn(
                "flex size-8 items-center justify-center rounded-control text-action",
                "transition-colors duration-fast hover:bg-action-subtle",
                "focus-visible:outline-none focus-visible:outline-focus",
                "disabled:opacity-40",
              )}
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            {/* The number only. What it means is said by the checkout bar. */}
            <span
              className="tabular w-5 text-center text-body font-bold text-ink"
              aria-live="polite"
            >
              {quantity}
            </span>
            <button
              type="button"
              aria-label="Add another"
              onClick={() => onQuantityChange(quantity + 1)}
              className={cn(
                "flex size-8 items-center justify-center rounded-control text-action",
                "transition-colors duration-fast hover:bg-action-subtle",
                "focus-visible:outline-none focus-visible:outline-focus",
              )}
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
        )}

        {/* Booking now is for someone who has decided; adding to the basket is
            for someone collecting several jobs. Once something IS in the
            basket the Add button has done its work and the stepper replaces
            it, so only one of the two ever shows. */}
        {!inCart && (
          <Button
            variant="secondary"
            className="shrink-0 px-4"
            onClick={onAdd}
            aria-label="Add to cart"
          >
            <Plus className="size-4" />
            Add
          </Button>
        )}

        {/* `h-12` to match the stepper exactly: the shared Button preset is
            44px and the stepper is 48px, so without this the two controls sat
            at different heights on the same row - the thing that made the pair
            look unfinished rather than designed. */}
        <Button
          variant="primary"
          className="h-12 min-w-0 flex-1 text-body"
          onClick={onBook}
        >
          Book this service
        </Button>
      </div>

      <p className="mt-3 text-caption text-ink-faint">
        You pay after the job is done. Anything extra is quoted first.
      </p>
    </div>
  );
}

/** The three promises, each one a documented rule. */
function TrustRow() {
  /*
    Three trust claims, and deliberately NOT styled the same.

    The client's service-detail mockup shows two outline chips and ONE solid
    blue fill, and the solid one is the verification claim. That break is the
    point: it makes the claim a customer most needs to believe the thing their
    eye lands on. Flattening all three to one style - which is what this was
    before - spends the contrast and buys nothing.
  */
  /* The warranty is NOT repeated here. It is stated beside the title, 400px
     up the same column; saying it twice made the page look padded rather than
     reassuring. These are the two claims that are not stated anywhere else. */
  const items = [
    { icon: BadgeCheck, label: "Verified professional", solid: true },
    { icon: Check, label: "Closed with your code", solid: false },
  ];

  return (
    <ul className="flex flex-wrap gap-2">
      {items.map(({ icon: Icon, label, solid }) => (
        <li
          key={label}
          className={cn(
            "cfc-chip",
            solid ? "cfc-chip-solid" : "cfc-chip-outline",
          )}
        >
          <Icon className="size-4 shrink-0" aria-hidden="true" />
          <span>{label}</span>
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
    /* Reviews was the only major section without a card: it floated on the
       page background while everything above it sat on white, which made the
       page look like it had run out halfway down. */
    <section className="cfc-card cfc-card-pad">
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
      {/* Rows divided by a hairline, not nested cards. A bordered box inside
          a bordered card is two frames around one thing. */}
      <ul className="mt-3 divide-y divide-border">
        {shown.map((r) => (
          <li key={r.id} className="py-4 first:pt-0 last:pb-0">
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
      {/* Full column width at every size. The 560px cap that was here solved
          the height problem by shrinking the whole photo, which left a band of
          empty page down both sides on a desktop - the image looked marooned
          rather than placed. The ratio does that job instead: see below. */}
      <div className="cfc-media border border-border bg-canvas">
        {hasPhoto ? (
          /* eslint-disable-next-line @next/next/no-img-element */
          <img
            src={shown}
            alt={name}
            /* The hero image of the screen a customer decided to open, so it
               is the one image on the page that must not be lazy. */
            /* Every source photo in the catalogue is 1200x900 - a single,
               consistent 4:3. So 4:3 is the RATIO, and it is kept: cropping
               to 16:9 on desktop threw away a third of a frame that was
               composed for 4:3, and on this photo that is the technician's
               hands and the unit he is working on.

               What was actually wrong was SIZE, not shape. The column is
               ~830px wide, so 4:3 made the photo 620px tall and pushed the
               title below the fold. Capping the height crops the frame
               centrally instead of shrinking the whole card. */
            /* RATIO BY DEVICE, which is what every marketplace does.

               A phone is a tall narrow column, so a 4:3 photo fills its width
               and stays a sensible height - that is why it looks right there,
               and it is kept below 900px.

               A desktop column is ~830px wide. At 4:3 that is a 620px-tall
               photo that dominates the fold; capping its width instead left
               empty page down both sides. 3:2 is the answer at that size - a
               classic photographic ratio (35mm), wide enough to fill the
               column at a comfortable 550px, and a gentler crop of a 4:3
               source than 16:9, which would cut a third of the frame.

               The source stays 1200x900 and is cropped by object-fit, so no
               new artwork is needed for this to work. */
            className="aspect-card w-full object-cover cfc-md:aspect-banner"
            onError={() => setFailed(true)}
          />
        ) : (
          <div
            className="flex aspect-card items-center justify-center bg-action-subtle cfc-md:aspect-banner"
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
