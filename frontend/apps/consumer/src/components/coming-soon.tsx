import { EmptyState } from "@cfc/ui";

/**
 * A route that exists but has not been built yet.
 *
 * Every tab and link in the navigation resolves to a real screen from Phase 0
 * onward. A placeholder that says so is better than a 404 — the shell stays
 * intact, the tab bar keeps working, and it is obvious this is scheduled work
 * rather than something broken.
 *
 * Each of these is replaced wholesale by its own phase; none of this markup
 * survives into the finished app.
 */
export function ComingSoon({
  icon,
  title,
  description,
  screens,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
  /** The inventory screens this route will cover, e.g. "Customer 25-29". */
  screens: string;
}) {
  return (
    <div className="mx-auto max-w-screen-xl px-4 py-12 md:px-6 lg:px-8">
      <div className="rounded-card border border-border bg-surface">
        <EmptyState
          icon={icon}
          title={title}
          description={`${description} (${screens})`}
        />
      </div>
    </div>
  );
}
