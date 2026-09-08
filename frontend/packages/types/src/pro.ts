import type { Id, Paise, Timestamp } from "./primitives";

/**
 * Pro shapes for Admin 11–18 (pro management), Admin 4–5 (quotations reference
 * a pro), and Admin 9–10 (map, assignment).
 */

export const PRO_APPROVAL_STATUSES = [
  "pending",
  "approved",
  "rejected",
] as const;
export type ProApprovalStatus = (typeof PRO_APPROVAL_STATUSES)[number];

export const PRO_APPROVAL_LABEL: Record<ProApprovalStatus, string> = {
  pending: "Pending review",
  approved: "Approved",
  rejected: "Rejected",
};

export interface ProListItem {
  id: Id;
  name: string;
  photoUrl: string | null;
  phone: string;
  services: string[];
  area: string;
  online: boolean;
  rating: number;
  jobsCompleted: number;
  approvalStatus: ProApprovalStatus;
  blocked: boolean;
  joinedAt: Timestamp;
  /** Present on the list so Admin 16 (pro wallet) needs no per-row detail fetch. */
  pendingPayoutPaise: Paise;
}

export type DocumentType = "aadhaar_front" | "aadhaar_back" | "pan" | "selfie";

export const DOCUMENT_TYPE_LABEL: Record<DocumentType, string> = {
  aadhaar_front: "Aadhaar (front)",
  aadhaar_back: "Aadhaar (back)",
  pan: "PAN card",
  selfie: "Selfie",
};

export const DOCUMENT_STATUSES = ["pending", "approved", "rejected"] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];

export interface ProDocument {
  type: DocumentType;
  imageUrl: string;
  status: DocumentStatus;
  rejectionReason?: string | undefined;
}

export interface ProDetail extends ProListItem {
  bio: string;
  experienceYears: number;
  bankAccountLast4: string;
  ifsc: string;
  upiId: string | null;
  documents: ProDocument[];
  totalEarnedPaise: Paise;
  pendingPayoutPaise: Paise;
  warningCount: number;
}

export interface ProWarning {
  id: Id;
  proId: Id;
  proName: string;
  reason: string;
  penaltyPaise: Paise;
  issuedAt: Timestamp;
  issuedBy: string;
}

export interface Payout {
  id: Id;
  proId: Id;
  proName: string;
  amountPaise: Paise;
  method: "bank" | "upi";
  destinationLast4: string;
  requestedAt: Timestamp;
  status: "pending" | "approved" | "paid" | "failed";
}

/**
 * One line in a pro's wallet. Admin 16 — "job-wise credits".
 *
 * A credit is what a completed job put into the wallet, already net of the CFC
 * fee, so the pro and the admin are reading the same number. A debit is a
 * penalty or a manual correction. A payout is money leaving the wallet.
 */
export interface WalletEntry {
  id: Id;
  proId: Id;
  kind: "credit" | "penalty" | "adjustment" | "payout";
  /** Booking reference for a credit, otherwise a short description. */
  label: string;
  /** Positive for a credit, negative for anything that reduces the balance. */
  amountPaise: Paise;
  at: Timestamp;
  /** Gross job value before the CFC fee. Credits only. */
  grossPaise?: Paise | undefined;
  /** CFC commission taken from the gross. Credits only. */
  feePaise?: Paise | undefined;
}
