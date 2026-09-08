"use client";

import * as React from "react";

/**
 * Drag-to-reorder for a vertical list.
 *
 * Native HTML5 drag events rather than a library: the behaviour is a few dozen
 * lines, and a dependency for it would be more surface to reason about than the
 * thing itself.
 *
 * Drag is never the only way to reorder. It is unusable with a keyboard, awkward
 * with a screen reader, and impossible on a touch screen without a long-press
 * gesture nobody discovers — so a caller must also expose move-up/move-down
 * controls, and this hook returns `move` for exactly that. Drag is the fast
 * path, not the path.
 *
 * The list is reordered live as the pointer crosses a row rather than on drop,
 * so the operator sees the result before committing. `onCommit` fires once, on
 * drop, with the final order.
 */

export interface ReorderHandlers {
  draggable: true;
  onDragStart: (e: React.DragEvent) => void;
  onDragEnter: (e: React.DragEvent) => void;
  onDragOver: (e: React.DragEvent) => void;
  onDragEnd: () => void;
  onDrop: (e: React.DragEvent) => void;
  "aria-grabbed": boolean | undefined;
}

export function useReorder<T>({
  items,
  onChange,
  onCommit,
}: {
  items: T[];
  /** Called on every reorder, including mid-drag. */
  onChange: (next: T[]) => void;
  /** Called once when a drag finishes, with the settled order. */
  onCommit?: ((next: T[]) => void) | undefined;
}): {
  /** Index currently being dragged, or null. */
  draggingIndex: number | null;
  /** Index the dragged row would land on, or null. */
  overIndex: number | null;
  /** Spread onto each row. */
  rowProps: (index: number) => ReorderHandlers;
  /** Keyboard and button path. Returns false if the move is out of bounds. */
  move: (from: number, direction: -1 | 1) => boolean;
} {
  const [draggingIndex, setDraggingIndex] = React.useState<number | null>(null);
  const [overIndex, setOverIndex] = React.useState<number | null>(null);

  // Held in a ref as well as state: the drag handlers fire faster than React
  // commits, and reading a stale index mid-drag drops rows in the wrong place.
  const dragging = React.useRef<number | null>(null);

  const reorder = React.useCallback(
    (from: number, to: number): T[] | null => {
      if (from === to || from < 0 || to < 0) return null;
      if (from >= items.length || to >= items.length) return null;
      const next = [...items];
      const [moved] = next.splice(from, 1);
      if (moved === undefined) return null;
      next.splice(to, 0, moved);
      return next;
    },
    [items],
  );

  const move = React.useCallback(
    (from: number, direction: -1 | 1) => {
      const next = reorder(from, from + direction);
      if (!next) return false;
      onChange(next);
      onCommit?.(next);
      return true;
    },
    [reorder, onChange, onCommit],
  );

  const rowProps = React.useCallback(
    (index: number): ReorderHandlers => ({
      draggable: true,
      "aria-grabbed": draggingIndex === index ? true : undefined,

      onDragStart: (e) => {
        dragging.current = index;
        setDraggingIndex(index);
        e.dataTransfer.effectAllowed = "move";
        // Firefox refuses to start a drag without payload.
        e.dataTransfer.setData("text/plain", String(index));
      },

      onDragEnter: (e) => {
        e.preventDefault();
        const from = dragging.current;
        if (from === null || from === index) return;
        setOverIndex(index);
        const next = reorder(from, index);
        if (next) {
          dragging.current = index;
          setDraggingIndex(index);
          onChange(next);
        }
      },

      onDragOver: (e) => {
        // Without this the drop is refused and the row snaps back.
        e.preventDefault();
        e.dataTransfer.dropEffect = "move";
      },

      onDragEnd: () => {
        dragging.current = null;
        setDraggingIndex(null);
        setOverIndex(null);
      },

      onDrop: (e) => {
        e.preventDefault();
        dragging.current = null;
        setDraggingIndex(null);
        setOverIndex(null);
        onCommit?.(items);
      },
    }),
    [draggingIndex, reorder, onChange, onCommit, items],
  );

  return { draggingIndex, overIndex, rowProps, move };
}
