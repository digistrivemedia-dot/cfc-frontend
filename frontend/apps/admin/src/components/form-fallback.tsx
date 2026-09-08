import { Skeleton } from "@cfc/ui";

/** Suspense fallback for add/edit form pages reading useSearchParams. */
export function FormFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-96 max-w-xl rounded-card" />
    </div>
  );
}
