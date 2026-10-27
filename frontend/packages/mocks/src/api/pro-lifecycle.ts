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
export async function startJob(jobId: string): Promise<ProJob> {
  return fetchJson<ProJob>(`/pro/jobs/${jobId}/start`, { method: "POST" });
}

/**
 * Pro 16, 17 — upload one before or after photo.
 *
 * `stage` is required rather than inferred from the job's status: a pro can
 * legitimately add a before-photo after starting, and guessing from state would
 * file it under the wrong heading. The two sets answer different questions in a
 * dispute — what the pro walked into, and what they left.
 */
export async function uploadJobPhoto(
  jobId: string,
  stage: "before" | "after",
  file: File,
): Promise<{
  stage: "before" | "after";
  url: string;
  beforeCount: number;
  afterCount: number;
}> {
  const form = new FormData();
  form.append("file", file);
  form.append("stage", stage);
  return fetchJson(`/pro/jobs/${jobId}/photos`, { method: "POST", form });
}
