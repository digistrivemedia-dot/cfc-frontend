"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Ban,
  Phone,
  ShieldCheck,
  TriangleAlert,
  UserX,
} from "lucide-react";
import {
  getCustomer,
  getCustomerBookings,
  getCustomerComplaints,
  getCustomers,
  AREA_OPTIONS,
} from "@cfc/mocks";
import type {
  CustomerBooking,
  CustomerComplaint,
  CustomerDetail,
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
  BookingStatusBadge,
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
  NoResultsState,
  PageHeader,
  Pagination,
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
} from "@cfc/ui";

/**
 * Admin 19–21 — Customer management.
 *
 * Inventory 19: "Search, filter, view all customers."
 * Inventory 20: "Profile, booking history, wallet, complaints, no-show count."
 * Inventory 21: "Account moderation with reason logging."
 *
 * A customer list is read for two reasons: someone called and needs looking up,
 * or somebody is causing trouble. So the search is the primary control and the
 * two signals that matter — complaints and no-shows — are on the row rather
 * than buried in a profile nobody opens speculatively.
 *
 * The no-show count is given weight because it is the one number that costs the
 * platform real money: a pro who travels to an empty house is paid nothing and
 * loses the slot.
 *
 * Frontend only — blocking updates local state and toasts. The backend team
 * owns the write path.
 */

const PAGE_SIZE = 20;

/** Above this a customer's no-shows are a pattern rather than bad luck. */
const NO_SHOW_CONCERN = 2;

function CustomerManagementInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openId = searchParams.get("id");

  const [search, setSearch] = React.useState("");
  const [debounced, setDebounced] = React.useState("");
  const [area, setArea] = React.useState<string | null>(null);
  const [standing, setStanding] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(PAGE_SIZE);

  const [data, setData] = React.useState<{
    items: CustomerDetail[];
    total: number;
  } | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebounced(search), 300);
    return () => clearTimeout(t);
  }, [search]);
  React.useEffect(() => setPage(1), [debounced, area, standing]);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    getCustomers({ search: debounced || undefined, page, pageSize })
      .then(setData)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      )
      .finally(() => setLoading(false));
  }, [debounced, page, pageSize]);

  React.useEffect(() => load(), [load]);

  // Area and standing are not server filters in the mock query, so both are
  // applied here. They move into the request when the backend adds them.
  const rows = React.useMemo(() => {
    let items = data?.items ?? [];
    if (area) items = items.filter((c) => c.area === area);
    if (standing === "blocked") items = items.filter((c) => c.blocked);
    if (standing === "complaints")
      items = items.filter((c) => c.complaintCount > 0);
    if (standing === "noshows")
      items = items.filter((c) => c.noShowCount >= NO_SHOW_CONCERN);
    return items;
  }, [data, area, standing]);

  const openDetail = (id: string) =>
    router.push(`/customers?id=${id}`, { scroll: false });
  const closeDetail = () => router.push("/customers", { scroll: false });

  const all = data?.items ?? [];
  const activeFilters = (area ? 1 : 0) + (standing ? 1 : 0);
  const anyFilter = activeFilters > 0 || debounced !== "";
  const clearAll = () => {
    setSearch("");
    setArea(null);
    setStanding(null);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customers"
        description="Everyone who has booked through the app or the web."
      />

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatCard
          label="Customers"
          value={data?.total ?? 0}
          loading={loading}
          hint="registered on the platform"
        />
        <StatCard
          label="Open complaints"
          value={all.filter((c) => c.complaintCount > 0).length}
          loading={loading}
          hint="customers with a grievance"
        />
        <StatCard
          label="Repeat no-shows"
          value={all.filter((c) => c.noShowCount >= NO_SHOW_CONCERN).length}
          loading={loading}
          hint={`${NO_SHOW_CONCERN} or more missed visits`}
          goodWhen="down"
        />
        <StatCard
          label="Blocked"
          value={all.filter((c) => c.blocked).length}
          loading={loading}
          hint="cannot place bookings"
        />
      </div>

      <div className="overflow-hidden rounded-card border border-border bg-surface shadow-sm">
        <FilterBar
          search={search}
          onSearchChange={setSearch}
          searchPlaceholder="Search by name or phone number"
          searchLabel="Search customers"
          activeCount={activeFilters}
          onClearAll={clearAll}
          resultLabel={
            !loading && data ? `${rows.length} of ${data.total}` : undefined
          }
        >
          <FilterSelect
            label="Standing"
            value={standing}
            onChange={setStanding}
            allLabel="Everyone"
            options={[
              { value: "complaints", label: "Has complaints" },
              { value: "noshows", label: "Repeat no-shows" },
              { value: "blocked", label: "Blocked" },
            ]}
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
            title="The customers could not load"
            description="The connection may have dropped. Try again."
            action={{ label: "Try again", onClick: load }}
          />
        ) : loading ? (
          <CustomerListSkeleton />
        ) : rows.length === 0 ? (
          anyFilter ? (
            <NoResultsState onClearFilters={clearAll} />
          ) : (
            <EmptyState
              icon={<UserX />}
              title="No customers yet"
              description="Customers appear here as soon as they register in the app."
            />
          )
        ) : (
          <ul className="divide-y divide-border-soft">
            {rows.map((c) => (
              <CustomerRow
                key={c.id}
                customer={c}
                onOpen={() => openDetail(c.id)}
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
          {openId && <CustomerDetailPanel id={openId} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/**
 * One customer.
 *
 * Complaints and no-shows are the only badges, because those are the only two
 * facts that change how an operator handles the call. Spend and booking count
 * sit on the right as reference, not as emphasis.
 */
function CustomerRow({
  customer,
  onOpen,
}: {
  customer: CustomerDetail;
  onOpen: () => void;
}) {
  return (
    <li>
      <button
        type="button"
        onClick={onOpen}
        className="flex w-full items-center gap-3 p-4 text-left transition-colors duration-fast hover:bg-canvas"
      >
        <Avatar className="size-avatar shrink-0">
          <AvatarFallback>{initials(customer.name)}</AvatarFallback>
        </Avatar>

        <span className="min-w-0 flex-1">
          <span className="flex flex-wrap items-center gap-2">
            <span className="text-small font-medium text-ink">
              {customer.name}
            </span>
            {customer.blocked && (
              <Badge tone="critical" dot>
                Blocked
              </Badge>
            )}
            {customer.complaintCount > 0 && (
              <Badge tone="clock" dot>
                {customer.complaintCount} complaint
                {customer.complaintCount === 1 ? "" : "s"}
              </Badge>
            )}
            {customer.noShowCount >= NO_SHOW_CONCERN && (
              <Badge tone="critical" dot>
                {customer.noShowCount} no-shows
              </Badge>
            )}
          </span>
          <span className="tabular mt-px block truncate text-caption text-ink-muted">
            {customer.phone} · {customer.area}
            {/* Below `sm` the right-hand figures are not rendered, so they
                ride along here instead of vanishing. */}
            <span className="sm:hidden">
              {" · "}
              {customer.totalBookings} booking
              {customer.totalBookings === 1 ? "" : "s"}
              {" · "}
              <span className="font-medium text-ink">
                {formatCurrency(customer.totalSpentPaise)}
              </span>
            </span>
          </span>
        </span>

        <span className="hidden items-center gap-6 sm:flex">
          <span className="text-right">
            <span className="tabular block text-small text-ink">
              {customer.totalBookings}
            </span>
            <span className="block text-caption text-ink-muted">bookings</span>
          </span>
          <span className="w-amount text-right">
            <span className="tabular block text-small font-medium text-ink">
              {formatCurrency(customer.totalSpentPaise)}
            </span>
            <span className="block text-caption text-ink-muted">spent</span>
          </span>
        </span>
      </button>
    </li>
  );
}

function CustomerListSkeleton() {
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
 * Admin 20 + 21 — Customer detail and moderation.
 *
 * Opens on the four facts that decide how a call goes — spend, bookings,
 * complaints, no-shows — then the history behind each. Blocking is the header
 * action for the same reason it is on a pro: it is the one irreversible thing
 * here and it needs a reason on the record.
 */
function CustomerDetailPanel({ id }: { id: string }) {
  const [customer, setCustomer] = React.useState<CustomerDetail | null>(null);
  const [bookings, setBookings] = React.useState<CustomerBooking[]>([]);
  const [complaints, setComplaints] = React.useState<CustomerComplaint[]>([]);
  const [blocked, setBlocked] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    Promise.all([
      getCustomer(id),
      getCustomerBookings(id),
      getCustomerComplaints(id),
    ])
      .then(([c, b, cm]) => {
        setCustomer(c);
        setBlocked(c.blocked);
        setBookings(b);
        setComplaints(cm);
      })
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      );
  }, [id]);

  React.useEffect(() => load(), [load]);

  if (error) {
    return (
      <SheetBody>
        <ErrorState
          icon={<TriangleAlert />}
          title="This customer could not be found"
          description={error}
          action={{ label: "Try again", onClick: load }}
        />
      </SheetBody>
    );
  }

  if (!customer) {
    return (
      <SheetBody className="space-y-4">
        <Skeleton className="h-block-xs rounded-card" />
        <Skeleton className="h-block-md rounded-card" />
      </SheetBody>
    );
  }

  const openComplaints = complaints.filter((c) => !c.resolved);
  const cancelled = bookings.filter((b) => b.status === "cancelled").length;

  return (
    <>
      <SheetHeader>
        <div className="flex items-start gap-3">
          <Avatar className="size-12 shrink-0">
            <AvatarFallback>{initials(customer.name)}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <SheetTitle>{customer.name}</SheetTitle>
            <p className="tabular text-caption text-ink-muted">
              {customer.phone} · {customer.area} · Joined{" "}
              {formatDate(customer.joinedAt)}
            </p>
            {blocked && (
              <p className="mt-2">
                <Badge tone="critical" dot>
                  Blocked
                </Badge>
              </p>
            )}
          </div>
        </div>
      </SheetHeader>

      <SheetBody className="space-y-4">
        {blocked && (
          <InlineAlert tone="critical" title="This account is blocked">
            They cannot place new bookings. Existing bookings are unaffected.
          </InlineAlert>
        )}

        {openComplaints.length > 0 && (
          <InlineAlert
            tone="clock"
            title={`${openComplaints.length} unresolved complaint${openComplaints.length === 1 ? "" : "s"}`}
          >
            Settle these before deciding on any moderation.
          </InlineAlert>
        )}

        <div className="grid grid-cols-2 gap-px overflow-hidden rounded-card border border-border bg-border">
          <SummaryTile
            label="Lifetime spend"
            value={formatCurrency(customer.totalSpentPaise)}
            hint={`${customer.totalBookings} bookings`}
          />
          <SummaryTile
            label="Wallet"
            value={formatCurrency(customer.walletPaise)}
            hint="credit available"
          />
          <SummaryTile
            label="Complaints"
            value={customer.complaintCount}
            hint={
              openComplaints.length > 0
                ? `${openComplaints.length} still open`
                : "all settled"
            }
          />
          <SummaryTile
            label="No-shows"
            value={customer.noShowCount}
            hint={
              customer.noShowCount >= NO_SHOW_CONCERN
                ? "a pattern, not bad luck"
                : "within normal"
            }
          />
        </div>

        <Tabs defaultValue="bookings">
          <TabsList>
            <TabsTrigger value="bookings">
              Bookings{bookings.length > 0 ? ` (${bookings.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="complaints">
              Complaints{complaints.length > 0 ? ` (${complaints.length})` : ""}
            </TabsTrigger>
            <TabsTrigger value="profile">Profile</TabsTrigger>
          </TabsList>

          <TabsContent value="bookings">
            {bookings.length === 0 ? (
              <EmptyState
                icon={<UserX />}
                title="No bookings yet"
                description="This customer has registered but not booked anything."
              />
            ) : (
              <>
                {cancelled > 0 && (
                  <p className="mb-3 text-caption text-ink-muted">
                    {cancelled} of the last {bookings.length} were cancelled.
                  </p>
                )}
                <ul className="divide-y divide-border-soft overflow-hidden rounded-card border border-border">
                  {bookings.map((b) => (
                    <li key={b.id} className="flex items-center gap-3 p-3">
                      <span className="min-w-0 flex-1">
                        <span className="flex flex-wrap items-center gap-2">
                          <span className="tabular text-small font-medium text-ink">
                            {b.reference}
                          </span>
                          <BookingStatusBadge status={b.status} />
                        </span>
                        <span className="mt-px block truncate text-caption text-ink-muted">
                          {b.serviceName} · {b.proName ?? "No pro assigned"}
                        </span>
                        <span className="tabular block text-caption text-ink-faint">
                          {formatSchedule(b.scheduledAt)}
                        </span>
                      </span>
                      <span className="tabular shrink-0 text-small font-medium text-ink">
                        {formatCurrency(b.totalPaise)}
                      </span>
                    </li>
                  ))}
                </ul>
                {customer.totalBookings > bookings.length && (
                  <p className="mt-3 text-caption text-ink-muted">
                    Showing the most recent {bookings.length} of{" "}
                    {customer.totalBookings}.
                  </p>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="complaints">
            {complaints.length === 0 ? (
              <EmptyState
                icon={<ShieldCheck />}
                title="No complaints"
                description="This customer has never raised one."
              />
            ) : (
              <ul className="divide-y divide-border-soft overflow-hidden rounded-card border border-border">
                {complaints.map((c) => (
                  <li key={c.id} className="p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-small font-medium text-ink">
                        {c.subject}
                      </span>
                      <Badge tone={c.resolved ? "neutral" : "clock"} dot={c.resolved}>
                        {c.resolved ? "Settled" : "Open"}
                      </Badge>
                    </div>
                    <p className="tabular mt-px text-caption text-ink-muted">
                      {c.bookingRef} · {formatDate(c.raisedAt)}
                    </p>
                    {c.outcome && (
                      <p className="mt-2 rounded-control bg-canvas p-2 text-caption text-ink-muted">
                        {c.outcome}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </TabsContent>

          <TabsContent value="profile">
            <DetailCard>
              <DetailList>
                <DetailRow
                  label="Phone"
                  value={
                    <a
                      href={`tel:${customer.phone.replace(/\s/g, "")}`}
                      className="tabular text-action hover:underline"
                    >
                      {customer.phone}
                    </a>
                  }
                />
                <DetailRow label="Email" value={customer.email ?? "Not set"} />
                <DetailRow label="Area" value={customer.area} />
                <DetailRow
                  label="Joined"
                  value={formatDate(customer.joinedAt)}
                  tabular
                />
              </DetailList>

              {customer.addresses.length > 0 && (
                <div className="mt-3 border-t border-border-soft pt-3">
                  <p className="mb-2 text-caption font-medium text-ink">
                    Saved addresses
                  </p>
                  <ul className="space-y-2">
                    {customer.addresses.map((a, i) => (
                      <li key={i} className="text-small text-ink-muted">
                        {a}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </DetailCard>
          </TabsContent>
        </Tabs>
      </SheetBody>

      <div className="flex shrink-0 gap-2 border-t border-border p-4">
        <Button variant="secondary" className="flex-1" asChild>
          <a href={`tel:${customer.phone.replace(/\s/g, "")}`}>
            <Phone />
            Call
          </a>
        </Button>
        <BlockCustomerDialog
          customer={customer}
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
      <p className="tabular mt-1 text-heading font-semibold text-ink">{value}</p>
      <p className="mt-px text-caption text-ink-faint">{hint}</p>
    </div>
  );
}

/**
 * Admin 21 — block or unblock a customer.
 *
 * Inventory: "Account moderation with reason logging."
 *
 * The reasons offered are the ones that actually occur: repeated no-shows,
 * abuse toward a pro, payment fraud. Free text stays available, but a queue
 * worked under pressure produces useful records only when the common cases are
 * one tap.
 */
const BLOCK_REASONS = [
  "Repeated no-shows for confirmed bookings.",
  "Abusive behaviour toward a service professional.",
  "Payment disputed after the work was completed.",
  "Fraudulent booking activity.",
];

function BlockCustomerDialog({
  customer,
  blocked,
  onToggle,
}: {
  customer: CustomerDetail;
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
        ? `${customer.name} can book again`
        : `${customer.name} has been blocked`,
    );
    setOpen(false);
  };

  if (blocked) {
    return (
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button variant="secondary" className="flex-1">
            <ShieldCheck />
            Unblock
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Unblock {customer.name}?</AlertDialogTitle>
            <AlertDialogDescription>
              They will be able to place bookings again immediately.
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
        <Button variant="secondary" className="flex-1">
          <Ban className="text-critical" />
          Block
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Block {customer.name}?</DialogTitle>
          <DialogDescription>
            They cannot place new bookings. Anything already booked goes ahead,
            and their wallet balance is untouched.
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
            Block this customer
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function CustomerManagementPage() {
  return (
    <Suspense fallback={<Skeleton className="h-block-lg rounded-card" />}>
      <CustomerManagementInner />
    </Suspense>
  );
}
