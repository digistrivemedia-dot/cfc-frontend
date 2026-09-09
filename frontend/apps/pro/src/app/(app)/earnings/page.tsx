import { Wallet } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Pro 22 — built in Phase 6. */
export default function Page() {
  return (
    <ComingSoon
      icon={<Wallet />}
      title="Earnings"
      description="Today, this week and this month, with the full settlement breakdown."
      screens="Pro 22"
    />
  );
}
