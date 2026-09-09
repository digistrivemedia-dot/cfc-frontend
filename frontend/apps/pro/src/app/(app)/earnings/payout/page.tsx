import { Banknote } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Pro 24 — built in Phase 6. */
export default function Page() {
  return (
    <ComingSoon
      icon={<Banknote />}
      title="Payout"
      description="Trigger a daily payout to your bank or UPI."
      screens="Pro 24"
    />
  );
}
