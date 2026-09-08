"use client";

import * as React from "react";
import { useRouter } from "next/navigation";

/**
 * Consumer Screen 1 — Splash.
 *
 * Inventory: "CFC branding, blue+orange logo animation."
 *
 * Full-screen indigo brand surface. Logo animates in, then the screen
 * self-advances:
 *   - First-time users  → /onboarding
 *   - Returning users   → /home  (localStorage flag "cfc_onboarding_seen")
 *
 * No button — splash is never interactive. It auto-advances at 1.8 s.
 */

const STORAGE_KEY = "cfc_onboarding_seen";
const ADVANCE_DELAY_MS = 1800;

export default function SplashPage() {
  const router = useRouter();
  const [visible, setVisible] = React.useState(false);

  React.useEffect(() => {
    // Trigger the entrance animation on the next paint.
    const frameId = requestAnimationFrame(() => setVisible(true));

    const timer = setTimeout(() => {
      try {
        const seen = localStorage.getItem(STORAGE_KEY) === "true";
        router.replace(seen ? "/home" : "/onboarding");
      } catch {
        // localStorage unavailable (private mode) — always go to onboarding.
        router.replace("/onboarding");
      }
    }, ADVANCE_DELAY_MS);

    return () => {
      cancelAnimationFrame(frameId);
      clearTimeout(timer);
    };
  }, [router]);

  return (
    <div
      className="relative flex min-h-screen flex-col items-center justify-center overflow-hidden bg-structure"
      aria-label="City Family Care splash screen"
    >
      {/* Decorative radial glow behind the logo */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(ellipse 70% 55% at 50% 42%, rgba(37,99,235,0.22) 0%, transparent 70%)",
        }}
      />

      {/* Logo lockup */}
      <div
        className="flex flex-col items-center gap-6"
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1) translateY(0)" : "scale(0.82) translateY(16px)",
          transition: "opacity 0.65s cubic-bezier(0.22,1,0.36,1), transform 0.65s cubic-bezier(0.22,1,0.36,1)",
        }}
      >
        {/* Shield icon — inline SVG, no external dep */}
        <div className="relative">
          <svg
            width="96"
            height="112"
            viewBox="0 0 96 112"
            fill="none"
            aria-hidden
          >
            {/* Shield body */}
            <path
              d="M48 4 L88 20 L88 56 C88 80 66 100 48 108 C30 100 8 80 8 56 L8 20 Z"
              fill="rgba(255,255,255,0.12)"
              stroke="rgba(255,255,255,0.35)"
              strokeWidth="2"
            />
            {/* Inner shield highlight */}
            <path
              d="M48 14 L80 27 L80 56 C80 76 62 94 48 101 C34 94 16 76 16 56 L16 27 Z"
              fill="rgba(37,99,235,0.28)"
            />
            {/* House silhouette */}
            <g transform="translate(24, 30)">
              {/* Roof */}
              <path d="M24 4 L44 18 L44 20 L4 20 L4 18 Z" fill="white" />
              {/* House body */}
              <rect x="8" y="20" width="32" height="26" rx="2" fill="white" />
              {/* Door */}
              <rect x="18" y="30" width="12" height="16" rx="2" fill="rgba(37,99,235,0.7)" />
              {/* Left window */}
              <rect x="10" y="24" width="8" height="7" rx="1" fill="rgba(37,99,235,0.5)" />
              {/* Right window */}
              <rect x="30" y="24" width="8" height="7" rx="1" fill="rgba(37,99,235,0.5)" />
            </g>
            {/* Checkmark accent */}
            <circle cx="72" cy="24" r="12" fill="var(--color-action)" />
            <path
              d="M67 24 L71 28 L77 21"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>

        {/* Wordmark */}
        <div className="flex flex-col items-center gap-1 text-center">
          <p
            className="text-display font-semibold tracking-wide text-on-structure width-expanded"
          >
            CFC
          </p>
          <p className="text-heading font-medium text-on-structure">
            City Family Care
          </p>
          <p className="mt-1 text-body text-on-structure-muted">
            Trusted Home Services
          </p>
        </div>
      </div>

      {/* Loading indicator */}
      <div
        className="absolute bottom-16 flex items-center gap-2"
        style={{
          opacity: visible ? 1 : 0,
          transition: "opacity 0.4s ease 0.8s",
        }}
        aria-hidden
      >
        {[0, 1, 2].map((i) => (
          <span
            key={i}
            className="block rounded-full bg-action"
            style={{
              width: "6px",
              height: "6px",
              animation: `cfcPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Pulse keyframe injected inline — avoids a global CSS file for a
          single animation that lives only on the splash screen. */}
      <style>{`
        @keyframes cfcPulse {
          0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
