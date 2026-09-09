import { ShieldAlert } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Pro 34 — built in Phase 9. */
export default function Page() {
  return (
    <ComingSoon
      icon={<ShieldAlert />}
      title="Warnings and penalties"
      description="Any active warnings, what caused them, and how to clear them."
      screens="Pro 34"
    />
  );
}
