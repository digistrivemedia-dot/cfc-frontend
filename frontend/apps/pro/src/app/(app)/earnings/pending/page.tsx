import { Clock } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Pro 25 — built in Phase 6. */
export default function Page() {
  return (
    <ComingSoon
      icon={<Clock />}
      title="Pending payments"
      description="Jobs you have completed where the money has not landed yet."
      screens="Pro 25"
    />
  );
}
