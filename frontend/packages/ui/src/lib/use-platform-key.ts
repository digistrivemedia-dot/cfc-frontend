"use client";

import * as React from "react";

/**
 * The modifier key label for the platform actually in use.
 *
 * The command palette binds both `metaKey` and `ctrlKey`, so the shortcut has
 * always worked everywhere — but the label was hardcoded to the Mac glyph,
 * which shows a Windows user a symbol that is not on their keyboard and is not
 * the key they need to press.
 *
 * It resolves after mount rather than during render: the server has no
 * navigator, and guessing there would swap the label on hydration. "Ctrl" is
 * the first paint because it is the majority case for this admin panel, so the
 * common path never changes text under the reader.
 */
export function usePlatformModifier(): string {
  const [isApple, setIsApple] = React.useState(false);

  React.useEffect(() => {
    if (typeof navigator === "undefined") return;
    // `platform` is deprecated but still the most reliable signal; the UA
    // string is the fallback for browsers that have already dropped it.
    const source = `${navigator.platform ?? ""} ${navigator.userAgent ?? ""}`;
    setIsApple(/Mac|iPhone|iPad|iPod/i.test(source));
  }, []);

  return isApple ? "⌘" : "Ctrl";
}
