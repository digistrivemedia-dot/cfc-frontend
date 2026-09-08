"use client";

import * as React from "react";
import { Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, CheckCircle2, Inbox, Send, TriangleAlert, UserPlus } from "lucide-react";
import { getSubAdmins, getTicket, getTickets } from "@cfc/mocks";
import {
  TICKET_PRIORITIES,
  TICKET_STATUSES,
  type SubAdmin,
  type TicketDetail,
  type TicketListItem,
  type TicketPriority,
  type TicketStatus,
} from "@cfc/types";
import {
  Badge,
  Button,
  Combobox,
  DataTable,
  DetailCard,
  DetailRow,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  EmptyState,
  ErrorState,
  FilterBar,
  FilterSelect,
  FormField,
  Input,
  NoResultsState,
  PageHeader,
  Pagination,
  RadioGroup,
  RadioGroupItem,
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
  Switch,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  Textarea,
  TicketPriorityBadge,
  TicketStatusBadge,
  formatCount,
  formatDate,
  formatSchedule,
  toast,
  type CardLayout,
  type Column,
  type SortDir,
} from "@cfc/ui";

/**
 * Admin 43–46 — Support & Communications.
 *
 * Nav restructure (approved plan): one sidebar item, three tabs.
 *
 *  - Tickets (43)            — the support queue. Ticket Detail / Reply (44)
 *                              opens as a side panel from a row, same shape as
 *                              Quotation Detail, deep-linkable via `?id=`.
 *  - Push Notifications (45) — compose and send to an audience.
 *  - Alert Config (46)       — automated WhatsApp / SMS event alerts.
 */

const TAB_PARAM = "tab";
type SupportTab = "tickets" | "push" | "alerts";

function SupportInner() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const openId = searchParams.get("id");
  const tab = (searchParams.get(TAB_PARAM) as SupportTab | null) ?? "tickets";

  const setTab = (next: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set(TAB_PARAM, next);
    params.delete("id");
    router.push(`/support?${params.toString()}`, { scroll: false });
  };

  const openDetail = (id: string) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("id", id);
    router.push(`/support?${params.toString()}`, { scroll: false });
  };
  const closeDetail = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("id");
    router.push(`/support?${params.toString()}`, { scroll: false });
  };

  return (
    <div className="space-y-4">
      <PageHeader
        title="Support & communications"
        description="Support requests, and the messages the platform sends out."
      />

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList>
          <TabsTrigger value="tickets">Tickets</TabsTrigger>
          <TabsTrigger value="push">Push notifications</TabsTrigger>
          <TabsTrigger value="alerts">Alert config</TabsTrigger>
        </TabsList>

        <TabsContent value="tickets">
          <TicketsTab onOpenDetail={openDetail} />
        </TabsContent>
        <TabsContent value="push">
          <PushNotificationsTab />
        </TabsContent>
        <TabsContent value="alerts">
          <AlertConfigTab />
        </TabsContent>
      </Tabs>

      <Sheet open={openId !== null} onOpenChange={(open) => { if (!open) closeDetail(); }}>
        <SheetContent className="sm:max-w-detail">
          {openId && <TicketDetailPanel id={openId} />}
        </SheetContent>
      </Sheet>
    </div>
  );
}

/**
 * A human reference for a ticket: tkt_0001 becomes CFC-1.
 *
 * The id is a database key; this is what goes in a phone call.
 */
function ticketRef(id: string): string {
  const n = Number(id.replace(/\D/g, ""));
  return Number.isNaN(n) ? id : `CFC-${n}`;
}

/** High first when sorting descending — the urgent end of the queue. */
const PRIORITY_RANK: Record<TicketPriority, number> = {
  low: 0,
  medium: 1,
  high: 2,
};

