import { Star } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Pro 30 — built in Phase 8. */
export default function Page() {
  return (
    <ComingSoon
      icon={<Star />}
      title="Ratings and reviews"
      description="What customers said, your average, and your replies."
      screens="Pro 30"
    />
  );
}
