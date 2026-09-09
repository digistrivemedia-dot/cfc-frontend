import type { DocumentType, ProApprovalStatus } from "@cfc/types";
import { pros } from "../fixtures/pros";
import { services } from "../fixtures/catalog";
import { applyScenario, latency } from "../control";

/**
 * Pro 2–9 — registration through KYC approval.
 *
 * The pro-side counterpart to `consumer-auth`, and deliberately separate: a
 * customer signs in and is immediately usable, while a pro signs up and then
 * **waits for a human to approve them.** That gap is the whole shape of this
 * flow, and it is why `registerPro` returns a pending status rather than a
 * session.
 */

/** The OTP length. Six, matching the consumer flow and MSG91's default. */
export const PRO_OTP_LENGTH = 6;

/** How long before "Resend code" becomes available. */
export const OTP_RESEND_SECONDS = 30;

export async function sendProOtp(
  phone: string,
): Promise<{ phone: string; resendAfterSeconds: number }> {
  await latency();
  return applyScenario({ phone, resendAfterSeconds: OTP_RESEND_SECONDS });
}

/**
 * Verify the code.
 *
 * Any six digits pass in the mock. `isNewPro` is what decides where the flow
 * goes next — a returning pro who abandoned onboarding should resume it, not
 * start again, and a fully registered one goes to the app.
 */
export async function verifyProOtp(
  phone: string,
  code: string,
): Promise<{ token: string; isNewPro: boolean }> {
  await latency();
  if (code.length !== PRO_OTP_LENGTH) {
    throw new Error(`Enter the ${PRO_OTP_LENGTH}-digit code.`);
  }
  return applyScenario({
    token: `mock_pro_token_${phone}_${Date.now()}`,
    isNewPro: true,
  });
}

/** What Pro 3 collects. */
export interface ProRegistration {
  name: string;
  phone: string;
  /** Service names from the catalogue, not free text. */
  services: string[];
  area: string;
}

/**
 * Pro 3 — register.
 *
 * Returns the id of the created record and a **pending** approval status. There
 * is no session token here on purpose: an unapproved pro has nothing to sign
 * in to, and issuing one would let them reach screens that assume approval.
 */
export async function registerPro(
  _input: ProRegistration,
): Promise<{ proId: string; approvalStatus: ProApprovalStatus }> {
  await latency();
  return {
    proId: `pro_new_${Date.now()}`,
    approvalStatus: "pending",
  };
}

/** Pro 5 — the profile a pro sets up before review. */
export interface ProProfileSetup {
  photo: boolean;
  skills: string[];
  experienceYears: number;
  areas: string[];
}

export async function saveProfileSetup(
  _proId: string,
  setup: ProProfileSetup,
): Promise<ProProfileSetup> {
  await latency();
  return setup;
}

/**
 * The documents CFC requires, in the order Pro 6 asks for them.
 *
 * Straight from the inventory: "Aadhaar front/back, PAN, bank details, selfie".
 * Bank details are their own screen (Pro 7) because they are typed rather than
 * photographed, so the four here are the image uploads.
 */
export const REQUIRED_DOCUMENTS: {
  type: DocumentType;
  label: string;
  hint: string;
}[] = [
  {
    type: "aadhaar_front",
    label: "Aadhaar — front",
    hint: "The side with your photo and Aadhaar number. All four corners in frame.",
  },
  {
    type: "aadhaar_back",
    label: "Aadhaar — back",
    hint: "The side with your address.",
  },
  {
    type: "pan",
    label: "PAN card",
    hint: "Needed for your payouts and tax records.",
  },
  {
    type: "selfie",
    label: "Selfie",
    hint: "A clear photo of your face in good light. It is matched against your Aadhaar.",
  },
];

export async function uploadDocument(
  _proId: string,
  type: DocumentType,
): Promise<{ type: DocumentType; status: "pending" }> {
  await latency();
  // Always pending: a document is approved by a human reviewing it, and
  // returning "approved" here would teach the screen a lie about the flow.
  return { type, status: "pending" };
}

/** Pro 7 — where payouts go. */
export interface BankDetails {
  accountName: string;
  accountNumber: string;
  ifsc: string;
  upiId: string | null;
}

/**
 * IFSC format: four letters, a zero, then six alphanumerics.
 *
 * Worth validating client-side because a wrong IFSC means a failed transfer
 * days later rather than an error now, and the pro is the one left chasing it.
 */
export function isValidIfsc(value: string): boolean {
  return /^[A-Z]{4}0[A-Z0-9]{6}$/.test(value.toUpperCase());
}

/** Indian account numbers run 9–18 digits depending on the bank. */
export function isValidAccountNumber(value: string): boolean {
  return /^\d{9,18}$/.test(value);
}

/** `name@handle`, the UPI VPA shape. */
export function isValidUpi(value: string): boolean {
  return /^[\w.\-]{2,}@[a-zA-Z]{2,}$/.test(value);
}

export async function saveBankDetails(
  _proId: string,
  details: BankDetails,
): Promise<BankDetails> {
  await latency();
  return details;
}

/** Pro 8 — accepting the Code of Conduct. Recorded with a timestamp. */
export async function acceptTerms(
  _proId: string,
): Promise<{ acceptedAt: string }> {
  await latency();
  return { acceptedAt: new Date().toISOString() };
}

/**
 * Pro 9 — where the KYC review has got to.
 *
 * Reads the pro's real record, so signing in as `pro_0010` (pending) or
 * `pro_0011` (rejected) demonstrates each state without a special mode.
 */
export interface ApprovalState {
  status: ProApprovalStatus;
  /** Per-document review state, so a rejection names what to re-upload. */
  documents: {
    type: DocumentType;
    label: string;
    status: "pending" | "approved" | "rejected";
    rejectionReason: string | null;
  }[];
  submittedAt: string;
}

export async function getApprovalState(
  proId: string,
): Promise<ApprovalState | null> {
  await latency();

  const pro = pros.find((p) => p.id === proId);
  if (!pro) return applyScenario(null, null);

  const labelFor = (type: DocumentType) =>
    REQUIRED_DOCUMENTS.find((d) => d.type === type)?.label ?? type;

  return applyScenario(
    {
      status: pro.approvalStatus,
      documents: pro.documents.map((d) => ({
        type: d.type,
        label: labelFor(d.type),
        status: d.status,
        rejectionReason: d.rejectionReason ?? null,
      })),
      submittedAt: pro.joinedAt,
    },
    null,
  );
}

/**
 * The services a pro can register for.
 *
 * From the catalogue, because the admin owns it. A registration form with free
 * text would let a pro register for "AC repair" against a catalogue entry named
 * "AC service & repair", and nothing would ever match them to a job.
 */
export async function getRegisterableServices(): Promise<
  { id: string; name: string; categoryName: string }[]
> {
  await latency();
  const rows = services
    .filter((s) => s.active)
    .map((s) => ({
      id: s.id,
      name: s.name,
      categoryName: s.categoryName,
    }));
  return applyScenario(rows, []);
}
