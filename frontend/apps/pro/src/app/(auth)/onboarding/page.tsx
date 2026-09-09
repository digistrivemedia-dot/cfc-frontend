import { Rocket } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Pro 3 — built in Phase 9. */
export default function Page() {
  return (
    <ComingSoon
      icon={<Rocket />}
      title="Welcome to CFC Pro"
      description="How the platform works, and what you need to get approved."
      screens="Pro 3"
    />
  );
}
