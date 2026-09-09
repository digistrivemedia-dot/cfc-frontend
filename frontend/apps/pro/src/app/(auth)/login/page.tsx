import { LogIn } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Pro 2 — built in Phase 9. */
export default function Page() {
  return (
    <ComingSoon
      icon={<LogIn />}
      title="Sign in"
      description="Sign in with your mobile number and a one-time code."
      screens="Pro 2"
    />
  );
}
