import { Search } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Placeholder until this route's phase lands. See ADMIN-MOBILE-PLAN's sibling consumer plan. */
export default function SearchPage() {
  return (
    <ComingSoon
      icon={<Search />}
      title="Search"
      description="Search services by name, with recent and trending suggestions."
      screens="Customer 8, 9"
    />
  );
}
