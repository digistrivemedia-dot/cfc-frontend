import type { ConsumerProfile, OtpSendResult, OtpVerifyResult } from "@cfc/types";
import { latency, applyScenario } from "../control";
import { CUSTOMER_NAMES, AREAS } from "../fixtures/seed";
import { getAddresses } from "./addresses";
import { clearToken, fetchJson, isLive, setToken } from "../http";

/**
 * Consumer auth mock API.
 *
 * No real OTP is sent. These functions simulate the round-trip with realistic
 * latency so loading states and the OTP auto-fill UX are exercisable.
 */

/** Send a one-time password to the given mobile number. */
export async function sendOtp(phone: string): Promise<OtpSendResult> {
  if (isLive("sendOtp")) {
    return fetchJson<OtpSendResult>("/consumer/auth/otp/send", {
      body: { phone },
    });
  }
  await latency();
  return applyScenario({ phone, resendAfterSeconds: 30 });
}

/**
 * Verify a one-time password.
 *
 * In the mock, any 6-digit code is accepted. The real implementation will
 * replace only this function body.
 */
export async function verifyOtp(
  phone: string,
  code: string,
): Promise<OtpVerifyResult> {
  if (isLive("verifyOtp")) {
    const result = await fetchJson<OtpVerifyResult>(
      "/consumer/auth/otp/verify",
      { body: { phone, code } },
    );
    // `localStorage`, not session: a customer who signs in and comes back
    // tomorrow expects to still be signed in, which is how every marketplace
    // behaves. The admin panel chooses the opposite, deliberately.
    setToken(result.token, "local");
    return result;
  }
  await latency();
  if (code.length !== 6) {
    throw new Error("Please enter a 6-digit code.");
  }
  return applyScenario({
    token: `mock_token_${phone}_${Date.now()}`,
    isNewUser: false,
  });
}

/**
 * The signed-in customer.
 *
 * Module state rather than a fresh object per call, so an edit on Customer 34
 * shows on 33 and in the navigation at once — the way it will behave when a
 * backend owns it. It resets on reload, which is the honest boundary of a
 * mock.
 *
 * Addresses are NOT held here. `api/addresses.ts` owns those and their
 * mutations; duplicating them would give two sources of truth for one list.
 */
const profile: ConsumerProfile = {
  id: "cust_01",
  name: CUSTOMER_NAMES[0] as string,
  phone: "+919876543210",
  area: AREAS[0],
  walletPaise: 24900,
  totalBookings: 7,
  joinedAt: "2025-03-12T08:00:00Z",
  addresses: [],
};

/**
 * The logged-in customer's own profile — used by My Profile and the app shell.
 *
 * The `empty` scenario returns a **brand-new customer** rather than throwing.
 * Without an empty value `applyScenario` raises a 404, and because the home
 * screen fetches the profile alongside the catalogue in one `Promise.all`, that
 * rejection took the categories, services and banners down with it — the whole
 * page rendered blank under `__cfc.empty()`. Whatever "empty" means for this
 * platform, it is not "the signed-in customer has no account": it means they
 * have no history yet, which is exactly the first-time visitor the home screen
 * needs to be reviewable against.
 */
export async function getConsumerProfile(): Promise<ConsumerProfile> {
  if (isLive("getConsumerProfile")) {
    return fetchJson<ConsumerProfile>("/consumer/auth/me");
  }
  await latency();
  // Addresses are read from their own module so the two never disagree.
  const addresses = await getAddresses();
  return applyScenario(
    { ...profile, addresses },
    {
      ...profile,
      // A new customer has booked nothing, spent nothing, and has not told us
      // where they live yet — the shell shows "Set your area" for this.
      area: "",
      addresses: [],
      walletPaise: 0,
      totalBookings: 0,
      joinedAt: new Date().toISOString(),
    },
  );
}

/**
 * Customer 34 — saving edited details.
 *
 * Only the fields that screen offers. The phone number is deliberately absent:
 * it is the login identity, and changing it is an OTP flow of its own rather
 * than a text field on a profile form.
 */
export async function updateConsumerProfile(patch: {
  name?: string;
  area?: string;
  avatarUrl?: string | undefined;
}): Promise<ConsumerProfile> {
  if (isLive("updateConsumerProfile")) {
    return fetchJson<ConsumerProfile>("/consumer/auth/me", {
      method: "PATCH",
      body: { name: patch.name, area: patch.area },
    });
  }
  await latency();
  if (patch.name !== undefined && patch.name.trim() !== "") {
    profile.name = patch.name.trim();
  }
  if (patch.area !== undefined && patch.area.trim() !== "") {
    profile.area = patch.area.trim();
  }
  if (patch.avatarUrl !== undefined) profile.avatarUrl = patch.avatarUrl;

  const addresses = await getAddresses();
  return applyScenario({ ...profile, addresses });
}
/**
 * Signs the customer out.
 *
 * Just discards the token — it is stateless, so that is what actually ends the
 * session. No request to make: there is no server-side record to clear, and the
 * audit value an admin sign-out has does not apply to a customer closing an app.
 */
export function signOutConsumer(): void {
  clearToken();
}
