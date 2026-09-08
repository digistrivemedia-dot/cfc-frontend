"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import {
  CalendarX2,
  CircleUserRound,
  Download,
  Phone,
  Search,
  ShieldAlert,
  ShieldCheck,
  ShieldOff,
  TriangleAlert,
  UserCheck,
} from "lucide-react";
import {
  getBooking,
  getBookings,
  getBookingsForExport,
  getPros,
  previewStatusOverride,
} from "@cfc/mocks";
import {
  BOOKING_STATUSES,
  BOOKING_STATUS_LABEL,
  areaScope,
  can,
  canViewBookings,
  type BookingDetail,
  type BookingListItem,
  type BookingStatus,
  type Page,
  type ProListItem,
} from "@cfc/types";
import {
  Avatar,
  AvatarFallback,
  Badge,
  BookingStatusBadge,
  Button,
  DataTable,
  DateRangePicker,
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
  InlineAlert,
  Input,
  MapView,
  PageHeader,
  Pagination,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Sheet,
  SheetBody,
  SheetContent,
  SheetHeader,
  SheetTitle,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  Timeline,
  TimelineItem,
  cn,
  downloadCsv,
  formatCurrency,
  formatSchedule,
  initials,
  toCsv,
  toast,
  type CardLayout,
  type Column,
  type DateRange,
  type MapMarker,
  type SortDir,
} from "@cfc/ui";
import { useActor } from "@/lib/actor";

/**
 * Admin 6–10 — Bookings & Jobs.
 *
 * Nav restructure (approved plan, corrected during build after re-reading
 * Admin 8's actual content): one sidebar item, four tabs.
 *
 *  - All Bookings (6)     — the master table, doc: "Master booking table,
 *                           status filters, date range, export CSV"
 *  - Needs Attention (8)  — doc: "Force status updates, admin intervention on
 *                           disputes". Kept as its own tab rather than folded
 *                           into the detail panel: it is a filtered QUEUE of
 *                           stuck bookings an operator needs to see as a list
 *                           to know intervention is needed at all — nobody
 *                           would open a random booking's panel to discover
 *                           it is stuck.
 *  - Live Map (9)         — doc: "Real-time map showing all active Pros and
 *                           their job locations"
 *  - Assign Jobs (10)     — doc: "Assign any job to any available Pro.
 *                           Override auto-assign." A distinct two-pane
 *                           working mode, not a per-booking action.
 *
 * Booking Detail (7) is not a tab — it opens as a side panel from a row in
 * All Bookings or Needs Attention, with the status-override control inside
 * it for one-off manual overrides. The open record is reflected in `?id=`.
 */

const PAGE_SIZE = 20;
const TAB_PARAM = "tab";
type BookingsTab = "all" | "attention" | "map" | "assign";

function BookingsAndJobsInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openId = searchParams.get("id");
  const tab = (searchParams.get(TAB_PARAM) as BookingsTab | null) ?? "all";

  const setTab = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(TAB_PARAM, next);
    params.delete("id");
    router.push(`/bookings?${params.toString()}`, { scroll: false });
  };

  const openDetail = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", id);
    router.push(`/bookings?${params.toString()}`, { scroll: false });
  };
  const closeDetail = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    router.push(`/bookings?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      <PageHeader title="Bookings & jobs" />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="all">All bookings</TabsTrigger>
          <TabsTrigger value="attention">Needs attention</TabsTrigger>
          <TabsTrigger value="map">Live map</TabsTrigger>
          <TabsTrigger value="assign">Assign jobs</TabsTrigger>
        </TabsList>

        <TabsContent value="all">
          <AllBookingsTab onOpenDetail={openDetail} />
        </TabsContent>
        <TabsContent value="attention">
          <NeedsAttentionTab onOpenDetail={openDetail} />
        </TabsContent>
        <TabsContent value="map">
          <LiveMapTab />
        </TabsContent>
        <TabsContent value="assign">
          <AssignJobsTab />
        </TabsContent>
      </Tabs>

      <Sheet open={openId !== null} onOpenChange={(open) => { if (!open) closeDetail(); }}>
        <SheetContent>
          {openId && <BookingDetailPanel id={openId} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/** Admin 6 — All bookings. Doc: "Master booking table, status filters, date range, export CSV". */
function AllBookingsTab({ onOpenDetail }: { onOpenDetail: (id: string) => void }) {
  const actor = useActor();
  const allowed = canViewBookings(actor);
  const scopedArea = areaScope(actor);

  const [search, setSearch] = React.useState("");
  const [debouncedSearch, setDebouncedSearch] = React.useState("");
  const [status, setStatus] = React.useState<BookingStatus | "all">("all");
  const [range, setRange] = React.useState<DateRange | undefined>();
  const [page, setPage] = React.useState(1);
  // `null` is the third sort state — the operator has cycled the column off.
  // The query still needs a field, so unsorted falls back to the list's natural
  // order, newest first.
  const [sortBy, setSortBy] = React.useState<string | null>("scheduledAt");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");

  const [data, setData] = React.useState<Page<BookingListItem> | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [exporting, setExporting] = React.useState(false);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 300);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    setPage(1);
  }, [debouncedSearch, status, range]);

  const query = React.useMemo(
    () => ({
      search: debouncedSearch || undefined,
      status,
      from: range?.from?.toISOString(),
      to: range?.to?.toISOString(),
      page,
      pageSize: PAGE_SIZE,
      sortBy: (sortBy ?? "scheduledAt") as
        | "scheduledAt"
        | "totalPaise"
        | "reference",
      sortDir: sortBy === null ? ("desc" as const) : sortDir,
      area: scopedArea,
    }),
    [debouncedSearch, status, range, page, sortBy, sortDir, scopedArea],
  );

  const load = React.useCallback(() => {
    if (!allowed) return;
    let cancelled = false;
    setLoading(true);
    setError(null);

    getBookings(query)
      .then((res) => {
        if (!cancelled) setData(res);
      })
      .catch((err: unknown) => {
        if (!cancelled)
          setError(err instanceof Error ? err.message : "The bookings could not load.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [allowed, query]);

  React.useEffect(() => load(), [load]);

  const hasFilters =
    debouncedSearch !== "" || status !== "all" || range?.from !== undefined;

  const clearFilters = () => {
    setSearch("");
    setStatus("all");
    setRange(undefined);
  };

  const handleExport = async () => {
    setExporting(true);
    try {
      const rows = await getBookingsForExport(query);
      const csv = toCsv(rows, [
        { header: "Booking ID", value: (r) => r.reference },
        { header: "Customer", value: (r) => r.customerName },
        { header: "Service", value: (r) => r.serviceName },
        { header: "Pro", value: (r) => r.proName ?? "Unassigned" },
        { header: "Area", value: (r) => r.area },
        { header: "Status", value: (r) => BOOKING_STATUS_LABEL[r.status] },
        { header: "Scheduled", value: (r) => r.scheduledAt },
        { header: "Amount (INR)", value: (r) => (r.totalPaise / 100).toFixed(2) },
      ]);
      const stamp = new Date().toISOString().slice(0, 10);
      downloadCsv(`cfc-bookings-${stamp}.csv`, csv);
    } catch {
      setError("The export could not be generated. Try again.");
    } finally {
      setExporting(false);
    }
  };

  if (!allowed) {
    return (
      <div className="rounded-card border border-border bg-surface">
        <ErrorState
          icon={<ShieldOff />}
          title="You do not have access to bookings"
          description="This area is limited to admin roles. Ask a super admin if you need access."
        />
      </div>
    );
  }

  const columns: Column<BookingListItem>[] = [
    {
      id: "reference",
      header: "Booking",
      sortable: true,
      skeletonWidth: "w-line-md",
      cell: (b) => (
        <span className="tabular font-medium text-ink width-condensed">{b.reference}</span>
      ),
    },
    { id: "customer", header: "Customer", skeletonWidth: "w-line-lg", cell: (b) => <span className="text-ink">{b.customerName}</span> },
    { id: "service", header: "Service", skeletonWidth: "w-line-lg", cell: (b) => <span className="text-ink">{b.serviceName}</span> },
    {
      id: "pro", header: "Pro", hideBelow: 1100, skeletonWidth: "w-line-md",
      cell: (b) => b.proName ? <span className="text-ink">{b.proName}</span> : <span className="text-ink-muted">Unassigned</span>,
    },
    { id: "area", header: "Area", hideBelow: 900, skeletonWidth: "w-line-sm", cell: (b) => <span className="text-ink-muted">{b.area}</span> },
    { id: "status", header: "Status", skeletonWidth: "w-line-xs", cell: (b) => <BookingStatusBadge status={b.status} /> },
    {
      id: "scheduledAt", header: "Scheduled", sortable: true, hideBelow: 780, skeletonWidth: "w-line-md",
      cell: (b) => <span className="tabular text-ink-muted width-condensed">{formatSchedule(b.scheduledAt)}</span>,
    },
    {
      id: "totalPaise", header: "Amount", sortable: true, align: "right", skeletonWidth: "w-line-xs",
      cell: (b) => <span className="tabular font-medium text-ink width-condensed">{formatCurrency(b.totalPaise)}</span>,
    },
  ];

  const card: CardLayout<BookingListItem> = {
    title: (b) => <span className="tabular">{b.reference}</span>,
    badge: (b) => <BookingStatusBadge status={b.status} />,
    lines: [
      (b) => `${b.customerName} · ${b.serviceName}`,
      (b) => `${b.proName ?? "Unassigned"} · ${b.area}`,
      (b) => <span className="tabular">{formatSchedule(b.scheduledAt)}</span>,
    ],
    trailing: (b) => <span className="tabular">{formatCurrency(b.totalPaise)}</span>,
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        {can(actor, "bookings.export") && (
          <Button
            variant="secondary"
            size="sm"
            onClick={handleExport}
            disabled={exporting || loading || (data?.total ?? 0) === 0}
          >
            <Download />
            {exporting ? "Preparing…" : "Export CSV"}
          </Button>
        )}
      </div>

      <div className="rounded-card border border-border bg-surface">
        <div className="flex flex-wrap items-center gap-2 border-b border-border p-3">
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by booking ID, customer, or service"
            icon={<Search />}
            className="h-8 min-w-search flex-1 text-small"
            aria-label="Search bookings"
          />
          <Select value={status} onValueChange={(v) => setStatus(v as BookingStatus | "all")}>
            <SelectTrigger className="h-8 w-menu text-small"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              {BOOKING_STATUSES.map((s) => <SelectItem key={s} value={s}>{BOOKING_STATUS_LABEL[s]}</SelectItem>)}
            </SelectContent>
          </Select>
          <DateRangePicker value={range} onChange={setRange} />
          {hasFilters && <Button variant="ghost" size="sm" onClick={clearFilters}>Clear filters</Button>}
        </div>

        {error ? (
          <ErrorState
            icon={<TriangleAlert />}
            title="The bookings could not load"
            description="The connection may have dropped. Try again."
            action={{ label: "Try again", onClick: load }}
          />
        ) : (
          <>
            <DataTable
              columns={columns}
              rows={data?.items ?? []}
              rowKey={(b) => b.id}
              card={card}
              loading={loading}
              sortBy={sortBy ?? undefined}
              sortDir={sortDir}
              onSort={(id, dir) => { setSortBy(id); setSortDir(dir); }}
              onRowClick={(b) => onOpenDetail(b.id)}
              empty={
                hasFilters ? (
                  <EmptyState
                    icon={<Search />}
                    title="No bookings match these filters"
                    description="Widen the date range or clear a filter to see more."
                    action={{ label: "Clear filters", onClick: clearFilters }}
                  />
                ) : (
                  <EmptyState
                    icon={<CalendarX2 />}
                    title="No bookings yet"
                    description={scopedArea ? `Bookings placed in ${scopedArea} will appear here.` : "Bookings will appear here as customers place them."}
                  />
                )
              }
            />
            {!loading && (data?.total ?? 0) > 0 && (
              <Pagination
                page={page}
                pageSize={PAGE_SIZE}
                total={data?.total ?? 0}
                onPageChange={setPage}
                className="border-t border-border"
              />
            )}
          </>
        )}
      </div>
    </div>
  );
}

/** Admin 8 — Needs attention. Doc: "Force status updates, admin intervention on disputes." */
function NeedsAttentionTab({ onOpenDetail }: { onOpenDetail: (id: string) => void }) {
  const [rows, setRows] = React.useState<BookingListItem[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setError(null);
    getBookings({ page: 1, pageSize: 10_000 })
      .then((res) => {
        const now = Date.now();
        const stuck = res.items.filter((b) => {
          const scheduled = new Date(b.scheduledAt).getTime();
          if (b.status === "pending" && scheduled < now) return true;
          if (b.status === "in_progress" && scheduled < now - 3 * 3_600_000) return true;
          return false;
        });
        setRows(stuck);
      })
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load."));
  }, []);

  React.useEffect(() => load(), [load]);

  const columns: Column<BookingListItem>[] = [
    {
      id: "reference", header: "Booking", skeletonWidth: "w-line-md",
      cell: (b) => <span className="tabular font-medium text-ink width-condensed">{b.reference}</span>,
    },
    { id: "customer", header: "Customer", skeletonWidth: "w-line-md", cell: (b) => <span className="text-ink">{b.customerName}</span> },
    { id: "status", header: "Current status", skeletonWidth: "w-line-sm", cell: (b) => <BookingStatusBadge status={b.status} /> },
    {
      id: "scheduledAt", header: "Was scheduled", hideBelow: 780, skeletonWidth: "w-line-md",
      cell: (b) => <span className="tabular text-ink-muted width-condensed">{formatSchedule(b.scheduledAt)}</span>,
    },
    {
      id: "amount", header: "Amount", align: "right", skeletonWidth: "w-line-xs",
      cell: (b) => <span className="tabular text-ink width-condensed">{formatCurrency(b.totalPaise)}</span>,
    },
  ];

  const card: CardLayout<BookingListItem> = {
    title: (b) => <span className="tabular">{b.reference}</span>,
    badge: (b) => <BookingStatusBadge status={b.status} />,
    lines: [(b) => b.customerName, (b) => formatSchedule(b.scheduledAt)],
    trailing: (b) => <span className="tabular">{formatCurrency(b.totalPaise)}</span>,
  };

  return (
    <div className="rounded-card border border-border bg-surface">
      {error ? (
        <ErrorState icon={<TriangleAlert />} title="This could not load" action={{ label: "Try again", onClick: load }} />
      ) : (
        <DataTable
          columns={columns}
          rows={rows ?? []}
          rowKey={(b) => b.id}
          card={card}
          loading={!rows}
          onRowClick={(b) => onOpenDetail(b.id)}
          empty={
            <EmptyState
              icon={<ShieldCheck />}
              title="Nothing needs intervention"
              description="Bookings stuck past their scheduled state will appear here. Click one to force a status update."
            />
          }
        />
      )}
    </div>
  );
}

/** Admin 9 — Live jobs map. Doc: "Real-time map showing all active Pros and their job locations." */
function LiveMapTab() {
  const [online, setOnline] = React.useState<ProListItem[] | null>(null);

  React.useEffect(() => {
    getPros({ online: "online", pageSize: 100 }).then((r) => setOnline(r.items));
  }, []);

  const markers: MapMarker[] = React.useMemo(() => {
    if (!online) return [];
    return online.map((p, i) => ({
      id: p.id,
      x: 15 + ((i * 37) % 70),
      y: 15 + ((i * 53) % 70),
      kind: "pro" as const,
      label: p.name.split(" ")[0],
    }));
  }, [online]);

  return (
    <div className="space-y-3">
      <p className="text-small text-ink-muted">
        {online ? `${online.length} pros online right now.` : "Loading…"}
      </p>
      {online ? <MapView markers={markers} className="h-panel" /> : <Skeleton className="h-panel rounded-card" />}
    </div>
  );
}

/** Admin 10 — Assign jobs. Doc: "Assign any job to any available Pro. Override auto-assign." */
function AssignJobsTab() {
  const [bookings, setBookings] = React.useState<BookingListItem[] | null>(null);
  const [pros, setPros] = React.useState<ProListItem[] | null>(null);
  const [selectedBooking, setSelectedBooking] = React.useState<string | null>(null);
  const [selectedPro, setSelectedPro] = React.useState<string | null>(null);
  const [search, setSearch] = React.useState("");

  React.useEffect(() => {
    getBookings({ status: "pending", page: 1, pageSize: 100 }).then((r) => setBookings(r.items));
    getPros({ online: "online", approvalStatus: "approved", pageSize: 100 }).then((r) => setPros(r.items));
  }, []);

  const filteredPros = React.useMemo(() => {
    if (!pros) return [];
    if (!search) return pros;
    const q = search.toLowerCase();
    return pros.filter((p) => p.name.toLowerCase().includes(q) || p.services.some((s) => s.toLowerCase().includes(q)));
  }, [pros, search]);

  const booking = bookings?.find((b) => b.id === selectedBooking);
  const pro = pros?.find((p) => p.id === selectedPro);

  const handleAssign = () => {
    if (!booking || !pro) return;
    setBookings((b) => b?.filter((x) => x.id !== booking.id) ?? b);
    toast.success(`${booking.reference} assigned to ${pro.name}`);
    setSelectedBooking(null);
    setSelectedPro(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <p className="text-small text-ink-muted">
          Cross-reference unassigned bookings against available pros, then assign.
        </p>
        <Button variant="primary" disabled={!booking || !pro} onClick={handleAssign}>
          <UserCheck />
          Assign job
        </Button>
      </div>

      {booking && pro && (
        <div className="rounded-card border border-action bg-action-subtle p-3 text-small text-ink">
          Assigning <span className="font-medium">{booking.reference}</span> to{" "}
          <span className="font-medium">{pro.name}</span>.
        </div>
      )}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-card border border-border bg-surface">
          <header className="border-b border-border p-3">
            <h2 className="text-heading font-semibold text-ink">Unassigned bookings</h2>
          </header>
          {!bookings ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-block-xs rounded-control" />)}
            </div>
          ) : bookings.length === 0 ? (
            <EmptyState icon={<UserCheck />} title="No unassigned bookings" description="Every pending booking currently has a pro assigned." />
          ) : (
            <ul className="divide-y divide-border">
              {bookings.map((b) => (
                <li key={b.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedBooking(b.id)}
                    aria-pressed={selectedBooking === b.id}
                    className={
                      selectedBooking === b.id
                        ? "block w-full border-l-nav border-action bg-action-subtle p-3 text-left"
                        : "block w-full border-l-nav border-transparent p-3 text-left hover:bg-action-subtle"
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="tabular font-medium text-ink width-condensed">{b.reference}</span>
                      <span className="tabular text-small text-ink-muted">{formatCurrency(b.totalPaise)}</span>
                    </div>
                    <p className="mt-1 text-small text-ink-muted">
                      {b.serviceName} · {b.area} · {formatSchedule(b.scheduledAt)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="rounded-card border border-border bg-surface">
          <header className="space-y-2 border-b border-border p-3">
            <h2 className="text-heading font-semibold text-ink">Available pros</h2>
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by name or service"
              icon={<Search />}
              className="h-8 text-small"
              aria-label="Search pros"
            />
          </header>
          {!pros ? (
            <div className="space-y-2 p-3">
              {Array.from({ length: 4 }, (_, i) => <Skeleton key={i} className="h-block-xs rounded-control" />)}
            </div>
          ) : filteredPros.length === 0 ? (
            <EmptyState icon={<CircleUserRound />} title="No pros match" />
          ) : (
            <ul className="divide-y divide-border">
              {filteredPros.map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => setSelectedPro(p.id)}
                    aria-pressed={selectedPro === p.id}
                    className={
                      selectedPro === p.id
                        ? "block w-full border-l-nav border-action bg-action-subtle p-3 text-left"
                        : "block w-full border-l-nav border-transparent p-3 text-left hover:bg-action-subtle"
                    }
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-ink">{p.name}</span>
                      <Badge tone="success">Online</Badge>
                    </div>
                    <p className="mt-1 text-small text-ink-muted">
                      {p.services.join(", ")} · {p.area} · ★ {p.rating.toFixed(1)}
                    </p>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}

/**
 * Admin 7 + 8 — Booking detail and status management.
 *
 * Inventory 7: "Full booking info, user+Pro info, timeline, status override".
 * Inventory 8: "Force status updates, admin intervention on disputes".
 *
 * The two are one screen because they are one job. An operator opens a booking
 * BECAUSE something is wrong with it — a pro marked a job done that the customer
 * says never happened, a job sitting unassigned past its slot. Putting the
 * override behind a separate route would mean reading the timeline in one place
 * and acting on it in another.
 *
 * The override is deliberately awkward: a reason is required, the dialog names
 * what the customer and pro will see, and the forced entry is marked in the
 * timeline forever. Forcing a state is an admin overriding reality, and the
 * record should say so.
 */
function BookingDetailPanel({ id }: { id: string }) {
  const actor = useActor();
  const [booking, setBooking] = React.useState<BookingDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  const load = React.useCallback(() => {
    setLoading(true);
    setError(null);
    getBooking(id)
      .then(setBooking)
      .catch((e: unknown) =>
        setError(e instanceof Error ? e.message : "Could not load."),
      )
      .finally(() => setLoading(false));
  }, [id]);

  React.useEffect(() => load(), [load]);

  if (loading) {
    return (
      <SheetBody className="space-y-4">
        <Skeleton className="h-8 w-line-md" />
        <Skeleton className="h-block-md rounded-card" />
        <Skeleton className="h-block-sm rounded-card" />
      </SheetBody>
    );
  }

  if (error || !booking) {
    return (
      <SheetBody>
        <ErrorState
          icon={<TriangleAlert />}
          title="This booking could not be found"
          description={error ?? "It may have been removed."}
          action={{ label: "Try again", onClick: load }}
        />
      </SheetBody>
    );
  }

  const canOverride = can(actor, "bookings.override_status");
  const scheduled = new Date(booking.scheduledAt).getTime();
  const stalled =
    (booking.status === "pending" && scheduled < Date.now()) ||
    (booking.status === "in_progress" && scheduled < Date.now() - 3 * 3_600_000);

  return (
    <>
      <SheetHeader>
        <SheetTitle>
          <span className="tabular">{booking.reference}</span>
        </SheetTitle>
        <div className="flex flex-wrap items-center gap-2">
          <BookingStatusBadge status={booking.status} />
          <span className="text-small text-ink-muted">
            {booking.serviceName}
          </span>
        </div>
      </SheetHeader>

      <SheetBody className="space-y-4">
        {stalled && (
          <InlineAlert
            tone="critical"
            title="This booking is past its scheduled time"
          >
            {booking.status === "pending"
              ? "No pro has accepted it. Assign one manually or cancel it."
              : "It has been in progress far longer than this service takes."}
          </InlineAlert>
        )}

        {/* Who and where — the first thing anyone opening a booking needs. */}
        <DetailCard title="Customer">
          <div className="flex items-start gap-3">
            <Avatar className="size-avatar shrink-0">
              <AvatarFallback>{initials(booking.customerName)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <p className="text-small font-medium text-ink">
                {booking.customerName}
              </p>
              <a
                href={`tel:${booking.customerPhone.replace(/\s/g, "")}`}
                className="tabular text-caption text-action hover:underline"
              >
                {booking.customerPhone}
              </a>
            </div>
            <Button variant="secondary" size="sm" asChild>
              <a href={`tel:${booking.customerPhone.replace(/\s/g, "")}`}>
                <Phone />
                Call
              </a>
            </Button>
          </div>

          <div className="mt-3 border-t border-border-soft pt-3">
            <DetailList>
              <DetailRow label="Address" value={booking.address} stacked />
              {booking.landmark && (
                <DetailRow label="Landmark" value={booking.landmark} stacked />
              )}
              {booking.notes && (
                <DetailRow
                  label="Customer note"
                  value={booking.notes}
                  stacked
                />
              )}
            </DetailList>
          </div>
        </DetailCard>

        <DetailCard title="Pro">
          {booking.proName === null ? (
            <p className="text-small text-ink-muted">
              No pro assigned yet.{" "}
              {booking.status === "pending"
                ? "Auto-assign is still trying, or assign one manually."
                : ""}
            </p>
          ) : (
            <div className="flex items-start gap-3">
              <Avatar className="size-avatar shrink-0">
                <AvatarFallback>{initials(booking.proName)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <p className="text-small font-medium text-ink">
                  {booking.proName}
                </p>
                {booking.proPhone && (
                  <a
                    href={`tel:${booking.proPhone.replace(/\s/g, "")}`}
                    className="tabular text-caption text-action hover:underline"
                  >
                    {booking.proPhone}
                  </a>
                )}
              </div>
              {booking.proPhone && (
                <Button variant="secondary" size="sm" asChild>
                  <a href={`tel:${booking.proPhone.replace(/\s/g, "")}`}>
                    <Phone />
                    Call
                  </a>
                </Button>
              )}
            </div>
          )}
        </DetailCard>

        {/* The settlement, split as Admin 32 settles it. GST rides on the
            platform fee only — never on the pro's professional fee. */}
        <DetailCard title="Payment">
          <DetailList>
            <DetailRow
              label="Customer paid"
              value={formatCurrency(booking.totalPaise)}
              tabular
            />
            <DetailRow
              label="CFC platform fee"
              value={`− ${formatCurrency(booking.platformFeePaise)}`}
              tabular
            />
            <DetailRow
              label="GST on the fee"
              value={formatCurrency(booking.gstPaise)}
              tabular
            />
            <DetailRow
              label="Pro receives"
              value={formatCurrency(booking.proPayoutPaise)}
              tabular
            />
            <DetailRow
              label="Method"
              value={
                <span className="flex items-center gap-2">
                  <span className="uppercase">{booking.paymentMethod}</span>
                  <Badge tone="neutral" dot={booking.paid}>
                    {booking.paid ? "Paid" : "On completion"}
                  </Badge>
                </span>
              }
            />
          </DetailList>
        </DetailCard>

        <DetailCard title="History">
          <Timeline>
            {booking.timeline.map((e, i) => (
              <TimelineItem
                key={i}
                title={
                  <span className="flex flex-wrap items-center gap-2">
                    {e.label}
                    {e.forced && <Badge tone="clock">Forced by admin</Badge>}
                  </span>
                }
                time={formatSchedule(e.at)}
                state={i === booking.timeline.length - 1 ? "current" : "done"}
                last={i === booking.timeline.length - 1}
              >
                {e.actor}
              </TimelineItem>
            ))}
          </Timeline>
        </DetailCard>
      </SheetBody>

      {canOverride && (
        <div className="shrink-0 border-t border-border p-4">
          <StatusOverrideDialog booking={booking} onApplied={setBooking} />
        </div>
      )}
    </>
  );
}

/**
 * Admin 8 — force a status.
 *
 * Only offers states that are a real move from where the booking is. Offering
 * "completed" on a cancelled booking would be a way to create nonsense, and a
 * dropdown of every status invites exactly that.
 */
const OVERRIDE_TARGETS: Record<BookingStatus, BookingStatus[]> = {
  pending: ["assigned", "cancelled"],
  assigned: ["in_progress", "pending", "cancelled"],
  in_progress: ["completed", "assigned", "cancelled"],
  completed: ["in_progress"],
  cancelled: ["pending"],
};

const OVERRIDE_CONSEQUENCE: Record<BookingStatus, string> = {
  pending: "The job returns to the auto-assign queue and pros are notified again.",
  assigned: "The pro is notified that the job is theirs again.",
  in_progress: "The job reopens. The pro can upload photos and complete it.",
  completed:
    "The customer is asked to rate, the invoice is generated and the pro's wallet is credited.",
  cancelled:
    "The customer is notified and any payment taken is queued for refund.",
};

function StatusOverrideDialog({
  booking,
  onApplied,
}: {
  booking: BookingDetail;
  onApplied: (b: BookingDetail) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [next, setNext] = React.useState<BookingStatus | null>(null);
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  React.useEffect(() => {
    if (!open) {
      setNext(null);
      setReason("");
    }
  }, [open]);

  const targets = OVERRIDE_TARGETS[booking.status];

  const apply = () => {
    if (!next || reason.trim() === "") return;
    setBusy(true);
    previewStatusOverride(booking.id, next, reason)
      .then((updated) => {
        onApplied(updated);
        toast.success(
          `${booking.reference} forced to ${BOOKING_STATUS_LABEL[next].toLowerCase()}`,
        );
        setOpen(false);
      })
      .catch((e: unknown) =>
        toast.error(e instanceof Error ? e.message : "Could not apply."),
      )
      .finally(() => setBusy(false));
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="secondary" className="w-full">
          <ShieldAlert />
          Force a status change
        </Button>
      </DialogTrigger>

      <DialogContent>
        <DialogHeader>
          <DialogTitle>
            Override <span className="tabular">{booking.reference}</span>
          </DialogTitle>
          <DialogDescription>
            Use this only when the real state and the recorded state disagree —
            a disputed completion, a job stuck after a failed handoff. The change
            is logged against your name.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <p className="mb-2 text-small font-medium text-ink">
              Move from{" "}
              <span className="text-ink-muted">
                {BOOKING_STATUS_LABEL[booking.status]}
              </span>{" "}
              to
            </p>
            <div className="grid gap-2">
              {targets.map((t) => {
                const on = next === t;
                return (
                  <button
                    key={t}
                    type="button"
                    onClick={() => setNext(t)}
                    className={cn(
                      "rounded-control border px-3 py-2 text-left",
                      "transition-colors duration-fast",
                      on
                        ? "border-action bg-action-subtle"
                        : "border-border-strong hover:bg-canvas",
                    )}
                  >
                    <span
                      className={cn(
                        "block text-small font-medium",
                        on ? "text-action-press" : "text-ink",
                      )}
                    >
                      {BOOKING_STATUS_LABEL[t]}
                    </span>
                    <span className="mt-px block text-caption text-ink-muted">
                      {OVERRIDE_CONSEQUENCE[t]}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          <FormField
            label="Why"
            required
            help="Kept on the booking permanently. Name what you verified."
          >
            <Textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Customer confirmed by phone that the work was finished."
            />
          </FormField>
        </div>

        <DialogFooter>
          <Button
            variant="primary"
            onClick={apply}
            loading={busy}
            disabled={next === null || reason.trim() === ""}
          >
            Force the change
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BookingsAndJobsPage() {
  return (
    <Suspense fallback={<Skeleton className="h-block-lg rounded-card" />}>
      <BookingsAndJobsInner />
    </Suspense>
  );
}
