import { ShieldCheck } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Pro 9 — built in Phase 9. */
export default function Page() {
  return (
    <ComingSoon
      icon={<ShieldCheck />}
      title="Approval pending"
      description="Your documents are with the CFC team for verification."
      screens="Pro 9"
    />
  );
}
