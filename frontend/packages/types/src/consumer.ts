import type { Id, Paise, Timestamp, Address } from "./primitives";
import type { BookingStatus } from "./booking";

/**
 * Consumer-specific domain types.
 *
 * These shapes are Consumer-only; Admin has no user-facing equivalent.
 * Cart, session, wallet, and auth flows live here.
 */

/** The logged-in customer's own profile. */
export interface ConsumerProfile {
  id: Id;
  name: string;
  /** E.164 format: "+91XXXXXXXXXX". Display-formatted in the UI. */
  phone: string;
  area: string;
  avatarUrl?: string | undefined;
  walletPaise: Paise;
  totalBookings: number;
  joinedAt: Timestamp;
  addresses: Address[];
}

/** Result of a successful OTP send. */
export interface OtpSendResult {
  /** The phone number the OTP was dispatched to. Returned so the UI can confirm. */
  phone: string;
  /** Resend allowed after this many seconds. */
  resendAfterSeconds: number;
}

/** Result of OTP verification. The token is opaque — screens store it in localStorage. */
export interface OtpVerifyResult {
  token: string;
  isNewUser: boolean;
}

/**
 * A customer review of a completed job.
 *
 * Customer 30 gates rating behind OTP confirmation, so every review here is
 * attached to a job the pro actually closed on-site. That is the whole reason
 * these can be shown as social proof rather than as marketing copy.
 *
 * `authorName` is a display name, already shortened for publication
 * ("Priya V."), because a full name plus an area is more identifying than a
 * review needs to be.
 */
export interface Review {
  id: Id;
  authorName: string;
  /** Where the job happened. Shown as context, never as a scope claim. */
  area: string;
  /** 1-5, whole stars. The rating UI does not offer halves. */
  rating: number;
  body: string;
  serviceName: string;
  createdAt: Timestamp;
  /** True once CFC has matched the review to a completed, OTP-closed booking. */
  verified: boolean;
}

/**
 * A booking, as the customer who placed it sees it.
 *
 * Deliberately not `BookingListItem`. That shape leads with `customerName`,
 * which is the viewer here and so tells them nothing, and it carries none of
 * what a customer actually needs: who is coming, how they are rated, how to
 * reach them, and the code that closes the job.
 *
 * Covers Customer 25 through 29 — the list, the detail, live tracking, work in
 * progress, and the in-progress OTP — so one fetch serves the whole set rather
 * than each screen widening the type again.
 */
export interface ConsumerBooking {
  id: Id;
  /** What a customer quotes on the phone, e.g. CFC12345678. */
  reference: string;
  serviceName: string;
  variantName: string | null;
  status: BookingStatus;
  scheduledAt: Timestamp;
  /** Where the job is. The customer's own address at the time of booking. */
  address: Address;
  totalPaise: Paise;
  /** How they paid, for the invoice. */
  paymentMethod: "upi" | "card" | "wallet" | "cash";

  /** Null until a professional accepts. Auto-assign offers to three at once. */
  pro: {
    /** Links to the public profile, Customer 13. */
    id: Id;
    name: string;
    phone: string;
    rating: number;
    jobsCompleted: number;
  } | null;

  /**
   * The code the customer shows the pro to close the job. Customer 29.
   *
   * Present only once a pro is on the way — there is nothing to show before
   * that, and a code visible for days is a code that leaks.
   */
  completionOtp: string | null;

  /** Minutes until arrival, once a pro is travelling. Customer 27. */
  etaMinutes: number | null;

  /** Where the pro is, as canvas percentages for `MapView`. Customer 27. */
  proPosition: { x: number; y: number } | null;

  /** Customer 28 — proof of work, before and after. */
  beforePhotoUrls: string[];
  afterPhotoUrls: string[];

  /** Status history, newest last. Customer 27's timeline. */
  events: { at: Timestamp; label: string }[];

  /** Set once the customer has rated it, so Customer 30 is offered only once. */
  rated: boolean;
}

/**
 * A professional, as a customer sees them. Customer 13.
 *
 * Deliberately **not** `ProDetail`. That shape carries the pro's bank account
 * last four, IFSC, UPI id, total earnings, pending payout and warning count —
 * a professional's financial record and disciplinary history. None of it is a
 * customer's business, and handing the whole object to a consumer screen would
 * leak it the moment someone opened the network tab.
 *
 * This is the deliberate subset: who they are, what they do, and whether they
 * are any good. `phone` is absent too — a customer reaches a pro through their
 * own booking, not from a public profile.
 */
export interface PublicPro {
  id: Id;
  name: string;
  photoUrl: string | null;
  bio: string;
  /** The skill tags the inventory asks for. */
  services: string[];
  area: string;
  rating: number;
  jobsCompleted: number;
  experienceYears: number;
  /** True once KYC has cleared. Drives the verified badge. */
  verified: boolean;
  joinedAt: Timestamp;
}

/**
 * One line in the customer's wallet. Customer 36, 37.
 *
 * Deliberately not the pro `WalletEntry`, which is payout-shaped: it carries a
 * `proId`, penalties, and the CFC commission taken from a job. A customer's
 * ledger is the other side of the business — money they put in, money a
 * booking took out, and money refunded.
 *
 * `amountPaise` is signed. A credit is positive, a debit negative, so a
 * running balance is a sum rather than a switch on `kind` — the arithmetic
 * cannot disagree with the label.
 */
export interface WalletTransaction {
  id: Id;
  kind: "topup" | "booking" | "refund" | "cashback" | "referral";
  /** What it was for. A booking reference, or a short description. */
  label: string;
  /** Positive credits the wallet, negative debits it. */
  amountPaise: Paise;
  at: Timestamp;
  /** The booking this line relates to, where there is one. */
  bookingReference?: string | undefined;
  /** Balance immediately after this line, so a statement reconciles. */
  balanceAfterPaise: Paise;
  status: "completed" | "pending" | "failed";
}

/**
 * Refer and earn. Customer 38.
 *
 * `rewardPerReferralPaise` and `minimumBookingPaise` are terms the client has
 * to set — see CONSUMER-OPEN-ITEMS. They live in the type rather than being
 * hardcoded on the screen so a single value change updates every mention.
 */
export interface ReferralProgramme {
  code: string;
  /** A full URL, ready to share. */
  shareUrl: string;
  rewardPerReferralPaise: Paise;
  /** What the friend has to spend before the reward pays out. */
  minimumBookingPaise: Paise;
  /** People who used the code, whether or not they have booked yet. */
  invited: number;
  /** Invited people who completed a qualifying booking. */
  converted: number;
  /** Total earned so far, already credited to the wallet. */
  earnedPaise: Paise;
}

/**
 * One notification. Customer 39.
 *
 * `kind` is the four categories the inventory names, and it drives both the
 * filter tabs and the icon — so a category cannot exist in one place and not
 * the other.
 *
 * `href` is where tapping it goes. A notification that opens nothing is worse
 * than no notification: it tells a customer something happened and then leaves
 * them to find it.
 */
export interface AppNotification {
  id: Id;
  kind: "booking" | "quotation" | "offer" | "reminder";
  title: string;
  body: string;
  at: Timestamp;
  read: boolean;
  /** Where this leads. Null only for something with nowhere to go. */
  href: string | null;
}
