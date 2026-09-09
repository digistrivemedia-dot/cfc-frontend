import { Bell } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Pro 31 — built in Phase 8. */
export default function Page() {
  return (
    <ComingSoon
      icon={<Bell />}
      title="Notifications"
      description="Job alerts, payout updates, announcements and warnings."
      screens="Pro 31"
    />
  );
}
