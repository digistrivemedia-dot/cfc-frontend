import type { Id, Paise, Timestamp, Address } from "./primitives";

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
