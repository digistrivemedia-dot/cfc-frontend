import { BriefcaseBusiness } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Pro 20 — built in Phase 5. */
export default function Page() {
  return (
    <ComingSoon
      icon={<BriefcaseBusiness />}
      title="Your jobs"
      description="Active, upcoming, completed and cancelled work."
      screens="Pro 20"
    />
  );
}
