import { Wrench } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Pro 15 — built in Phase 4. */
export default function Page() {
  return (
    <ComingSoon
      icon={<Wrench />}
      title="Work in progress"
      description="Upload before photos, add extra charges, and complete the job with the customer's OTP."
      screens="Pro 15, 16, 18"
    />
  );
}
