import { Settings } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Pro 33 — built in Phase 8. */
export default function Page() {
  return (
    <ComingSoon
      icon={<Settings />}
      title="Settings"
      description="Notification preferences, language, and account deactivation."
      screens="Pro 33"
    />
  );
}