/** Admin 43 — Support tickets list. Inventory: all open/closed tickets, priority filter, assign to agent. */
function TicketsTab({ onOpenDetail }: { onOpenDetail: (id: string) => void }) {
  const [status, setStatus] = React.useState<TicketStatus | "all">("all");
  // Spec: "priority filter". Kept client-side because the mock endpoint takes
  // status only, and that signature is frozen for the backend team.
  const [priority, setPriority] = React.useState<TicketPriority | null>(null);
  const [search, setSearch] = React.useState("");
  const [rows, setRows] = React.useState<TicketListItem[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [selected, setSelected] = React.useState<string[]>([]);
  const [agents, setAgents] = React.useState<SubAdmin[]>([]);
  const [assigning, setAssigning] = React.useState<TicketListItem | null>(null);
  const [sortBy, setSortBy] = React.useState<string | null>("updated");
  const [sortDir, setSortDir] = React.useState<SortDir>("desc");
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(10);

  const load = React.useCallback(() => {
    setError(null);
    getTickets(status).then(setRows).catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load."));
  }, [status]);

  React.useEffect(() => load(), [load]);

  // The agent list is the real sub-admin roster, not invented names.
  React.useEffect(() => {
    getSubAdmins().then(setAgents).catch(() => setAgents([]));
  }, []);

  const filtered = React.useMemo(() => {
    if (rows === null) return null;
    const q = search.trim().toLowerCase();
    const kept = rows.filter(
      (t) =>
        (priority === null || t.priority === priority) &&
        (q === "" ||
          t.id.toLowerCase().includes(q) ||
          t.subject.toLowerCase().includes(q) ||
          t.fromName.toLowerCase().includes(q)),
    );

    if (sortBy === null) return kept;
    const dir = sortDir === "asc" ? 1 : -1;
    return [...kept].sort((a, b) => {
      switch (sortBy) {
        // High first when descending: an agent sorting by priority wants the
        // urgent end of the queue, not the alphabetical one.
        case "priority":
          return (PRIORITY_RANK[a.priority] - PRIORITY_RANK[b.priority]) * dir;
        case "subject":
          return a.subject.localeCompare(b.subject) * dir;
        case "from":
          return a.fromName.localeCompare(b.fromName) * dir;
        case "status":
          return a.status.localeCompare(b.status) * dir;
        default:
          return (Date.parse(a.updatedAt) - Date.parse(b.updatedAt)) * dir;
      }
    });
  }, [rows, priority, search, sortBy, sortDir]);

  // Filtering while on a later page would otherwise strand the view on an
  // empty page.
  React.useEffect(() => {
    setPage(1);
  }, [priority, status, search, pageSize]);

  const paged = React.useMemo(
    () => filtered?.slice((page - 1) * pageSize, page * pageSize) ?? null,
    [filtered, page, pageSize],
  );

  // What is actually waiting on someone, which is the number worth showing.
  const openCount = (rows ?? []).filter(
    (t) => t.status === "open" || t.status === "in_progress",
  ).length;

  const activeCount =
    (priority !== null ? 1 : 0) + (status !== "all" ? 1 : 0);

  const clearAll = () => {
    setPriority(null);
    setStatus("all");
    setSearch("");
  };

  /**
   * Assignment, in both places it is needed.
   *
   * One ticket is assigned from its row; a backlog is assigned in bulk. With
   * no backend to persist to, the row updates locally - the visible effect a
   * real assignment would have.
   */
  const assign = (ids: readonly string[], agentName: string) => {
    setRows((current) =>
      current
        ? current.map((t) =>
            ids.includes(t.id) ? { ...t, assignedTo: agentName } : t,
          )
        : current,
    );
    toast.success(
      ids.length === 1
        ? `Assigned to ${agentName}`
        : `${ids.length} tickets assigned to ${agentName}`,
    );
  };

  const columns: Column<TicketListItem>[] = [
    {
      // Six subjects across eighteen tickets: without a reference an agent
      // cannot tell two rows apart, or quote one over the phone.
      id: "ref",
      header: "Ticket",
      skeletonWidth: "w-line-xs",
      cell: (t) => (
        <span className="tabular text-caption text-ink-muted">
          {ticketRef(t.id)}
        </span>
      ),
    },
    {
      id: "subject", header: "Subject", sortable: true, skeletonWidth: "w-menu",
      cell: (t) => (
        <button type="button" onClick={() => onOpenDetail(t.id)} className="font-medium text-action hover:underline">
          {t.subject}
        </button>
      ),
    },
    { id: "from", header: "From", sortable: true, hideBelow: 900, skeletonWidth: "w-line-sm", cell: (t) => <span className="text-ink-muted">{t.fromName}</span> },
    { id: "priority", header: "Priority", sortable: true, skeletonWidth: "w-line-xs", cell: (t) => <TicketPriorityBadge priority={t.priority} /> },
    {
      /**
       * Never hidden.
       *
       * "Assign to agent" is a named requirement, and this is the only
       * per-row way to do it - so hiding the column at a width threshold
       * removed the action entirely whenever the detail sheet was open and
       * the table was squeezed. Metadata can drop out of a narrow table;
       * the screen's primary verb cannot.
       */
      id: "assigned",
      header: "Assigned to",
      skeletonWidth: "w-line-sm",
      cell: (t) =>
        t.assignedTo ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setAssigning(t);
            }}
            className="truncate text-ink-muted underline decoration-dotted underline-offset-2 hover:text-ink"
            title={`Reassign from ${t.assignedTo}`}
          >
            {t.assignedTo}
          </button>
        ) : (
          /* Unassigned is the state that needs an action, so it carries one. */
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              setAssigning(t);
            }}
          >
            <UserPlus />
            Assign
          </Button>
        ),
    },
    { id: "updated", header: "Updated", sortable: true, hideBelow: 780, skeletonWidth: "w-line-xs", cell: (t) => <span className="tabular text-ink-muted width-condensed">{formatSchedule(t.updatedAt)}</span> },
    { id: "status", header: "Status", sortable: true, skeletonWidth: "w-line-xs", cell: (t) => <TicketStatusBadge status={t.status} /> },
  ];

  const card: CardLayout<TicketListItem> = {
    title: (t) => t.subject,
    badge: (t) => <TicketPriorityBadge priority={t.priority} />,
    lines: [
      (t) => `${ticketRef(t.id)} · ${t.fromName}`,
      // On mobile there are no columns, so the assign action has to live in
      // the card or it does not exist at all below the card breakpoint.
      (t) => (
        <span className="flex flex-wrap items-center gap-1">
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              setAssigning(t);
            }}
            className="font-medium text-action underline decoration-dotted underline-offset-2"
          >
            {t.assignedTo ?? "Assign"}
          </button>
          <span aria-hidden="true">·</span>
          <span>{formatSchedule(t.updatedAt)}</span>
        </span>
      ),
    ],
    trailing: (t) => <TicketStatusBadge status={t.status} />,
  };

  return (
    <div className="space-y-3">
      <FilterBar
        search={search}
        onSearchChange={setSearch}
        searchPlaceholder="Search subject or sender"
        searchLabel="Search tickets"
        activeCount={activeCount}
        onClearAll={activeCount > 0 ? clearAll : undefined}
        resultLabel={
          filtered && rows
            ? `${filtered.length} of ${rows.length} · ${openCount} open`
            : undefined
        }
      >
        <FilterSelect
          label="Status"
          allLabel="Any status"
          value={status === "all" ? null : status}
          onChange={(v) => setStatus((v as TicketStatus | null) ?? "all")}
          options={TICKET_STATUSES.map((v) => ({
            value: v,
            label: v.replace("_", " "),
          }))}
        />
        <FilterSelect
          label="Priority"
          allLabel="Any priority"
          value={priority}
          onChange={(v) => setPriority(v as TicketPriority | null)}
          options={TICKET_PRIORITIES.map((v) => ({ value: v, label: v }))}
        />
      </FilterBar>

      <div className="rounded-card border border-border bg-surface">
        {error ? (
          <ErrorState icon={<TriangleAlert />} title="Could not load" action={{ label: "Try again", onClick: load }} />
        ) : (
          <DataTable
            columns={columns}
            rows={paged ?? []}
            rowKey={(t) => t.id}
            card={card}
            loading={rows === null}
            onRowClick={(t) => onOpenDetail(t.id)}
            sortBy={sortBy ?? undefined}
            sortDir={sortDir}
            onSort={(id, dir) => {
              setSortBy(id);
              setSortDir(dir);
            }}
            selectedIds={selected}
            onSelectionChange={setSelected}
            selectionNoun="ticket"
            bulkBar={({ selectedIds, clear }) => (
              <BulkAssign
                agents={agents}
                count={selectedIds.length}
                onAssign={(name) => {
                  assign(selectedIds, name);
                  clear();
                }}
              />
            )}
            empty={
              activeCount > 0 || search.trim() !== "" ? (
                <NoResultsState
                  title="No tickets match"
                  description="Try a different priority or status."
                  onClearFilters={clearAll}
                />
              ) : (
                <EmptyState icon={<Inbox />} title="No tickets" description="Support requests will appear here." />
              )
            }
          />
        )}

        {filtered && filtered.length > 0 && (
          <div className="border-t border-border p-3">
            <Pagination
              page={page}
              pageSize={pageSize}
              total={filtered.length}
              onPageChange={setPage}
              onPageSizeChange={setPageSize}
            />
          </div>
        )}
      </div>

      <AssignDialog
        ticket={assigning}
        agents={agents}
        onOpenChange={(open) => { if (!open) setAssigning(null); }}
        onAssign={(name) => {
          if (assigning) assign([assigning.id], name);
          setAssigning(null);
        }}
      />
    </div>
  );
}

