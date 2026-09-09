"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  IndianRupee,
  Phone,
  Plus,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import {
  PHONE_CONFIRM_THRESHOLD_PAISE,
  QUOTATION_MIN_BEFORE_PHOTOS,
  QUOTATION_WINDOW_MINUTES,
  getProJob,
  quoteTotal,
  submitQuotation,
} from "@cfc/mocks";
import type { ProJob, QuotationMaterialLine } from "@cfc/types";
import {
  Button,
  Input,
  InlineAlert,
  PhotoCapture,
  Skeleton,
  Textarea,
  cn,
  formatCurrency,
  toast,
  type CapturedPhoto,
} from "@cfc/ui";
import { ProAction, ProActionLayout } from "@/components/pro-action-bar";
import { currentProId } from "@/lib/pro-session";

/**
 * Pro 16 — raise a quotation.
 *
 * The platform's priority path, and the screen where the agreement's rules are
 * least optional. Three of them shape this form:
 *
 * **Minimum 2 before-photos, or the quote is auto-rejected.** So the count is
 * live and the submit button says what is missing. A pro should learn this rule
 * from the form, not from having an hour's work thrown away — which is exactly
 * what "auto-reject" means for them.
 *
 * **Quotes above ₹5,000 trigger a phone call to the customer.** Not a block,
 * but a pro who is not told will be surprised when an admin rings them. Shown
 * as soon as the total crosses the line.
 *
 * **The admin decides within 15 minutes.** Stated before submitting, because
 * that window is how long the pro will be standing in the customer's house
 * waiting for an answer, and it is the difference between "wait here" and
 * "come back tomorrow".
 *
 * ## The material list
 *
 * Rows with a live total, because a pro pricing a job on a phone in someone's
 * kitchen should not be doing arithmetic. `quoteTotal` is the same function the
 * submission uses, so the figure on screen is the figure submitted.
 */

export default function ProQuotePage() {
  const params = useParams<{ id: string }>();
  const proId = React.useMemo(() => currentProId(), []);
  const [job, setJob] = React.useState<ProJob | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    let cancelled = false;
    void getProJob(proId, params.id)
      .then((j) => {
        if (!cancelled) {
          setJob(j);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [proId, params.id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-4 md:px-6 lg:px-8">
        <Skeleton className="h-6 w-line-lg" />
        <Skeleton className="mt-4 h-block-md w-full rounded-card" />
      </div>
    );
  }

  if (job === null) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-12 text-center md:px-6">
        <p className="text-body text-ink-muted">This job is not available.</p>
        <Button variant="ghost" className="mt-3" asChild>
          <Link href="/jobs">
            <ArrowLeft />
            All jobs
          </Link>
        </Button>
      </div>
    );
  }

  return <QuoteForm job={job} />;
}

interface MaterialRow extends QuotationMaterialLine {
  key: string;
}

