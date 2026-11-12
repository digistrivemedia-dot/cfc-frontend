import { RequestList } from "@/components/request-list";

/** Ready for pickup (screen 6) — packed, awaiting or already collected. */
export default function ReadyPage() {
  return (
    <RequestList
      statuses={["ready", "collected"]}
      title="Ready for Pickup"
      description="Packed and waiting for the professional to collect."
      emptyMessage="Nothing ready for pickup."
    />
  );
}
