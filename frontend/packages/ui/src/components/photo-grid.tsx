"use client";

import * as React from "react";
import { ImageOff, Play, X } from "lucide-react";
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
                thumbnail
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
        {/* Wider than the dialog default: evidence is the whole point of this
            view, and `max-w-lg` crops a landscape photo to a postcard. */}
        <DialogContent className="max-w-3xl p-0">
          {open !== null && urls[open] !== undefined && (
            <>
              <Photo
                url={urls[open]}
                alt={`${label} photo ${open + 1} of ${urls.length}`}
                // `object-contain`, not the tile's `cover`: the lightbox is
                // where somebody reads a meter or checks a finish, and a
                // cropped photo is exactly where that detail goes missing.
                // `cn` is tailwind-merge, so this wins over the tile default.
                className="max-h-document w-full bg-structure object-contain"
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
  thumbnail = false,
}: {
  url: string;
  alt: string;
  className?: string | undefined;
  /** In the grid rather than the lightbox: no controls, click passes through. */
  thumbnail?: boolean | undefined;
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

  /**
   * Videos are proof too, and an `<img>` cannot play one.
   *
   * Every tile was an `<img>`, so a completion video failed to load, hit
   * `onError`, and rendered "No preview" — the file had uploaded perfectly
   * well and the viewer simply could not show it.
   *
   * Detected from the extension rather than a content type, because these are
   * stored paths rather than fetched blobs and there is no header to read.
   */
  if (/\.(mp4|mov|webm|m4v)$/i.test(url)) {
    /**
     * A thumbnail video carries **no controls**.
     *
     * The tile sits inside the button that opens the lightbox, and a native
     * control bar swallows the click before it ever reaches that button — so
     * tapping a video did nothing, while tapping a photo opened it full size.
     * `pointer-events-none` makes the whole tile click through to the button,
     * and the play badge says it is a video and will open.
     *
     * The lightbox copy gets the controls, because that is where watching it
     * is the point.
     */
    if (thumbnail) {
      return (
        <span className={cn("relative block", className)}>
          <video
            src={url}
            // Metadata only: a grid of clips must not pull whole files down
            // before anyone has asked to watch one.
            preload="metadata"
            muted
            playsInline
            onError={() => setFailed(true)}
            aria-label={alt}
            className="pointer-events-none size-full bg-structure object-cover"
          />
          <span
            className="pointer-events-none absolute inset-0 flex items-center justify-center"
            aria-hidden="true"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-on-media">
              <Play className="size-4 text-white" fill="currentColor" />
            </span>
          </span>
        </span>
      );
    }

    return (
      <video
        src={url}
        controls
        // Opened deliberately from a tap, so it should start playing rather
        // than waiting for a second tap on the same element.
        autoPlay
        playsInline
        onError={() => setFailed(true)}
        aria-label={alt}
        className={cn("bg-structure object-contain", className)}
      />
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
