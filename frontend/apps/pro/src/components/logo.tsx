import { cn } from "@cfc/ui";

/**
 * The CFC mark — a shield around a house.
 *
 * Drawn rather than imported so it inherits `currentColor` and stays sharp at
 * every size. A raster logo would need one file per colour it appears in, and
 * this mark appears on white, on navy, and inside a filled tile.
 *
 * The same mark is drawn in the admin panel's auth shell. It lives in both
 * apps rather than in `@cfc/ui` because the apps must not import from each
 * other, and a brand mark is not a design-system primitive.
 */
export function Logo({ className }: { className?: string | undefined }) {
  return (
    <svg
      viewBox="0 0 48 48"
      className={cn("shrink-0", className)}
      fill="none"
      aria-hidden="true"
    >
      {/* Shield outline */}
      <path
        d="M24 3.5 6.5 10.2v13.2c0 10.6 7.2 18.9 17.5 21.6 10.3-2.7 17.5-11 17.5-21.6V10.2L24 3.5Z"
        stroke="currentColor"
        strokeWidth={2.5}
        strokeLinejoin="round"
      />
      {/* House, filled so it reads as a solid mark at small sizes */}
      <path
        d="M24 14.5 33.5 22v10.5a1.5 1.5 0 0 1-1.5 1.5h-6v-7h-4v7h-6a1.5 1.5 0 0 1-1.5-1.5V22L24 14.5Z"
        fill="currentColor"
      />
    </svg>
  );
}
