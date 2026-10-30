import type { DocumentType, ProApprovalStatus, ProWarning } from "@cfc/types";
import { fetchJson, fetchObjectUrl, type ObjectUrl } from "../http";

/**
 * Admin 13–15 — the KYC queue and blocking.
 *
 * **None of these existed.** `ADMIN-SUMMARY.md` recorded the admin app as 100%
 * read-only, and `pros/page.tsx:589` was the proof: `decide()` filtered a row
 * out of local state and showed a toast. A pro "approved" that way was still
 * pending in every other session, and still receiving no work.
 *
 * Live-only, like the other admin writes — there is nothing for an approval to
 * fall back to, and a toast over an unchanged database is the failure this
 * replaces.
 */

/** Admin 14 — approve or reject one document, so a rejection names which. */
export async function reviewProDocument(
  proId: string,
  type: DocumentType,
  status: "approved" | "rejected",
  reason?: string,
): Promise<{ type: DocumentType; status: string }> {
  return fetchJson(`/admin/pros/${proId}/documents/${type}`, {
    method: "PATCH",
    body: { status, ...(reason !== undefined ? { reason } : {}) },
  });
}

/**
 * Admin 13 — approve the registration.
 *
 * Refused by the server unless all four documents are approved, bank details
 * exist and the conduct has been accepted. The screen disables its button under
 * the same conditions, but a disabled button is not a check — approving a pro
 * whose PAN was never looked at is the whole failure this queue prevents.
 */
export async function approveProKyc(
  proId: string,
): Promise<{ id: string; approvalStatus: ProApprovalStatus }> {
  return fetchJson(`/admin/pros/${proId}/approve`, { method: "POST" });
}

/** A reason is required — a rejection the pro cannot act on is not a decision. */
export async function rejectProKyc(
  proId: string,
  reason: string,
): Promise<{ id: string; approvalStatus: ProApprovalStatus }> {
  return fetchJson(`/admin/pros/${proId}/reject`, {
    method: "POST",
    body: { reason },
  });
}

/**
 * Admin 14 — ask for documents again without rejecting the registration.
 *
 * The middle outcome the queue needs. A blurry Aadhaar is not grounds for
 * rejection; it is grounds for "send that one again". Rejecting outright sends
 * the pro back to re-photograph all four.
 */
export async function requestMoreDocuments(
  proId: string,
  types: DocumentType[],
  reason: string,
): Promise<{ id: string; requested: DocumentType[] }> {
  return fetchJson(`/admin/pros/${proId}/request-documents`, {
    method: "POST",
    body: { types, reason },
  });
}

/**
 * Admin 15 — block or unblock.
 *
 * Gated on `pros.block`, which the agreement does **not** delegate to a sub
 * admin even though `pros.approve_kyc` is. Onboarding someone is delegated;
 * stopping them working is not.
 */
export async function blockPro(
  proId: string,
  reason: string,
): Promise<{ id: string; blocked: boolean }> {
  return fetchJson(`/admin/pros/${proId}/block`, {
    method: "POST",
    body: { reason },
  });
}

export async function unblockPro(
  proId: string,
): Promise<{ id: string; blocked: boolean }> {
  return fetchJson(`/admin/pros/${proId}/unblock`, { method: "POST" });
}

/**
 * Admin 17 — issue a warning, with an optional penalty.
 *
 * `penaltyPaise` is **positive**: the size of the fine. The server writes the
 * matching negative wallet row itself, in the same request, so the discipline
 * record and the pro's balance cannot end up disagreeing about whether money
 * was taken. Pass 0 (or omit) for a warning that carries no deduction — the
 * agreement's escalation path warns before it fines.
 *
 * Gated on `pros.block`, not `pros.approve_kyc`: a sub admin has onboarding
 * delegated to them, and discipline is not delegated.
 */
export async function issueWarning(
  proId: string,
  reason: string,
  penaltyPaise = 0,
): Promise<ProWarning> {
  return fetchJson(`/admin/pros/${proId}/warnings`, {
    method: "POST",
    body: { reason, penaltyPaise },
  });
}

/**
 * Why a pro is or is not receiving offers.
 *
 * Exists so the list can explain an absence instead of leaving an operator to
 * infer it from two separate badges — "approved" and "offline" together mean
 * no work is arriving, and that is not obvious from either one alone. Uses the
 * same predicate the dispatch engine does.
 */
export async function getProDispatchStatus(
  proId: string,
): Promise<{ eligible: boolean; reasons: string[] }> {
  return fetchJson(`/admin/pros/${proId}/dispatch-status`);
}

/**
 * Loads one KYC document for viewing, as an object URL.
 *
 * The approvals screen showed a generic file icon rather than the document —
 * so a reviewer was asked to verify an Aadhaar they could not see. The comment
 * on that screen says it plainly: *"A registration is not approved by looking
 * at a name. The reviewer needs the four documents in front of them."*
 *
 * **Revoke the returned URL when the tile unmounts.**
 */
export async function getProDocumentUrl(
  proId: string,
  type: DocumentType,
): Promise<ObjectUrl> {
  return fetchObjectUrl(`/admin/pros/${proId}/documents/${type}`);
}
