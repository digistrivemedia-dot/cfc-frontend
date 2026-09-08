import type { Id, Paise, Timestamp } from "./primitives";

/**
 * Quotation flow: Pro submits → Admin approves within 15 minutes → Customer
 * accepts with 50% advance. Admin 4–5.
 */

export const QUOTATION_STATUSES = [
  "pending",
  "approved",
  "rejected",
  "customer_accepted",
  "customer_declined",
] as const;
export type QuotationStatus = (typeof QUOTATION_STATUSES)[number];

export const QUOTATION_STATUS_LABEL: Record<QuotationStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
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
}
