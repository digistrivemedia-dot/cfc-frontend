"use client";

import * as React from "react";
import Link from "next/link";
import type { Banner } from "@cfc/types";
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

  const hrefFor = (b: Banner) =>
    b.linkType === "category"
      ? `/categories?cat=${b.linkTarget ?? ""}`
      : b.linkType === "service"
        ? `/service/${b.linkTarget ?? ""}`
        : "/categories";

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
