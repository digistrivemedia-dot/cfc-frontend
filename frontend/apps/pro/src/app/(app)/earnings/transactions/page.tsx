import { ReceiptText } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Pro 23 — built in Phase 6. */
export default function Page() {
  return (
    <ComingSoon
      icon={<ReceiptText />}
      title="Transaction history"
      description="Every payout record, job by job."
      screens="Pro 23"
    />
  );
}
