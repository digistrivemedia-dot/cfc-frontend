"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Shield,
  CheckCircle2,
  ArrowLeft,
  MapPin,
  Home,
  Wrench,
  Sparkles,
} from "lucide-react";

/**
 * AuthShell — the shared two-column layout for all auth screens.
 *
 * Desktop (≥ md): Left brand panel | Right form panel
 * Mobile: Compact top bar + form card, full-width
 *
 * Now upgraded with premium glassmorphism, richer gradients,
 * and a centered, elevated form card on desktop.
 */

interface AuthShellProps {
  children: React.ReactNode;
  heading: string;
  subheading?: string;
  backHref?: string;
  backLabel?: string;
}

const TRUST_POINTS = [
  {
    icon: CheckCircle2,
    title: "Verified professionals",
    desc: "Every pro is background-checked and trained",
  },
  {
    icon: Shield,
    title: "30-day service warranty",
    desc: "Free re-service if you're not satisfied",
  },
  {
    // Was a fabricated rating and customer count. Replaced with a documented
    // capability — live tracking is a real feature of the platform, and it is
    // a better reason to sign up than a number nobody can verify.
    icon: MapPin,
    title: "Live tracking to your door",
    desc: "Follow your professional on the map, with an arrival time",
  },
];

const SERVICE_ICONS = [
  { icon: Wrench, label: "Repairs" },
  { icon: Home, label: "Cleaning" },
  { icon: Sparkles, label: "Beauty" },
];

export function AuthShell({
  children,
  heading,
  subheading,
  backHref,
  backLabel = "Back",
}: AuthShellProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-canvas md:grid md:grid-cols-2">
      {/* ── Left brand panel (desktop only) ──────────────────────────────── */}
      <div
        className="relative hidden flex-col justify-between overflow-hidden p-12 lg:p-panel-lg md:flex"
        style={{
          background:
            "linear-gradient(135deg, var(--color-structure) 0%, var(--color-structure-raised) 50%, var(--color-ink) 100%)",
        }}
      >
        {/* Dynamic Glowing Orbs */}
        <div
          aria-hidden
          className="pointer-events-none absolute -left-20 top-20 rounded-full opacity-40 mix-blend-screen"
          style={{ background: "var(--color-action)", width: "500px", height: "500px", filter: "blur(100px)" }}
        />
        <div
          aria-hidden
          className="pointer-events-none absolute -right-20 bottom-20 rounded-full opacity-30 mix-blend-screen"
          style={{ background: "var(--color-success, var(--color-action-hover))", width: "400px", height: "400px", filter: "blur(80px)" }}
        />

        {/* Subtle dot-grid pattern */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-15"
          style={{
            backgroundImage:
              "radial-gradient(circle, rgba(255,255,255,0.7) 1px, transparent 1px)",
            backgroundSize: "32px 32px",
          }}
        />

        {/* Top — logo */}
        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="flex size-12 items-center justify-center rounded-2xl bg-white/10 backdrop-blur-md border border-white/20" style={{ boxShadow: "0 0 15px rgba(255,255,255,0.1)" }}>
              <Shield className="size-6 text-white" />
            </div>
            <div>
              <p className="text-title font-bold text-white tracking-tight">
                City Family Care
              </p>
              <p className="text-small font-medium text-white/70 uppercase tracking-wider">
                Trusted Home Services
              </p>
            </div>
          </div>

          {/* Service category pills (Glassmorphic) */}
          <div className="mt-12 flex flex-wrap gap-3">
            {SERVICE_ICONS.map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm transition-all hover:bg-white/10"
              >
                <Icon className="size-4 text-white/80" />
                <span className="text-small font-medium text-white/90">
                  {label}
                </span>
              </div>
            ))}
            <div className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-sm transition-all hover:bg-white/10">
              <span className="text-small font-medium text-white/90">
                +20 services
              </span>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="font-bold leading-tight tracking-tight text-white drop-shadow-sm" style={{ fontSize: "3.5rem" }}>
            Every home service,
            <br />
            <span className="text-action-hover">
              done right.
            </span>
          </h2>
          <p className="max-w-md text-body font-medium leading-relaxed text-white/80">
            Book verified professionals for repairs, cleaning, beauty and more
            — all with a 30-day warranty.
          </p>
        </div>

        {/* Bottom — trust points (Glass cards) */}
        <div className="relative z-10 flex flex-col gap-4">
          {TRUST_POINTS.map(({ icon: Icon, title, desc }) => (
            <div
              key={title}
              className="group flex items-center gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-md transition-all hover:bg-white/10 hover:shadow-lg"
            >
              <div className="flex size-tile shrink-0 items-center justify-center rounded-full bg-white/10 text-white shadow-inner transition-transform group-hover:scale-110">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-body font-semibold text-white">{title}</p>
                <p className="text-small text-white/70">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Right form panel ─────────────────────────────────────────────── */}
      <div className="flex flex-col bg-canvas md:min-h-screen">
        {/* Mobile-only top bar */}
        <div className="flex items-center gap-3 border-b border-border bg-surface px-6 py-4 shadow-sm md:hidden">
          {backHref ? (
            <button
              type="button"
              className="flex items-center gap-1 text-small text-ink-muted transition-colors hover:text-ink"
              onClick={() => router.push(backHref)}
            >
              <ArrowLeft className="size-4" />
              {backLabel}
            </button>
          ) : (
            <div className="flex items-center gap-2">
              <div className="flex size-8 items-center justify-center rounded-lg bg-action shadow-sm">
                <Shield className="size-4 text-on-structure" />
              </div>
              <span className="text-body font-bold tracking-tight text-ink">
                City Family Care
              </span>
            </div>
          )}
        </div>

        {/* Form content — centered and elevated on desktop */}
        <div className="flex flex-1 items-center justify-center p-6 sm:p-panel md:p-12 lg:p-panel-lg">
          <div className="w-full rounded-3xl bg-surface px-6 py-panel shadow-none sm:px-panel sm:py-12 md:border md:border-border/50 lg:p-12" style={{ maxWidth: "420px", boxShadow: "0 8px 30px rgba(0,0,0,0.04)" }}>
            {/* Desktop back button */}
            {backHref && (
              <button
                type="button"
                className="mb-8 hidden w-fit items-center gap-2 rounded-full border border-border bg-surface px-4 py-2 text-small font-medium text-ink-muted shadow-sm transition-all hover:bg-canvas hover:text-ink hover:shadow md:flex"
                onClick={() => router.push(backHref)}
              >
                <ArrowLeft className="size-4" />
                {backLabel}
              </button>
            )}

            {/* Screen heading */}
            <div className="mb-8 space-y-2">
              <h1 className="text-display font-bold tracking-tight text-ink">
                {heading}
              </h1>
              {subheading && (
                <p className="text-body text-ink-muted leading-relaxed">
                  {subheading}
                </p>
              )}
            </div>

            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
