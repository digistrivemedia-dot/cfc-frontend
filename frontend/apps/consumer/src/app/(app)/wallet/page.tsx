import { Wallet } from "lucide-react";
import { ComingSoon } from "@/components/coming-soon";

/** Placeholder until this route's phase lands. See ADMIN-MOBILE-PLAN's sibling consumer plan. */
export default function WalletPage() {
  return (
    <ComingSoon
      icon={<Wallet />}
      title="Wallet"
      description="Your balance, top-ups and transaction history."
      screens="Customer 36, 37"
    />
  );
}
