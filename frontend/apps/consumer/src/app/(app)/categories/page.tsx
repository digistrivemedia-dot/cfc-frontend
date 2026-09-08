import { LayoutGrid } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Placeholder until this route's phase lands. See ADMIN-MOBILE-PLAN's sibling consumer plan. */
export default function CategoriesPage() {
  return (
    <ComingSoon
      icon={<LayoutGrid />}
      title="Categories"
      description="Browse every service by category and sub-category."
      screens="Customer 10, 11"
    />
  );
}
