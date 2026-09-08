"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  CheckCircle2,
  Star,
  Wrench,
  Home,
  Sparkles,
  HeartPulse,
  Zap,
  ChevronRight,
  ChevronLeft,
} from "lucide-react";
import { Button } from "@cfc/ui";

/**
 * Consumer Screen 2 — Onboarding Walkthrough.
 *
 * Inventory: "One Step Solution, Verified Pros, 30-Day Warranty highlights."
 *
 * Desktop: Full marketing page — hero + 3 feature cards + CTA.
 * Mobile:  3-slide swipeable walkthrough with dot indicators.
 *
 * Both paths write the localStorage flag so splash won't re-route here.
 */

const STORAGE_KEY = "cfc_onboarding_seen";

function markOnboardingSeen() {
  try { localStorage.setItem(STORAGE_KEY, "true"); } catch { /**/ }
}

/* ── Slide data ──────────────────────────────────────────────────── */

interface SlideData {
  id: string;
  icon: React.ComponentType<{ className?: string }>;
  iconBg: string;
  iconColor: string;
  title: string;
  body: string;
}

const SLIDES: SlideData[] = [
  {
    id: "one-stop",
    icon: Zap,
    iconBg: "bg-action-subtle",
    iconColor: "text-action",
    title: "One Stop Solution",
    body: "Electrical, cleaning, plumbing, beauty and 20+ more categories — all booked in under 60 seconds. No calls, no haggling.",
  },
  {
    id: "verified-pros",
    icon: Shield,
    iconBg: "bg-success-subtle",
    iconColor: "text-success",
    title: "Verified Professionals",
    body: "Every pro is background-checked, trained and rated. You see their photo, ID and reviews before they arrive.",
  },
  {
    id: "warranty",
    icon: CheckCircle2,
    iconBg: "bg-gain-subtle",
    iconColor: "text-gain",
    title: "30-Day Warranty",
    body: "Not satisfied with the work? We\u2019ll re-do it — free, within 30 days. No questions asked.",
  },
];

/* ── Service grid for desktop hero ──────────────────────────────── */

const SERVICES = [
  { icon: Wrench, label: "AC Repair", price: "From \u20b9499" },
  { icon: Home, label: "Home Cleaning", price: "From \u20b91,899" },
  { icon: Sparkles, label: "Beauty & Salon", price: "From \u20b9599" },
  { icon: HeartPulse, label: "Nurse Care", price: "From \u20b91,299" },
];

/**
 * What the platform actually promises.
 *
 * This block previously carried "50,000+ happy customers", a 4.8-star rating
 * and "500+ verified pros" - none of which has a source. PLATFORM-FACTS.md
 * lists marketing figures under "do not claim". Every entry here is a
 * documented rule from the agreement instead: a claim we can stand behind is
 * worth more than a number we cannot.
 */
const PROMISES = [
  { value: "30 days", label: "Warranty on every job" },
  { value: "KYC", label: "Every professional verified" },
  { value: "Live", label: "Track your pro on the map" },
];

/* ── Mobile Slide component ──────────────────────────────────────── */

function MobileSlide({
  slide,
  exiting,
}: {
  slide: SlideData;
  exiting: boolean;
}) {
  const Icon = slide.icon;
  return (
    <div
      className="flex flex-col items-center px-6 py-8 text-center"
      style={{
        opacity: exiting ? 0 : 1,
        transform: exiting ? "translateX(-20px)" : "translateX(0)",
        transition: "opacity 0.2s ease, transform 0.2s ease",
      }}
    >
      <div
        className={`mb-6 flex size-20 items-center justify-center rounded-full ${slide.iconBg}`}
      >
        <Icon className={`size-10 ${slide.iconColor}`} />
      </div>
      <h2 className="text-title font-semibold text-ink">{slide.title}</h2>
      <p className="mt-3 max-w-xs text-body text-ink-muted">{slide.body}</p>
    </div>
  );
}

