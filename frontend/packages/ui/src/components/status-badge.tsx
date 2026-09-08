import {
  BOOKING_STATUS_LABEL,
  PRO_APPROVAL_LABEL,
  QUOTATION_STATUS_LABEL,
  type BookingStatus,
  type DocumentStatus,
  type ProApprovalStatus,
  type QuotationStatus,
  type RefundStatus,
  type TicketPriority,
  type TicketStatus,
  type TransactionStatus,
} from "@cfc/types";
import { Badge, type BadgeProps } from "../primitives/badge";

/**
 * Every status → tone mapping in the product, in one file.
 *
 * Status colours are never re-mapped per screen. If a failed transaction is
 * critical here, it is critical on every screen that shows one. Before this
 * file existed, only bookings had a shared mapping and every other screen chose
 * its own tones inline — which is exactly how the same status ends up coloured
 * two different ways on two different screens.
 *
 * The discipline, applied uniformly below:
 *
 *   neutral + filled dot    an active, settled state — approved, online,
 *                           in progress, paid
 *   neutral + hollow dot    an inactive or terminal state — offline, closed,
 *                           cancelled, rejected
 *   live                    something is happening right now, and only that
 *   clock                   a countdown is running against this record
 *   critical                money was lost or access was revoked
 *
 * Most rows come out neutral. That is the point: the two or three rows that do
 * carry colour are then genuinely findable at a glance.
 */

type Tone = NonNullable<BadgeProps["tone"]>;
type Dot = BadgeProps["dot"];
type Spec = { tone: Tone; dot: Dot };

// Bookings -------------------------------------------------------------------
const BOOKING: Record<BookingStatus, Spec> = {
  pending: { tone: "neutral", dot: "hollow" },
  assigned: { tone: "neutral", dot: true },
  // The one state an operator scans a live board for.
  in_progress: { tone: "live", dot: true },
  completed: { tone: "neutral", dot: true },
  cancelled: { tone: "neutral", dot: "hollow" },
};

export function BookingStatusBadge({ status }: { status: BookingStatus }) {
  const { tone, dot } = BOOKING[status];
  return (
    <Badge tone={tone} dot={dot}>
      {BOOKING_STATUS_LABEL[status]}
    </Badge>
  );
}

// Pro approval ---------------------------------------------------------------
const PRO_APPROVAL: Record<ProApprovalStatus, Spec> = {
  // Pending review is a queue position, not a problem. The queue length is what
  // deserves attention, and that belongs on a KPI, not on every row.
  pending: { tone: "neutral", dot: "hollow" },
  approved: { tone: "neutral", dot: true },
  rejected: { tone: "neutral", dot: "hollow" },
};

export function ProApprovalBadge({ status }: { status: ProApprovalStatus }) {
  const { tone, dot } = PRO_APPROVAL[status];
  return (
    <Badge tone={tone} dot={dot}>
      {PRO_APPROVAL_LABEL[status]}
    </Badge>
  );
}

/**
 * Availability is the exception that earns green: it is live, it changes
 * minute to minute, and it is the single thing an operator dispatching a job
 * needs to see without reading.
 */
export function ProAvailabilityBadge({ online }: { online: boolean }) {
  return online ? (
    <Badge tone="live" dot>
      Online
    </Badge>
  ) : (
    <Badge tone="neutral" dot="hollow">
      Offline
    </Badge>
  );
}

/** Blocked is access revoked. It is always critical, and it always shows. */
export function ProBlockedBadge() {
  return (
    <Badge tone="critical" dot>
      Blocked
    </Badge>
  );
}

// Documents ------------------------------------------------------------------
const DOCUMENT: Record<DocumentStatus, Spec> = {
  pending: { tone: "neutral", dot: "hollow" },
  approved: { tone: "neutral", dot: true },
  rejected: { tone: "critical", dot: true },
};

const DOCUMENT_LABEL: Record<DocumentStatus, string> = {
  pending: "Not reviewed",
  approved: "Verified",
  rejected: "Rejected",
};

export function DocumentStatusBadge({ status }: { status: DocumentStatus }) {
  const { tone, dot } = DOCUMENT[status];
  return (
    <Badge tone={tone} dot={dot}>
      {DOCUMENT_LABEL[status]}
    </Badge>
  );
}

// Quotations -----------------------------------------------------------------
const QUOTATION: Record<QuotationStatus, Spec> = {
  pending: { tone: "neutral", dot: "hollow" },
  approved: { tone: "neutral", dot: true },
  rejected: { tone: "neutral", dot: "hollow" },
  customer_accepted: { tone: "neutral", dot: true },
  customer_declined: { tone: "neutral", dot: "hollow" },
};

export function QuotationStatusBadge({ status }: { status: QuotationStatus }) {
  const { tone, dot } = QUOTATION[status];
  return (
    <Badge tone={tone} dot={dot}>
      {QUOTATION_STATUS_LABEL[status]}
    </Badge>
  );
}

