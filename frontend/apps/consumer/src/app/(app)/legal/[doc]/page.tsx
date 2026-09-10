"use client";

import * as React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { ErrorState, InlineAlert } from "@cfc/ui";

/**
 * Customer 44 — the legal documents.
 *
 * One route for three documents, because they share a shape: a title, a date,
 * and prose. `max-w-prose` is deliberate here and nowhere else in the app —
 * legal text is the one thing on this platform that is genuinely read rather
 * than scanned, and a 1280px line length makes it unreadable.
 *
 * ────────────────────────────────────────────────────────────────────────────
 * THE TEXT IS A PLACEHOLDER STRUCTURE, NOT LEGAL COPY.
 *
 * Terms, a privacy policy and a refund policy are drafted by the client's
 * lawyer, not by us. Writing plausible-sounding legal text would be the most
 * dangerous invention in this whole build: it is binding, it is the one place a
 * customer's rights are defined, and a refund clause we made up would commit
 * the business to honouring it.
 *
 * So each document states its own headings and says plainly that the content
 * is pending. See CONSUMER-OPEN-ITEMS.
 * ────────────────────────────────────────────────────────────────────────────
 */

const DOCS: Record<
  string,
  { title: string; sections: string[] }
> = {
  terms: {
    title: "Terms of service",
    sections: [
      "Who we are and what this service does",
      "Your account",
      "Booking a service",
      "Prices, fees and taxes",
      "Quotations and extra work",
      "The 30-day warranty",
      "Cancellation and rescheduling",
      "Conduct and safety",
      "Liability",
      "Governing law and disputes",
    ],
  },
  privacy: {
    title: "Privacy policy",
    sections: [
      "What we collect",
      "Why we collect it",
      "Your location, and when we use it",
      "Who we share it with",
      "Payment information",
      "How long we keep it",
      "Your rights and how to exercise them",
      "Cookies and local storage",
      "Contacting us about your data",
    ],
  },
  refunds: {
    title: "Refund and cancellation",
    sections: [
      "Cancelling before a professional is assigned",
      "Cancelling after a professional is on the way",
      "Visit charges",
      "Refunds on a declined quotation",
      "How long a refund takes",
      "Raising a dispute",
    ],
  },
};

export default function LegalPage() {
  const params = useParams<{ doc: string }>();
  const doc = DOCS[params.doc];

  if (doc === undefined) {
    return (
      <div className="mx-auto max-w-prose px-4 py-12 md:px-6">
        <ErrorState
          title="Document not found"
          action={{ label: "Back to settings", onClick: () => history.back() }}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-prose px-4 pt-4 md:px-6 md:pb-12">
      <Link
        href="/settings"
        className="inline-flex items-center gap-1 text-caption text-ink-muted hover:text-action"
      >
        <ArrowLeft className="size-3" aria-hidden="true" />
        Settings
      </Link>

      <h1 className="mt-3 text-title font-semibold text-ink">{doc.title}</h1>

      <div className="mt-4">
        <InlineAlert tone="clock" title="Awaiting the final wording">
          This document is being prepared by City Family Care&apos;s legal
          advisers. The headings below are the structure it will follow.
        </InlineAlert>
      </div>

      <ol className="mt-4 space-y-3">
        {doc.sections.map((section, i) => (
          <li
            key={section}
            className="rounded-card border border-border bg-surface p-4"
          >
            <p className="text-small font-medium text-ink">
              <span className="tabular mr-2 text-ink-faint">{i + 1}.</span>
              {section}
            </p>
          </li>
        ))}
      </ol>

      <p className="mt-6 text-caption text-ink-faint">
        Questions in the meantime? Our team is on the{" "}
        <Link href="/support" className="text-action underline">
          Help screen
        </Link>
        .
      </p>
    </div>
  );
}