/* ── Main component ──────────────────────────────────────────────── */

export default function OnboardingPage() {
  const router = useRouter();
  const [slide, setSlide] = React.useState(0);
  const [exiting, setExiting] = React.useState(false);
  const isLast = slide === SLIDES.length - 1;

  function goToLogin() {
    markOnboardingSeen();
    router.push("/login");
  }

  function advance() {
    if (isLast) { goToLogin(); return; }
    setExiting(true);
    setTimeout(() => { setSlide((s) => s + 1); setExiting(false); }, 220);
  }

  function retreat() {
    if (slide === 0) return;
    setExiting(true);
    setTimeout(() => { setSlide((s) => s - 1); setExiting(false); }, 220);
  }

  const current = SLIDES[slide]!;

  return (
    <>
      {/* ══ DESKTOP LAYOUT ═══════════════════════════════════════════════ */}
      <div className="hidden min-h-screen flex-col bg-canvas md:flex">
        {/* Nav */}
        <header className="flex items-center justify-between border-b border-border bg-surface px-10 py-4">
          <div className="flex items-center gap-3">
            <div className="flex size-9 items-center justify-center rounded-control bg-action">
              <Shield className="size-5 text-on-structure" />
            </div>
            <span className="text-heading font-semibold text-ink">
              City Family Care
            </span>
          </div>
          <button
            type="button"
            id="onboarding-skip-desktop"
            className="text-body text-ink-muted hover:text-ink"
            onClick={goToLogin}
          >
            Skip intro
          </button>
        </header>

        {/* Hero */}
        <section className="bg-structure px-10 py-16">
          <div className="mx-auto max-w-screen-lg">
            <div className="flex items-end justify-between gap-8">
              <div className="max-w-lg">
                <div className="mb-4 inline-flex items-center gap-2 rounded-full bg-action-subtle px-4 py-2">
                  <Star className="size-4 text-action" />
                  <span className="text-small font-medium text-action">
                    Verified professionals, fixed prices
                  </span>
                </div>
                <h1 className="text-display font-semibold leading-tight text-on-structure width-expanded">
                  Every home service,
                  <br />
                  done right.
                </h1>
                <p className="mt-4 text-body text-on-structure-muted">
                  Book verified professionals for repairs, cleaning, beauty and
                  more — all with a 30-day service warranty.
                </p>
                <div className="mt-8 flex items-center gap-4">
                  <Button
                    id="onboarding-get-started"
                    variant="primary"
                    size="lg"
                    onClick={goToLogin}
                    className="px-8"
                  >
                    Get started — it&apos;s free
                    <ChevronRight className="size-5" />
                  </Button>
                  <span className="text-small text-on-structure-muted">
                    No credit card required
                  </span>
                </div>
              </div>

              {/* Service grid */}
              <div className="grid grid-cols-2 gap-3">
                {SERVICES.map(({ icon: Icon, label, price }) => (
                  <div
                    key={label}
                    className="flex flex-col gap-2 rounded-card border border-on-structure-faint bg-structure-raised px-5 py-4"
                  >
                    <div className="flex size-10 items-center justify-center rounded-control bg-action">
                      <Icon className="size-5 text-on-structure" />
                    </div>
                    <p className="text-small font-medium text-on-structure">
                      {label}
                    </p>
                    <p className="text-caption text-on-structure-muted">
                      {price}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section className="border-b border-border bg-surface px-10 py-6">
          <div className="mx-auto flex max-w-screen-lg items-center justify-between">
            {PROMISES.map(({ value, label }) => (
              <div key={label} className="text-center">
                <p className="text-title font-semibold text-structure">
                  {value}
                </p>
                <p className="text-small text-ink-muted">{label}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Feature cards */}
        <section className="flex-1 px-10 py-16">
          <div className="mx-auto max-w-screen-lg">
            <h2 className="mb-10 text-center text-title font-semibold text-ink">
              Why customers choose CFC
            </h2>
            <div className="grid grid-cols-3 gap-6">
              {SLIDES.map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.id}
                    className="rounded-card border border-border bg-surface p-6 shadow-sm"
                  >
                    <div
                      className={`mb-4 inline-flex size-12 items-center justify-center rounded-control ${s.iconBg}`}
                    >
                      <Icon className={`size-6 ${s.iconColor}`} />
                    </div>
                    <h3 className="text-heading font-semibold text-ink">
                      {s.title}
                    </h3>
                    <p className="mt-2 text-body text-ink-muted">{s.body}</p>
                  </div>
                );
              })}
            </div>

            <div className="mt-12 text-center">
              <Button
                id="onboarding-get-started-bottom"
                variant="primary"
                size="lg"
                onClick={goToLogin}
                className="px-10"
              >
                Create your free account
                <ChevronRight className="size-5" />
              </Button>
              <p className="mt-3 text-small text-ink-muted">
                Already have an account?{" "}
                <button
                  type="button"
                  className="font-medium text-action hover:text-action-hover"
                  onClick={goToLogin}
                >
                  Log in
                </button>
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* ══ MOBILE LAYOUT ════════════════════════════════════════════════ */}
      <div className="flex min-h-screen flex-col bg-canvas md:hidden">
        {/* Mobile nav */}
        <div className="flex items-center justify-between border-b border-border bg-surface px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex size-8 items-center justify-center rounded-control bg-action">
              <Shield className="size-4 text-on-structure" />
            </div>
            <span className="text-body font-semibold text-ink">City Family Care</span>
          </div>
          <button
            type="button"
            id="onboarding-skip"
            className="text-body text-ink-muted"
            onClick={goToLogin}
          >
            Skip
          </button>
        </div>

        {/* Slide */}
        <div className="flex flex-1 items-center">
          <MobileSlide slide={current} exiting={exiting} />
        </div>

        {/* Bottom card */}
        <div className="border-t border-border bg-surface px-6 pb-10 pt-6">
          {/* Dot indicators */}
          <div className="mb-6 flex items-center justify-center gap-2">
            {SLIDES.map((s, i) => (
              <button
                key={s.id}
                type="button"
                id={`onboarding-dot-${i}`}
                aria-label={`Slide ${i + 1}`}
                aria-current={i === slide ? "step" : undefined}
                onClick={() => {
                  if (i !== slide) {
                    setExiting(true);
                    setTimeout(() => { setSlide(i); setExiting(false); }, 220);
                  }
                }}
                style={{
                  width: i === slide ? "24px" : "8px",
                  height: "8px",
                  borderRadius: "4px",
                  backgroundColor:
                    i === slide
                      ? "var(--color-action)"
                      : "var(--color-border)",
                  transition: "width 0.3s ease, background-color 0.3s ease",
                  border: "none",
                  padding: 0,
                  cursor: "pointer",
                }}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {slide > 0 && (
              <button
                type="button"
                id="onboarding-prev"
                className="flex size-touch items-center justify-center rounded-control border border-border bg-surface text-ink hover:bg-action-subtle"
                onClick={retreat}
              >
                <ChevronLeft className="size-5" />
              </button>
            )}
            <Button
              id={isLast ? "onboarding-get-started" : `onboarding-next-${slide}`}
              variant="primary"
              size="lg"
              className="flex-1"
              onClick={advance}
            >
              {isLast ? "Get Started" : "Next"}
              {!isLast && <ChevronRight className="size-5" />}
            </Button>
          </div>

          {!isLast && (
            <button
              type="button"
              id="onboarding-login-link"
              onClick={goToLogin}
              className="mt-4 w-full text-center text-small text-ink-muted hover:text-ink"
            >
              Already have an account?{" "}
              <span className="font-medium text-action">Log in</span>
            </button>
          )}
        </div>
      </div>
    </>
  );
}