/** Assigning a selection. Sits in the bulk bar, so it is compact by necessity. */
function BulkAssign({
  agents,
  count,
  onAssign,
}: {
  agents: SubAdmin[];
  count: number;
  onAssign: (agentName: string) => void;
}) {
  const [agentId, setAgentId] = React.useState<string | null>(null);

  return (
    <div className="flex items-center gap-2">
      <Combobox
        size="sm"
        options={agents.map((a) => ({ value: a.id, label: a.name }))}
        value={agentId}
        onChange={setAgentId}
        placeholder="Choose agent"
        aria-label={`Assign ${count} tickets to`}
        className="w-menu"
      />
      <Button
        variant="primary"
        size="sm"
        disabled={agentId === null}
        onClick={() => {
          const agent = agents.find((a) => a.id === agentId);
          if (agent) onAssign(agent.name);
          setAgentId(null);
        }}
      >
        Assign
      </Button>
    </div>
  );
}

/**
 * Assigning one ticket.
 *
 * A dialog rather than an inline select: the agent list is searchable and the
 * row is already the click target for opening the ticket, so an expanding
 * control inside it would fight the row's own job.
 */
function AssignDialog({
  ticket,
  agents,
  onOpenChange,
  onAssign,
}: {
  ticket: TicketListItem | null;
  agents: SubAdmin[];
  onOpenChange: (open: boolean) => void;
  onAssign: (agentName: string) => void;
}) {
  const [agentId, setAgentId] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (ticket) setAgentId(null);
  }, [ticket]);

  return (
    <Dialog open={ticket !== null} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Assign ticket</DialogTitle>
          <DialogDescription>
            {ticket ? ticket.subject : ""}
          </DialogDescription>
        </DialogHeader>

        <FormField label="Agent" required>
          <Combobox
            options={agents.map((a) => ({
              value: a.id,
              label: a.area ? `${a.name} · ${a.area}` : a.name,
            }))}
            value={agentId}
            onChange={setAgentId}
            placeholder="Choose an agent"
            aria-label="Agent"
          />
        </FormField>

        <DialogFooter>
          <Button
            variant="primary"
            disabled={agentId === null}
            onClick={() => {
              const agent = agents.find((a) => a.id === agentId);
              if (agent) onAssign(agent.name);
            }}
          >
            Assign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/** Admin 44 — Ticket detail / reply side panel. Inventory: thread view, internal notes, status update, resolve. */
function TicketDetailPanel({ id }: { id: string }) {
  const [ticket, setTicket] = React.useState<TicketDetail | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);
  const [isInternal, setIsInternal] = React.useState(false);
  const [replyText, setReplyText] = React.useState("");
  const [agents, setAgents] = React.useState<SubAdmin[]>([]);

  React.useEffect(() => {
    setLoading(true);
    setError(null);
    getTicket(id)
      .then(setTicket)
      .catch((e: unknown) => setError(e instanceof Error ? e.message : "Could not load."))
      .finally(() => setLoading(false));
  }, [id]);

  React.useEffect(() => {
    getSubAdmins().then(setAgents).catch(() => setAgents([]));
  }, []);

  if (loading) {
    return (
      <SheetBody className="space-y-4">
        <Skeleton className="h-8 w-line-lg" />
        <Skeleton className="h-block-lg rounded-card" />
        <Skeleton className="h-block-md rounded-card" />
      </SheetBody>
    );
  }
  if (error || !ticket) {
    return (
      <SheetBody>
        <ErrorState icon={<TriangleAlert />} title="This ticket could not be found" description={error ?? undefined} />
      </SheetBody>
    );
  }

  /** Spec: "status update". Local, for the same reason the reply is. */
  const setStatus = (next: string) => {
    setTicket((t) => (t ? { ...t, status: next as TicketStatus } : t));
    toast.success(
      next === "resolved" ? "Ticket resolved" : `Status set to ${next.replace("_", " ")}`,
    );
  };

  // No real backend to persist against — the reply is appended to the local
  // thread, the visible effect a real send would have.
  const handleSend = () => {
    const body = replyText.trim();
    if (!body) return;
    setTicket((t) =>
      t
        ? {
            ...t,
            messages: [
              ...t.messages,
              {
                id: `msg_${Date.now()}`,
                author: "You",
                isInternal,
                body,
                sentAt: new Date().toISOString(),
              },
            ],
          }
        : t,
    );
    toast.success(isInternal ? "Internal note added" : "Reply sent");
    setReplyText("");
  };

  return (
    <>
      <SheetHeader>
        <SheetTitle>{ticket.subject}</SheetTitle>
        <div className="flex flex-wrap items-center gap-2">
          <p className="text-body text-ink-muted">From {ticket.fromName} ({ticket.fromRole})</p>
          <TicketStatusBadge status={ticket.status} />
        </div>
      </SheetHeader>

      <SheetBody className="space-y-4">
        <div className="grid gap-3 sm:grid-cols-2">
          <DetailCard title="Details">
            <DetailRow label="Ticket" value={<span className="tabular">{ticketRef(ticket.id)}</span>} />
            <DetailRow label="Priority" value={<TicketPriorityBadge priority={ticket.priority} />} />
            <DetailRow
              label="Assigned to"
              /* Seeing "Unassigned" and having no way to act on it was the gap:
                 assignment existed on the list but not here. */
              value={
                <Combobox
                  size="sm"
                  clearable
                  options={agents.map((a) => ({ value: a.name, label: a.name }))}
                  value={ticket.assignedTo}
                  onChange={(name) => {
                    setTicket((t) => (t ? { ...t, assignedTo: name } : t));
                    toast.success(name ? `Assigned to ${name}` : "Assignment cleared");
                  }}
                  placeholder="Unassigned"
                  aria-label="Assigned agent"
                />
              }
            />
          </DetailCard>

          <DetailCard title="Status">
            <div className="space-y-2">
              <Select value={ticket.status} onValueChange={setStatus}>
                <SelectTrigger className="w-full"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>

              {/* Spec names "resolve" separately from "status update", and it
                  is the one an agent reaches for most, so it gets a button
                  rather than being buried in the select. */}
              {ticket.status !== "resolved" && ticket.status !== "closed" && (
                <Button
                  variant="secondary"
                  className="w-full"
                  onClick={() => setStatus("resolved")}
                >
                  <CheckCircle2 />
                  Mark resolved
                </Button>
              )}
            </div>
          </DetailCard>
        </div>

        <DetailCard title="Thread">
          <div className="space-y-3">
            {ticket.messages.map((m) => (
              <div key={m.id} className={m.isInternal ? "rounded-control border border-clock-line bg-clock-subtle p-3" : "rounded-control bg-canvas p-3"}>
                <div className="flex items-center justify-between gap-2">
                  <span className="text-small font-medium text-ink">
                    {m.author}
                    {m.author !== ticket.fromName && (
                      <span className="ml-1 font-normal text-ink-faint">· agent</span>
                    )}
                  </span>
                  <span className="shrink-0 text-caption text-ink-muted">{formatSchedule(m.sentAt)}</span>
                </div>
                {m.isInternal && <Badge tone="clock" className="mt-1">Internal note — not sent to {ticket.fromRole}</Badge>}
                <p className="mt-2 text-body text-ink">{m.body}</p>
              </div>
            ))}
          </div>

          <div className="mt-4 space-y-2 border-t border-border pt-4">
            <Textarea
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              rows={3}
              placeholder={isInternal ? "Internal note — not visible to the customer" : "Reply to the customer"}
            />
            <div className="flex items-center justify-between gap-3">
              <button
                type="button"
                onClick={() => setIsInternal((v) => !v)}
                className="text-caption text-ink-muted hover:text-ink"
              >
                {isInternal ? "Switch to public reply" : "Switch to internal note"}
              </button>
              <Button variant="primary" size="sm" onClick={handleSend} disabled={replyText.trim() === ""}>
                <Send />Send
              </Button>
            </div>
          </div>
        </DetailCard>
      </SheetBody>
    </>
  );
}

