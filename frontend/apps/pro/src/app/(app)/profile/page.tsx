import { User } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Pro 26 — built in Phase 7. */
export default function Page() {
  return (
    <ComingSoon
      icon={<User />}
      title="Your profile"
      description="Photo, rating, verified badge, CFC Pro ID and skills."
      screens="Pro 26"
    />
  );
}
