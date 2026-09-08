import { PageHeader } from "@cfc/ui";

/**
 * Placeholder for a screen in the inventory that has not been built yet.
 *
 * Every route exists from day one so the app is walkable end to end and gaps in
 * the inventory surface early. Each is replaced by its real screen in turn.
 */
export function Stub({ n, title }: { n: number; title: string }) {
  return (
    <div className="space-y-4">
      <PageHeader title={title} description={`Admin ${n} — not built yet.`} />
      <div className="rounded-card border border-border bg-surface p-6">
        <p className="text-body text-ink-muted">
          This screen is in the inventory and will be built in turn.
        </p>
      </div>
    </div>
  );
}
