"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Check,
  CheckCheck,
  ImageOff,
  Pencil,
  Phone,
  Trash2,
  TriangleAlert,
  X,
} from "lucide-react";
import { getQuotation, getQuotations } from "@cfc/mocks";
import {
  QUOTATION_STATUSES,
  QUOTATION_STATUS_LABEL,
  type QuotationDetail,
  type QuotationStatus,
} from "@cfc/types";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  DetailCard,
  DetailList,
  DetailRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  EmptyState,
  ErrorState,
  FilterBar,
  FilterSelect,
  FormField,
  InlineAlert,
  Input,
  NoResultsState,
  Pagination,
  PageHeader,
  QuotationStatusBadge,
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Skeleton,
  StatCard,
  Textarea,
  cn,
  formatCurrency,
  formatSchedule,
  initials,
  toast,
} from "@cfc/ui";

/**
 * Admin 4 + 5 — Quotation management.
 *
 * Inventory 4: "Live queue of all pending quotes. Job ID, Pro, Customer,
 * Service, Amount. [Approve] [Edit & Approve] [Reject] per row."
 * Inventory 5: "Full quote view: Pro notes, before-photos, material list,
 * customer history. Approve/Edit/Reject with reason."
 *
 * This is a triage queue under a clock, not a table, and it is built as one.
 * The agreement gives the pro a fifteen-minute wait and no longer, so the
 * screen sorts by time remaining rather than by submission order, shows each
 * window draining, and puts Approve and Send back on the row — an operator with
 * four minutes left should not spend forty seconds opening a record to use
 * them.
 *
 * Three rules from the agreement are enforced visibly rather than merely
 * documented:
 *
 *   15 minutes   the approval window. Under 5 it turns amber, past it red.
 *   ₹5,000       above this a quote needs a phone confirmation first, so the
 *                row says so and the approve action asks for it.
 *   2 photos     a quote with fewer is auto-rejected, so a short one is
 *                flagged before anyone spends time reading it.
 *
 * Frontend only — deciding a quote removes it from the local list and toasts.
 * The mock layer is read-only and the backend team owns the write path.
 */

const PAGE_SIZE = 20;

/** SRS 3.2 — above this a quote needs a phone confirmation before approval. */
const CALL_THRESHOLD_PAISE = 500_000;

/** SRS 3.2 — fewer than this many before-photos is an automatic rejection. */
const MIN_PHOTOS = 2;

const REJECTION_REASONS = [
  "Quoted amount exceeds the template rate for this service.",
  "Material list does not match the work described.",
  "Before-photos do not show the reported problem.",
  "Customer has disputed the scope of this job.",
];

function QuotationManagementInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openId = searchParams.get("id");

  const [status, setStatus] = React.useState<QuotationStatus | "all">("pending");
  const [search, setSearch] = React.useState("");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(PAGE_SIZE);

  const [data, setData] = React.useState<{
    items: QuotationDetail[];
    total: number;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    let cancelled = false;
    setLoading(true);
    setError(null);
    getQuotations({ status, page, pageSize })
      .then((res) => !cancelled && setData(res))
      .catch(
        (e: unknown) =>
          !cancelled &&
          setError(e instanceof Error ? e.message : "Could not load."),
      )
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [status, page, pageSize]);

  React.useEffect(() => load(), [load]);
  React.useEffect(() => setPage(1), [status]);

  const openDetail = (id: string) =>
    router.push(`/quotations?id=${id}`, { scroll: false });
  const closeDetail = () => router.push("/quotations", { scroll: false });

  // No backend to persist against, so the row leaves the visible queue — the
  // effect a real status change would have, without pretending to write.
  const decide = (q: QuotationDetail, outcome: "approved" | "rejected") => {
    setData((d) =>
      d
        ? { ...d, items: d.items.filter((r) => r.id !== q.id), total: d.total - 1 }
        : d,
    );
    toast.success(
      outcome === "approved"
        ? `${q.jobRef} approved — the customer has been notified`
        : `${q.jobRef} sent back to ${q.proName}`,
    );
    if (openId === q.id) closeDetail();
  };

  // Most urgent first. An operator triages by clock, never by submission order.
  const rows = React.useMemo(() => {
    if (!data) return [];
    const q = search.trim().toLowerCase();
    const matched = q
      ? data.items.filter(
          (r) =>
            r.jobRef.toLowerCase().includes(q) ||
            r.proName.toLowerCase().includes(q) ||
            r.customerName.toLowerCase().includes(q) ||
            r.serviceName.toLowerCase().includes(q),
        )
      : data.items;
    return [...matched].sort(
      (a, b) => (a.minutesRemaining ?? 999) - (b.minutesRemaining ?? 999),
    );
  }, [data, search]);

  const pending = data?.items.filter((q) => q.status === "pending") ?? [];
  const overdue = pending.filter((q) => (q.minutesRemaining ?? 99) <= 0).length;
  const closing = pending.filter((q) => {
    const m = q.minutesRemaining;
    return m !== null && m > 0 && m <= 5;
  }).length;
  const needCall = pending.filter(
    (q) => q.totalPaise > CALL_THRESHOLD_PAISE,
  ).length;

  const filtered = search.trim() !== "" || status !== "pending";

  return (
    <div className="space-y-6">
      <PageHeader
        title="Quotation management"
        description="Pros submit quotes from the field. Each one has a 15-minute window before it expires."
      />

      {overdue > 0 && (
        <InlineAlert
          tone="critical"
          title={`${overdue} quote${overdue === 1 ? "" : "s"} past the 15-minute window`}
        >
          The pro is waiting on site and cannot start work until this is
          resolved.
        </InlineAlert>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Awaiting review"
          value={pending.length}
          loading={loading}
          hint="pros waiting on site"
        />
        <StatCard
          label="Past the window"
          value={overdue}
          loading={loading}
          hint={overdue === 0 ? "none overdue" : "resolve these first"}
          goodWhen="down"
          {...(overdue > 0
            ? { delta: { value: "overdue", direction: "up" as const } }
            : {})}
        />
        <StatCard
          label="Closing soon"
          value={closing}
          loading={loading}
          hint="under 5 minutes left"
        />
        <StatCard
          label="Need a phone call"
          value={needCall}
          loading={loading}
          hint="above ₹5,000"
        />
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by job ID, pro, customer or service"
          searchLabel="Search quotations"
          activeCount={status !== "pending" ? 1 : 0}
          onClearAll={() => {
            setStatus("pending");
            setSearch("");
          }}
          resultLabel={
            !loading && data ? `${rows.length} of ${data.total}` : undefined
          }
        >
          <FilterSelect
            label="Status"
            value={status === "pending" ? null : status}
            onChange={(v) => setStatus((v as QuotationStatus) ?? "pending")}
            allLabel="Awaiting review"
            options={QUOTATION_STATUSES.filter((s) => s !== "pending").map(
              (s) => ({ value: s, label: QUOTATION_STATUS_LABEL[s] }),
            )}
          />
        </FilterBar>

        {error ? (
          <ErrorState
            icon={<TriangleAlert />}
            title="The quotations could not load"
            description="The connection may have dropped. Try again."
            action={{ label: "Try again", onClick: load }}
          />
        ) : loading ? (
          <QueueSkeleton />
        ) : rows.length === 0 ? (
          filtered ? (
            <NoResultsState
              onClearFilters={() => {
                setStatus("pending");
                setSearch("");
              }}
            />
          ) : (
            <EmptyState
              icon={<CheckCheck />}
              title="The queue is clear"
              description="Every quote submitted so far has been reviewed. New ones appear here the moment a pro sends them."
            />
          )
        ) : (
          <ul className="divide-y divide-border-soft">
            {rows.map((q) => (
              <QueueRow
                key={q.id}
                quote={q}
                onOpen={() => openDetail(q.id)}
                onDecide={decide}
              />
            ))}
          </ul>
        )}

        {!loading && !error && data && data.total > pageSize && (
          <Pagination
            page={page}
            pageSize={pageSize}
            total={data.total}
            onPageChange={setPage}
            onPageSizeChange={setPageSize}
            className="border-t border-border"
          />
        )}
      </div>

      <Sheet
        open={openId !== null}
        onOpenChange={(open) => {
          if (!open) closeDetail();
        }}
      >
        <SheetContent>
          {openId && <QuotationDetailPanel id={openId} onDecide={decide} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// -- The queue row -----------------------------------------------------------

/**
 * One quote, actionable without opening it.
 *
 * A row is not a table row: the clock, the flags and both decisions have to sit
 * together, and on a phone they stack rather than being hidden behind a
 * horizontal scroll.
 */
function QueueRow({
  quote,
  onOpen,
  onDecide,
}: {
  quote: QuotationDetail;
  onOpen: () => void;
  onDecide: (q: QuotationDetail, outcome: "approved" | "rejected") => void;
}) {
  const left = quote.minutesRemaining;
  const overdue = left !== null && left <= 0;
  const pending = quote.status === "pending";
  const needsCall = quote.totalPaise > CALL_THRESHOLD_PAISE;
  const shortPhotos = quote.beforePhotoUrls.length < MIN_PHOTOS;

  return (
    <li
      className={cn(
        "p-4 transition-colors duration-fast",
        // The only tinted row on the screen. One row in twenty, not twenty.
        overdue && pending ? "bg-critical-subtle" : "hover:bg-canvas",
      )}
    >
      <div className="flex flex-wrap items-start gap-4">
        {/* Identity */}
        <button
          type="button"
          onClick={onOpen}
          className="flex min-w-0 flex-1 basis-full items-start gap-3 rounded-control text-left sm:basis-auto"
        >
          <Avatar className="size-avatar shrink-0">
            <AvatarFallback>{initials(quote.proName)}</AvatarFallback>
          </Avatar>

          <span className="min-w-0 flex-1">
            <span className="flex flex-wrap items-center gap-2">
              <span className="tabular text-small font-medium text-ink width-condensed">
                {quote.jobRef}
              </span>
              <span className="truncate text-small text-ink">
                {quote.serviceName}
              </span>
              {needsCall && pending && (
                <Badge tone="clock">
                  <Phone className="size-3" aria-hidden="true" />
                  Call first
                </Badge>
              )}
              {shortPhotos && pending && (
                <Badge tone="critical">
                  <ImageOff className="size-3" aria-hidden="true" />
                  {quote.beforePhotoUrls.length} of {MIN_PHOTOS} photos
                </Badge>
              )}
            </span>
            <span className="mt-px block truncate text-caption text-ink-muted">
              {quote.proName} → {quote.customerName} ·{" "}
              <span className="tabular">{formatSchedule(quote.submittedAt)}</span>
            </span>
          </span>
        </button>

        {/* Clock + amount. Right-aligned on a phone, where this is its own
            line and a left-aligned amount reads as unfinished. */}
        <div className="ml-auto flex items-center gap-4 sm:ml-0">
          {pending ? (
            <Clock minutesRemaining={left} />
          ) : (
            <QuotationStatusBadge status={quote.status} />
          )}
          <span className="tabular w-amount text-right text-body font-semibold text-ink width-condensed">
            {formatCurrency(quote.totalPaise)}
          </span>
        </div>

        {/* Decisions */}
        {pending && (
          <div className="flex w-full gap-2 sm:w-auto">
            <RejectDialog quote={quote} onDecide={onDecide} />
            <EditApproveDialog quote={quote} onDecide={onDecide} />
            <ApproveButton quote={quote} onDecide={onDecide} />
          </div>
        )}
      </div>
    </li>
  );
}

/**
 * The fifteen-minute window as a draining bar.
 *
 * The bar reads faster than the number does — the eye takes in how much room is
 * left before it finishes reading "7 min". Teal while there is room, amber under
 * five minutes, red once the window has closed.
 */
function Clock({ minutesRemaining }: { minutesRemaining: number | null }) {
  if (minutesRemaining === null) {
    return <span className="w-clock text-caption text-ink-faint">—</span>;
  }

  const overdue = minutesRemaining <= 0;
  const closing = !overdue && minutesRemaining <= 5;
  const fraction = Math.max(0, Math.min(1, minutesRemaining / 15));

  return (
    <div className="w-clock shrink-0 space-y-1">
      <p
        className={cn(
          "tabular text-caption font-medium",
          overdue
            ? "text-critical-ink"
            : closing
              ? "text-clock-ink"
              : "text-ink-muted",
        )}
      >
        {overdue ? "Overdue" : `${minutesRemaining} min`}
      </p>
      <div
        className="h-1 overflow-hidden rounded-pill bg-neutral-subtle"
        role="img"
        aria-label={
          overdue
            ? "Past the 15-minute approval window"
            : `${minutesRemaining} of 15 minutes remaining`
        }
      >
        <div
          className={cn(
            "h-full rounded-pill transition-size duration-slow ease-out",
            overdue ? "bg-critical" : closing ? "bg-clock" : "bg-action",
          )}
          style={{ width: `${overdue ? 100 : fraction * 100}%` }}
        />
      </div>
    </div>
  );
}

/**
 * Approve. Above ₹5,000 the agreement requires a phone confirmation first, so
 * the button asks for it rather than letting an operator skip a rule they may
 * not remember.
 */
function ApproveButton({
  quote,
  onDecide,
}: {
  quote: QuotationDetail;
  onDecide: (q: QuotationDetail, outcome: "approved" | "rejected") => void;
}) {
  const needsCall = quote.totalPaise > CALL_THRESHOLD_PAISE;

  if (!needsCall) {
    return (
      <Button
        variant="primary"
        size="sm"
        className="flex-1 sm:flex-none"
        onClick={() => onDecide(quote, "approved")}
      >
        <Check />
        Approve
      </Button>
    );
  }

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="primary" size="sm" className="flex-1 sm:flex-none">
          <Check />
          Approve
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Confirm {formatCurrency(quote.totalPaise)} with the customer first
          </AlertDialogTitle>
          <AlertDialogDescription>
            Quotes above {formatCurrency(CALL_THRESHOLD_PAISE)} need a phone
            confirmation before approval. Call {quote.customerName} and confirm
            the amount and the work described.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Not yet</AlertDialogCancel>
          <AlertDialogAction onClick={() => onDecide(quote, "approved")}>
            Customer confirmed — approve
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

/**
 * Edit & approve — the third action the inventory names for Admin 4 and 5.
 *
 * It exists because the alternative is worse. A quote with one wrong line is
 * common: a material priced above the template, a labour figure that includes
 * something already covered. Sending that back costs the pro their remaining
 * window and a second site visit to resubmit, when the operator can see exactly
 * what is wrong and fix it in ten seconds.
 *
 * Every edit is a reduction in practice, so the dialog shows the delta against
 * what the pro submitted rather than only the new total — an operator should
 * see how much they just took off a pro's earnings before they commit to it.
 *
 * The ₹5,000 rule follows the EDITED total, not the original: a quote edited
 * down past the threshold no longer needs the phone call, and one edited up past
 * it now does.
 */
function EditApproveDialog({
  quote,
  onDecide,
}: {
  quote: QuotationDetail;
  onDecide: (q: QuotationDetail, outcome: "approved" | "rejected") => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [materials, setMaterials] = React.useState(quote.materials);
  const [labour, setLabour] = React.useState(quote.laborPaise);
  const [note, setNote] = React.useState("");

  // Reopening after a cancel should show the pro's figures again, not the ones
  // that were abandoned last time.
  React.useEffect(() => {
    if (!open) {
      setMaterials(quote.materials);
      setLabour(quote.laborPaise);
      setNote("");
    }
  }, [open, quote.materials, quote.laborPaise]);

  const materialTotal = materials.reduce((s, m) => s + m.costPaise, 0);
  const total = materialTotal + labour;
  const delta = total - quote.totalPaise;
  const changed = delta !== 0;
  const needsCall = total > CALL_THRESHOLD_PAISE;

  const setMaterialCost = (index: number, rupees: string) => {
    const paise = Math.max(0, Math.round(Number(rupees) * 100) || 0);
    setMaterials((ms) =>
      ms.map((m, i) => (i === index ? { ...m, costPaise: paise } : m)),
    );
  };

  const dropMaterial = (index: number) =>
    setMaterials((ms) => ms.filter((_, i) => i !== index));

  const commit = () => {
    onDecide(
      { ...quote, materials, laborPaise: labour, totalPaise: total },
      "approved",
    );
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm" className="flex-1 sm:flex-none">
          <Pencil />
          <span className="sm:hidden">Edit</span>
          <span className="hidden sm:inline">Edit &amp; approve</span>
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Edit <span className="tabular">{quote.jobRef}</span> before approving
          </DialogTitle>
          <DialogDescription>
            {quote.proName} sees the edited figures and the reason. Correcting a
            line here saves them resubmitting inside their remaining window.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="overflow-hidden rounded-card border border-border">
            <p className="border-b border-border bg-canvas px-3 py-2 text-caption font-semibold uppercase tracking-wide text-ink-faint">
              Materials
            </p>

            {materials.length === 0 ? (
              <p className="px-3 py-4 text-small text-ink-muted">
                All material lines removed. Labour only.
              </p>
            ) : (
              <ul className="divide-y divide-border-soft">
                {materials.map((m, i) => (
                  <li key={i} className="flex items-center gap-2 px-3 py-2">
                    <span className="min-w-0 flex-1 truncate text-small text-ink">
                      {m.description}
                    </span>
                    <Input
                      inputSize="sm"
                      type="number"
                      min={0}
                      value={String(m.costPaise / 100)}
                      onChange={(e) => setMaterialCost(i, e.target.value)}
                      aria-label={`Cost of ${m.description} in rupees`}
                      className="w-amount text-right"
                    />
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => dropMaterial(i)}
                      aria-label={`Remove ${m.description}`}
                    >
                      <Trash2 />
                    </Button>
                  </li>
                ))}
              </ul>
            )}

            <div className="flex items-center gap-2 border-t border-border px-3 py-2">
              <span className="min-w-0 flex-1 text-small font-medium text-ink">
                Labour
              </span>
              <Input
                inputSize="sm"
                type="number"
                min={0}
                value={String(labour / 100)}
                onChange={(e) =>
                  setLabour(Math.max(0, Math.round(Number(e.target.value) * 100) || 0))
                }
                aria-label="Labour cost in rupees"
                className="w-amount text-right"
              />
              {/* Spacer matching the remove button, so the two columns of
                  inputs stay aligned. */}
              <span className="size-8 shrink-0" aria-hidden="true" />
            </div>
          </div>

          {/* The delta, not just the new total. An operator should see what
              they are taking off a pro's earnings before committing. */}
          <div className="flex items-baseline justify-between rounded-card bg-canvas px-3 py-3">
            <span className="text-small text-ink-muted">
              {changed ? "Revised total" : "Total"}
            </span>
            <span className="text-right">
              <span className="tabular block text-heading font-semibold text-ink">
                {formatCurrency(total)}
              </span>
              {changed && (
                <span
                  className={cn(
                    "tabular block text-caption font-medium",
                    delta < 0 ? "text-live-ink" : "text-clock-ink",
                  )}
                >
                  {delta < 0 ? "−" : "+"}
                  {formatCurrency(Math.abs(delta))} vs. submitted
                </span>
              )}
            </span>
          </div>

          <FormField
            label="What changed"
            required={changed}
            help="The pro sees this alongside the revised figures."
          >
            <Textarea
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. Gas refill priced at the template rate."
            />
          </FormField>

          {needsCall && (
            <InlineAlert tone="clock" title="Phone confirmation still required">
              The revised total is above {formatCurrency(CALL_THRESHOLD_PAISE)}.
              Confirm it with {quote.customerName} before approving.
            </InlineAlert>
          )}
        </div>

        <DialogFooter>
          <Button
            variant="primary"
            onClick={commit}
            disabled={changed && note.trim() === ""}
          >
            <Check />
            {changed ? "Approve revised quote" : "Approve"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Send back. A rejection reaches the pro's Quotation Status screen, so a reason
 * is required — and the four most common ones are one tap rather than a typed
 * sentence, because an operator working a queue against a clock will otherwise
 * write nothing useful.
 */
function RejectDialog({
  quote,
  onDecide,
}: {
  quote: QuotationDetail;
  onDecide: (q: QuotationDetail, outcome: "approved" | "rejected") => void;
}) {
  const [reason, setReason] = React.useState("");

  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>
        <Button variant="secondary" size="sm" className="flex-1 sm:flex-none">
          <X />
          Send back
        </Button>
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Send {quote.jobRef} back?</AlertDialogTitle>
          <AlertDialogDescription>
            {quote.proName} sees this reason on their Quotation Status screen and
            can resubmit.
          </AlertDialogDescription>
        </AlertDialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {REJECTION_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={cn(
                  "rounded-pill border px-3 py-1 text-caption text-left",
                  "transition-colors duration-fast",
                  reason === r
                    ? "border-action bg-action-subtle text-action-press"
                    : "border-border-strong text-ink-muted hover:bg-canvas",
                )}
              >
                {r.replace(/\.$/, "")}
              </button>
            ))}
          </div>
          <Textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Or write a specific reason"
            aria-label="Reason for sending back"
          />
        </div>

        <AlertDialogFooter>
          <AlertDialogCancel>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="critical"
            disabled={reason.trim() === ""}
            onClick={() =>
              onDecide({ ...quote, rejectionReason: reason }, "rejected")
            }
          >
            Send back
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function QueueSkeleton() {
  return (
    <div className="divide-y divide-border-soft">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-4 p-4">
          <Skeleton className="size-avatar rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-line-md" />
            <Skeleton className="h-3 w-line-lg" />
          </div>
          <Skeleton className="h-8 w-clock" />
          <Skeleton className="h-8 w-amount" />
          <Skeleton className="h-8 w-line-sm" />
        </div>
      ))}
    </div>
  );
}

// -- Admin 5: the detail panel ----------------------------------------------

function QuotationDetailPanel({
  id,
  onDecide,
}: {
  id: string;
  onDecide: (q: QuotationDetail, outcome: "approved" | "rejected") => void;
}) {
  const [quote, setQuote] = React.useState<QuotationDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    setLoading(true);
    setError(null);
    getQuotation(id)
      .then(setQuote)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      )
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <SheetBody className="space-y-4">
        <Skeleton className="h-8 w-line-md" />
        <Skeleton className="h-block-md rounded-card" />
        <Skeleton className="h-block-sm rounded-card" />
      </SheetBody>
    );
  }

  if (error || !quote) {
    return (
      <SheetBody>
        <ErrorState
          icon={<TriangleAlert />}
          title="This quotation could not be found"
          description={error ?? "It may have been removed."}
        />
      </SheetBody>
    );
  }

  const materialTotal = quote.materials.reduce((s, m) => s + m.costPaise, 0);
  const pending = quote.status === "pending";
  const shortPhotos = quote.beforePhotoUrls.length < MIN_PHOTOS;
  const needsCall = quote.totalPaise > CALL_THRESHOLD_PAISE;

  return (
    <>
      <SheetHeader>
        <SheetTitle>
          <span className="tabular">{quote.jobRef}</span>
        </SheetTitle>
        <p className="text-small text-ink-muted">
          {quote.proName} → {quote.customerName} · {quote.serviceName}
        </p>
      </SheetHeader>

      <SheetBody className="space-y-4">
        {pending && (
          <div className="flex items-center justify-between gap-3 rounded-card border border-border bg-canvas p-3">
            <span className="text-small text-ink-muted">Approval window</span>
            <Clock minutesRemaining={quote.minutesRemaining} />
          </div>
        )}

        {shortPhotos && pending && (
          <InlineAlert
            tone="critical"
            title={`Only ${quote.beforePhotoUrls.length} before-photo${quote.beforePhotoUrls.length === 1 ? "" : "s"}`}
          >
            A quotation needs at least {MIN_PHOTOS}. Send it back and ask the pro
            to reshoot before approving.
          </InlineAlert>
        )}

        {needsCall && pending && (
          <InlineAlert tone="clock" title="Phone confirmation required">
            This quote is above {formatCurrency(CALL_THRESHOLD_PAISE)}. Confirm
            the amount with {quote.customerName} before approving.
          </InlineAlert>
        )}

        <DetailCard title="What the pro found">
          <p className="text-body leading-relaxed text-ink">{quote.proNotes}</p>
        </DetailCard>

        <DetailCard
          title={`Before photos (${quote.beforePhotoUrls.length})`}
          padded={false}
        >
          <div className="grid grid-cols-2 gap-px bg-border">
            {quote.beforePhotoUrls.map((url) => (
              <div
                key={url}
                className="flex aspect-square items-center justify-center bg-canvas text-ink-faint"
                role="img"
                aria-label="Before-work photo submitted by the pro"
              >
                <ImageOff className="size-6" aria-hidden="true" />
              </div>
            ))}
          </div>
        </DetailCard>

        <DetailCard title="Costing" padded={false}>
          <div className="divide-y divide-border-soft px-4">
            {quote.materials.map((m, i) => (
              <div
                key={i}
                className="flex items-center justify-between gap-3 py-2 text-small"
              >
                <span className="min-w-0 flex-1 text-ink">{m.description}</span>
                <span className="tabular shrink-0 text-ink">
                  {formatCurrency(m.costPaise)}
                </span>
              </div>
            ))}
          </div>
          <div className="border-t border-border px-4 py-3">
            <DetailList>
              <DetailRow
                label="Materials"
                value={formatCurrency(materialTotal)}
                tabular
              />
              <DetailRow
                label="Labour"
                value={formatCurrency(quote.laborPaise)}
                tabular
              />
            </DetailList>
            <div className="mt-2 flex items-center justify-between border-t border-border pt-3 text-body font-semibold text-ink">
              <span>Total</span>
              <span className="tabular">
                {formatCurrency(quote.totalPaise)}
              </span>
            </div>
          </div>
        </DetailCard>

        <DetailCard title="Context">
          <DetailList>
            <DetailRow
              label="Bookings in this area"
              value={quote.customerAreaHistory}
              tabular
            />
            <DetailRow
              label="Submitted"
              value={formatSchedule(quote.submittedAt)}
              tabular
            />
            <DetailRow
              label="Status"
              value={<QuotationStatusBadge status={quote.status} />}
            />
          </DetailList>
        </DetailCard>

        {quote.rejectionReason && (
          <DetailCard title="Why this was sent back">
            <p className="text-body text-critical-ink">
              {quote.rejectionReason}
            </p>
          </DetailCard>
        )}
      </SheetBody>

      {pending && (
        <div className="flex shrink-0 gap-2 border-t border-border p-4">
          <RejectDialog quote={quote} onDecide={onDecide} />
          <EditApproveDialog quote={quote} onDecide={onDecide} />
          <ApproveButton quote={quote} onDecide={onDecide} />
        </div>
      )}
    </>
  );
}

export default function QuotationManagementPage() {
  return (
    <Suspense fallback={<Skeleton className="h-panel rounded-card" />}>
      <QuotationManagementInner />
    </Suspense>
  );
}
