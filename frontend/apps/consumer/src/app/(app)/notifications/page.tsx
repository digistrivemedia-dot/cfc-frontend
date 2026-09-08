import { Bell } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Placeholder until this route's phase lands. See ADMIN-MOBILE-PLAN's sibling consumer plan. */
export default function NotificationsPage() {
  return (
    <ComingSoon
      icon={<Bell />}
      title="Notifications"
      description="Booking updates, offers and quotation alerts."
      screens="Customer 39"
    />
  );
}
