"use client";

import * as React from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  IndianRupee,
  Loader2,
  Plus,
  Satellite,
  Trash2,
  TriangleAlert,
} from "lucide-react";
import { addExtraCharge, getProJob } from "@cfc/mocks";
import type { ExtraCharge, ProJob } from "@cfc/types";
import {
  Badge,
  Button,
  ErrorState,
  Input,
  PhotoCapture,
  Skeleton,
  cn,
  formatCurrency,
  toast,
  type CapturedPhoto,
} from "@cfc/ui";
import { ProAction, ProActionLayout } from "@/components/pro-action-bar";
import { currentProId } from "@/lib/pro-session";
import {
  GPS_PROOF_RADIUS_M,
  LOCATION_ERROR_MESSAGE,
  useDistanceTo,
} from "@/lib/use-distance-to";

/**
 * Pro 15 — work in progress.
 *
 * The inventory asks for four things: before-photos, extra charges, a Complete
 * Job button, and "GPS proof active". All four are here, and the ordering is
 * the order the work actually happens in.
 *
 * ## Before-photos come first, and there is a reason to explain
 *
 * A pro asked to photograph a customer's bathroom before touching it will
 * reasonably wonder why. The answer is that the photos protect *them* — they
 * are the evidence in a dispute about pre-existing damage, and they are what
 * makes a quotation credible to an admin who cannot see the site. Saying so
 * turns an imposition into a reason.
 *
 * ## GPS is live, and shown as a number
 *
 * The 100 m rule bites at completion, so a pro needs to know where they stand
 * *while* they work, not at the moment they try to close. Shown as a live
 * distance rather than a verdict.
 *
 * ## Extra charges vs. a quotation
 *
 * Two different things, and conflating them is how a pro ends up bypassing the
 * approval flow. An extra charge is small and explainable — a part, a second
 * visit. Anything substantial goes through the quotation flow, where an admin
 * reviews it and the customer accepts with a 50% advance. Both routes are on
 * this screen, labelled for what they are.
 */