/**
 * The SLA clock, per SRS 3.2 — a quote must be actioned within fifteen minutes.
 *
 * This is the canonical use of amber: a countdown running against a record.
 * Under three minutes it becomes critical, because at that point the window is
 * about to be missed rather than merely running.
 */
export function SlaClockBadge({
  minutesRemaining,
}: {
  minutesRemaining: number | null;
}) {
  if (minutesRemaining === null) {
    return <span className="text-ink-faint">—</span>;
  }
  if (minutesRemaining <= 0) {
    return (
      <Badge tone="critical" dot>
        Overdue
      </Badge>
    );
  }
  return (
    <Badge tone={minutesRemaining <= 3 ? "critical" : "clock"} dot>
      <span className="tabular">{minutesRemaining} min</span>
    </Badge>
  );
}

// Transactions ---------------------------------------------------------------
const TRANSACTION: Record<TransactionStatus, Spec> = {
  success: { tone: "neutral", dot: true },
  pending: { tone: "neutral", dot: "hollow" },
  // Money that did not arrive.
  failed: { tone: "critical", dot: true },
  // Money that went back out. Not an error, but it moves the ledger.
  refunded: { tone: "clock", dot: true },
};

const TRANSACTION_LABEL: Record<TransactionStatus, string> = {
  success: "Paid",
  pending: "Pending",
  failed: "Failed",
  refunded: "Refunded",
};

export function TransactionStatusBadge({
  status,
}: {
  status: TransactionStatus;
}) {
  const { tone, dot } = TRANSACTION[status];
  return (
    <Badge tone={tone} dot={dot}>
      {TRANSACTION_LABEL[status]}
    </Badge>
  );
}

// Payouts --------------------------------------------------------------------
export type PayoutStatus = "pending" | "approved" | "paid" | "failed";

const PAYOUT: Record<PayoutStatus, Spec> = {
  pending: { tone: "neutral", dot: "hollow" },
  approved: { tone: "neutral", dot: true },
  paid: { tone: "neutral", dot: true },
  failed: { tone: "critical", dot: true },
};

const PAYOUT_LABEL: Record<PayoutStatus, string> = {
  pending: "Awaiting approval",
  approved: "Approved",
  paid: "Paid",
  failed: "Transfer failed",
};

export function PayoutStatusBadge({ status }: { status: PayoutStatus }) {
  const { tone, dot } = PAYOUT[status];
  return (
    <Badge tone={tone} dot={dot}>
      {PAYOUT_LABEL[status]}
    </Badge>
  );
}

// Refunds --------------------------------------------------------------------
const REFUND: Record<RefundStatus, Spec> = {
  requested: { tone: "neutral", dot: "hollow" },
  approved: { tone: "neutral", dot: true },
  rejected: { tone: "neutral", dot: "hollow" },
  paid: { tone: "neutral", dot: true },
};

const REFUND_LABEL: Record<RefundStatus, string> = {
  requested: "Requested",
  approved: "Approved",
  rejected: "Rejected",
  paid: "Refunded",
};

export function RefundStatusBadge({ status }: { status: RefundStatus }) {
  const { tone, dot } = REFUND[status];
  return (
    <Badge tone={tone} dot={dot}>
      {REFUND_LABEL[status]}
    </Badge>
  );
}

// Support tickets ------------------------------------------------------------
const TICKET: Record<TicketStatus, Spec> = {
  open: { tone: "neutral", dot: "hollow" },
  in_progress: { tone: "live", dot: true },
  resolved: { tone: "neutral", dot: true },
  closed: { tone: "neutral", dot: "hollow" },
};

const TICKET_LABEL: Record<TicketStatus, string> = {
  open: "Open",
  in_progress: "Being handled",
  resolved: "Resolved",
  closed: "Closed",
};

export function TicketStatusBadge({ status }: { status: TicketStatus }) {
  const { tone, dot } = TICKET[status];
  return (
    <Badge tone={tone} dot={dot}>
      {TICKET_LABEL[status]}
    </Badge>
  );
}

/**
 * Priority is set by a human and is a claim about urgency, so only the top of
 * the scale spends colour. A board where every ticket is amber tells an agent
 * nothing.
 */
const TICKET_PRIORITY: Record<TicketPriority, Spec> = {
  low: { tone: "neutral", dot: "hollow" },
  medium: { tone: "neutral", dot: true },
  high: { tone: "critical", dot: true },
};

const TICKET_PRIORITY_LABEL: Record<TicketPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export function TicketPriorityBadge({
  priority,
}: {
  priority: TicketPriority;
}) {
  const { tone, dot } = TICKET_PRIORITY[priority];
  return (
    <Badge tone={tone} dot={dot}>
      {TICKET_PRIORITY_LABEL[priority]}
    </Badge>
  );
}
