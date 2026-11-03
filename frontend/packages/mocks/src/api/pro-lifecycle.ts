import type { ProJob } from "@cfc/types";
import { fetchJson } from "../http";

/**
 * Pro 15–17 — starting work, and the proof-of-work photos.
 *
 * Live-only. There is nothing for "the pro has arrived" to fall back to, and a
 * local-only transition would show the pro a job in progress while the customer
 * still saw "professional assigned".
 */

/** Pro 15 — arrived on site. `assigned → in_progress`. */
/**
 * Pro 15 — the pro has arrived and the customer has read out the start code.
 *
 * **The code is the gate.** A job used to start on the pro tapping "I'm Here",
 * so nothing connected the clock starting to the customer actually being there
 * and agreeing. Four digits, held only by the customer, compared by the server
 * — the pro never receives it, so there is nothing to read out of a response.
 *
 * A wrong code comes back as a 400 with `WRONG_OTP`, distinct from a bad state
 * transition, so the screen can mark the field instead of claiming the job
 * cannot be started.
 */
export async function startJob(jobId: string, otp: string): Promise<ProJob> {
  return fetchJson<ProJob>(`/pro/jobs/${jobId}/start`, {
    method: "POST",
    body: { otp },
  });
}

/**
 * Pro 16, 17 — upload one before or after photo.
 *
 * `stage` is required rather than inferred from the job's status: a pro can
 * legitimately add a before-photo after starting, and guessing from state would
 * file it under the wrong heading. The two sets answer different questions in a
 * dispute — what the pro walked into, and what they left.
 */
export interface JobMediaResult {
  stage: "before" | "after";
  url: string;
  /** So the screen renders a player rather than a broken `<img>`. */
  kind: "image" | "video";
  bytes: number;
  beforeCount: number;
  afterCount: number;
}

/**
 * Uploads one piece of job proof — a photo **or** a video.
 *
 * Still one endpoint and one control: which of the two the pro picked is the
 * file's business, not a different call's. The server checks the magic bytes
 * rather than the extension, and enforces two different budgets — 20 MB for
 * all of a job's images together, 60 MB for a single video.
 *
 * Those limits are returned as readable messages naming the sizes involved,
 * because "too large" tells a pro nothing about which file to drop when they
 * are several in.
 */
export async function uploadJobMedia(
  jobId: string,
  stage: "before" | "after",
  file: File,
): Promise<JobMediaResult> {
  const form = new FormData();
  form.append("file", file);
  form.append("stage", stage);
  return fetchJson(`/pro/jobs/${jobId}/photos`, { method: "POST", form });
}

/** @deprecated Use `uploadJobMedia`, which also accepts video. */
export const uploadJobPhoto = uploadJobMedia;
