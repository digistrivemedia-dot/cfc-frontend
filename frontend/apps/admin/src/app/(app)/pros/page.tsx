"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Ban,
  Check,
  ChevronRight,
  CircleDollarSign,
  ClipboardCheck,
  FileCheck,
  FileText,
  ShieldAlert,
  ShieldCheck,
  Star,
  TriangleAlert,
  UserX,
  Wallet,
  X,
} from "lucide-react";
import {
  AREA_OPTIONS,
  SERVICE_NAMES,
  getPayouts,
  getPro,
  getProWarnings,
  getPros,
  getWalletEntries,
} from "@cfc/mocks";
import {
  DOCUMENT_TYPE_LABEL,
  PRO_APPROVAL_LABEL,
  PRO_APPROVAL_STATUSES,
  type DocumentType,
  type Payout,
  type ProApprovalStatus,
  type ProDetail,
  type ProDocument,
  type ProListItem,
  type ProWarning,
  type WalletEntry,
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
  DataTable,
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
  FormField,
  Input,
  PageHeader,
  Pagination,
  Combobox,
  DocumentStatusBadge,
  FilterBar,
  FilterSelect,
  InlineAlert,
  NoResultsState,
  PayoutStatusBadge,
  ProApprovalBadge,
  ProAvailabilityBadge,
  ProBlockedBadge,
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Skeleton,
  StatCard,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  cn,
  formatCurrency,
  formatDate,
  formatSchedule,
  initials,
  toast,
  type CardLayout,
  type Column,
} from "@cfc/ui";

/**
 * Admin 11–18 — Pro Management.
 *
 * Nav restructure (approved plan, corrected during build after re-reading
 * every screen's actual content): one sidebar item, six tabs.
 *
 *  - All Pros (11)    — the master directory. Row click opens Pro Detail (12)
 *                       as a side panel, its own Profile/Documents/Earnings/
 *                       Warnings tabs scoped to that one pro, Block/Unblock (15)
 *                       as the panel's header action.
 *  - Approvals (13)   — pending registrations, approve or reject with remarks.
 *  - Documents (14)   — cross-pro batch document review. NOT a per-pro
 *                       drill-in: every pending pro's documents reviewed
 *                       together, the same shape as Wallet/Payouts/Warnings.
 *  - Wallet (16)      — cross-pro balance ledger with manual adjustment.
 *  - Payouts (18)     — pending payout approval queue.
 *  - Warnings (17)    — discipline record across all pros, issue new warning.
 *
 * Admin 15 (Block/Unblock) has no tab of its own — it's the action inside
 * Pro Detail's panel, plus a "Blocked" filter is reachable from All Pros.
 */

const PAGE_SIZE = 20;
const TAB_PARAM = "tab";
type ProsTab = "all" | "approvals" | "documents" | "wallet" | "payouts" | "warnings";

function ProManagementInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openId = searchParams.get("id");
  // A separate param, because a wallet and a profile answer different
  // questions about the same person and one panel should not have to guess.
  const walletId = searchParams.get("wallet");
  const tab = (searchParams.get(TAB_PARAM) as ProsTab | null) ?? "all";

  const setTab = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(TAB_PARAM, next);
    params.delete("id");
    params.delete("wallet");
    router.push(`/pros?${params.toString()}`, { scroll: false });
  };

  const openDetail = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", id);
    router.push(`/pros?${params.toString()}`, { scroll: false });
  };
  const closeDetail = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    router.push(`/pros?${params.toString()}`, { scroll: false });
  };

  const openWallet = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("wallet", id);
    router.push(`/pros?${params.toString()}`, { scroll: false });
  };
  const closeWallet = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("wallet");
    router.push(`/pros?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Pro management" description="Every service professional on the platform." />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All pros</TabsTrigger>
          <TabsTrigger value="approvals">Approvals</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="wallet">Wallet</TabsTrigger>
          <TabsTrigger value="payouts">Payouts</TabsTrigger>
          <TabsTrigger value="warnings">Warnings</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <AllProsTab onOpenDetail={openDetail} />
        </TabsContent>
        <TabsContent value="approvals">
          <ApprovalsTab />
        </TabsContent>
        <TabsContent value="documents">
          <DocumentsTab />
        </TabsContent>
        <TabsContent value="wallet">
          <WalletTab onOpenWallet={openWallet} />
        </TabsContent>
        <TabsContent value="payouts">
          <PayoutsTab onOpenDetail={openDetail} />
        </TabsContent>
        <TabsContent value="warnings">
          <WarningsTab onOpenDetail={openDetail} />
        </TabsContent>
      </Tabs>

      <Sheet open={openId !== null} onOpenChange={(open) => { if (!open) closeDetail(); }}>
        <SheetContent>
          {openId && <ProDetailPanel id={openId} />}
        </SheetContent>
      </Sheet>

      <Sheet
        open={walletId !== null}
        onOpenChange={(open) => {
          if (!open) closeWallet();
        }}
      >
        <SheetContent>
          {walletId && <WalletDetailPanel proId={walletId} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/**
 * Admin 11 — All pros.
 *
 * Inventory: "Paginated table with online/offline status live. Search, filter by
 * service/area/status."
 *
 * A pro directory is not a list of people, it is a dispatch tool. An operator
 * opens it to answer one of two questions — who can take this job right now, or
 * why is this pro underperforming — so availability and standing lead, and the
 * filters are the ones those questions need.
 *
 * The row leads with a status dot rather than a badge column: at twenty rows,
 * "who is online" should be answerable by scanning the left edge, not by
 * reading a column of pills.
 */
function AllProsTab({ onOpenDetail }: { onOpenDetail: (id: string) => void }) {
  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [approval, setApproval] = React.useState<ProApprovalStatus | null>(null);
  const [online, setOnline] = React.useState<string | null>(null);
  const [area, setArea] = React.useState<string | null>(null);
  const [service, setService] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(PAGE_SIZE);

  const [data, setData] = React.useState<{
    items: ProListItem[];
    total: number;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);
  React.useEffect(() => setPage(1), [debounced, approval, online, area, service]);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    getPros({
      search: debounced || undefined,
      approvalStatus: approval ?? "all",
      online: (online as "online" | "offline" | null) ?? "all",
      page,
      pageSize,
    })
      .then(setData)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      )
      .finally(() => setLoading(false));
  }, [debounced, approval, online, page, pageSize]);

  React.useEffect(() => load(), [load]);

  // Area and service are not server filters in the mock query, so both are
  // applied here. When the backend adds them these move into the request like
  // the others.
  const rows = React.useMemo(() => {
    let items = data?.items ?? [];
    if (area) items = items.filter((p) => p.area === area);
    if (service) items = items.filter((p) => p.services.includes(service));
    return items;
  }, [data, area, service]);

  const activeFilters =
    (approval ? 1 : 0) + (online ? 1 : 0) + (area ? 1 : 0) + (service ? 1 : 0);
  const anyFilter = activeFilters > 0 || debounced !== "";

  const clearAll = () => {
    setSearch("");
    setApproval(null);
    setOnline(null);
    setArea(null);
    setService(null);
  };

  const onlineNow = (data?.items ?? []).filter((p) => p.online).length;

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="On the platform"
          value={data?.total ?? 0}
          loading={loading}
          hint="approved and pending"
        />
        <StatCard
          label="Online right now"
          value={onlineNow}
          loading={loading}
          hint="available to accept jobs"
        />
        <StatCard
          label="Awaiting KYC"
          value={
            (data?.items ?? []).filter((p) => p.approvalStatus === "pending")
              .length
          }
          loading={loading}
          hint="cannot accept jobs yet"
        />
        <StatCard
          label="Blocked"
          value={(data?.items ?? []).filter((p) => p.blocked).length}
          loading={loading}
          hint="access revoked"
        />
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name, phone or Pro ID"
          searchLabel="Search pros"
          activeCount={activeFilters}
          onClearAll={clearAll}
          resultLabel={
            !loading && data ? `${rows.length} of ${data.total}` : undefined
          }
        >
          <FilterSelect
            label="Availability"
            value={online}
            onChange={setOnline}
            allLabel="Any"
            options={[
              { value: "online", label: "Online" },
              { value: "offline", label: "Offline" },
            ]}
          />
          <FilterSelect
            label="Approval"
            value={approval}
            onChange={(v) => setApproval(v as ProApprovalStatus | null)}
            allLabel="Any"
            options={PRO_APPROVAL_STATUSES.map((s) => ({
              value: s,
              label: PRO_APPROVAL_LABEL[s],
            }))}
          />
          <FilterSelect
            label="Service"
            value={service}
            onChange={setService}
            allLabel="All services"
            options={SERVICE_NAMES.map((n) => ({ value: n, label: n }))}
          />
          <FilterSelect
            label="Area"
            value={area}
            onChange={setArea}
            allLabel="All areas"
            options={AREA_OPTIONS.map((a) => ({ value: a, label: a }))}
          />
        </FilterBar>

        {error ? (
          <ErrorState
            icon={<TriangleAlert />}
            title="The pros could not load"
            description="The connection may have dropped. Try again."
            action={{ label: "Try again", onClick: load }}
          />
        ) : loading ? (
          <ProListSkeleton />
        ) : rows.length === 0 ? (
          anyFilter ? (
            <NoResultsState onClearFilters={clearAll} />
          ) : (
            <EmptyState
              icon={<UserX />}
              title="No pros yet"
              description="Pros appear here as soon as they register from the Pro app."
            />
          )
        ) : (
          <ul className="divide-y divide-border-soft">
            {rows.map((p) => (
              <ProRow key={p.id} pro={p} onOpen={() => onOpenDetail(p.id)} />
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
    </div>
  );
}

/**
 * One pro.
 *
 * Availability is a dot on the avatar rather than a column, so the left edge of
 * the list answers "who is free" in one pass. Everything that would stop a
 * dispatch — blocked, awaiting KYC, carrying warnings — is a badge beside the
 * name, because those are exceptions and exceptions belong where the eye
 * already is.
 */
function ProRow({ pro, onOpen }: { pro: ProListItem; onOpen: () => void }) {
  // A blocked pro cannot be online whatever the flag says, and showing "Online"
  // beside "Blocked" reads as a contradiction to anyone dispatching.
  const available = pro.online && !pro.blocked;

  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors duration-fast hover:bg-canvas"
      >
        <Avatar className="size-avatar shrink-0">
          <AvatarFallback>{initials(pro.name)}</AvatarFallback>
        </Avatar>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-small font-medium text-ink">{pro.name}</span>
            {pro.blocked && <ProBlockedBadge />}
            {pro.approvalStatus === "pending" && (
              <Badge tone="clock" dot>
                Awaiting KYC
              </Badge>
            )}
          </span>
          <span className="mt-px block truncate text-caption text-ink-muted">
            {pro.services.join(", ")} · {pro.area}
            {/* Rating, jobs and pending payout are a right-hand column that is
                not rendered below `sm`. They ride along here rather than
                disappearing: an admin on a phone is judging the same pro on
                the same facts as one at a desk. */}
            <span className="sm:hidden">
              {" · "}
              {pro.rating > 0 ? `${pro.rating.toFixed(1)}★` : "New"}
              {" · "}
              {pro.jobsCompleted} jobs
              {pro.pendingPayoutPaise > 0 && (
                <>
                  {" · "}
                  <span className="font-medium text-ink">
                    {formatCurrency(pro.pendingPayoutPaise)} due
                  </span>
                </>
              )}
            </span>
          </span>
          <span className="mt-2 block sm:hidden">
            <ProAvailabilityBadge online={available} />
          </span>
        </span>

        {/* Availability as its own column. The inventory asks for live
            online/offline status, and a 12px dot tucked under an avatar does
            not answer "who can take this job" across twenty rows — a labelled
            pill in a fixed column does, because the eye reads down one line
            rather than hunting corner to corner. */}
        <span className="hidden w-line-xs shrink-0 sm:block">
          <ProAvailabilityBadge online={available} />
        </span>

        <span className="hidden items-center gap-6 sm:flex">
          <span className="text-right">
            <span className="tabular flex items-center gap-1 text-small text-ink">
              {pro.rating > 0 ? (
                <>
                  <Star className="size-3 fill-star text-star" aria-hidden="true" />
                  {pro.rating.toFixed(1)}
                </>
              ) : (
                <span className="text-ink-faint">New</span>
              )}
            </span>
            <span className="tabular block text-caption text-ink-muted">
              {pro.jobsCompleted} jobs
            </span>
          </span>

          <span className="w-amount text-right">
            <span className="tabular block text-small font-medium text-ink">
              {formatCurrency(pro.pendingPayoutPaise)}
            </span>
            <span className="block text-caption text-ink-muted">pending</span>
          </span>
        </span>

        <ChevronRight
          className="size-4 shrink-0 text-ink-faint"
          aria-hidden="true"
        />
      </button>
    </li>
  );
}

function ProListSkeleton() {
  return (
    <div className="divide-y divide-border-soft">
      {Array.from({ length: 6 }, (_, i) => (
        <div key={i} className="flex items-center gap-3 p-4">
          <Skeleton className="size-avatar rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-line-lg" />
            <Skeleton className="h-3 w-full max-w-line-2xl" />
          </div>
          <Skeleton className="h-8 w-line-xs" />
        </div>
      ))}
    </div>
  );
}







/**
 * Admin 13 — Pro approval / rejection.
 *
 * Inventory: "Review KYC documents, Aadhaar/PAN, approve or reject with
 * remarks."
 *
 * A registration is not approved by looking at a name. The reviewer needs the
 * four documents in front of them, so the card carries them inline rather than
 * making anyone open a second screen to see what they are deciding on — and the
 * approve button stays disabled until every one has been verified, because
 * approving a pro whose PAN was never checked is the whole failure this screen
 * exists to prevent.
 */
function ApprovalsTab() {
  const [pending, setPending] = React.useState<ProListItem[] | null>(null);
  const [details, setDetails] = React.useState<Record<string, ProDetail>>({});
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    getPros({ approvalStatus: "pending", pageSize: 100 })
      .then(async (r) => {
        setPending(r.items);
        const full = await Promise.all(r.items.map((p) => getPro(p.id)));
        setDetails(Object.fromEntries(full.map((p) => [p.id, p])));
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      );
  }, []);

  React.useEffect(() => load(), [load]);

  const decide = (p: ProListItem, outcome: "approved" | "rejected") => {
    setPending((rs) => rs?.filter((x) => x.id !== p.id) ?? rs);
    toast.success(
      outcome === "approved"
        ? `${p.name} approved — they can go online now`
        : `${p.name} rejected — they can resubmit their documents`,
    );
  };

  const setDocStatus = (
    proId: string,
    docType: DocumentType,
    status: "approved" | "rejected",
  ) => {
    setDetails((d) => {
      const detail = d[proId];
      if (!detail) return d;
      return {
        ...d,
        [proId]: {
          ...detail,
          documents: detail.documents.map((doc) =>
            doc.type === docType ? { ...doc, status } : doc,
          ),
        },
      };
    });
  };

  if (error) {
    return (
      <div className="rounded-card border border-border bg-surface">
        <ErrorState
          icon={<TriangleAlert />}
          title="The approval queue could not load"
          action={{ label: "Try again", onClick: load }}
        />
      </div>
    );
  }

  if (!pending) {
    return (
      <div className="space-y-3">
        {Array.from({ length: 2 }, (_, i) => (
          <Skeleton key={i} className="h-block-md rounded-card" />
        ))}
      </div>
    );
  }

  if (pending.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface">
        <EmptyState
          icon={<ClipboardCheck />}
          title="Nobody waiting for approval"
          description="New pro registrations land here for KYC review as soon as they finish signing up."
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-small text-ink-muted">
        {pending.length} registration{pending.length === 1 ? "" : "s"} waiting.
        A pro cannot accept jobs until every document is verified.
      </p>

      {pending.map((p) => (
        <ApprovalCard
          key={p.id}
          pro={p}
          detail={details[p.id]}
          onDoc={setDocStatus}
          onDecide={decide}
        />
      ))}
    </div>
  );
}

function ApprovalCard({
  pro,
  detail,
  onDoc,
  onDecide,
}: {
  pro: ProListItem;
  detail: ProDetail | undefined;
  onDoc: (
    proId: string,
    docType: DocumentType,
    status: "approved" | "rejected",
  ) => void;
  onDecide: (p: ProListItem, outcome: "approved" | "rejected") => void;
}) {
  const [remark, setRemark] = React.useState("");

  const docs = detail?.documents ?? [];
  const verified = docs.filter((d) => d.status === "approved").length;
  const rejected = docs.filter((d) => d.status === "rejected");
  const allChecked = docs.length > 0 && verified === docs.length;

  return (
    <section className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
      <header className="flex flex-wrap items-center gap-3 border-b border-border p-4">
        <Avatar className="size-avatar shrink-0">
          <AvatarFallback>{initials(pro.name)}</AvatarFallback>
        </Avatar>
        <div className="min-w-0 flex-1">
          <p className="text-small font-medium text-ink">{pro.name}</p>
          <p className="truncate text-caption text-ink-muted">
            {pro.services.join(", ")} · {pro.area} · Applied{" "}
            {formatDate(pro.joinedAt)}
          </p>
        </div>
        <Badge tone={allChecked ? "neutral" : "clock"} dot={allChecked}>
          {detail ? `${verified} of ${docs.length} verified` : "Loading"}
        </Badge>
      </header>

      {!detail ? (
        <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
          {Array.from({ length: 4 }, (_, i) => (
            <Skeleton key={i} className="aspect-video rounded-control" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
            {docs.map((doc) => (
              <DocumentTile
                key={doc.type}
                doc={doc}
                onApprove={() => onDoc(pro.id, doc.type, "approved")}
                onReject={() => onDoc(pro.id, doc.type, "rejected")}
              />
            ))}
          </div>

          {rejected.length > 0 && (
            <div className="px-4 pb-4">
              <InlineAlert
                tone="critical"
                title={`${rejected.length} document${rejected.length === 1 ? "" : "s"} rejected`}
              >
                Reject the registration so they can reupload, or clear the
                rejection if it was a mistake.
              </InlineAlert>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 border-t border-border p-4">
            <Input
              inputSize="sm"
              value={remark}
              onChange={(e) => setRemark(e.target.value)}
              placeholder="Remarks — required to reject"
              aria-label={`Remarks for ${pro.name}`}
              className="min-w-search flex-1"
            />
            <div className="flex gap-2">
              <Button
                variant="secondary"
                size="sm"
                disabled={remark.trim() === ""}
                onClick={() => onDecide(pro, "rejected")}
              >
                <X className="text-critical" />
                Reject
              </Button>
              <Button
                variant="primary"
                size="sm"
                disabled={!allChecked}
                onClick={() => onDecide(pro, "approved")}
              >
                <Check />
                Approve pro
              </Button>
            </div>
          </div>

          {!allChecked && (
            <p className="border-t border-border-soft px-4 py-2 text-caption text-ink-muted">
              Verify every document before approving.
            </p>
          )}
        </>
      )}
    </section>
  );
}

/**
 * Admin 14 — one document, reviewed on its own.
 *
 * Inventory: "Document viewer, approve per document type."
 *
 * Each document is decided separately because they fail separately: a blurred
 * Aadhaar and a valid PAN are two different conversations with the pro. Once
 * decided the tile shows its verdict and offers to undo, rather than losing the
 * controls entirely — a mis-tap on someone's KYC should not be permanent.
 */
function DocumentTile({
  doc,
  onApprove,
  onReject,
}: {
  doc: ProDocument;
  onApprove: () => void;
  onReject: () => void;
}) {
  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex aspect-video items-center justify-center rounded-control border",
          doc.status === "approved"
            ? "border-live bg-live-subtle text-live-ink"
            : doc.status === "rejected"
              ? "border-critical bg-critical-subtle text-critical-ink"
              : "border-border bg-canvas text-ink-faint",
        )}
        role="img"
        aria-label={`${DOCUMENT_TYPE_LABEL[doc.type]} scan`}
      >
        {doc.status === "approved" ? (
          <Check className="size-6" aria-hidden="true" />
        ) : doc.status === "rejected" ? (
          <X className="size-6" aria-hidden="true" />
        ) : (
          <FileText className="size-6" aria-hidden="true" />
        )}
      </div>

      <p className="text-caption font-medium text-ink">
        {DOCUMENT_TYPE_LABEL[doc.type]}
      </p>

      {doc.status === "pending" ? (
        <div className="flex gap-1">
          <Button
            variant="secondary"
            size="sm"
            className="flex-1"
            aria-label={`Reject ${DOCUMENT_TYPE_LABEL[doc.type]}`}
            onClick={onReject}
          >
            <X className="text-critical" />
          </Button>
          <Button
            variant="primary"
            size="sm"
            className="flex-1"
            aria-label={`Verify ${DOCUMENT_TYPE_LABEL[doc.type]}`}
            onClick={onApprove}
          >
            <Check />
          </Button>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-2">
          <DocumentStatusBadge status={doc.status} />
          <button
            type="button"
            onClick={doc.status === "approved" ? onReject : onApprove}
            className="rounded-pill text-caption text-action hover:underline"
          >
            Undo
          </button>
        </div>
      )}
    </div>
  );
}

/**
 * Admin 14 as its own tab — the cross-pro document queue.
 *
 * Same tiles as the approval card, grouped by pro. This exists separately from
 * Approvals because verifying documents and deciding registrations are done by
 * different people at different times: a reviewer works through scans in bulk,
 * while approving a pro is a judgement made once their file is complete.
 */
function DocumentsTab() {
  const [pending, setPending] = React.useState<ProListItem[] | null>(null);
  const [details, setDetails] = React.useState<Record<string, ProDetail>>({});
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    getPros({ approvalStatus: "pending", pageSize: 50 })
      .then(async (r) => {
        setPending(r.items);
        const full = await Promise.all(r.items.map((p) => getPro(p.id)));
        setDetails(Object.fromEntries(full.map((p) => [p.id, p])));
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      );
  }, []);

  React.useEffect(() => load(), [load]);

  const decideDoc = (
    proId: string,
    docType: DocumentType,
    status: "approved" | "rejected",
  ) => {
    setDetails((d) => {
      const detail = d[proId];
      if (!detail) return d;
      return {
        ...d,
        [proId]: {
          ...detail,
          documents: detail.documents.map((doc) =>
            doc.type === docType ? { ...doc, status } : doc,
          ),
        },
      };
    });
    toast.success(
      `${DOCUMENT_TYPE_LABEL[docType]} ${status === "approved" ? "verified" : "rejected"}`,
    );
  };

  if (error) {
    return (
      <div className="rounded-card border border-border bg-surface">
        <ErrorState
          icon={<TriangleAlert />}
          title="The document queue could not load"
          action={{ label: "Try again", onClick: load }}
        />
      </div>
    );
  }

  if (!pending) return <Skeleton className="h-block-lg rounded-card" />;

  if (pending.length === 0) {
    return (
      <div className="rounded-card border border-border bg-surface">
        <EmptyState
          icon={<FileCheck />}
          title="No documents waiting"
          description="Aadhaar, PAN and bank details from new registrations appear here for verification."
        />
      </div>
    );
  }

  const outstanding = pending.reduce((n, p) => {
    const docs = details[p.id]?.documents ?? [];
    return n + docs.filter((d) => d.status === "pending").length;
  }, 0);

  return (
    <div className="space-y-4">
      <p className="text-small text-ink-muted">
        {outstanding} document{outstanding === 1 ? "" : "s"} still to check
        across {pending.length} pro{pending.length === 1 ? "" : "s"}.
      </p>

      {pending.map((p) => {
        const detail = details[p.id];
        return (
          <section
            key={p.id}
            className="overflow-hidden rounded-card border border-border bg-surface shadow-sm"
          >
            <header className="flex items-center gap-3 border-b border-border p-4">
              <Avatar className="size-avatar shrink-0">
                <AvatarFallback>{initials(p.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-small font-medium text-ink">{p.name}</p>
                <p className="truncate text-caption text-ink-muted">
                  {p.services.join(", ")} · {p.area}
                </p>
              </div>
            </header>

            <div className="grid grid-cols-2 gap-3 p-4 sm:grid-cols-4">
              {!detail
                ? Array.from({ length: 4 }, (_, i) => (
                    <Skeleton key={i} className="aspect-video rounded-control" />
                  ))
                : detail.documents.map((doc) => (
                    <DocumentTile
                      key={doc.type}
                      doc={doc}
                      onApprove={() => decideDoc(p.id, doc.type, "approved")}
                      onReject={() => decideDoc(p.id, doc.type, "rejected")}
                    />
                  ))}
            </div>
          </section>
        );
      })}
    </div>
  );
}

/**
 * Admin 16 — Pro wallet.
 *
 * Inventory: "Balance, job-wise credits, pending payouts, manual adjustment."
 *
 * A wallet ledger is money owed to real people, so the screen leads with the
 * total liability rather than with a list. An operator opening this is usually
 * answering "how much do we owe tonight" before they are answering anything
 * about an individual.
 */
function WalletTab({ onOpenWallet }: { onOpenWallet: (id: string) => void }) {
  const [rows, setRows] = React.useState<ProListItem[] | null>(null);
  const [payouts, setPayouts] = React.useState<Payout[]>([]);
  const [search, setSearch] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    Promise.all([
      getPros({ approvalStatus: "approved", pageSize: 100 }),
      getPayouts(),
    ])
      .then(([r, p]) => {
        setRows(r.items);
        setPayouts(p);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      );
  }, []);

  React.useEffect(() => load(), [load]);

  // A balance with a request already against it must not be settled twice.
  const requestedFor = React.useCallback(
    (proId: string) =>
      payouts.find(
        (p) =>
          p.proId === proId &&
          (p.status === "pending" || p.status === "approved"),
      ),
    [payouts],
  );

  const applyAdjustment = (proId: string, deltaPaise: number) => {
    setRows(
      (rs) =>
        rs?.map((p) =>
          p.id === proId
            ? {
                ...p,
                pendingPayoutPaise: Math.max(
                  0,
                  p.pendingPayoutPaise + deltaPaise,
                ),
              }
            : p,
        ) ?? rs,
    );
  };

  const visible = React.useMemo(() => {
    const items = rows ?? [];
    const q = search.trim().toLowerCase();
    const matched = q
      ? items.filter((p) => p.name.toLowerCase().includes(q))
      : items;
    // Largest balance first — the money that matters most is the money most of
    // it is sitting in.
    return [...matched].sort(
      (a, b) => b.pendingPayoutPaise - a.pendingPayoutPaise,
    );
  }, [rows, search]);

  const owed = (rows ?? []).reduce((s, p) => s + p.pendingPayoutPaise, 0);
  const withBalance = (rows ?? []).filter((p) => p.pendingPayoutPaise > 0);

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Owed to pros"
          value={formatCurrency(owed)}
          loading={rows === null}
          hint="across every wallet"
        />
        <StatCard
          label="Pros with a balance"
          value={withBalance.length}
          loading={rows === null}
          hint="waiting on a payout"
        />
        <StatCard
          label="Largest single balance"
          value={formatCurrency(
            withBalance.reduce((m, p) => Math.max(m, p.pendingPayoutPaise), 0),
          )}
          loading={rows === null}
          hint="settle this one first"
        />
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by pro name"
          searchLabel="Search wallets"
          resultLabel={
            rows ? `${visible.length} of ${rows.length}` : undefined
          }
        />

        {error ? (
          <ErrorState
            icon={<TriangleAlert />}
            title="The wallets could not load"
            action={{ label: "Try again", onClick: load }}
          />
        ) : !rows ? (
          <ProListSkeleton />
        ) : visible.length === 0 ? (
          search ? (
            <NoResultsState onClearFilters={() => setSearch("")} />
          ) : (
            <EmptyState
              icon={<Wallet />}
              title="No approved pros yet"
              description="Wallets appear once a pro is verified and starts completing jobs."
            />
          )
        ) : (
          <ul className="divide-y divide-border-soft">
            {visible.map((p) => (
              <li
                key={p.id}
                className="flex flex-wrap items-center gap-3 p-4 transition-colors duration-fast hover:bg-canvas"
              >
                <button
                  type="button"
                  onClick={() => onOpenWallet(p.id)}
                  className="flex min-w-0 flex-1 items-center gap-3 rounded-control text-left"
                >
                  <Avatar className="size-avatar shrink-0">
                    <AvatarFallback>{initials(p.name)}</AvatarFallback>
                  </Avatar>
                  <span className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-small font-medium text-ink">
                        {p.name}
                      </span>
                      {requestedFor(p.id) && (
                        <Badge tone="clock" dot>
                          Payout requested
                        </Badge>
                      )}
                    </span>
                    <span className="tabular block text-caption text-ink-muted">
                      {p.area} · {p.jobsCompleted} jobs
                    </span>
                  </span>
                </button>

                <span className="w-amount text-right">
                  <span className="tabular block text-body font-semibold text-ink">
                    {formatCurrency(p.pendingPayoutPaise)}
                  </span>
                  <span className="block text-caption text-ink-faint">
                    view ledger
                  </span>
                </span>

                <AdjustDialog
                  proId={p.id}
                  proName={p.name}
                  balancePaise={p.pendingPayoutPaise}
                  onApply={applyAdjustment}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

/**
 * One pro's wallet, opened from the ledger. Admin 16.
 *
 * The list answers "how much" — this answers "made of what". A balance with no
 * breakdown is a number a pro will dispute and an operator cannot defend, so
 * every credit shows the job that produced it, the gross, and the CFC fee taken
 * from it.
 *
 * Payout requests sit above the ledger rather than inside it: a request is money
 * ABOUT to leave, and an operator settling tonight needs to see it before
 * reading history.
 */
function WalletDetailPanel({ proId }: { proId: string }) {
  const [pro, setPro] = React.useState<ProDetail | null>(null);
  const [entries, setEntries] = React.useState<WalletEntry[] | null>(null);
  const [payouts, setPayouts] = React.useState<Payout[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    Promise.all([getPro(proId), getWalletEntries(proId), getPayouts()])
      .then(([p, e, allPayouts]) => {
        setPro(p);
        setEntries(e);
        setPayouts(allPayouts.filter((x) => x.proId === proId));
      })
      .catch((err: unknown) =>
        setError(err instanceof Error ? err.message : "Could not load."),
      );
  }, [proId]);

  React.useEffect(() => load(), [load]);

  if (error) {
    return (
      <SheetBody>
        <ErrorState
          icon={<TriangleAlert />}
          title="This wallet could not load"
          description={error}
          action={{ label: "Try again", onClick: load }}
        />
      </SheetBody>
    );
  }

  if (!pro || !entries) {
    return (
      <SheetBody className="space-y-4">
        <Skeleton className="h-block-xs rounded-card" />
        <Skeleton className="h-block-md rounded-card" />
      </SheetBody>
    );
  }

  const credits = entries.filter((e) => e.kind === "credit");
  const feeTotal = credits.reduce((s, e) => s + (e.feePaise ?? 0), 0);
  const grossTotal = credits.reduce((s, e) => s + (e.grossPaise ?? 0), 0);
  const deductions = entries
    .filter((e) => e.amountPaise < 0)
    .reduce((s, e) => s + e.amountPaise, 0);
  const requested = payouts.filter(
    (p) => p.status === "pending" || p.status === "approved",
  );

  return (
    <>
      <SheetHeader>
        <SheetTitle>{pro.name}</SheetTitle>
        <p className="text-caption text-ink-muted">
          Wallet · {pro.area} · {pro.jobsCompleted} jobs completed
        </p>
      </SheetHeader>

      <SheetBody className="space-y-4">
        {/* The balance, and what it is made of. */}
        <DetailCard>
          <p className="text-caption text-ink-muted">Pending balance</p>
          <p className="tabular mt-1 text-display font-semibold text-ink">
            {formatCurrency(pro.pendingPayoutPaise)}
          </p>
          <div className="mt-3 border-t border-border-soft pt-3">
            <DetailList>
              <DetailRow
                label={`Earned on ${credits.length} job${credits.length === 1 ? "" : "s"}`}
                value={formatCurrency(grossTotal)}
                tabular
              />
              <DetailRow
                label="CFC fee (15%)"
                value={`− ${formatCurrency(feeTotal)}`}
                tabular
              />
              {deductions < 0 && (
                <DetailRow
                  label="Penalties and corrections"
                  value={formatCurrency(deductions)}
                  tabular
                />
              )}
            </DetailList>
          </div>
        </DetailCard>

        {/* Admin 16 — "pending payouts". Money already requested against this
            balance, so an operator does not settle it twice. */}
        <DetailCard title="Payout requests" padded={false}>
          {requested.length === 0 ? (
            <p className="px-4 pb-4 text-small text-ink-muted">
              No payout requested. The pro triggers one from the Pro app;
              transfers land within 48 hours of approval.
            </p>
          ) : (
            <ul className="divide-y divide-border-soft">
              {requested.map((p) => (
                <li
                  key={p.id}
                  className="flex items-center justify-between gap-3 px-4 py-3"
                >
                  <span className="min-w-0">
                    <span className="tabular block text-small font-medium text-ink">
                      {formatCurrency(p.amountPaise)}
                    </span>
                    <span className="tabular block text-caption text-ink-muted">
                      {p.method.toUpperCase()} ···· {p.destinationLast4} ·{" "}
                      {formatSchedule(p.requestedAt)}
                    </span>
                  </span>
                  <PayoutStatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          )}
        </DetailCard>

        {/* Admin 16 — "job-wise credits". */}
        <DetailCard title="Ledger" padded={false}>
          {entries.length === 0 ? (
            <p className="px-4 pb-4 text-small text-ink-muted">
              Nothing in this wallet yet. Credits appear as jobs are completed
              and settled.
            </p>
          ) : (
            <ul className="divide-y divide-border-soft">
              {entries.map((e) => (
                <li key={e.id} className="px-4 py-3">
                  <div className="flex items-baseline justify-between gap-3">
                    <span className="min-w-0 flex-1">
                      <span
                        className={cn(
                          "block truncate text-small text-ink",
                          e.kind === "credit" && "tabular font-medium",
                        )}
                      >
                        {e.label}
                      </span>
                      <span className="tabular block text-caption text-ink-faint">
                        {formatSchedule(e.at)}
                      </span>
                    </span>
                    <span
                      className={cn(
                        "tabular shrink-0 text-small font-medium",
                        e.amountPaise < 0 ? "text-critical-ink" : "text-ink",
                      )}
                    >
                      {e.amountPaise < 0 ? "− " : "+ "}
                      {formatCurrency(Math.abs(e.amountPaise))}
                    </span>
                  </div>

                  {/* A credit shows the split, so the pro and the admin are
                      reading the same arithmetic. */}
                  {e.kind === "credit" && e.grossPaise !== undefined && (
                    <p className="tabular mt-1 text-caption text-ink-muted">
                      {formatCurrency(e.grossPaise)} job value − {" "}
                      {formatCurrency(e.feePaise ?? 0)} CFC fee
                    </p>
                  )}
                </li>
              ))}
            </ul>
          )}
        </DetailCard>
      </SheetBody>
    </>
  );
}

/**
 * Manual adjustment.
 *
 * Deliberately two explicit buttons rather than a signed number. "Enter -150 to
 * deduct" is a field that produces the wrong sign under time pressure, and the
 * wrong sign on a payout is money that has to be chased back.
 */
function AdjustDialog({
  proId,
  proName,
  balancePaise,
  onApply,
}: {
  proId: string;
  proName: string;
  balancePaise: number;
  onApply: (proId: string, deltaPaise: number) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [direction, setDirection] = React.useState<"add" | "deduct">("deduct");
  const [amount, setAmount] = React.useState("");
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setAmount("");
      setReason("");
      setDirection("deduct");
    }
  }, [open]);

  const rupees = Number(amount);
  const valid = amount.trim() !== "" && !Number.isNaN(rupees) && rupees > 0;
  const paise = Math.round(rupees * 100);
  const overdrawn = direction === "deduct" && paise > balancePaise;
  const canApply = valid && reason.trim() !== "" && !overdrawn;

  const apply = () => {
    if (!canApply) return;
    onApply(proId, direction === "add" ? paise : -paise);
    toast.success(
      `${formatCurrency(paise)} ${direction === "add" ? "added to" : "deducted from"} ${proName}`,
    );
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" size="sm">
          Adjust
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Adjust {proName}&apos;s balance</DialogTitle>
          <DialogDescription>
            Currently {formatCurrency(balancePaise)} pending. Every adjustment is
            logged against your name.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div
            role="radiogroup"
            aria-label="Adjustment direction"
            className="grid grid-cols-2 gap-1 rounded-control bg-neutral-subtle p-1"
          >
            {(["deduct", "add"] as const).map((d) => (
              <button
                key={d}
                type="button"
                role="radio"
                aria-checked={direction === d}
                onClick={() => setDirection(d)}
                className={cn(
                  "rounded-pill px-3 py-2 text-small transition-colors duration-fast",
                  direction === d
                    ? "bg-surface font-semibold text-ink shadow-sm"
                    : "font-medium text-ink-muted hover:text-ink",
                )}
              >
                {d === "deduct" ? "Deduct" : "Add"}
              </button>
            ))}
          </div>

          <FormField
            label="Amount"
            required
            {...(overdrawn
              ? { error: "More than this pro is owed." }
              : {})}
          >
            <Input
              type="number"
              min={0}
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              trailing="₹"
              aria-label="Amount in rupees"
            />
          </FormField>

          <FormField label="Reason" required>
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Correction for a duplicate settlement on CFC12345678."
            />
          </FormField>

          {valid && !overdrawn && (
            <p className="tabular rounded-card bg-canvas p-3 text-small text-ink-muted">
              New balance:{" "}
              <span className="font-semibold text-ink">
                {formatCurrency(
                  direction === "add"
                    ? balancePaise + paise
                    : balancePaise - paise,
                )}
              </span>
            </p>
          )}
        </div>

        <DialogFooter>
          <Button variant="primary" onClick={apply} disabled={!canApply}>
            Apply adjustment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Admin 18 — Payout approval.
 *
 * Inventory: "Pending payouts list, approve individual or batch, transfer
 * status."
 *
 * Batch approval is the point. A daily payout run is dozens of transfers, and
 * approving them one at a time is how an operator ends up skipping the checks
 * entirely — so selection and a bulk action are the primary path, with the
 * per-row button kept for the one-off.
 */
function PayoutsTab({ onOpenDetail }: { onOpenDetail: (id: string) => void }) {
  const [rows, setRows] = React.useState<Payout[] | null>(null);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    getPayouts()
      .then(setRows)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      );
  }, []);

  React.useEffect(() => load(), [load]);

  const pending = (rows ?? []).filter((p) => p.status === "pending");
  const failed = (rows ?? []).filter((p) => p.status === "failed");
  const pendingTotal = pending.reduce((s, p) => s + p.amountPaise, 0);

  const approve = (ids: string[]) => {
    setRows(
      (rs) =>
        rs?.map((x) =>
          ids.includes(x.id) ? { ...x, status: "approved" as const } : x,
        ) ?? rs,
    );
    setSelected((sel) => sel.filter((id) => !ids.includes(id)));
    const total = (rows ?? [])
      .filter((r) => ids.includes(r.id))
      .reduce((s, r) => s + r.amountPaise, 0);
    toast.success(
      ids.length === 1
        ? `${formatCurrency(total)} approved`
        : `${ids.length} payouts approved — ${formatCurrency(total)} total`,
    );
  };

  const selectedTotal = (rows ?? [])
    .filter((r) => selected.includes(r.id))
    .reduce((s, r) => s + r.amountPaise, 0);

  const columns: Column<Payout>[] = [
    {
      id: "pro",
      header: "Pro",
      skeletonWidth: "w-line-md",
      cell: (p) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onOpenDetail(p.proId);
          }}
          className="rounded-pill font-medium text-action hover:underline"
        >
          {p.proName}
        </button>
      ),
    },
    {
      id: "amount",
      header: "Amount",
      align: "right",
      tabular: true,
      skeletonWidth: "w-line-xs",
      cell: (p) => (
        <span className="font-medium text-ink">
          {formatCurrency(p.amountPaise)}
        </span>
      ),
    },
    {
      id: "method",
      header: "To",
      hideBelow: 780,
      skeletonWidth: "w-line-sm",
      cell: (p) => (
        <span className="tabular text-ink-muted">
          {p.method.toUpperCase()} ···· {p.destinationLast4}
        </span>
      ),
    },
    {
      id: "requested",
      header: "Requested",
      hideBelow: 1000,
      tabular: true,
      skeletonWidth: "w-line-md",
      cell: (p) => (
        <span className="text-ink-muted">{formatSchedule(p.requestedAt)}</span>
      ),
    },
    {
      id: "status",
      header: "Status",
      skeletonWidth: "w-line-sm",
      cell: (p) => <PayoutStatusBadge status={p.status} />,
    },
    {
      id: "action",
      header: "",
      align: "right",
      cell: (p) =>
        p.status === "pending" ? (
          <Button
            variant="secondary"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              approve([p.id]);
            }}
          >
            <Check />
            Approve
          </Button>
        ) : null,
    },
  ];

  const card: CardLayout<Payout> = {
    title: (p) => p.proName,
    badge: (p) => <PayoutStatusBadge status={p.status} />,
    lines: [
      (p) => `${p.method.toUpperCase()} ···· ${p.destinationLast4}`,
      (p) => formatSchedule(p.requestedAt),
    ],
    trailing: (p) => (
      <span className="tabular">{formatCurrency(p.amountPaise)}</span>
    ),
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Awaiting approval"
          value={pending.length}
          loading={rows === null}
          hint={formatCurrency(pendingTotal)}
        />
        <StatCard
          label="Failed transfers"
          value={failed.length}
          loading={rows === null}
          hint={failed.length === 0 ? "none" : "retry or check the account"}
          goodWhen="down"
          {...(failed.length > 0
            ? { delta: { value: "failed", direction: "up" as const } }
            : {})}
        />
        <StatCard
          label="Paid out"
          value={(rows ?? []).filter((p) => p.status === "paid").length}
          loading={rows === null}
          hint="settled to bank or UPI"
        />
      </div>

      {failed.length > 0 && (
        <InlineAlert
          tone="critical"
          title={`${failed.length} transfer${failed.length === 1 ? "" : "s"} failed`}
        >
          The pro has not been paid. Check the bank details on their profile
          before retrying.
        </InlineAlert>
      )}

      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        <DataTable
          columns={columns}
          rows={rows ?? []}
          rowKey={(p) => p.id}
          card={card}
          loading={rows === null}
          error={error}
          onRetry={load}
          caption="Pro payouts"
          selectionNoun="payout"
          selectedIds={selected}
          onSelectionChange={setSelected}
          bulkBar={({ selectedIds, clear }) => (
            <>
              <span className="tabular">
                {formatCurrency(selectedTotal)} total
              </span>
              <Button
                variant="primary"
                size="sm"
                onClick={() => {
                  approve(selectedIds);
                  clear();
                }}
              >
                <Check />
                Approve selected
              </Button>
            </>
          )}
          empty={
            <EmptyState
              icon={<CircleDollarSign />}
              title="No payouts requested"
              description="Pros trigger a payout from the Pro app once a job is settled. Transfers land within 48 hours of approval."
            />
          }
        />
      </div>
    </div>
  );
}

/**
 * Admin 17 — Warning and penalty management.
 *
 * Inventory: "Issue warnings, apply penalties, track escalations."
 *
 * Escalation is the part that matters. A pro with three warnings is a different
 * conversation from a pro with one, so the screen counts per pro and surfaces
 * anyone at or past the threshold rather than presenting a flat log where the
 * pattern is invisible.
 */
const ESCALATION_THRESHOLD = 3;

const WARNING_REASONS = [
  "Did not arrive for an accepted job.",
  "Arrived outside the scheduled window without notice.",
  "Customer reported rude or unprofessional conduct.",
  "Left the job unfinished without informing support.",
  "Quoted above the template rate without justification.",
];

function WarningsTab({ onOpenDetail }: { onOpenDetail: (id: string) => void }) {
  const [rows, setRows] = React.useState<ProWarning[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    getProWarnings()
      .then(setRows)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      );
  }, []);

  React.useEffect(() => load(), [load]);

  // Count per pro so escalation is visible. A flat log hides the pattern that
  // the discipline system exists to catch.
  const byPro = React.useMemo(() => {
    const map = new Map<string, { name: string; count: number; penalty: number }>();
    for (const w of rows ?? []) {
      const cur = map.get(w.proId) ?? { name: w.proName, count: 0, penalty: 0 };
      cur.count += 1;
      cur.penalty += w.penaltyPaise;
      map.set(w.proId, cur);
    }
    return map;
  }, [rows]);

  const escalated = [...byPro.entries()].filter(
    ([, v]) => v.count >= ESCALATION_THRESHOLD,
  );
  const penaltyTotal = (rows ?? []).reduce((s, w) => s + w.penaltyPaise, 0);

  const issue = (w: ProWarning) => {
    setRows((rs) => [w, ...(rs ?? [])]);
    toast.success(`Warning issued to ${w.proName}`);
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-3">
        <StatCard
          label="Warnings issued"
          value={rows?.length ?? 0}
          loading={rows === null}
          hint="across every pro"
        />
        <StatCard
          label="At escalation"
          value={escalated.length}
          loading={rows === null}
          hint={`${ESCALATION_THRESHOLD} or more warnings`}
          goodWhen="down"
          {...(escalated.length > 0
            ? { delta: { value: "review", direction: "up" as const } }
            : {})}
        />
        <StatCard
          label="Penalties applied"
          value={formatCurrency(penaltyTotal)}
          loading={rows === null}
          hint="deducted from payouts"
        />
      </div>

      {escalated.length > 0 && (
        <InlineAlert
          tone="critical"
          title={`${escalated.length} pro${escalated.length === 1 ? "" : "s"} at ${ESCALATION_THRESHOLD} or more warnings`}
        >
          {escalated.map(([, v]) => v.name).join(", ")} — review whether to block
          rather than warn again.
        </InlineAlert>
      )}

      <div className="flex justify-end">
        <IssueWarningDialog onIssued={issue} />
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        {error ? (
          <ErrorState
            icon={<TriangleAlert />}
            title="The discipline record could not load"
            action={{ label: "Try again", onClick: load }}
          />
        ) : !rows ? (
          <ProListSkeleton />
        ) : rows.length === 0 ? (
          <EmptyState
            icon={<ShieldCheck />}
            title="No warnings issued"
            description="The discipline record is clean. Warnings and penalties appear here as they are issued."
          />
        ) : (
          <ul className="divide-y divide-border-soft">
            {rows.map((w) => {
              const count = byPro.get(w.proId)?.count ?? 1;
              return (
                <li key={w.id} className="p-4 transition-colors duration-fast hover:bg-canvas">
                  <div className="flex flex-wrap items-start gap-3">
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2">
                        <button
                          type="button"
                          onClick={() => onOpenDetail(w.proId)}
                          className="rounded-pill text-small font-medium text-action hover:underline"
                        >
                          {w.proName}
                        </button>
                        {count >= ESCALATION_THRESHOLD && (
                          <Badge tone="critical" dot>
                            {count} warnings
                          </Badge>
                        )}
                      </p>
                      <p className="mt-px text-small text-ink">{w.reason}</p>
                      <p className="mt-1 text-caption text-ink-faint">
                        {formatDate(w.issuedAt)} · issued by {w.issuedBy}
                      </p>
                    </div>
                    <span className="tabular w-amount shrink-0 text-right text-small font-medium">
                      {w.penaltyPaise > 0 ? (
                        <span className="text-critical-ink">
                          − {formatCurrency(w.penaltyPaise)}
                        </span>
                      ) : (
                        <span className="text-ink-faint">No penalty</span>
                      )}
                    </span>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}

function IssueWarningDialog({
  onIssued,
}: {
  onIssued: (w: ProWarning) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [pros, setPros] = React.useState<ProListItem[]>([]);
  const [proId, setProId] = React.useState<string | null>(null);
  const [reason, setReason] = React.useState("");
  const [penalty, setPenalty] = React.useState("");

  React.useEffect(() => {
    if (!open) {
      setProId(null);
      setReason("");
      setPenalty("");
      return;
    }
    getPros({ approvalStatus: "approved", pageSize: 100 }).then((r) =>
      setPros(r.items),
    );
  }, [open]);

  const pro = pros.find((p) => p.id === proId);
  const canIssue = pro !== undefined && reason.trim() !== "";

  const submit = () => {
    if (!pro) return;
    onIssued({
      id: `warn_${Date.now()}`,
      proId: pro.id,
      proName: pro.name,
      reason: reason.trim(),
      penaltyPaise: Math.round(Number(penalty) * 100) || 0,
      issuedAt: new Date().toISOString(),
      issuedBy: "You",
    });
    setOpen(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="primary">
          <ShieldAlert />
          Issue a warning
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Issue a warning</DialogTitle>
          <DialogDescription>
            The pro sees this on their Warning screen. A penalty is deducted from
            their next payout.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          {/* A searchable picker rather than a typed name: a warning against a
              misspelled name attaches to nobody. */}
          <FormField label="Pro" required>
            <Combobox
              options={pros.map((p) => ({
                value: p.id,
                label: p.name,
                description: `${p.services.join(", ")} · ${p.area}`,
              }))}
              value={proId}
              onChange={setProId}
              placeholder="Choose a pro"
              searchPlaceholder="Search by name"
              aria-label="Pro"
            />
          </FormField>

          <FormField label="Reason" required>
            <div className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {WARNING_REASONS.map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setReason(r)}
                    className={cn(
                      "rounded-pill border px-3 py-1 text-left text-caption",
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
                placeholder="Or describe what happened"
                aria-label="Reason"
              />
            </div>
          </FormField>

          <FormField
            label="Penalty"
            help="Leave empty for a warning with no deduction."
          >
            <Input
              type="number"
              min={0}
              value={penalty}
              onChange={(e) => setPenalty(e.target.value)}
              placeholder="0"
              trailing="₹"
              aria-label="Penalty in rupees"
            />
          </FormField>
        </div>

        <DialogFooter>
          <Button variant="critical" onClick={submit} disabled={!canIssue}>
            Issue warning
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/**
 * Admin 12 + 15 — Pro detail and block/unblock.
 *
 * Inventory 12: "Full profile, documents, earnings history, job stats, ratings,
 * warnings." Inventory 15: "Toggle access, reason required, audit trail."
 *
 * The panel opens on a summary rather than on tabs. An operator opening a pro
 * almost always wants one fact — are they verified, are they blocked, what do
 * they owe, how many warnings — and making them choose a tab before seeing any
 * of it is the common failure of a detail view. The tabs are there for the
 * depth behind each of those facts.
 *
 * Block is the panel's header action because it is the one irreversible thing
 * on the screen, and it requires a reason for the same reason a status override
 * does: revoking someone's livelihood should leave a record of who did it and
 * why.
 */
function ProDetailPanel({ id }: { id: string }) {
  const [pro, setPro] = React.useState<ProDetail | null>(null);
  const [warnings, setWarnings] = React.useState<ProWarning[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [blocked, setBlocked] = React.useState(false);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    Promise.all([getPro(id), getProWarnings(id)])
      .then(([p, w]) => {
        setPro(p);
        setBlocked(p.blocked);
        setWarnings(w);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      )
      .finally(() => setLoading(false));
  }, [id]);

  React.useEffect(() => load(), [load]);

  if (loading) {
    return (
      <SheetBody className="space-y-4">
        <Skeleton className="h-block-xs rounded-card" />
        <Skeleton className="h-block-md rounded-card" />
        <Skeleton className="h-block-sm rounded-card" />
      </SheetBody>
    );
  }

  if (error || !pro) {
    return (
      <SheetBody>
        <ErrorState
          icon={<TriangleAlert />}
          title="This pro could not be found"
          description={error ?? undefined}
          action={{ label: "Try again", onClick: load }}
        />
      </SheetBody>
    );
  }

  const verified = pro.documents.filter((d) => d.status === "approved").length;
  const rejected = pro.documents.filter((d) => d.status === "rejected").length;
  const penaltyTotal = warnings.reduce((s, w) => s + w.penaltyPaise, 0);

  return (
    <>
      <SheetHeader>
        <div className="flex items-start gap-3">
          <span className="relative shrink-0">
            <Avatar className="size-12">
              <AvatarFallback>{initials(pro.name)}</AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "absolute -bottom-px -right-px size-3 rounded-full border-2 border-surface",
                pro.online ? "bg-live" : "bg-neutral",
              )}
              aria-label={pro.online ? "Online" : "Offline"}
            />
          </span>
          <div className="min-w-0 flex-1">
            <SheetTitle>{pro.name}</SheetTitle>
            <p className="flex flex-wrap items-center gap-2 text-caption text-ink-muted">
              <span className="tabular">{pro.id}</span>
              <span aria-hidden="true">·</span>
              <span>Joined {formatDate(pro.joinedAt)}</span>
            </p>
            <p className="mt-2 flex flex-wrap items-center gap-2">
              <ProApprovalBadge status={pro.approvalStatus} />
              {blocked && <ProBlockedBadge />}
              <ProAvailabilityBadge online={pro.online} />
            </p>
          </div>
        </div>
      </SheetHeader>

      <SheetBody className="space-y-4">
        {blocked && (
          <InlineAlert tone="critical" title="This pro is blocked">
            They cannot go online or accept jobs. Unblocking restores access
            immediately.
          </InlineAlert>
        )}

        {rejected > 0 && (
          <InlineAlert
            tone="clock"
            title={`${rejected} document${rejected === 1 ? "" : "s"} rejected`}
          >
            They cannot be approved until every document is verified.
          </InlineAlert>
        )}

        {/* The four facts an operator opens a pro for, before any tab. */}
        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-border bg-border">
          <SummaryTile
            label="Rating"
            value={
              pro.rating > 0 ? (
                <span className="flex items-center gap-1">
                  <Star className="size-4 fill-star text-star" aria-hidden="true" />
                  {pro.rating.toFixed(1)}
                </span>
              ) : (
                "New"
              )
            }
            hint={`${pro.jobsCompleted} jobs completed`}
          />
          <SummaryTile
            label="Pending payout"
            value={formatCurrency(pro.pendingPayoutPaise)}
            hint={`${formatCurrency(pro.totalEarnedPaise)} earned all time`}
          />
          <SummaryTile
            label="Documents"
            value={`${verified} of ${pro.documents.length}`}
            hint={rejected > 0 ? `${rejected} rejected` : "verified"}
          />
          <SummaryTile
            label="Warnings"
            value={warnings.length}
            hint={
              penaltyTotal > 0
                ? `${formatCurrency(penaltyTotal)} in penalties`
                : "no penalties"
            }
          />
        </div>

        <Tabs defaultValue="profile">
          <TabsList>
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="documents">Documents</TabsTrigger>
            <TabsTrigger value="payout">Payout</TabsTrigger>
            <TabsTrigger value="warnings">
              Warnings{warnings.length > 0 ? ` (${warnings.length})` : ""}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <DetailCard>
              <DetailList>
                <DetailRow
                  label="Phone"
                  value={
                    <a
                      href={`tel:${pro.phone.replace(/\s/g, "")}`}
                      className="tabular text-action hover:underline"
                    >
                      {pro.phone}
                    </a>
                  }
                />
                <DetailRow label="Services" value={pro.services.join(", ")} />
                <DetailRow label="Area" value={pro.area} />
                <DetailRow
                  label="Experience"
                  value={`${pro.experienceYears} years`}
                  tabular
                />
                <DetailRow label="About" value={pro.bio} stacked />
              </DetailList>
            </DetailCard>
          </TabsContent>

          <TabsContent value="documents">
            <div className="grid gap-3 sm:grid-cols-2">
              {pro.documents.map((doc) => (
                <DetailCard key={doc.type} title={DOCUMENT_TYPE_LABEL[doc.type]}>
                  <div
                    className="flex aspect-video items-center justify-center rounded-control bg-canvas text-ink-faint"
                    role="img"
                    aria-label={`${DOCUMENT_TYPE_LABEL[doc.type]} scan`}
                  >
                    <FileText className="size-6" aria-hidden="true" />
                  </div>
                  <div className="mt-3">
                    <DocumentStatusBadge status={doc.status} />
                  </div>
                  {doc.rejectionReason && (
                    <p className="mt-2 text-caption text-critical-ink">
                      {doc.rejectionReason}
                    </p>
                  )}
                </DetailCard>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="payout">
            <DetailCard>
              <DetailList>
                <DetailRow
                  label="Earned all time"
                  value={formatCurrency(pro.totalEarnedPaise)}
                  tabular
                />
                <DetailRow
                  label="Pending payout"
                  value={formatCurrency(pro.pendingPayoutPaise)}
                  tabular
                />
                <DetailRow
                  label="Bank account"
                  value={`•••• ${pro.bankAccountLast4}`}
                  tabular
                />
                <DetailRow label="IFSC" value={pro.ifsc} tabular />
                <DetailRow
                  label="UPI"
                  value={pro.upiId ?? "Not set"}
                  tabular={pro.upiId !== null}
                />
              </DetailList>
              <p className="mt-3 border-t border-border-soft pt-3 text-caption text-ink-muted">
                Payouts transfer to this account within 48 hours of a job being
                completed.
              </p>
            </DetailCard>
          </TabsContent>

          <TabsContent value="warnings">
            {warnings.length === 0 ? (
              <EmptyState
                icon={<ShieldCheck />}
                title="Clean record"
                description="No warnings or penalties have been issued to this pro."
              />
            ) : (
              <div className="divide-y divide-border-soft overflow-hidden rounded-card border border-border">
                {warnings.map((w) => (
                  <div key={w.id} className="p-4">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="tabular text-caption text-ink-muted">
                        {formatDate(w.issuedAt)}
                      </span>
                      {w.penaltyPaise > 0 && (
                        <span className="tabular text-small font-medium text-critical-ink">
                          − {formatCurrency(w.penaltyPaise)}
                        </span>
                      )}
                    </div>
                    <p className="mt-1 text-small text-ink">{w.reason}</p>
                    <p className="mt-1 text-caption text-ink-faint">
                      Issued by {w.issuedBy}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </SheetBody>

      <div className="shrink-0 border-t border-border p-4">
        <BlockDialog
          pro={pro}
          blocked={blocked}
          onToggle={() => setBlocked((b) => !b)}
        />
      </div>
    </>
  );
}

function SummaryTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: React.ReactNode;
  hint: string;
}) {
  return (
    <div className="bg-surface p-3">
      <p className="text-caption text-ink-muted">{label}</p>
      <p className="tabular mt-1 text-heading font-semibold text-ink">
        {value}
      </p>
      <p className="mt-px text-caption text-ink-faint">{hint}</p>
    </div>
  );
}

/**
 * Admin 15 — block or unblock.
 *
 * Blocking takes away someone's income, so it asks for a reason and says
 * plainly what happens. Unblocking is a single confirmation: restoring access
 * needs no justification.
 */
const BLOCK_REASONS = [
  "Repeated no-shows against accepted jobs.",
  "Customer complaint upheld after investigation.",
  "Documents found to be invalid on re-verification.",
  "Rating fell below the 2.5 threshold.",
];

function BlockDialog({
  pro,
  blocked,
  onToggle,
}: {
  pro: ProDetail;
  blocked: boolean;
  onToggle: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [reason, setReason] = React.useState("");

  React.useEffect(() => {
    if (!open) setReason("");
  }, [open]);

  const confirm = () => {
    onToggle();
    toast.success(
      blocked
        ? `${pro.name} can accept jobs again`
        : `${pro.name} has been blocked`,
    );
    setOpen(false);
  };

  if (blocked) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="secondary" className="w-full">
            <ShieldCheck />
            Unblock {pro.name}
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Restore access for {pro.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be able to go online and accept jobs immediately.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction variant="primary" onClick={confirm}>
              Unblock
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full">
          <Ban className="text-critical" />
          Block {pro.name}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block {pro.name}?</DialogTitle>
          <DialogDescription>
            They are signed out immediately, cannot go online, and any job
            currently assigned to them returns to the queue. Pending payouts are
            unaffected.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex flex-wrap gap-2">
            {BLOCK_REASONS.map((r) => (
              <button
                key={r}
                type="button"
                onClick={() => setReason(r)}
                className={cn(
                  "rounded-pill border px-3 py-1 text-left text-caption",
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
          <FormField label="Reason" required help="Kept on the audit trail.">
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="What happened, and what was verified"
            />
          </FormField>
        </div>

        <DialogFooter>
          <Button
            variant="critical"
            onClick={confirm}
            disabled={reason.trim() === ""}
          >
            Block this pro
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function ProManagementPage() {
  return (
    <Suspense fallback={<Skeleton className="h-block-lg rounded-card" />}>
      <ProManagementInner />
    </Suspense>
  );
}
