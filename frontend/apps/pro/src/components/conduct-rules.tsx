"use client";

import * as React from "react";
import { Check, Info } from "lucide-react";
import type { GoldenRule, PenaltyStep } from "@cfc/mocks";
import { cn } from "@cfc/ui";

/**
 * The three Golden Rules and the penalty structure.
 *
 * Shared by Pro 8 (accepting them during onboarding) and Pro 35 (reading them
 * afterwards) because they must be word-for-word identical. A pro who signs one
 * version and later reads a differently worded one has a legitimate grievance,
 * and two copies of a document is exactly how that happens.
 *
 * `tone` is the only difference between the two uses: onboarding renders on the
 * navy ground, the in-app screen on canvas.
 */

export function GoldenRules({
  rules,
  tone,
}: {
  rules: GoldenRule[];
  tone: "navy" | "light";
}) {
  const navy = tone === "navy";

  return (
    <ol className="space-y-4">
      {rules.map((rule) => (
        <li
          key={rule.number}
          className={cn(
            "rounded-card border p-4",
            navy
              ? "border-structure-line bg-structure-raised"
              : "border-border bg-surface",
          )}
        >
          <div className="flex items-start gap-3">
            <span
              className={cn(
                "flex size-tile shrink-0 items-center justify-center rounded-full",
                "text-heading font-semibold",
                navy ? "bg-brand text-on-action" : "bg-action text-on-action",
              )}
              aria-hidden="true"
            >
              {rule.number}
            </span>
            <div className="min-w-0">
              <h3
                className={cn(
                  "text-body font-semibold",
                  navy ? "text-on-structure" : "text-ink",
                )}
              >
                {rule.title}
              </h3>
              <p
                className={cn(
                  "mt-1 text-small",
                  navy ? "text-on-structure-muted" : "text-ink-muted",
                )}
              >
                {rule.body}
              </p>
            </div>
          </div>

          {/* The specific commitments. Each one is something the app checks. */}
          <ul className="mt-3 space-y-2">
            {rule.commitments.map((commitment) => (
              <li
                key={commitment}
                className={cn(
                  "flex items-start gap-2 text-caption",
                  navy ? "text-on-structure" : "text-ink",
                )}
              >
                <Check
                  className={cn(
                    "mt-px size-4 shrink-0",
                    navy ? "text-brand" : "text-action",
                  )}
                  aria-hidden="true"
                />
                {commitment}
              </li>
            ))}
          </ul>

          {/* What happens if it is broken. No rupee figures — the agreement
              gives none, and inventing one puts words in the client's mouth on
              a document a professional signs. */}
          <p
            className={cn(
              "mt-3 border-t pt-3 text-caption",
              navy
                ? "border-structure-line text-on-structure-faint"
                : "border-border text-ink-muted",
            )}
          >
            {rule.consequence}
          </p>
        </li>
      ))}
    </ol>
  );
}

export function PenaltyStructure({
  steps,
  amountsNotSet,
  tone,
}: {
  steps: PenaltyStep[];
  /** True while the client has not provided the penalty schedule. */
  amountsNotSet: boolean;
  tone: "navy" | "light";
}) {
  const navy = tone === "navy";

  return (
    <section
      className={cn(
        "rounded-card border p-4",
        navy
          ? "border-structure-line bg-structure-raised"
          : "border-border bg-surface",
      )}
    >
      <h2
        className={cn(
          "text-small font-semibold",
          navy ? "text-on-structure" : "text-ink",
        )}
      >
        What happens if a rule is broken
      </h2>

      <ol className="mt-3 space-y-3">
        {steps.map((step, i) => (
          <li key={step.stage} className="flex items-start gap-3">
            <span
              className={cn(
                "mt-px flex size-5 shrink-0 items-center justify-center rounded-full",
                "text-caption font-semibold",
                navy
                  ? "border border-structure-line text-on-structure-muted"
                  : "border border-border text-ink-muted",
              )}
              aria-hidden="true"
            >
              {i + 1}
            </span>
            <span className="min-w-0">
              <span
                className={cn(
                  "block text-small font-medium",
                  navy ? "text-on-structure" : "text-ink",
                )}
              >
                {step.stage}
              </span>
              <span
                className={cn(
                  "block text-caption",
                  navy ? "text-on-structure-muted" : "text-ink-muted",
                )}
              >
                {step.what}
              </span>
            </span>
          </li>
        ))}
      </ol>

      {/* Said plainly rather than left as a blank column.
          A professional reading a penalty structure with no amounts will assume
          they are hidden; told the office sets them per incident, they know to
          ask. */}
      {amountsNotSet && (
        <p
          className={cn(
            "mt-3 flex items-start gap-2 border-t pt-3 text-caption",
            navy
              ? "border-structure-line text-on-structure-faint"
              : "border-border text-ink-muted",
          )}
        >
          <Info className="mt-px size-4 shrink-0" aria-hidden="true" />
          Deduction amounts are decided by the CFC office for each incident and
          shown on your transaction history with the reason. There is no fixed
          fine list — ask the office if you want the current figures.
        </p>
      )}
    </section>
  );
}
