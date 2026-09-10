"use client";

import * as React from "react";
import { Camera, TriangleAlert, X } from "lucide-react";
import { cn } from "../lib/cn";

/**
 * Take or choose photos, with a preview.
 *
 * `PhotoGrid` displays photos that already exist. Nothing in the system
 * *captures* them, and the pro app needs it in three places where the photo is
 * evidence rather than decoration:
 *
 *   Pro 15  before-photos on starting work
 *   Pro 16  before-photos on a quotation — **minimum 2, or it is auto-rejected**
 *   Pro 18  after-photos on completion
 *
 * ## Why validation happens here
 *
 * A pro on a phone will hand this a 12 MB photo from a 108-megapixel camera,
 * and a rejection that arrives from the server after a slow upload — while they
 * are standing in a customer's house — is a genuinely bad experience. Type and
 * size are checked before anything is read.
 *
 * ## The minimum is shown, not just enforced
 *
 * The quotation rule is that fewer than two before-photos means automatic
 * rejection. A pro must be able to see how many they still need *before* they
 * submit, so `minimum` renders as a live count rather than only firing on
 * submit. Discovering the rule by having your work rejected is not discovering
 * it in time.
 *
 * ## Object URLs
 *
 * Previews are `URL.createObjectURL` blobs, revoked when removed and on
 * unmount. Without that a pro adding and removing photos leaks the whole file
 * into memory each time, which on a phone browser is how a page dies.
 */

/** What a browser will actually decode, rather than everything named image/*. */
const ACCEPTED = ["image/jpeg", "image/png", "image/webp", "image/heic"];

/** 10 MB. Generous for a photo, small enough to upload on mobile data. */
const MAX_BYTES = 10 * 1024 * 1024;

export interface CapturedPhoto {
  id: string;
  file: File;
  /** Blob URL for the preview. Revoked when the photo is removed. */
  previewUrl: string;
}

export interface PhotoCaptureProps {
  photos: CapturedPhoto[];
  onChange: (next: CapturedPhoto[]) => void;
  /** Announced and labelled: "Before photos". */
  label: string;
  /** Required count. Renders as a live "1 of 2 added" counter. */
  minimum?: number | undefined;
  /** Hard cap. Prevents a pro uploading forty photos of one tap. */
  maximum?: number | undefined;
  /** Why these photos are needed. A pro asked for evidence deserves a reason. */
  hint?: string | undefined;
  disabled?: boolean | undefined;
  className?: string | undefined;
}

export function PhotoCapture({
  photos,
  onChange,
  label,
  minimum,
  maximum = 8,
  hint,
  disabled = false,
  className,
}: PhotoCaptureProps) {
  const inputRef = React.useRef<HTMLInputElement>(null);
  const [rejected, setRejected] = React.useState<string[]>([]);

  // Held in a ref so the unmount cleanup sees the final list rather than the
  // list as it was when the effect first ran.
  const photosRef = React.useRef(photos);
  React.useEffect(() => {
    photosRef.current = photos;
  }, [photos]);

  React.useEffect(
    () => () => {
      for (const p of photosRef.current) URL.revokeObjectURL(p.previewUrl);
    },
    [],
  );

  const add = (files: FileList | null) => {
    if (files === null) return;

    const accepted: CapturedPhoto[] = [];
    const problems: string[] = [];
    const room = maximum - photos.length;

    for (const file of Array.from(files)) {
      if (accepted.length >= room) {
        problems.push(`You can add up to ${maximum} photos.`);
        break;
      }
      // Some Android browsers report an empty type for a camera capture, so an
      // empty type is allowed through rather than rejected on a technicality.
      if (file.type !== "" && !ACCEPTED.includes(file.type)) {
        problems.push(`${file.name} is not a photo.`);
        continue;
      }
      if (file.size > MAX_BYTES) {
        problems.push(
          `${file.name} is too large (${Math.round(file.size / 1024 / 1024)} MB). The limit is 10 MB.`,
        );
        continue;
      }
      accepted.push({
        // `randomUUID` is not available on every mobile browser over http, so
        // the id is composed rather than generated.
        id: `${file.name}-${file.size}-${Date.now()}-${accepted.length}`,
        file,
        previewUrl: URL.createObjectURL(file),
      });
    }

    setRejected(problems);
    if (accepted.length > 0) onChange([...photos, ...accepted]);

    // Cleared so choosing the same file twice in a row still fires a change.
    if (inputRef.current !== null) inputRef.current.value = "";
  };

  const remove = (id: string) => {
    const gone = photos.find((p) => p.id === id);
    if (gone !== undefined) URL.revokeObjectURL(gone.previewUrl);
    onChange(photos.filter((p) => p.id !== id));
  };

  const short =
    minimum !== undefined ? Math.max(0, minimum - photos.length) : 0;
  const full = photos.length >= maximum;

  return (
    <div className={className}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-small font-medium text-ink">{label}</p>
        {minimum !== undefined && (
          <p
            className={cn(
              "text-caption font-medium",
              short > 0 ? "text-clock-ink" : "text-live-ink",
            )}
          >
            {photos.length} of {minimum} added
            {short > 0 && ` · ${short} more needed`}
          </p>
        )}
      </div>

      {hint !== undefined && (
        <p className="mt-px text-caption text-ink-muted">{hint}</p>
      )}

      <ul className="mt-3 flex flex-wrap gap-2">
        {photos.map((photo, i) => (
          <li key={photo.id} className="relative">
            {/* A plain <img>, deliberately: this is an object URL for a file
                the customer just picked, which next/image cannot optimise and
                would refuse to load. The disable comment that used to sit here
                named a Next rule, and this package has no Next plugin — so the
                comment itself was the lint error. */}
            <img
              src={photo.previewUrl}
              alt={`${label} ${i + 1}`}
              className="size-tile-lg rounded-control border border-border object-cover"
            />
            {!disabled && (
              <button
                type="button"
                onClick={() => remove(photo.id)}
                aria-label={`Remove ${label} ${i + 1}`}
                className={cn(
                  "absolute -right-1 -top-1 flex size-5 items-center justify-center",
                  "rounded-full bg-structure text-on-structure shadow-sm",
                  "transition-colors duration-fast hover:bg-critical",
                )}
              >
                <X className="size-3" aria-hidden="true" />
              </button>
            )}
          </li>
        ))}

        {!full && !disabled && (
          <li>
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              className={cn(
                "flex size-tile-lg flex-col items-center justify-center gap-1",
                "rounded-control border border-dashed",
                short > 0 ? "border-clock-line bg-clock-subtle" : "border-border bg-canvas",
                "text-caption font-medium text-ink-muted",
                "transition-colors duration-fast hover:border-action-line hover:text-action",
              )}
            >
              <Camera className="size-5" aria-hidden="true" />
              Add
            </button>
          </li>
        )}
      </ul>

      <input
        ref={inputRef}
        type="file"
        // `capture="environment"` asks a phone for the rear camera directly.
        // It is a hint: a desktop browser ignores it and opens a file picker,
        // which is the correct behaviour there.
        capture="environment"
        accept={ACCEPTED.join(",")}
        multiple
        className="sr-only"
        aria-label={`Add ${label}`}
        onChange={(e) => add(e.target.files)}
      />

      {rejected.length > 0 && (
        <ul className="mt-2 space-y-1">
          {rejected.map((problem) => (
            <li
              key={problem}
              className="flex items-start gap-2 text-caption text-critical-ink"
            >
              <TriangleAlert
                className="mt-px size-4 shrink-0"
                aria-hidden="true"
              />
              {problem}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
