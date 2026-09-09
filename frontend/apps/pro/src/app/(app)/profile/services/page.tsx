import { Wrench } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Pro 28 — built in Phase 7. */
export default function Page() {
  return (
    <ComingSoon
      icon={<Wrench />}
      title="Your services"
      description="The services you offer, and which are switched on."
      screens="Pro 28"
    />
  );
}
