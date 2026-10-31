import { ApiError } from "@cfc/types";

/**
 * The HTTP boundary.
 *
 * This file is the entire reason the backend swap is cheap. Each function in
 * `api/*.ts` keeps its name, arguments and return type, and gains one line
 * at the top:
 *
 * ```ts
 * if (isLive("getCategories")) return fetchJson<Category[]>("/public/categories");
 * ```
 *
 * No screen changes. A function is either live or still on fixtures, and the
 * app runs either way — which is what lets a stage ship on its own instead of
 * waiting for a single cutover at the end.
 */

const DEFAULT_BASE = "http://localhost:4000/api";

/**
 * Where the API is. Build-time inlined by Next, so it differs per deployment
 * without differing per app.
 */
export const API_BASE = (
  process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_BASE
).replace(/\/$/, "");

/**
 * Which functions talk to the real server.
 *
 * A comma-separated list of function names, or `*` for all of them:
 *
 *   NEXT_PUBLIC_LIVE_APIS=getServiceAreas,getCategories
 *   NEXT_PUBLIC_LIVE_APIS=*
 *
 * Per-function rather than one global switch because a half-migrated system has
 * to be demonstrable. With a single flag, nothing is verifiable in the UI until
 * every endpoint exists; with this, each stage is walked through the real
 * screens as it lands.
 */
const LIVE = new Set(
  (process.env.NEXT_PUBLIC_LIVE_APIS ?? "")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
);

export function isLive(name: string): boolean {
  return LIVE.has("*") || LIVE.has(name);
}

/**
 * The session token.
 *
 * One key, read from whichever storage the app put it in. The three apps are on
 * three origins, so they cannot see each other's storage and one key name is
 * unambiguous — no per-app configuration to keep in sync.
 *
 * `sessionStorage` is checked first: the admin panel deliberately ends its
 * session when the tab closes, and the consumer app deliberately does not, so
 * each app chooses its own storage and this reads both.
 */
const TOKEN_KEY = "cfc.token";

export function getToken(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return (
      window.sessionStorage.getItem(TOKEN_KEY) ??
      window.localStorage.getItem(TOKEN_KEY)
    );
  } catch {
    // Private browsing, or storage blocked. Treated as signed out.
    return null;
  }
}

export function setToken(token: string, persist: "session" | "local"): void {
  if (typeof window === "undefined") return;
  try {
    const store = persist === "local" ? window.localStorage : window.sessionStorage;
    store.setItem(TOKEN_KEY, token);
  } catch {
    // Non-fatal: the session lasts this page's lifetime instead.
  }
}

export function clearToken(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(TOKEN_KEY);
    window.localStorage.removeItem(TOKEN_KEY);
  } catch {
    // Nothing stored to clear.
  }
}

/**
 * The role inside the stored token, or null when there is none.
 *
 * Decodes the JWT payload **without verifying it**, which is safe for the one
 * thing it is used for: choosing which URL to call. The server verifies the
 * signature and enforces every permission, so a tampered role here changes
 * nothing except which endpoint returns a 403.
 *
 * This exists because the first version of `catalogBase()` treated *presence*
 * of a token as "this is the admin app" — which was true until Phase 5 gave
 * customers tokens too, at which point a signed-in customer was routed to the
 * admin catalogue endpoint and got a 403 while simply browsing.
 */
export function tokenRole(): string | null {
  return tokenActor()?.role ?? null;
}

/** Who the stored token says we are. `null` when there is no usable token. */
export interface TokenActor {
  id: string;
  name: string;
  role: string;
}

/**
 * The actor inside the stored token.
 *
 * The server puts `sub`, `name` and `role` in every token it signs, so the id
 * and display name of the signed-in user are **already on the client** — no
 * request needed to show "Murugan" in a navigation rail.
 *
 * That matters because the pro app's shell used to fetch a whole profile on
 * every screen just to read a name, and the call it used was an admin route
 * that answered 403 regardless. A request that cannot succeed, repeated on
 * every navigation, to display something we were already holding.
 *
 * As with `tokenRole`, this decodes **without verifying**, which is safe for
 * what it is used for: choosing a URL and rendering a label. The server
 * verifies the signature and enforces every permission, so a tampered name
 * here changes a word on the screen and nothing else.
 */
export function tokenActor(): TokenActor | null {
  const token = getToken();
  if (!token) return null;

  const payload = token.split(".")[1];
  if (!payload) return null;

  try {
    // base64url -> base64, then decode. `atob` is in every browser and in Node
    // 16+, so no Buffer import that would break the browser bundle.
    const json = atob(payload.replace(/-/g, "+").replace(/_/g, "/"));
    const parsed = JSON.parse(json) as {
      sub?: unknown;
      name?: unknown;
      role?: unknown;
    };
    if (typeof parsed.role !== "string") return null;
    return {
      id: typeof parsed.sub === "string" ? parsed.sub : "",
      name: typeof parsed.name === "string" ? parsed.name : "",
      role: parsed.role,
    };
  } catch {
    // A malformed token is treated as no token: the request goes to the public
    // endpoint, which is the safe direction to fail in.
    return null;
  }
}

