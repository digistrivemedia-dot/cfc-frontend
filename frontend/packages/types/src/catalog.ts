import type { BasisPoints, Id, Paise } from "./primitives";

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

export interface ServiceDetail extends ServiceListItem {
  description: string;
  imageUrls: string[];
  variants: ServiceVariant[];
  inclusions: string[];
  warrantyDays: number;
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
