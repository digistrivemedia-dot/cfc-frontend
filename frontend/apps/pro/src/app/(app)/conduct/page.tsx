import { ScrollText } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Pro 35 — built in Phase 9. */
export default function Page() {
  return (
    <ComingSoon
      icon={<ScrollText />}
      title="Partner Code of Conduct"
      description="The CFC golden rules and the penalty structure behind them."
      screens="Pro 35"
    />
  );
}
