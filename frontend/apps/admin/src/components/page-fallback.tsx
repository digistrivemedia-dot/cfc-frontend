import { Skeleton } from "@cfc/ui";

/**
 * Suspense fallback for pages reading useSearchParams.
 *
 * Next.js requires the boundary for static prerendering; this is what paints
 * while the search params resolve, so the first frame is a skeleton rather
 * than a blank page.
 */
export function PageFallback() {
  return (
    <div className="space-y-4">
      <Skeleton className="h-8 w-line-2xl" />
      <div className="grid gap-4 lg:grid-cols-[1fr_320px]">
        <Skeleton className="h-block-md rounded-card" />
        <Skeleton className="h-block-md rounded-card" />
      </div>
    </div>
  );
}
