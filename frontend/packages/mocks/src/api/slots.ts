import type { Slot } from "@cfc/types";
import { applyScenario, latency } from "../control";

/**
 * Customer 15 — arrival windows for one service on one day.
 *
 * Two-hour windows from 08:00 to 20:00. Availability is derived, not random,
 * so the screen behaves the way a real booking system does:
 *
 *   A window that has already started today is never offered. This is the
 *   thing a customer notices immediately if it is wrong.
 *
 *   Today is thinner than later in the week — pros are already committed. A
 *   grid where every slot is free makes the "no slots left" state impossible
 *   to see during review.
 *
 *   Evenings go first, because that is when people are home.
 *
 * The pattern is seeded on the date so a given day always returns the same
 * grid: a slot that disappears on re-render looks like a bug.
 */

const START_HOUR = 8;
const END_HOUR = 20;
const WINDOW_MINUTES = 120;

/** Stable per-day pseudo-randomness, so the same date gives the same grid. */
function dayHash(date: Date): number {
  const key =
    date.getFullYear() * 10_000 + (date.getMonth() + 1) * 100 + date.getDate();
  let h = key % 2_147_483_647;
  h = (h * 48_271) % 2_147_483_647;
  return h;
}

export async function getSlots(serviceId: string, isoDate: string) {
  await latency();

  const day = new Date(isoDate);
  const now = new Date();
  const isToday = day.toDateString() === now.toDateString();
  const daysAhead = Math.round(
    (new Date(day.toDateString()).getTime() -
      new Date(now.toDateString()).getTime()) /
      86_400_000,
  );

  const seed = dayHash(day) + serviceId.length;
  const slots: Slot[] = [];

  for (let hour = START_HOUR; hour < END_HOUR; hour += WINDOW_MINUTES / 60) {
    const startsAt = new Date(day);
    startsAt.setHours(hour, 0, 0, 0);

    // A window already under way cannot be booked.
    const started = isToday && startsAt.getTime() <= now.getTime();

    // Later in the week is emptier; evenings fill first.
    const evening = hour >= 16;
    const pressure = daysAhead <= 0 ? 0.55 : daysAhead === 1 ? 0.3 : 0.15;
    const taken = ((seed + hour * 7) % 100) / 100 < pressure + (evening ? 0.15 : 0);

    slots.push({
      startsAt: startsAt.toISOString(),
      durationMinutes: WINDOW_MINUTES,
      available: !started && !taken,
    });
  }

  return applyScenario(slots, []);
}