const AUDIENCE_LABEL: Record<string, string> = {
  all: "all users",
  customers: "customers",
  pros: "pros",
  segment: "the selected segment",
};

/**
 * Push copy limits.
 *
 * Android collapses a notification title at around 65 characters and the body
 * at around 240. These are the practical ceilings, not a house style.
 */
const TITLE_LIMIT = 65;
const BODY_LIMIT = 240;

/**
 * The segments the spec's "specific segments" refers to.
 *
 * Each is derived from booking history the platform already holds - nothing
 * here needs a new data source.
 */
const SEGMENTS = [
  { value: "new", label: "New customers (no booking yet)", reach: 1840 },
  { value: "repeat", label: "Repeat customers (2+ bookings)", reach: 2960 },
  { value: "lapsed", label: "Lapsed (no booking in 90 days)", reach: 1120 },
  { value: "top_pros", label: "Top-rated pros (4.5+)", reach: 210 },
  { value: "inactive_pros", label: "Inactive pros (offline 14+ days)", reach: 64 },
];

/** Roughly how many devices each audience reaches. */
const AUDIENCE_REACH: Record<string, number> = {
  all: 9240,
  customers: 8790,
  pros: 450,
};

/** Admin 45 — Push notification manager. Inventory: compose and send push to all users / pros / specific segments. */
/**
 * Admin 45 — Push notification manager.
 *
 * Inventory: "Compose and send push to all users / Pros / specific segments."
 *
 * Two columns, because this is a composer: what you are writing on the left,
 * what will actually land on a phone on the right. The preview is sticky - a
 * preview you scroll away from while typing is not previewing anything.
 *
 * Send is irreversible and reaches thousands of real phones at once, so the
 * right column ends with who it goes to, how many devices that is, and when.
 */
