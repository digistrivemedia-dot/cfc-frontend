"use client";

import * as React from "react";
import { ImageOff, X } from "lucide-react";
import { cn } from "../lib/cn";
import { Dialog, DialogContent } from "../primitives/dialog";

/**
 * Before-and-after photos, with a lightbox.
 *
 * These are evidence, not decoration — a customer checks them to confirm the
 * work described is the work done, and disputes turn on them. So a thumbnail
 * opens full size rather than being the only view.
 *
 * A photo that fails to load falls back to a labelled placeholder rather than
 * a browser broken-image icon. During development the fixture paths do not
 * resolve at all, and a grid of broken icons reads as a fault in the app.
 */
export function PhotoGrid({
  urls,
  /** Announced on each thumbnail: "Before photo 2 of 3". */
  label,
  className,
}: {
  urls: readonly string[];
  label: string;
  className?: string | undefined;
}) {
  const [open, setOpen] = React.useState<number | null>(null);

  if (urls.length === 0) return null;

  return (
    <>
      <ul
        className={cn(
          // Scrolls on a phone, wraps on a desktop: three photos fit at
          // 1280px, and one and a half fit at 390px.
          "-mx-4 flex gap-2 overflow-x-auto px-4 scrollbar-none",
          "md:mx-0 md:flex-wrap md:px-0",
          className,
        )}
      >
        {urls.map((url, i) => (
          <li key={url} className="shrink-0">
            <button
              type="button"
              onClick={() => setOpen(i)}
              className={cn(
                "block overflow-hidden rounded-control border border-border",
                "transition-colors duration-fast hover:border-action",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-focus",
              )}
            >
              <Photo
                url={url}
                alt={`${label} photo ${i + 1} of ${urls.length}`}
                className="aspect-card w-line-md"
              />
            </button>
          </li>
        ))}
      </ul>

      <Dialog
        open={open !== null}
        onOpenChange={(next) => {
          if (!next) setOpen(null);
        }}
      >
        <DialogContent className="p-0">
          {open !== null && urls[open] !== undefined && (
            <>
              <Photo
                url={urls[open]}
                alt={`${label} photo ${open + 1} of ${urls.length}`}
                className="aspect-card w-full"
              />
              <div className="flex items-center justify-between gap-3 border-t border-border p-3">
                <p className="tabular text-caption text-ink-muted">
                  {label} · {open + 1} of {urls.length}
                </p>
                <button
                  type="button"
                  onClick={() => setOpen(null)}
                  aria-label="Close"
                  className="flex size-8 items-center justify-center rounded-full text-ink-muted hover:bg-canvas hover:text-ink"
                >
                  <X className="size-4" />
                </button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}

/**
 * One photo, or an honest placeholder.
 *
 * `onError` swaps to the placeholder rather than leaving the browser's broken
 * icon, which looks like the app failed rather than the file being absent.
 */
function Photo({
  url,
  alt,
  className,
}: {
  url: string;
  alt: string;
  className?: string | undefined;
}) {
  const [failed, setFailed] = React.useState(false);

  if (failed) {
    return (
      <span
        className={cn(
          "flex flex-col items-center justify-center gap-1 bg-canvas text-ink-faint",
          className,
        )}
        role="img"
        aria-label={`${alt} — not available`}
      >
        <ImageOff className="size-5" aria-hidden="true" />
        <span className="text-caption">No preview</span>
      </span>
    );
  }

  return (
    // A raw img: this component lives in @cfc/ui, which must not depend on
    // next/image. See CONSUMER-OPEN-ITEMS 4.2.
    <img
      src={url}
      alt={alt}
      loading="lazy"
      onError={() => setFailed(true)}
      className={cn("object-cover", className)}
    />
  );
}
