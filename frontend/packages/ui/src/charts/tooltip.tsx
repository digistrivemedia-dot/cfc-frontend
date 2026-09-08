import type { TooltipProps } from "recharts";

/**
 * The chart tooltip. A `surface` card with a hairline border and an
 * indigo-tinted shadow, matching every other overlay in the system.
 */
export function ChartTooltip({
  active,
  label,
  payload,
  formatValue,
}: TooltipProps<number, string> & {
  formatValue?: ((v: number) => string) | undefined;
}) {
  if (!active || !payload?.length) return null;

  return (
    <div className="rounded-control border border-border bg-surface px-3 py-2 shadow-md">
      <p className="text-caption font-medium text-ink-muted">{label}</p>
      <div className="mt-1 space-y-1">
        {payload.map((entry) => (
          <div key={entry.dataKey} className="flex items-center gap-2 text-small">
            <span
              className="size-2 shrink-0 rounded-full"
              style={{ backgroundColor: entry.color }}
              aria-hidden="true"
            />
            <span className="text-ink-muted">{entry.name}</span>
            <span className="tabular ml-auto font-medium text-ink">
              {formatValue && typeof entry.value === "number"
                ? formatValue(entry.value)
                : entry.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
