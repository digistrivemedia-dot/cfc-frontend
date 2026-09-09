import type { Id, Paise } from "./primitives";

/**
 * Pro 26–29 — the pro's own profile, services and schedule.
 *
 * The shapes here are shaped by one fact from the agreement: **the admin owns
 * the catalogue and its pricing.** "All categories, sub-categories, services
 * and pricing are created and managed entirely by the Admin. Nothing is
 * hardcoded."
 *
 * That decides what Pro 28 can be. The inventory asks for "services offered,
 * pricing per service, enable/disable toggle", which reads as though a pro sets
 * their own rates — and they do not. So the rate is carried here as a
 * **read-only** figure with its source named, and the only thing a pro controls
 * is whether they are currently taking that work. A screen offering an editable
 * price field that silently cannot save would be worse than one that explains
 * who sets it.
 */

/**
 * One service a pro is approved for.
 *
 * `ratePaise` is what the customer pays, set by the admin. `netPaise` is what
 * the pro keeps after commission — shown alongside, because a pro comparing
 * two services cares about the second number and the platform has no reason to
 * make them work it out.
 */
export interface ProService {
  serviceId: Id;
  serviceName: string;
  categoryName: string;
  /** Admin-set. The pro cannot change it. */
  ratePaise: Paise;
  /** What the pro keeps on a job at that rate, after CFC's commission. */
  netPaise: Paise;
  /** The pro's own switch: are they taking this work at the moment. */
  enabled: boolean;
  /** Jobs done in this service. Context for whether to keep it on. */
  jobsCompleted: number;
}

/**
 * A pro's week. Pro 29.
 *
 * Seven days, each either off or a window. Deliberately one window per day
 * rather than arbitrary many: a pro working 9–1 and 4–8 is real, but the
 * complexity of arbitrary ranges buys little against a schedule the dispatch
 * system only uses to decide whether to alert someone, and a simpler shape is
 * one a pro can actually keep accurate.
 */
export const WEEKDAYS = [
  "mon",
  "tue",
  "wed",
  "thu",
  "fri",
  "sat",
  "sun",
] as const;
export type Weekday = (typeof WEEKDAYS)[number];

export const WEEKDAY_LABEL: Record<Weekday, string> = {
  mon: "Monday",
  tue: "Tuesday",
  wed: "Wednesday",
  thu: "Thursday",
  fri: "Friday",
  sat: "Saturday",
  sun: "Sunday",
};

/** Three letters, for the desktop grid's column headers. */
export const WEEKDAY_SHORT: Record<Weekday, string> = {
  mon: "Mon",
  tue: "Tue",
  wed: "Wed",
  thu: "Thu",
  fri: "Fri",
  sat: "Sat",
  sun: "Sun",
};

export interface DayAvailability {
  day: Weekday;
  working: boolean;
  /** 24-hour "HH:MM". Ignored when `working` is false. */
  from: string;
  to: string;
}

/**
 * The whole schedule, plus holiday mode.
 *
 * Holiday mode is separate from setting all seven days off, and the difference
 * matters: a pro going away for a week should not have to clear their schedule
 * and then rebuild it from memory when they return. It suspends the week
 * without destroying it.
 */
export interface ProAvailability {
  days: DayAvailability[];
  holidayMode: boolean;
  /** When holiday mode ends. Null means indefinite. */
  holidayUntil: string | null;
}

/** What Pro 27 can change. Everything absent from here is admin-owned. */
export interface ProProfileEdit {
  bio: string;
  experienceYears: number;
  /** The areas the pro will travel to. */
  areas: string[];
  phone: string;
  upiId: string | null;
}
