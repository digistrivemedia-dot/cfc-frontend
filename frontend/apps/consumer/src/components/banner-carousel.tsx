"use client";

import * as React from "react";
import Link from "next/link";
import { getServices, getSubCategories } from "@cfc/mocks";
import type { Banner, ServiceDetail, SubCategory } from "@cfc/types";
import { cn } from "@cfc/ui";

/**
 * Auto-advancing banner carousel.
 *
 * Shows one banner at a time with smooth slide transitions, dot indicators,
 * and auto-advance every 5 seconds. Pauses on hover (desktop) and touch
 * (mobile). Swipe-to-advance on mobile via touch delta detection.
 */
export function BannerCarousel({ banners }: { banners: Banner[] }) {
  const [current, setCurrent] = React.useState(0);
  const [paused, setPaused] = React.useState(false);
  const touchRef = React.useRef<number | null>(null);
  const count = banners.length;

  /**
   * What a banner's `linkTarget` actually resolves to.
   *
   * Admin's banner editor stores a service or category by NAME, not id -
   * `linkTarget: "AC service & repair"`, not a service id. Building the href
   * by string-concatenating that name straight into `/service/${linkTarget}`
   * or `/categories?cat=${linkTarget}` produced a URL that always 404'd (a
   * service route needs an id) or landed on the unfiltered catalogue (a
   * category name is not a `?sub=` value /categories understands). Both are
   * looked up against the real catalogue here instead.
   */
  const [services, setServices] = React.useState<ServiceDetail[] | null>(null);
  const [subCategories, setSubCategories] = React.useState<SubCategory[] | null>(null);

  React.useEffect(() => {
    getServices().then(setServices).catch(() => setServices([]));
    getSubCategories().then(setSubCategories).catch(() => setSubCategories([]));
  }, []);

  // Auto-advance.
  React.useEffect(() => {
    if (paused || count <= 1) return;
    const timer = setInterval(() => {
      setCurrent((c) => (c + 1) % count);
    }, 5000);
    return () => clearInterval(timer);
  }, [paused, count]);

  const goTo = (i: number) => setCurrent(i);
  const next = () => setCurrent((c) => (c + 1) % count);
  const prev = () => setCurrent((c) => (c - 1 + count) % count);

  const hrefFor = (b: Banner): string => {
    if (b.linkType === "service") {
      // `linkTarget` is the service's name; find the id `/service/[id]`
      // actually needs. Falls back to the catalogue rather than a broken
      // link if a banner names a service that no longer exists.
      const match = services?.find((s) => s.name === b.linkTarget);
      return match ? `/service/${match.id}` : "/categories";
    }
    if (b.linkType === "category") {
      // `linkTarget` is an ADMIN category name ("Home & Maintenance") - a
      // pricing/commission grouping, not something /categories browses
      // directly (see that screen's header comment: it shows the ten real
      // sub-categories only). Resolved to that admin category's first
      // sub-category, so the banner still lands somewhere real rather than
      // on a `?cat=` param nothing reads any more.
      const match = subCategories?.find((s) => s.categoryName === b.linkTarget);
      return match ? `/categories?sub=${encodeURIComponent(match.name)}` : "/categories";
    }
    return "/categories";
  };

  return (
    <div
      className="relative overflow-hidden rounded-card"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onTouchStart={(e) => {
        touchRef.current = e.touches[0]?.clientX ?? null;
      }}
      onTouchEnd={(e) => {
        if (touchRef.current === null) return;
        const delta = (e.changedTouches[0]?.clientX ?? 0) - touchRef.current;
        if (Math.abs(delta) > 50) {
          if (delta < 0) next();
          else prev();
        }
        touchRef.current = null;
      }}
    >
      <div
        className="flex transition-transform duration-carousel ease-in-out"
        style={{ transform: `translateX(-${current * 100}%)` }}
      >
        {banners.map((banner) => (
          <Link
            key={banner.id}
            href={hrefFor(banner)}
            className="relative flex aspect-banner w-full shrink-0 items-end"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={banner.imageUrl}
              alt=""
              loading={current === 0 ? "eager" : "lazy"}
              className="absolute inset-0 size-full object-cover"
            />
            {/* Gradient so text reads over any artwork */}
            <span
              className="absolute inset-0"
              style={{
                background:
                  "linear-gradient(to right, rgba(14,31,61,0.8), rgba(14,31,61,0.4), transparent)",
              }}
              aria-hidden="true"
            />
            <span className="relative p-4 md:p-6">
              <span className="block text-heading font-semibold text-on-structure md:text-title"
                style={{ maxWidth: "280px" }}
              >
                {banner.title}
              </span>
              <span className="mt-1 inline-flex items-center gap-1 text-small font-medium text-on-structure-muted">
                View offer →
              </span>
            </span>
          </Link>
        ))}
      </div>

      {/* Dot indicators */}
      {count > 1 && (
        <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1">
          {banners.map((_, i) => (
            <button
              key={i}
              type="button"
              aria-label={`Go to slide ${i + 1}`}
              onClick={() => goTo(i)}
              className={cn(
                "rounded-full transition-all duration-base",
                i === current
                  ? "bg-on-structure"
                  : "bg-on-structure-faint",
              )}
              style={{
                height: "6px",
                width: i === current ? "24px" : "6px",
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
}
