import type { BasisPoints, Id, Paise, Timestamp } from "./primitives";

/** Admin 22–29 — categories, sub-categories, services, pricing, commission. */

export interface Category {
  id: Id;
  name: string;
  iconName: string;
  description: string;
  sortOrder: number;
  active: boolean;
  serviceCount: number;
}

export interface SubCategory {
  id: Id;
  categoryId: Id;
  categoryName: string;
  name: string;
  iconName: string;
  active: boolean;
}

export interface ServiceListItem {
  id: Id;
  name: string;
  categoryName: string;
  subCategoryName: string;
  basePricePaise: Paise;
  active: boolean;
  bookingCount: number;
  /**
   * Average rating across completed jobs for this service, 0 when none yet.
   *
   * Customer 9 sorts on it, and Customer 12 and 13 display it. Reviews are
   * OTP-gated (Customer 30), so a rating here is backed by jobs a pro actually
   * closed on site rather than by anonymous submissions.
   */
  rating: number;
  /** How many ratings the average is drawn from. Zero is shown as "New". */
  reviewCount: number;
}

/**
 * A bookable option within a service. Admin 27 — "variants".
 *
 * A service is a thing a customer searches for; a variant is what they actually
 * book. "AC service" is the service, "1 ton split" and "2 ton window" are the
 * variants, and they carry different prices and durations.
 *
 * Priced as a DELTA against the service base price rather than absolutely, so
 * changing the base price in Admin 28 moves every variant with it instead of
 * leaving a set of stale absolute numbers behind.
 */
export interface ServiceVariant {
  id: Id;
  name: string;
  /** Added to (or subtracted from) the service base price. */
  priceDeltaPaise: Paise;
  /** Typical time on site, in minutes. Shown to the customer and the pro. */
  durationMinutes: number;
  /** Exactly one variant is the default a customer sees pre-selected. */
  isDefault: boolean;
  active: boolean;
}

/**
 * An optional extra bought alongside the service. Customer 14 — "add-ons".
 *
 * Unlike a variant, an add-on is additive and independent: a customer picks any
 * number of them, or none, and each one is priced absolutely rather than as a
 * delta because it is a separate piece of work, not a different shape of the
 * same job.
 */
export interface ServiceAddOn {
  id: Id;
  name: string;
  /** What the customer gets. One line — this sits under the name in a list. */
  description: string;
  pricePaise: Paise;
  /** Added to the visit's time on site when selected. */
  durationMinutes: number;
  active: boolean;
}

export interface ServiceDetail extends ServiceListItem {
  description: string;
  imageUrls: string[];
  variants: ServiceVariant[];
  addOns: ServiceAddOn[];
  inclusions: string[];
  warrantyDays: number;
}

/**
 * A single row in the search type-ahead dropdown.
 *
 * Deliberately not a `ServiceDetail` or even a `ServiceListItem`: the
 * suggestion list is shown while a customer is still typing, before they have
 * committed to a search, so it needs only enough to render a clickable row —
 * a name to show, a sub-category for context, and an id so picking a
 * suggestion can jump straight to that service instead of running a search
 * for its own name.
 */
export interface ServiceSuggestion {
  id: Id;
  name: string;
  subCategoryName: string;
}

/**
 * Nothing financial is ever hardcoded. Base price, platform fee, visit charge,
 * and night surcharge are all admin-editable per service, with an optional
 * city-wise override.
 */
export interface PricingRule {
  serviceId: Id;
  serviceName: string;
  basePricePaise: Paise;
  platformFeePaise: Paise;
  visitChargePaise: Paise;
  nightSurchargePaise: Paise;
  cityOverride?: { city: string; basePricePaise: Paise } | undefined;
}

export interface CommissionRule {
  id: Id;
  scope: "category" | "pro" | "partner";
  /** Category name, pro name, or partner name depending on `scope`. */
  targetName: string;
  commissionBps: BasisPoints;
  note?: string | undefined;
}

/**
 * A question a customer asks before booking. Customer 12 — "FAQs".
 *
 * Answers are platform policy, not per-service copy, so most services share
 * the same set. `serviceId` is null for a question that applies everywhere,
 * which is the common case.
 */
export interface ServiceFaq {
  id: Id;
  serviceId: Id | null;
  question: string;
  answer: string;
}

/**
 * One bookable arrival window. Customer 15 — "calendar + slot grid, AM/PM".
 *
 * `startsAt` is a full timestamp rather than a time string, so a slot carries
 * its own date and the UI never has to combine the two — the class of bug that
 * makes a booking land on the wrong day.
 */
export interface Slot {
  /** ISO timestamp of the window's start, in the customer's local day. */
  startsAt: Timestamp;
  /** Minutes the window spans. Two hours is the platform default. */
  durationMinutes: number;
  available: boolean;
}
