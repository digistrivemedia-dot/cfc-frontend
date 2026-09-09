import { LifeBuoy } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Pro 32 — built in Phase 8. */
export default function Page() {
  return (
    <ComingSoon
      icon={<LifeBuoy />}
      title="Help and support"
      description="Answers to common questions, raise a ticket, or call the helpline."
      screens="Pro 32"
    />
  );
}
