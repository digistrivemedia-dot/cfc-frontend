import Link from "next/link";
import {
  ArrowRight,
  BadgeCheck,
  MapPin,
  ShieldCheck,
  Wallet,
} from "lucide-react";
import { cn, formatCurrency } from "@cfc/ui";

/**
 * The hero.
 *
 * A rounded card on the light canvas — the card has edges, so it reads as
 * placed rather than painted on, which is the difference between a designed
 * page and a coloured header.
 *
 * **Built for a phone first.** Around ninety per cent of traffic is mobile, and
 * every earlier version treated that as the degraded case: the photograph was
 * `hidden lg:block`, so the majority of visitors got a navy box with text in it
 * and no picture at all. Here the image is part of the card at every width — it
 * simply sits above the copy on a phone and beside it on a desktop.
 *
 * **No search field.** The header already carries one, fixed to the top of every
 * screen. A second identical box two hundred pixels below it is not a second
 * chance to search, it is the same control drawn twice — and on a phone it cost
 * a third of the first screenful. The hero's job is to send someone into the
 * catalogue, so it offers the one action that does that.
 *
 * The copy leads with price certainty because that is the real anxiety in home
 * services: not whether someone will turn up, but what they will charge once
 * they have. It is also a promise this platform can actually keep — pricing is
 * fixed and confirmed before a booking is placed. Everything stated here is
 * documented; PLATFORM-FACTS.md forbids invented ratings and customer counts,
 * so there are none.
 *
 * A server component. It holds no state and no handlers, so there is no reason
 * to ship it to the browser.
 */

const PROMISES = [
  { icon: Wallet, label: "Fixed, upfront pricing" },
  { icon: BadgeCheck, label: "Verified professionals" },
  { icon: ShieldCheck, label: "30-day warranty" },
] as const;

export function HomeHero({
  area,
  startingPricePaise,
  topServiceId,
}: {
  area: string | undefined;
  startingPricePaise: number | null;
  /** The most-booked service, so "Book now" leads somewhere real. */
  topServiceId: string | undefined;
}) {
  return (
    <section className="bg-canvas">
      <div className="mx-auto max-w-screen-xl px-4 pb-6 pt-6 md:px-6 md:pt-8 lg:px-8">
        <div className="mb-4 flex flex-wrap items-baseline justify-between gap-2">
          <h1 className="text-title font-semibold tracking-tight text-ink md:text-title-lg">
            What can we help you with?
          </h1>
          {area && (
            <p className="flex items-center gap-1 text-small text-ink-muted">
              <MapPin
                className="size-4 shrink-0 text-action"
                aria-hidden="true"
              />
              Serving {area}
            </p>
          )}
        </div>

        <div className="relative isolate overflow-hidden rounded-card bg-structure">
          {/* Two light sources at opposite corners give the card a diagonal
              fall-off rather than a flat field of navy. */}
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 70% 120% at 5% 0%, rgba(0,184,196,0.22) 0%, transparent 58%)",
            }}
          />
          <div
            aria-hidden="true"
            className="absolute inset-0 -z-10"
            style={{
              background:
                "radial-gradient(ellipse 80% 120% at 95% 100%, rgba(37,99,235,0.34) 0%, transparent 62%)",
            }}
          />

          {/* The copy comes first in the DOM — it is the substance, and a
              screen reader should reach the headline before a decorative
              photograph. `order-*` puts the image on top visually on a phone
              and back on the right from `lg`, so reading order and visual
              order can differ without duplicating the markup. */}
          <div className="flex flex-col lg:grid lg:grid-cols-2 lg:items-center">
            <div className="order-2 p-5 md:p-8 lg:order-1">
              <h2 className="text-display font-semibold leading-tight tracking-tight text-on-structure lg:text-display-lg">
                The price you see is{" "}
                <span className="text-brand-bright">the price you pay.</span>
              </h2>

              <p className="mt-3 max-w-screen-sm text-body leading-relaxed text-on-structure-muted">
                Repairs, cleaning, beauty and care
                {startingPricePaise !== null && (
                  <>
                    {" from "}
                    <span className="font-semibold text-on-structure">
                      {formatCurrency(startingPricePaise)}
                    </span>
                  </>
                )}
                {" — agreed before anyone arrives. No call-out fee, no surprises."}
              </p>

              {/* Two actions, sized to their labels rather than stretched to
                  the column. A single full-width button on a wide card reads
                  as a banner rather than a control, and it left the visitor
                  one option where there are really two: browse, or book the
                  thing most people book.

                  They share the row on a phone rather than stacking — both
                  labels are short enough to sit comfortably at half width, and
                  stacking would push the badges below the fold. */}
              <div className="mt-6 flex flex-wrap gap-3">
                <Link
                  href="/categories"
                  className={cn(
                    "flex h-touch flex-1 items-center justify-center gap-2 rounded-control",
                    "bg-brand px-5 text-small font-semibold text-structure",
                    "transition-colors duration-fast hover:bg-brand-bright",
                    "focus-visible:outline-none focus-visible:outline-focus",
                    "sm:flex-none",
                  )}
                >
                  Explore services
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>

                {/* Points at a real service rather than a generic route:
                    `/book` needs an id, so a bare "Book now" link would be a
                    dead end. Falls back to the catalogue until the data
                    arrives, which is also what it does if nothing is
                    bookable. */}
                <Link
                  href={topServiceId ? `/book/${topServiceId}` : "/categories"}
                  className={cn(
                    "flex h-touch flex-1 items-center justify-center gap-2 rounded-control",
                    "border border-on-structure-faint px-5",
                    "text-small font-semibold text-on-structure",
                    "transition-colors duration-fast hover:bg-structure-raised",
                    "focus-visible:outline-none focus-visible:outline-focus",
                    "sm:flex-none",
                  )}
                >
                  Book now
                </Link>
              </div>

              <ul className="mt-6 flex flex-wrap gap-2">
                {PROMISES.map(({ icon: Icon, label }) => (
                  <li
                    key={label}
                    className={cn(
                      "flex items-center gap-2 rounded-pill border border-structure-muted",
                      "bg-structure-raised px-3 py-1",
                      "text-caption font-medium text-on-structure",
                    )}
                  >
                    <Icon
                      className="size-3 shrink-0 text-brand-bright"
                      aria-hidden="true"
                    />
                    {label}
                  </li>
                ))}
              </ul>
            </div>

            {/*
              A real photograph of the work, at every width.

              It was `hidden lg:block` before, so most visitors — the ones on a
              phone — got no image at all. It is also no longer
              `promo-cleaning.png`, which was a piece of finished advertising
              art carrying another company's branding ("SPARKLE & SHINE",
              "HOME GLOW"), its own feature list and its own app-download call
              to action. This one shows a pro mid-job with the cleaned stripe
              visible on the upholstery — the result, not a claim about it —
              and is a fifth of the file size.
            */}
            <div className="order-1 overflow-hidden px-5 pt-5 md:px-8 md:pt-8 lg:order-2 lg:p-8 lg:pl-0">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/mock/services/sofa-carpet-cleaning.jpg"
                alt="A City Family Care professional deep-cleaning upholstery in a customer's living room"
                fetchPriority="high"
                className="aspect-banner w-full rounded-card object-cover"
              />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
