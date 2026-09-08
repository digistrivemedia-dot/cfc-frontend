import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

/**
 * tailwind-merge has to be taught our scales, otherwise it cannot tell that
 * `text-body` and `text-small` conflict (it would keep both), or that
 * `text-ink` is a colour rather than a size.
 *
 * These lists mirror the preset in @cfc/config. When a token is added there, it
 * is added here too.
 */
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "font-size": [
        { text: ["display", "title", "heading", "body", "small", "caption"] },
      ],
      "text-color": [
        {
          text: [
            "ink",
            "ink-muted",
            "structure",
            "structure-raised",
            "action",
            "action-subtle",
            "canvas",
            "surface",
            "border",
            "success",
            "success-subtle",
            "warning",
            "warning-subtle",
            "danger",
            "danger-subtle",
            "gain",
            "gain-subtle",
            "go",
            "go-subtle",
          ],
        },
      ],
      rounded: [{ rounded: ["none", "pill", "control", "card", "full"] }],
      shadow: [{ shadow: ["none", "sm", "md", "lg"] }],
    },
  },
});

/**
 * Merges class names, with later Tailwind utilities winning over earlier ones.
 *
 * Used by every component in @cfc/ui so a caller can override a variant's
 * spacing or colour without fighting specificity.
 */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