export default function ProWorkPage() {
  const params = useParams<{ id: string }>();
  const jobId = params.id;
  const proId = React.useMemo(() => currentProId(), []);

  const [job, setJob] = React.useState<ProJob | null>(null);
  const [state, setState] = React.useState<"loading" | "ready" | "gone">(
    "loading",
  );

  const load = React.useCallback(() => {
    setState("loading");
    let cancelled = false;
    void getProJob(proId, jobId)
      .then((j) => {
        if (cancelled) return;
        if (j === null) {
          setState("gone");
          return;
        }
        setJob(j);
        setState("ready");
      })
      .catch(() => {
        if (!cancelled) setState("gone");
      });
    return () => {
      cancelled = true;
    };
  }, [proId, jobId]);

  React.useEffect(() => load(), [load]);

  if (state === "loading") {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-4 md:px-6 lg:px-8">
        <Skeleton className="h-4 w-line-sm" />
        <Skeleton className="mt-4 h-6 w-line-lg" />
        <Skeleton className="mt-4 h-block-sm w-full rounded-card" />
      </div>
    );
  }

  if (state === "gone" || job === null) {
    return (
      <div className="mx-auto max-w-screen-xl px-4 py-12 md:px-6 lg:px-8">
        <div className="rounded-card border border-border bg-surface">
          <ErrorState
            title="Job not available"
            description="This job is no longer assigned to you."
            action={{ label: "Try again", onClick: load }}
          />
        </div>
        <div className="mt-4 text-center">
          <Button variant="ghost" asChild>
            <Link href="/jobs">
              <ArrowLeft />
              All jobs
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  return <WorkView job={job} />;
}

function WorkView({ job }: { job: ProJob }) {
  const router = useRouter();

  const [beforePhotos, setBeforePhotos] = React.useState<CapturedPhoto[]>([]);
  const [extras, setExtras] = React.useState<ExtraCharge[]>([]);
  const distance = useDistanceTo(job.location);

  const extrasTotal = extras.reduce((t, x) => t + x.amountPaise, 0);

  return (
    <ProActionLayout
      action={
        <ProAction>
          <CompleteAction
            job={job}
            beforeCount={beforePhotos.length}
            extrasTotal={extrasTotal}
            distance={distance}
            onComplete={() => router.push(`/jobs/${job.id}/complete`)}
          />
        </ProAction>
      }
    >
      <div className="py-4">
        <Link
          href={`/jobs/${job.id}`}
          className="inline-flex items-center gap-1 text-small font-medium text-ink-muted hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Job details
        </Link>

        <div className="mt-3">
          <Badge tone="live" dot>
            In progress
          </Badge>
          <h1 className="mt-2 text-title font-semibold text-ink">
            {job.serviceName}
          </h1>
          <p className="mt-px text-small text-ink-muted">
            {job.customerName} · {job.area}
          </p>
        </div>

        {/* 1. Before-photos, with the reason they exist. */}
        <section className="mt-5 rounded-card border border-border bg-surface p-4">
          <PhotoCapture
            photos={beforePhotos}
            onChange={setBeforePhotos}
            label="Before photos"
            hint="Take these before you start. They protect you if the customer later reports damage that was already there, and they are required if you raise a quotation."
          />
        </section>

        {/* 2. Extra charges, and the quotation route beside them. */}
        <section className="mt-4 overflow-hidden rounded-card border border-border bg-surface">
          <div className="border-b border-border px-4 py-3">
            <h2 className="text-small font-semibold text-ink">
              Extra charges
            </h2>
            <p className="mt-px text-caption text-ink-muted">
              Small additions the customer has agreed to — a part, a second
              visit. For larger work, raise a quotation instead.
            </p>
          </div>

          <div className="p-4">
            <ExtraCharges
              jobId={job.id}
              charges={extras}
              onChange={setExtras}
            />
          </div>

          {/* The quotation route. Deliberately here, next to extra charges, so
              a pro tempted to add ₹4,000 as an "extra" sees the correct path
              in the same glance. */}
          <div className="border-t border-border bg-canvas p-4">
            <div className="flex items-start gap-3">
              <span className="flex size-tile shrink-0 items-center justify-center rounded-control bg-action-subtle text-action">
                <FileText className="size-5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="text-small font-medium text-ink">
                  Bigger job than expected?
                </p>
                <p className="text-caption text-ink-muted">
                  Raise a quotation with a material list. An admin reviews it
                  within 15 minutes and the customer pays 50% in advance.
                </p>
              </div>
            </div>
            <Button variant="secondary" className="mt-3 w-full" asChild>
              <Link href={`/jobs/${job.id}/quote`}>Raise a quotation</Link>
            </Button>
          </div>
        </section>
      </div>
    </ProActionLayout>
  );
}

// -- Extra charges -----------------------------------------------------------

function ExtraCharges({
  jobId,
  charges,
  onChange,
}: {
  jobId: string;
  charges: ExtraCharge[];
  onChange: (next: ExtraCharge[]) => void;
}) {
  const [label, setLabel] = React.useState("");
  const [rupees, setRupees] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  const amountPaise = Math.round(Number(rupees) * 100);
  const valid = label.trim() !== "" && Number.isFinite(amountPaise) && amountPaise > 0;

  const add = async () => {
    if (!valid) return;
    setBusy(true);
    try {
      const charge = await addExtraCharge(jobId, label.trim(), amountPaise);
      onChange([...charges, charge]);
      setLabel("");
      setRupees("");
    } catch {
      toast.error("Could not add the charge. Try again.");
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      {charges.length > 0 && (
        <ul className="mb-3 divide-y divide-border-soft rounded-control border border-border">
          {charges.map((charge) => (
            <li
              key={charge.id}
              className="flex items-center justify-between gap-3 px-3 py-2"
            >
              <span className="min-w-0 truncate text-small text-ink">
                {charge.label}
              </span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="tabular text-small font-medium text-ink">
                  {formatCurrency(charge.amountPaise)}
                </span>
                <button
                  type="button"
                  onClick={() =>
                    onChange(charges.filter((c) => c.id !== charge.id))
                  }
                  aria-label={`Remove ${charge.label}`}
                  className="flex size-touch items-center justify-center rounded-control text-ink-faint transition-colors duration-fast hover:text-critical-ink"
                >
                  <Trash2 className="size-4" aria-hidden="true" />
                </button>
              </span>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Input
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder="What is the charge for?"
          aria-label="Charge description"
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
              aria-label="Amount in rupees"
              // `pl-8` clears the icon at left-3. Off the closed scale here and
              // the padding silently vanishes, putting the icon over the digits.
              className="pl-8 tabular"
            />
          </div>
          <Button
            variant="secondary"
            disabled={!valid || busy}
            onClick={() => void add()}
          >
            <Plus />
            Add
          </Button>
        </div>
      </div>
    </>
  );
}

// -- The docked action -------------------------------------------------------

/**
 * Complete the job — gated, and honest about the gate.
 *
 * Two conditions, and they behave differently on purpose:
 *
 *   **Before-photos** are a soft requirement here. The agreement mandates them
 *   for a *quotation*; for an ordinary job they are strongly advisable, so this
 *   warns rather than blocks. Blocking a pro who forgot to photograph a tap
 *   from ever closing the job would strand them.
 *
 *   **The 100 m GPS rule** is the platform's own proof requirement, so it is
 *   shown live and enforced at the completion step — but not by making the
 *   button unpressable, because a pro who cannot get a fix indoors still has to
 *   be able to finish. The completion screen records what the GPS said.
 */
function CompleteAction({
  job,
  beforeCount,
  extrasTotal,
  distance,
  onComplete,
}: {
  job: ProJob;
  beforeCount: number;
  extrasTotal: number;
  distance: ReturnType<typeof useDistanceTo>;
  onComplete: () => void;
}) {
  const { metres, accuracyM, loading, error, retry } = distance;
  const within = metres !== null && metres <= GPS_PROOF_RADIUS_M;

  return (
    <>
      {/* GPS, live. */}
      <div
        className={cn(
          "rounded-control border p-3",
          error !== null
            ? "border-clock-line bg-clock-subtle"
            : within
              ? "border-live-line bg-live-subtle"
              : "border-border bg-canvas",
        )}
      >
        <p className="flex items-center gap-2 text-small font-medium">
          {loading ? (
            <Loader2 className="size-4 shrink-0 animate-spin text-ink-muted" aria-hidden="true" />
          ) : error !== null ? (
            <TriangleAlert className="size-4 shrink-0 text-clock-ink" aria-hidden="true" />
          ) : within ? (
            <CheckCircle2 className="size-4 shrink-0 text-live-ink" aria-hidden="true" />
          ) : (
            <Satellite className="size-4 shrink-0 text-ink-muted" aria-hidden="true" />
          )}
          <span
            className={cn(
              error !== null
                ? "text-clock-ink"
                : within
                  ? "text-live-ink"
                  : "text-ink",
            )}
          >
            {loading
              ? "Checking location…"
              : error !== null
                ? "Location unavailable"
                : metres === null
                  ? "Location not checked"
                  : within
                    ? "GPS confirmed on site"
                    : `${Math.round(metres)} m from the customer`}
          </span>
        </p>

        {error !== null ? (
          <>
            <p className="mt-1 text-caption text-clock-ink">
              {LOCATION_ERROR_MESSAGE[error]}
            </p>
            {error !== "unsupported" && error !== "denied" && (
              <Button variant="ghost" size="sm" className="mt-1 text-clock-ink" onClick={retry}>
                Check again
              </Button>
            )}
          </>
        ) : (
          metres !== null && (
            <p className="mt-1 text-caption text-ink-muted">
              Within {GPS_PROOF_RADIUS_M} m is required to complete
              {accuracyM !== null && ` · accurate to about ${Math.round(accuracyM)} m`}
            </p>
          )
        )}
      </div>

      {/* What they will earn, including anything added on site. */}
      <div className="mt-3 border-t border-border pt-3">
        <div className="flex items-baseline justify-between gap-3">
          <span className="text-small text-ink-muted">You earn</span>
          <span className="tabular text-title font-semibold text-ink">
            {formatCurrency(job.netEarningPaise)}
          </span>
        </div>
        {extrasTotal > 0 && (
          <p className="mt-px text-caption text-ink-muted">
            Plus {formatCurrency(extrasTotal)} in extra charges, once approved.
          </p>
        )}
      </div>

      {/* The soft warning about photos. */}
      {beforeCount === 0 && (
        <p className="mt-3 flex items-start gap-2 rounded-control bg-clock-subtle p-2 text-caption text-clock-ink">
          <TriangleAlert className="mt-px size-4 shrink-0" aria-hidden="true" />
          You have not added any before photos. They are your evidence if the
          customer reports a problem later.
        </p>
      )}

      <Button size="pro" className="mt-3 w-full" onClick={onComplete}>
        Complete job
      </Button>
      <p className="mt-2 text-caption text-ink-muted">
        You will need the customer’s 4-digit code.
      </p>
    </>
  );
}
