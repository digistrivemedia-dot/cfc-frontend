import type { ConsumerProfile, OtpSendResult, OtpVerifyResult } from "@cfc/types";
import { latency, applyScenario } from "../control";
import { CUSTOMER_NAMES, AREAS } from "../fixtures/seed";

/**
 * Consumer auth mock API.
 *
 * No real OTP is sent. These functions simulate the round-trip with realistic
 * latency so loading states and the OTP auto-fill UX are exercisable.
 */

/** Send a one-time password to the given mobile number. */
export async function sendOtp(phone: string): Promise<OtpSendResult> {
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
  await latency();
  if (code.length !== 6) {
    throw new Error("Please enter a 6-digit code.");
  }
  return applyScenario({
    token: `mock_token_${phone}_${Date.now()}`,
    isNewUser: false,
  });
}

/** The logged-in customer's own profile — used by My Profile and the app shell. */
export async function getConsumerProfile(): Promise<ConsumerProfile> {
  await latency();

  const profile: ConsumerProfile = {
    id: "cust_01",
    name: CUSTOMER_NAMES[0] as string,
    phone: "+919876543210",
    area: AREAS[0],
    walletPaise: 24900,
    totalBookings: 7,
    joinedAt: "2025-03-12T08:00:00Z",
    addresses: [
      {
        id: "addr_01",
        label: "home",
        line1: "42, Kaveri Nagar",
        line2: "Near Temple Street",
        landmark: "Opposite Saravana Stores",
        area: AREAS[0],
        city: "Tiruchirappalli",
        state: "Tamil Nadu",
        pincode: "620006",
        point: { lat: 10.8505, lng: 78.6837 },
        isDefault: true,
      },
    ],
  };

  return applyScenario(profile);
}
