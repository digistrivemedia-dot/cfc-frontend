import { redirect } from "next/navigation";

/**
 * Root entry point.
 *
 * Nothing lives at "/" — it is a pure routing node. `/splash` decides where a
 * pro actually lands: onboarding if they have never signed in, the approval
 * screen if their KYC is still pending, otherwise the dashboard.
 */
export default function Root() {
  redirect("/splash");
}
