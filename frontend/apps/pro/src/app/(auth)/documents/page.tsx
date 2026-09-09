"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { ArrowRight, Check, ShieldCheck } from "lucide-react";
import { REQUIRED_DOCUMENTS, uploadDocument } from "@cfc/mocks";
import type { DocumentType } from "@cfc/types";
import {
  Button,
  InlineAlert,
  PhotoCapture,
  cn,
  toast,
  type CapturedPhoto,
} from "@cfc/ui";
import {
  OnboardingCard,
  OnboardingShell,
} from "@/components/onboarding-shell";

/**
 * Pro 6 — document upload.
 *
 * "Aadhaar front/back, PAN, bank details, selfie." Bank details are typed
 * rather than photographed, so they are Pro 7; the four image uploads are here.
 *
 * ## Why each document is wanted, next to the box that wants it
 *
 * This is the most invasive screen in the app — a stranger's platform asking
 * for a national ID, a tax number and a photograph of someone's face. A pro who
 * is not told why abandons it, and a pro who is told a vague reason abandons it
 * more slowly.
 *
 * So every upload carries its purpose and a framing hint. "All four corners in
 * frame" prevents a rejection two days later; "matched against your Aadhaar"
 * explains why a smiling selfie is not what is wanted.
 *
 * ## What this screen must not promise
 *
 * Nothing here says a document is *accepted*. A person reviews these, and
 * `uploadDocument` deliberately returns `pending` always — a screen that ticked
 * a document green on upload would be teaching the pro that the review is
 * automatic, and then contradicting itself on the approval screen.
 *
 * Real KYC storage is a backend concern. What is real here: type and size
 * validation before anything is read, camera capture on a phone, and a preview
 * so a pro can see they photographed the right side of the card.
 * PRO-OPEN-ITEMS 2.5.
 */

export default function ProDocumentsPage() {
  const router = useRouter();

  const [files, setFiles] = React.useState<
    Record<string, CapturedPhoto[]>
  >({});
  const [busy, setBusy] = React.useState(false);

  const setFor = (type: DocumentType, next: CapturedPhoto[]) =>
    setFiles((current) => ({ ...current, [type]: next }));

  const uploaded = REQUIRED_DOCUMENTS.filter(
    (d) => (files[d.type] ?? []).length > 0,
  ).length;
  const complete = uploaded === REQUIRED_DOCUMENTS.length;

  const submit = async () => {
    if (!complete) return;
    setBusy(true);
    try {
      // Sequentially rather than in parallel: on mobile data, four concurrent
      // image uploads are slower than four in a row and much more likely to
      // have one fail.
      for (const doc of REQUIRED_DOCUMENTS) {
        await uploadDocument("pro_new", doc.type);
      }
      router.push("/bank-details");
    } catch {
      toast.error(
        "An upload did not go through. Check your connection and try again.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <OnboardingShell
      heading="Upload your documents"
      subheading="The CFC office checks these before you can take jobs."
      step="documents"
      backHref="/profile-setup"
    >
      <div className="space-y-4">
        {/* Why any of this is being asked. Once, at the top. */}
        <InlineAlert tone="info" title="Why CFC needs these">
          Customers let professionals into their homes, so every professional on
          the platform is identity-checked. Your documents are seen by the CFC
          office only — never by a customer.
        </InlineAlert>

        {REQUIRED_DOCUMENTS.map((doc) => {
          const current = files[doc.type] ?? [];
          const done = current.length > 0;
          return (
            <OnboardingCard
              key={doc.type}
              className={cn(done && "border-live-line")}
            >
              <PhotoCapture
                photos={current}
                onChange={(next) => setFor(doc.type, next)}
                label={doc.label}
                maximum={1}
                hint={doc.hint}
              />
              {done && (
                <p className="mt-2 flex items-center gap-2 text-caption text-live-ink">
                  <Check className="size-4 shrink-0" aria-hidden="true" />
                  Ready to upload
                </p>
              )}
            </OnboardingCard>
          );
        })}

        <div className="rounded-card border border-structure-line bg-structure-raised p-4">
          <p className="flex items-start gap-2 text-caption text-on-structure-muted">
            <ShieldCheck
              className="mt-px size-4 shrink-0 text-brand"
              aria-hidden="true"
            />
            Your documents are stored securely and used only to verify who you
            are. They are not shared with customers or anyone outside CFC.
          </p>
        </div>

        <Button
          size="pro"
          className="w-full"
          disabled={!complete || busy}
          onClick={() => void submit()}
        >
          {busy ? "Uploading…" : "Upload and continue"}
          {!busy && <ArrowRight />}
        </Button>

        {!complete && (
          <p className="text-center text-caption text-on-structure-muted">
            {uploaded} of {REQUIRED_DOCUMENTS.length} added —{" "}
            {REQUIRED_DOCUMENTS.length - uploaded} still needed.
          </p>
        )}
      </div>
    </OnboardingShell>
  );
}