function PushNotificationsTab() {
  const [title, setTitle] = React.useState("");
  const [message, setMessage] = React.useState("");
  const [audience, setAudience] = React.useState("all");
  const [segment, setSegment] = React.useState<string | null>(null);
  const [schedule, setSchedule] = React.useState("now");
  // Date and time are separate controls, matching the banner scheduler: the
  // native datetime-local widget ignores the design system and opens a raw
  // browser calendar over whatever is beneath it.
  const [sendDate, setSendDate] = React.useState("");
  const [sendTime, setSendTime] = React.useState("18:00");

  const segmentChosen = audience !== "segment" || segment !== null;
  const scheduleReady = schedule === "now" || sendDate !== "";
  const canSend =
    title.trim() !== "" && message.trim() !== "" && segmentChosen && scheduleReady;

  // Sending to "all users" without knowing whether that is 200 people or
  // 20,000 is how an accidental mass push happens.
  const reach =
    audience === "segment"
      ? (SEGMENTS.find((sg) => sg.value === segment)?.reach ?? 0)
      : (AUDIENCE_REACH[audience] ?? 0);

  const audienceLabel =
    audience === "segment"
      ? (SEGMENTS.find((sg) => sg.value === segment)?.label ?? "the selected segment")
      : (AUDIENCE_LABEL[audience] ?? "all users");

  const sendsAt =
    schedule === "later" && sendDate !== ""
      ? withTime(sendDate, sendTime)
      : null;

  const handleSend = () => {
    if (!canSend) return;
    toast.success(
      schedule === "now"
        ? `Sent to ${audienceLabel}`
        : `Scheduled for ${audienceLabel}`,
    );
    setTitle("");
    setMessage("");
    setAudience("all");
    setSegment(null);
    setSchedule("now");
    setSendDate("");
    setSendTime("18:00");
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
      <div className="space-y-4">
        <div className="space-y-4 rounded-card border border-border bg-surface p-4">
          <div>
            <h3 className="text-small font-semibold text-ink">Message</h3>
            <p className="text-caption text-ink-muted">
              What the notification says on the lock screen.
            </p>
          </div>

          {/* A push title is truncated by the OS well before it is long. The
              counters are the difference between a message that reads on a
              lock screen and one that ends in an ellipsis. */}
          <FormField label="Title" required help={`${title.length} of ${TITLE_LIMIT} characters`}>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value.slice(0, TITLE_LIMIT))}
              placeholder="e.g. 20% off your next booking"
            />
          </FormField>

          <FormField label="Message" required help={`${message.length} of ${BODY_LIMIT} characters`}>
            <Textarea
              value={message}
              onChange={(e) => setMessage(e.target.value.slice(0, BODY_LIMIT))}
              placeholder="Keep it short — this is a push notification, not an email."
              rows={3}
            />
          </FormField>
        </div>

        <div className="space-y-4 rounded-card border border-border bg-surface p-4">
          <div>
            <h3 className="text-small font-semibold text-ink">Audience</h3>
            <p className="text-caption text-ink-muted">Who receives it.</p>
          </div>

          <FormField label="Send to" required>
            <RadioGroup
              value={audience}
              onValueChange={setAudience}
              className="grid gap-2 sm:grid-cols-2"
            >
              {AUDIENCES.map((a) => (
                <label
                  key={a.value}
                  className="flex items-start gap-2 rounded-control border border-border p-3 text-body text-ink has-[:checked]:border-action has-[:checked]:bg-action-subtle"
                >
                  <RadioGroupItem value={a.value} className="mt-1" />
                  <span className="min-w-0">
                    <span className="block">{a.label}</span>
                    <span className="tabular block text-caption text-ink-muted">
                      {a.value === "segment"
                        ? "Choose below"
                        : `about ${formatCount(AUDIENCE_REACH[a.value] ?? 0)} devices`}
                    </span>
                  </span>
                </label>
              ))}
            </RadioGroup>
          </FormField>

          {/* Choosing "specific segment" and then being shown nothing to pick
              is the defect this closes. */}
          {audience === "segment" && (
            <FormField
              label="Segment"
              required
              help="Segments are derived from booking history."
            >
              <Combobox
                options={SEGMENTS.map((sg) => ({
                  value: sg.value,
                  label: `${sg.label} — ${formatCount(sg.reach)}`,
                }))}
                value={segment}
                onChange={setSegment}
                placeholder="Choose a segment"
                aria-label="Segment"
              />
            </FormField>
          )}
        </div>

        <div className="space-y-4 rounded-card border border-border bg-surface p-4">
          <div>
            <h3 className="text-small font-semibold text-ink">Timing</h3>
            <p className="text-caption text-ink-muted">When it goes out.</p>
          </div>

          <RadioGroup
            value={schedule}
            onValueChange={setSchedule}
            className="grid gap-2 sm:grid-cols-2"
          >
            <label className="flex items-center gap-2 rounded-control border border-border p-3 text-body text-ink has-[:checked]:border-action has-[:checked]:bg-action-subtle">
              <RadioGroupItem value="now" />
              Send immediately
            </label>
            <label className="flex items-center gap-2 rounded-control border border-border p-3 text-body text-ink has-[:checked]:border-action has-[:checked]:bg-action-subtle">
              <RadioGroupItem value="later" />
              Schedule for later
            </label>
          </RadioGroup>

          {schedule === "later" && (
            <div className="grid gap-3 sm:grid-cols-2">
              <FormField label="Date" required>
                <Input
                  type="date"
                  value={sendDate}
                  min={TODAY_ISO}
                  onChange={(e) => setSendDate(e.target.value)}
                  aria-label="Date to send"
                />
              </FormField>
              <FormField label="Time" help="Evening sends see the highest open rate.">
                <Input
                  type="time"
                  value={sendTime}
                  onChange={(e) => setSendTime(e.target.value)}
                  aria-label="Time to send"
                />
              </FormField>
            </div>
          )}
        </div>
      </div>

      {/* Sticky: the preview is the thing being edited, so it stays in view
          while the form above it scrolls. */}
      <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
        <div className="rounded-card border border-border bg-surface p-4">
          <h3 className="text-small font-semibold text-ink">Preview</h3>
          <p className="text-caption text-ink-muted">
            Roughly how it lands on a phone.
          </p>

          <div className="mt-3 rounded-card bg-structure p-3">
            <div className="rounded-control bg-surface p-3 shadow-sm">
              <div className="flex items-center gap-2">
                <span className="flex size-4 items-center justify-center rounded-control bg-brand text-on-action">
                  <Bell className="size-3" aria-hidden="true" />
                </span>
                <span className="text-caption font-medium text-ink-muted">
                  City Family Care
                </span>
                <span className="ml-auto text-caption text-ink-faint">now</span>
              </div>
              <p className="mt-2 break-words text-small font-medium text-ink">
                {title.trim() === "" ? "Notification title" : title}
              </p>
              <p className="mt-1 break-words text-caption text-ink-muted">
                {message.trim() === "" ? "Your message appears here." : message}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2 rounded-card border border-border bg-surface p-4">
          <DetailRow
            label="Going to"
            value={<span className="text-right">{audienceLabel}</span>}
          />
          <DetailRow
            label="Devices"
            value={<span className="tabular">about {formatCount(reach)}</span>}
          />
          <DetailRow
            label="Sends"
            value={
              sendsAt
                ? formatDate(sendsAt, "datetime")
                : schedule === "later"
                  ? "Pick a date"
                  : "Immediately"
            }
          />

          <Button
            variant="primary"
            className="mt-2 w-full"
            onClick={handleSend}
            disabled={!canSend}
          >
            <Send />
            {schedule === "later" ? "Schedule notification" : "Send notification"}
          </Button>

          {!canSend && (
            <p className="text-caption text-ink-faint">
              {title.trim() === "" || message.trim() === ""
                ? "Add a title and a message first."
                : !segmentChosen
                  ? "Choose a segment."
                  : "Pick a date to send on."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

/** The audiences the spec names, in the order they are offered. */
const AUDIENCES = [
  { value: "all", label: "All users" },
  { value: "customers", label: "Customers only" },
  { value: "pros", label: "Pros only" },
  { value: "segment", label: "Specific segment" },
];

/**
 * Combines a picked day with a picked time, in local terms.
 *
 * The same helper the banner scheduler uses: a send set for 6pm goes at 6pm
 * here, not at whatever 18:00 UTC happens to be locally.
 */
function withTime(date: string, time: string): string {
  const [y, mo, d] = date.split("-").map(Number);
  const [h, mi] = time.split(":").map(Number);
  const out = new Date();
  out.setFullYear(y ?? 1970, (mo ?? 1) - 1, d ?? 1);
  out.setHours(h ?? 0, mi ?? 0, 0, 0);
  return out.toISOString();
}

/** A send cannot be scheduled into the past. */
const TODAY_ISO = new Date().toISOString().slice(0, 10);

/**
 * The four events the spec names, each with the message that actually goes
 * out. The spec says "configure", and a pair of on/off switches configures
 * nothing - the template is the part someone needs to get right, because it
 * is what a customer reads.
 */
const ALERTS = [
  {
    id: "booking_confirm",
    label: "Booking confirmed",
    description: "Sent to the customer immediately after payment.",
    template:
      "Hi {name}, your {service} booking is confirmed for {date} at {time}. Your CFC professional will arrive then. Track it in the app.",
  },
  {
    id: "job_assigned",
    label: "Job assigned",
    description: "Sent to the pro when a job is auto-assigned or manually assigned.",
    template:
      "New job: {service} at {area} on {date}, {time}. Open the CFC Pro app to accept.",
  },
  {
    id: "otp",
    label: "OTP delivery",
    description: "Sent for login and job-completion verification.",
    template: "{otp} is your CFC verification code. Do not share it with anyone.",
  },
  {
    id: "payout",
    label: "Payout completed",
    description: "Sent to the pro once a payout has been transferred.",
    template:
      "Rs {amount} has been transferred to your account ending {last4}. Reference {utr}.",
  },
] as const;

/** Admin 46 — WhatsApp / SMS alert configuration. Inventory: configure automated alerts — booking confirm, job assigned, OTP, payout. */
function AlertConfigTab() {
  return (
    <div className="space-y-3">
      <p className="text-small text-ink-muted">
        Automated alerts sent for key events. WhatsApp is client-managed; SMS runs through MSG91.
      </p>
      <div className="space-y-3">
        {ALERTS.map((a) => (
          <AlertRow key={a.id} alert={a} />
        ))}
      </div>
    </div>
  );
}

/**
 * One configurable alert.
 *
 * The template is behind a disclosure: an operator opening this screen is
 * usually turning a channel on or off, and only occasionally editing wording.
 * Showing four textareas at once would bury the switches that get used daily.
 */
function AlertRow({ alert }: { alert: (typeof ALERTS)[number] }) {
  const [sms, setSms] = React.useState(true);
  const [whatsapp, setWhatsapp] = React.useState(true);
  const [open, setOpen] = React.useState(false);
  const [template, setTemplate] = React.useState<string>(alert.template);
  const off = !sms && !whatsapp;

  return (
    <div className="rounded-card border border-border bg-surface">
      <div className="flex flex-wrap items-center justify-between gap-4 p-4">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <p className="text-small font-medium text-ink">{alert.label}</p>
            {/* OTP is not optional - a pro cannot close a job without it. */}
            {alert.id === "otp" && <Badge tone="neutral" dot>Required</Badge>}
          </div>
          <p className="text-caption text-ink-muted">{alert.description}</p>
          {off && (
            <p className="mt-1 text-caption text-critical-ink">
              Both channels are off — this alert will not be sent at all.
            </p>
          )}
        </div>
        <div className="flex shrink-0 items-center gap-4">
          <label className="flex items-center gap-2 text-caption text-ink-muted">
            SMS
            <Switch
              checked={sms}
              onCheckedChange={setSms}
              disabled={alert.id === "otp"}
              aria-label={`${alert.label} over SMS`}
            />
          </label>
          <label className="flex items-center gap-2 text-caption text-ink-muted">
            WhatsApp
            <Switch
              checked={whatsapp}
              onCheckedChange={setWhatsapp}
              aria-label={`${alert.label} over WhatsApp`}
            />
          </label>
        </div>
      </div>

      <div className="border-t border-border px-4 py-3">
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          className="flex items-center gap-1 text-caption font-medium text-action hover:underline"
        >
          {open ? "Hide message" : "Edit message"}
        </button>

        {open && (
          <div className="mt-3 space-y-2">
            <Textarea
              value={template}
              onChange={(e) => setTemplate(e.target.value)}
              rows={3}
              aria-label={`${alert.label} message template`}
            />
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-caption text-ink-faint">
                {"Placeholders in {braces} are filled in when the alert is sent."}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTemplate(alert.template)}
                  disabled={template === alert.template}
                >
                  Reset
                </Button>
                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => toast.success(`Test ${alert.label} sent to your number`)}
                >
                  Send test
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => toast.success(`${alert.label} message saved`)}
                  disabled={template.trim() === ""}
                >
                  Save
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function SupportPage() {
  return (
    <Suspense fallback={<Skeleton className="h-block-lg rounded-card" />}>
      <SupportInner />
    </Suspense>
  );
}
