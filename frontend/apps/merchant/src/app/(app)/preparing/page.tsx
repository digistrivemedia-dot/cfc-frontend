import { RequestList } from "@/components/request-list";

/** Preparing (screen 5) — accepted, not yet on the counter. */
export default function PreparingPage() {
  return (
    <RequestList
      statuses={["accepted", "partially_accepted"]}
      title="Preparing"
      description="Accepted requests. Mark each one ready once it is packed."
      emptyMessage="Nothing being prepared."
    />
  );
}
