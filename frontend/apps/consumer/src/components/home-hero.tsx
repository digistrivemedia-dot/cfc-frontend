"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, BadgeCheck, ShieldCheck, Star, Wallet } from "lucide-react";
import { cn, formatCurrency } from "@cfc/ui";

/**
 * The home hero — Design B, editorial.
 *
 * A photograph of the work, at full width, with the promise over it. The
 * difference from a poster is that the search field sits inside the image
 * rather than below it, so the picture is doing a job (establishing what this
 * business is) while the control that matters stays in the first screenful.
 *
 * The image is a real photograph of a service being performed, not a stock
 * abstraction. It is loaded eagerly and given a fetch priority because it is
 * the largest contentful paint on the customer's first screen.
 *
 * Every claim is documented: 30-day warranty, KYC-verified pros, fixed
 * pricing. No invented ratings or customer counts — PLATFORM-FACTS.md lists
 * those under "do not claim".
 */

const PROMISES = [
  { icon: ShieldCheck, label: "30-day warranty" },
  { icon: BadgeCheck, label: "KYC-verified pros" },
  { icon: Wallet, label: "Fixed price upfront" },
] as const;

export function HomeHero({
  area,
  startingPricePaise,
}: {
  area: string | undefined;
  startingPricePaise: number | null;
}) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  return (
    <section className="relative isolate overflow-hidden bg-structure">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/mock/services/deep-home-cleaning.jpg"
        alt=""
        fetchPriority="high"
        className="absolute inset-0 -z-10 size-full object-cover"
      />

      {/* Two overlays doing different jobs: a flat wash for overall contrast,
          and a left-weighted gradient so the text column stays legible while
          the right of the photograph survives. */}
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{ background: "rgba(23,26,60,0.62)" }}
      />
      <div
        aria-hidden="true"
        className="absolute inset-0 -z-10"
        style={{
          background:
            "linear-gradient(100deg, rgba(23,26,60,0.95) 0%, rgba(23,26,60,0.72) 42%, rgba(23,26,60,0.25) 100%)",
        }}
      />

      <div className="mx-auto max-w-screen-xl px-4 py-12 md:px-6 md:py-panel lg:px-8">
        <div className="max-w-screen-md">
          {area && (
            <p className="mb-4 inline-flex items-center gap-2 rounded-pill border border-on-structure-faint px-3 py-1 text-caption font-medium text-on-structure">
              <Star className="size-3 text-brand-bright" aria-hidden="true" />
              Now serving {area}
            </p>
          )}

          <h1 className="text-display font-semibold leading-tight tracking-tight text-on-structure">
            Your home,
            <br />
            in expert hands.
          </h1>

          <p className="mt-4 max-w-screen-sm text-body text-on-structure-muted">
            Verified professionals for repairs, cleaning, beauty and care.
            {startingPricePaise !== null && (
              <>
                {" "}
                Fixed prices from{" "}
                <span className="font-semibold text-on-structure">
                  {formatCurrency(startingPricePaise)}
                </span>
                , shown before you book.
              </>
            )}
          </p>

          <form
            role="search"
            onSubmit={(e) => {
              e.preventDefault();
              const q = query.trim();
              router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
            }}
            className="mt-8 max-w-screen-sm"
          >
            <div className="flex flex-col gap-2 sm:flex-row">
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="What do you need done?"
                aria-label="Search for a service"
                className={cn(
                  "h-touch-lg min-w-0 flex-1 rounded-control bg-surface px-4",
                  "text-body text-ink placeholder:text-ink-faint shadow-lg",
                  "focus:outline-none focus-visible:outline-focus",
                )}
              />
              <button
                type="submit"
                className={cn(
                  "flex h-touch-lg shrink-0 items-center justify-center gap-2 rounded-control bg-brand px-8",
                  "text-body font-semibold text-on-action shadow-lg",
                  "transition-colors duration-fast hover:bg-brand-bright",
                  "focus-visible:outline-none focus-visible:outline-focus",
                )}
              >
                Find a service
                <ArrowRight className="size-4" aria-hidden="true" />
              </button>
            </div>
          </form>

          <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
            {PROMISES.map(({ icon: Icon, label }) => (
              <li
                key={label}
                className="flex items-center gap-2 text-small font-medium text-on-structure"
              >
                <Icon
                  className="size-4 shrink-0 text-brand-bright"
                  aria-hidden="true"
                />
                {label}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
