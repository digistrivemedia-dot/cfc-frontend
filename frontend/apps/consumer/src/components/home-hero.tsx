"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, MapPin, Search, ShieldCheck, Wallet } from "lucide-react";
import { cn } from "@cfc/ui";

/**
 * The home hero.
 *
 * A search-first hero, not a poster. The previous version was a full-bleed
 * marketing image with two buttons, one of which ("Search") navigated to a
 * different screen to do the thing the hero could have done itself. A customer
 * who arrives knowing what they want should be able to type it here.
 *
 * Kept deliberately short. A tall photographic hero pushes the services — the
 * actual product — below the fold, and the customer who lands here is trying
 * to book a job, not admire a stock photo.
 *
 * The three promises are the platform's real, documented commitments (30-day
 * warranty, KYC-verified pros, fixed pricing). No invented ratings or customer
 * counts: PLATFORM-FACTS.md lists those under "do not claim".
 */

const PROMISES = [
  { icon: ShieldCheck, label: "30-day warranty" },
  { icon: BadgeCheck, label: "Verified professionals" },
  { icon: Wallet, label: "Fixed price, shown upfront" },
] as const;

export function HomeHero({ area }: { area: string | undefined }) {
  const router = useRouter();
  const [query, setQuery] = React.useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const q = query.trim();
    router.push(q ? `/search?q=${encodeURIComponent(q)}` : "/search");
  }

  return (
    <section className="relative overflow-hidden bg-structure">
      {/* A soft directional wash rather than a photograph. The hero's job here
          is to frame the search field, and a busy image behind an input is
          the fastest way to make the input hard to read. */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 80% 100% at 15% 0%, rgba(37,99,235,0.30) 0%, transparent 65%)",
        }}
      />

      <div className="relative mx-auto max-w-screen-xl px-4 py-8 md:px-6 md:py-12 lg:px-8">
        <h1 className="max-w-line-xl text-display font-semibold leading-tight text-on-structure">
          Home services, <span className="text-brand-bright">done right.</span>
        </h1>
        <p className="mt-2 max-w-line-lg text-body text-on-structure-muted">
          Verified professionals for repairs, cleaning, beauty and care in{" "}
          {area ?? "your area"}.
        </p>

        {/* The search field is the hero's primary control. */}
        <form onSubmit={submit} className="mt-6 max-w-line-2xl" role="search">
          <div className="flex flex-col gap-2 sm:flex-row">
            <div className="relative flex-1">
              <Search
                className="pointer-events-none absolute left-4 top-1/2 size-5 -translate-y-1/2 text-ink-faint"
                aria-hidden="true"
              />
              <input
                type="search"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search for a service — AC, cleaning, salon…"
                aria-label="Search for a service"
                className={cn(
                  "h-touch-lg w-full rounded-control border border-transparent bg-surface pl-12 pr-4",
                  "text-body text-ink placeholder:text-ink-faint",
                  "shadow-md transition-shadow duration-fast",
                  "focus:outline-none focus-visible:outline-focus",
                )}
              />
            </div>
            <button
              type="submit"
              className={cn(
                "h-touch-lg shrink-0 rounded-control bg-brand px-8",
                "text-body font-semibold text-on-action shadow-md",
                "transition-colors duration-fast hover:bg-brand-bright",
                "focus-visible:outline-none focus-visible:outline-focus",
              )}
            >
              Search
            </button>
          </div>
        </form>

        {area && (
          <p className="mt-3 flex items-center gap-1 text-small text-on-structure-muted">
            <MapPin className="size-4 shrink-0 text-brand-bright" aria-hidden="true" />
            Showing professionals near {area}
          </p>
        )}

        <ul className="mt-6 flex flex-wrap gap-x-6 gap-y-2">
          {PROMISES.map(({ icon: Icon, label }) => (
            <li
              key={label}
              className="flex items-center gap-2 text-small text-on-structure-muted"
            >
              <Icon className="size-4 shrink-0 text-brand-bright" aria-hidden="true" />
              {label}
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