/** True when the stored token belongs to one of the three admin roles. */
export function isAdminToken(): boolean {
  const role = tokenRole();
  return role === "super_admin" || role === "sub_admin" || role === "area_admin";
}

/** What the server sends on failure — the `ApiError` fields, as JSON. */
interface ErrorEnvelope {
  status?: number;
  message?: string;
  code?: string;
}

export interface FetchOptions {
  method?: "GET" | "POST" | "PATCH" | "PUT" | "DELETE";
  /** Serialised as JSON. Omit for GET. */
  body?: unknown;
  /** Appended as a query string, skipping undefined and null values. */
  query?: Record<string, string | number | boolean | undefined | null>;
  /** For `FormData` uploads, where the browser must set the content type. */
  form?: FormData;
  signal?: AbortSignal;
}

function buildUrl(path: string, query?: FetchOptions["query"]): string {
  const url = `${API_BASE}${path.startsWith("/") ? path : `/${path}`}`;
  if (!query) return url;

  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    // An absent filter must not become `?status=undefined`, which the server
    // would read as the literal string.
    if (value === undefined || value === null || value === "") continue;
    params.set(key, String(value));
  }
  const qs = params.toString();
  return qs ? `${url}?${qs}` : url;
}

/**
 * One request.
 *
 * Always throws `ApiError` on failure — the same class the mock layer throws,
 * so every error screen already written against it keeps working unchanged.
 * That includes the cases a `fetch` caller usually forgets: a network failure,
 * and a non-JSON response from a proxy or a crashed process, both of which
 * arrive as an `ApiError` rather than a `TypeError` or a parse error.
 */
export async function fetchJson<T>(
  path: string,
  options: FetchOptions = {},
): Promise<T> {
  const { method, body, query, form, signal } = options;
  const token = getToken();

  const headers: Record<string, string> = {};
  if (token) headers["Authorization"] = `Bearer ${token}`;
  // FormData sets its own content type, including the multipart boundary.
  if (body !== undefined && !form) headers["Content-Type"] = "application/json";

  let response: Response;
  try {
    response = await fetch(buildUrl(path, query), {
      method: method ?? (body !== undefined || form ? "POST" : "GET"),
      headers,
      ...(form ? { body: form } : {}),
      ...(body !== undefined && !form ? { body: JSON.stringify(body) } : {}),
      ...(signal ? { signal } : {}),
    });
  } catch (cause) {
    // An aborted request is the caller's own doing — a cancelled fetch on
    // unmount must not surface as "you appear to be offline".
    if (cause instanceof DOMException && cause.name === "AbortError") throw cause;
    throw new ApiError(
      0,
      "Could not reach the server. Check your connection and try again.",
      "NETWORK",
    );
  }

  if (response.status === 204) return undefined as T;

  const text = await response.text();

  let parsed: unknown = undefined;
  if (text) {
    try {
      parsed = JSON.parse(text);
    } catch {
      // A proxy error page or a crash dump, not our envelope. Do not let the
      // raw body reach a screen — it is as likely to be HTML as a message.
      throw new ApiError(
        response.status || 500,
        "The server sent an unexpected response.",
        "BAD_RESPONSE",
      );
    }
  }

  if (!response.ok) {
    const envelope = (parsed ?? {}) as ErrorEnvelope;
    throw new ApiError(
      envelope.status ?? response.status,
      envelope.message ?? "Something went wrong at our end.",
      envelope.code,
    );
  }

  return parsed as T;
}

/** A protected file, fetched into memory. */
export interface ObjectUrl {
  /** Blob URL, for an `<img src>`, an `<iframe>` or a download link. */
  url: string;
  /**
   * What the server actually sent.
   *
   * Returned because the caller cannot otherwise tell a JPEG from a PDF, and a
   * PAN may legitimately be either. Rendering a PDF into an `<img>` produces a
   * broken-image icon over a document that uploaded perfectly well.
   */
  contentType: string;
}

/**
 * Fetches a protected file and returns an object URL for it.
 *
 * KYC documents live behind an authenticated route, so an `<img src>` cannot
 * reach them — a plain tag sends no `Authorization` header. The alternatives
 * were to put the token in the query string, which lands it in server logs and
 * browser history, or to issue signed URLs, which is a second auth mechanism to
 * get right. Fetching the bytes with the header we already have and wrapping
 * them in a blob URL keeps one mechanism.
 *
 * **The caller must `URL.revokeObjectURL` when done**, or every document opened
 * stays in memory for the life of the tab.
 */
export async function fetchObjectUrl(path: string): Promise<ObjectUrl> {
  const token = getToken();
  const response = await fetch(buildUrl(path), {
    headers: token ? { Authorization: `Bearer ${token}` } : {},
  });

  if (!response.ok) {
    throw new ApiError(
      response.status,
      response.status === 404
        ? "That file is not available."
        : "Could not load that file.",
      "FILE_UNAVAILABLE",
    );
  }

  const blob = await response.blob();
  return {
    url: URL.createObjectURL(blob),
    // The blob's own type, not the header: the browser has already normalised
    // it, and a header with a charset suffix would break a `startsWith` check.
    contentType: blob.type || response.headers.get("Content-Type") || "",
  };
}
