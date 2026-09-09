"use client";

import * as React from "react";
import Link from "next/link";
import {
  ArrowRight,
  Banknote,
  CalendarDays,
  FileCheck2,
  Gift,
  IdCard,
  Smartphone,
} from "lucide-react";
import { COMMISSION_FREE_JOBS } from "@cfc/types";
import { Button } from "@cfc/ui";
import { Logo } from "@/components/logo";

/**
 * Pro 3's front door — what joining CFC actually involves.
 *
 * Not in the inventory as a screen, and built anyway, because the alternative
 * is dropping someone straight into a form that will shortly ask for their
 * Aadhaar, PAN, bank account and a selfie. A tradesperson who has not been told
 * why abandons that form, and rightly.
 *
 * So this screen does two things and nothing else:
 *
 *   **Says what is in it for them**, using only documented facts. The
 *   commission-free first jobs and the 48-hour payout are real terms from the
 *   agreement. There is no "earn ₹40,000 a month" here, because nothing in the
 *   agreement supports a figure like that and a platform that opens with an
 *   invented number has set the tone for everything after it.
 *
 *   **Says what will be asked of them, before it is asked.** Four documents and
 *   roughly ten minutes. Someone who knows a selfie is coming can take it in
 *   good light; someone ambushed by it three screens in gives up.
 */

const BENEFITS = [
  {
    icon: Gift,
    title: `No commission on your first ${COMMISSION_FREE_JOBS} jobs`,
    body: "You keep the full amount on each one. After that, CFC takes 15% of the job value.",
  },
  {
    icon: Banknote,
    title: "Paid within 48 hours",
    body: "Money from a completed job clears within two days, straight to your bank account or UPI. Request a payout any day.",
  },
  {
    icon: CalendarDays,
    title: "You choose when you work",
    body: "Set your own hours and days off, and go offline whenever you need to. Nobody is assigned work they have not accepted.",
  },
  {
    icon: Smartphone,
    title: "Jobs come to you",
    body: "Customers book, and the nearest professionals are alerted. No chasing work and no quoting on the phone.",
  },
];

const REQUIREMENTS = [
  "Aadhaar card — front and back",
  "PAN card",
  "A selfie in good light",
  "Your bank account or UPI details",
];

export default function ProOnboardingPage() {
  return (
    <div className="flex min-h-screen flex-col bg-structure">
      <header className="flex h-bar shrink-0 items-center gap-2 px-4 md:px-6">
        <Logo className="size-6 text-brand" />
        <span className="text-heading font-semibold tracking-tight text-on-structure">
          CFC Pro
        </span>
      </header>

      <main className="flex-1 px-4 pb-8 md:px-6">
        <div className="mx-auto w-full max-w-detail">
          <h1 className="mt-4 text-display font-semibold text-on-structure">
            Work with City Family Care
          </h1>
          <p className="mt-2 max-w-prose text-body text-on-structure-muted">
            Join as a verified professional and take jobs near you. Fixed rates,
            no chasing payments.
          </p>

          {/* What they get. Documented facts only. */}
          <ul className="mt-6 space-y-3">
            {BENEFITS.map(({ icon: Icon, title, body }) => (
              <li
                key={title}
                className="flex gap-3 rounded-card border border-structure-line bg-structure-raised p-4"
              >
                <span className="flex size-tile shrink-0 items-center justify-center rounded-control bg-structure text-brand">
                  <Icon className="size-5" aria-hidden="true" />
                </span>
                <span className="min-w-0">
                  <span className="block text-small font-semibold text-on-structure">
                    {title}
                  </span>
                  <span className="mt-px block text-caption text-on-structure-muted">
                    {body}
                  </span>
                </span>
              </li>
            ))}
          </ul>

          {/* What will be asked of them, before it is asked. */}
          <section className="mt-6 rounded-card border border-structure-line bg-structure-raised p-4">
            <h2 className="flex items-center gap-2 text-small font-semibold text-on-structure">
              <IdCard className="size-5 shrink-0 text-brand" aria-hidden="true" />
              What you will need
            </h2>
            <p className="mt-1 text-caption text-on-structure-muted">
              Registration takes about ten minutes. Have these ready:
            </p>
            <ul className="mt-3 space-y-2">
              {REQUIREMENTS.map((item) => (
                <li
                  key={item}
                  className="flex items-start gap-2 text-caption text-on-structure"
                >
                  <FileCheck2
                    className="mt-px size-4 shrink-0 text-brand"
                    aria-hidden="true"
                  />
                  {item}
                </li>
              ))}
            </ul>
            <p className="mt-3 border-t border-structure-line pt-3 text-caption text-on-structure-faint">
              The CFC office checks your documents before you can take jobs. You
              will be told as soon as that is done.
            </p>
          </section>

          <div className="mt-6 flex flex-col gap-2 sm:flex-row-reverse">
            <Button size="pro" className="min-w-0 flex-1" asChild>
              <Link href="/register">
                Get started
                <ArrowRight />
              </Link>
            </Button>
            <Button
              variant="secondary"
              size="pro"
              className="min-w-0 flex-1"
              asChild
            >
              <Link href="/login">I already have an account</Link>
            </Button>
          </div>
        </div>
      </main>
    </div>
  );
}
