import { CalendarDays } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Placeholder until this route's phase lands. See ADMIN-MOBILE-PLAN's sibling consumer plan. */
export default function BookingsPage() {
  return (
    <ComingSoon
      icon={<CalendarDays />}
      title="My bookings"
      description="Upcoming, ongoing, completed and cancelled bookings."
      screens="Customer 25-29"
    />
  );
}
