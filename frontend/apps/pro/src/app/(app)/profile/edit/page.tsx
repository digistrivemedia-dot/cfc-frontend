import { PencilLine } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Pro 27 — built in Phase 7. */
export default function Page() {
  return (
    <ComingSoon
      icon={<PencilLine />}
      title="Edit profile"
      description="Bio, skills, service area, experience and contact details."
      screens="Pro 27"
    />
  );
}
