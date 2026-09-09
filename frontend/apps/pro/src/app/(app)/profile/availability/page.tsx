import { CalendarDays } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Pro 29 — built in Phase 7. */
export default function Page() {
  return (
    <ComingSoon
      icon={<CalendarDays />}
      title="Availability"
      description="Your weekly schedule, off days and holiday mode."
      screens="Pro 29"
    />
  );
}