function QuoteForm({ job }: { job: ProJob }) {
  const router = useRouter();

  const [description, setDescription] = React.useState("");
  const [photos, setPhotos] = React.useState<CapturedPhoto[]>([]);
  const [materials, setMaterials] = React.useState<MaterialRow[]>([]);
  const [labourRupees, setLabourRupees] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const labourPaise = Math.round((Number(labourRupees) || 0) * 100);
  const total = quoteTotal({ materials, labourPaise });

  const shortPhotos = Math.max(0, QUOTATION_MIN_BEFORE_PHOTOS - photos.length);
  const needsCall = total > PHONE_CONFIRM_THRESHOLD_PAISE;

  const submit = async () => {
    setBusy(true);
    try {
      const result = await submitQuotation({
        jobId: job.id,
        description,
        materials: materials.map(({ description: d, costPaise }) => ({
          description: d,
          costPaise,
        })),
        labourPaise,
        beforePhotoCount: photos.length,
      });

      if (!result.ok) {
        // Named reasons, so the message says which rule was missed rather than
        // "submission failed".
        toast.error(
          result.error.reason === "too-few-photos"
            ? `Add ${result.error.needed} more before photo${result.error.needed === 1 ? "" : "s"} — a quotation needs at least ${QUOTATION_MIN_BEFORE_PHOTOS}.`
            : result.error.reason === "no-description"
              ? "Describe the work before submitting."
              : "Add a labour cost or at least one material.",
        );
        return;
      }

      toast.success("Quotation sent for approval.");
      router.push(`/jobs/${job.id}/quote/status`);
    } catch {
      toast.error("Could not submit. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <ProActionLayout
      action={
        <ProAction>
          <div className="border-b border-border pb-3">
            <div className="flex items-baseline justify-between gap-3">
              <span className="text-small font-medium text-ink">
                Quote total
              </span>
              <span className="tabular text-title font-semibold text-ink">
                {formatCurrency(total)}
              </span>
            </div>
            <p className="mt-px text-caption text-ink-muted">
              The customer pays 50% in advance, the balance on completion.
            </p>
          </div>

          {/* The 15-minute window, before they commit. */}
          <p className="mt-3 text-caption text-ink-muted">
            An admin reviews this within {QUOTATION_WINDOW_MINUTES} minutes. You
            will see the decision on the next screen.
          </p>

          {needsCall && (
            <p className="mt-3 flex items-start gap-2 rounded-control bg-clock-subtle p-2 text-caption text-clock-ink">
              <Phone className="mt-px size-4 shrink-0" aria-hidden="true" />
              Over {formatCurrency(PHONE_CONFIRM_THRESHOLD_PAISE)} — an admin
              will call the customer to confirm before approving.
            </p>
          )}

          <Button
            size="pro"
            className="mt-3 w-full"
            disabled={busy || shortPhotos > 0 || total <= 0 || description.trim() === ""}
            onClick={() => void submit()}
          >
            {busy ? "Submitting…" : "Submit for approval"}
          </Button>

          {/* Why the button is unavailable. A disabled button with no
              explanation is the most frustrating control in any app. */}
          {(shortPhotos > 0 || total <= 0 || description.trim() === "") && (
            <p className="mt-2 text-caption text-clock-ink">
              {shortPhotos > 0
                ? `Add ${shortPhotos} more before photo${shortPhotos === 1 ? "" : "s"} to submit.`
                : description.trim() === ""
                  ? "Describe the work to submit."
                  : "Add a labour cost or a material."}
            </p>
          )}
        </ProAction>
      }
    >
      <div className="py-4">
        <Link
          href={`/jobs/${job.id}/work`}
          className="inline-flex items-center gap-1 text-small font-medium text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to the job
        </Link>

        <h1 className="mt-3 text-title font-semibold text-ink">
          Raise a quotation
        </h1>
        <p className="mt-1 text-small text-ink-muted">
          {job.serviceName} · {job.customerName}
        </p>

        {/* The rule, stated once at the top rather than only as an error. */}
        <InlineAlert tone="info" title="What the admin needs" className="mt-4">
          A clear description of the work, the materials and their costs, your
          labour charge, and at least {QUOTATION_MIN_BEFORE_PHOTOS} photos of
          the site before you start. A quotation with fewer photos is rejected
          automatically.
        </InlineAlert>

        {/* 1. The work. */}
        <section className="mt-4 rounded-card border border-border bg-surface p-4">
          <label
            htmlFor="quote-description"
            className="block text-small font-medium text-ink"
          >
            What needs doing
          </label>
          <p className="mt-px text-caption text-ink-muted">
            Write it for the customer, not the admin — they read this before
            paying.
          </p>
          <Textarea
            id="quote-description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={4}
            placeholder="The concealed pipe behind the wall has corroded and needs replacing, along with two joints and the wall tile that has to come off to reach it."
            className="mt-2"
          />
        </section>

        {/* 2. Materials. */}
        <section className="mt-4 overflow-hidden rounded-card border border-border bg-surface">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-small font-semibold text-ink">Materials</h2>
            <p className="mt-px text-caption text-ink-muted">
              List each part with its cost. The customer sees this itemised.
            </p>
          </div>
          <div className="p-4">
            <MaterialList rows={materials} onChange={setMaterials} />
          </div>
        </section>

        {/* 3. Labour. */}
        <section className="mt-4 rounded-card border border-border bg-surface p-4">
          <label
            htmlFor="quote-labour"
            className="block text-small font-medium text-ink"
          >
            Your labour charge
          </label>
          <div className="relative mt-2 max-w-line-2xl">
            <IndianRupee
              className="pointer-events-none absolute left-3 top-3 size-4 text-ink-muted"
              aria-hidden="true"
            />
            <Input
              id="quote-labour"
              value={labourRupees}
              onChange={(e) =>
                setLabourRupees(e.target.value.replace(/[^\d.]/g, ""))
              }
              inputMode="decimal"
              placeholder="0"
              className="pl-8 tabular"
            />
          </div>
        </section>

        {/* 4. Photos — the rule with teeth. */}
        <section
          className={cn(
            "mt-4 rounded-card border bg-surface p-4",
            shortPhotos > 0 ? "border-clock-line" : "border-border",
          )}
        >
          <PhotoCapture
            photos={photos}
            onChange={setPhotos}
            label="Before photos"
            minimum={QUOTATION_MIN_BEFORE_PHOTOS}
            hint="Photograph the site before you start. Fewer than two and the quotation is rejected automatically — these are what let an admin approve work they cannot see."
          />
        </section>
      </div>
    </ProActionLayout>
  );
}

// -- Materials ---------------------------------------------------------------

function MaterialList({
  rows,
  onChange,
}: {
  rows: MaterialRow[];
  onChange: (next: MaterialRow[]) => void;
}) {
  const [description, setDescription] = React.useState("");
  const [rupees, setRupees] = React.useState("");

  const costPaise = Math.round((Number(rupees) || 0) * 100);
  const valid = description.trim() !== "" && costPaise > 0;

  const add = () => {
    if (!valid) return;
    onChange([
      ...rows,
      {
        key: `${Date.now()}-${rows.length}`,
        description: description.trim(),
        costPaise,
      },
    ]);
    setDescription("");
    setRupees("");
  };

  const materialsTotal = rows.reduce((t, r) => t + r.costPaise, 0);

  return (
    <>
      {rows.length > 0 && (
        <ul className="mb-3 divide-y divide-border-soft rounded-control border border-border">
          {rows.map((row) => (
            <li
              key={row.key}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <span className="min-w-0 truncate text-small text-ink">
                {row.description}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="tabular text-small font-medium text-ink">
                  {formatCurrency(row.costPaise)}
                </span>
                <button
                  type="button"
                  onClick={() => onChange(rows.filter((r) => r.key !== row.key))}
                  aria-label={`Remove ${row.description}`}
                  className="flex size-touch items-center justify-center rounded-control text-ink-faint transition-colors duration-fast hover:text-critical-ink"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
          <li className="flex items-center justify-between gap-3 bg-canvas px-3 py-2">
            <span className="text-small font-medium text-ink">Materials</span>
            <span className="tabular text-small font-semibold text-ink">
              {formatCurrency(materialsTotal)}
            </span>
          </li>
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Part or material"
          aria-label="Material description"
          className="min-w-0 flex-1"
        />
        <div className="flex gap-2">
          <div className="relative min-w-0 flex-1 sm:w-line-sm sm:flex-none">
            <IndianRupee
              className="pointer-events-none absolute left-3 top-3 size-4 text-ink-muted"
              aria-hidden="true"
            />
            <Input
              value={rupees}
              onChange={(e) => setRupees(e.target.value.replace(/[^\d.]/g, ""))}
              inputMode="decimal"
              placeholder="0"
              aria-label="Cost in rupees"
              className="pl-8 tabular"
            />
          </div>
          <Button variant="secondary" disabled={!valid} onClick={add}>
            <Plus />
            Add
          </Button>
        </div>
      </div>

      {rows.length === 0 && (
        <p className="mt-2 flex items-start gap-2 text-caption text-ink-muted">
          <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
          If the job needs no materials, leave this empty and put your charge
          under labour.
        </p>
      )}
    </>
  );
}
