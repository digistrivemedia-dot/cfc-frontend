import { RequestList } from "@/components/request-list";

/** New Requests (screen 4) — everything still awaiting an answer. */
export default function RequestsPage() {
  return (
    <RequestList
      statuses={["pending"]}
      title="New Requests"
      description="Confirm what you can supply, or decline so the job moves on."
      emptyMessage="No new requests. They appear here as jobs are approved."
    />
  );
}
