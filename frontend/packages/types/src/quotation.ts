import type { Id, Paise, Timestamp } from "./primitives";

/**
 * Quotation flow: Pro submits → **straight to the customer** → customer
 * accepts → the work starts → the customer pays in full on completion.
 *
 * ## The flow changed, and two gates were removed
 *
 * It used to be: pro submits, **an admin approves within 15 minutes**, then the
 * customer accepts and pays a **50% advance**. Both of those are gone on the
 * client's instruction.
 *
 * - **No approval gate.** A quotation reaches the customer the moment the pro
 *   raises it. The admin's 15 minutes are now an *edit window*: the office can
 *   change the figures or cancel it outright while it runs, and a window that
 *   lapses changes nothing except that they no longer can.
 * - **No advance.** The customer pays the whole amount when the job is
 *   finished, alongside the booking itself.
 *
 * The consequence worth stating: **`customer_accepted` is the lock.** Once the
 * customer has agreed, the figures are frozen even if the admin's window is
 * still open. What the customer saw is what they pay — the alternative is
 * billing someone for a number they never read.
 */

export const QUOTATION_STATUSES = [
  /**
   * With the customer, awaiting their decision.
   *
   * Also the admin's edit window while `decisionBy` is in the future. This
   * used to mean "waiting on the office" and was hidden from the customer
   * entirely; it now means the opposite — it is *their* decision that is
   * outstanding.
   */
  "pending",
  /**
   * @deprecated Legacy. Nothing produces this any more.
   *
   * Kept because quotations approved under the old flow still carry it, and
   * they must stay acceptable rather than becoming unreachable rows. Treated
   * exactly like `pending` everywhere a customer may act.
   */
  "approved",
  /** Cancelled by the office, with a reason. */
  "rejected",
  "customer_accepted",
  "customer_declined",
] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export const QUOTATION_STATUS_LABEL: Record<QuotationStatus, string> = {
  // Not "Pending review" — nobody is reviewing it. The customer is deciding.
  pending: "With the customer",
  approved: "Approved",
  rejected: "Cancelled by office",
  customer_accepted: "Customer accepted",
  customer_declined: "Customer declined",
};

export interface QuotationMaterialLine {
  description: string;
  costPaise: Paise;
}

export interface QuotationListItem {
  id: Id;
  jobRef: string;
  proName: string;
  customerName: string;
  serviceName: string;
  totalPaise: Paise;
  status: QuotationStatus;
  submittedAt: Timestamp;
  /** Minutes remaining in the 15-minute approval window. Null once resolved. */
  minutesRemaining: number | null;
}

export interface QuotationDetail extends QuotationListItem {
  proNotes: string;
  materials: QuotationMaterialLine[];
  laborPaise: Paise;
  beforePhotoUrls: string[];
  customerAreaHistory: number;
  rejectionReason?: string | undefined;

  /**
   * The code the customer reads out so the professional can start the quoted
   * work. Customer-facing projections only — never the pro's.
   *
   * Null until they confirm, and null again once the pro has entered it, so a
   * screenshot taken during the visit is worthless afterwards.
   */
  startOtp?: string | null | undefined;
  /** Whether the pro has entered that code. */
  workStarted?: boolean | undefined;

  /**
   * Whether the office can still change these figures.
   *
   * True only while the quotation is undecided **and** inside the admin's
   * 15-minute edit window. Shown to the customer because approving while it is
   * true is what locks the amount, and that is worth knowing before they tap
   * rather than after.
   */
  officeMayStillEdit?: boolean | undefined;
}
