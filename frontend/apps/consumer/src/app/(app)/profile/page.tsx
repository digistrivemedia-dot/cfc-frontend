import { User } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Placeholder until this route's phase lands. See ADMIN-MOBILE-PLAN's sibling consumer plan. */
export default function ProfilePage() {
  return (
    <ComingSoon
      icon={<User />}
      title="Profile"
      description="Your details, addresses, referrals and settings."
      screens="Customer 33-35, 43, 44"
    />
  );
}
