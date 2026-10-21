/**
 * Shared Recharts theme.
 *
 * Every chart in the app pulls its series colours from these tokens instead
 * of hard-coded hex values, so the analytics surfaces stay on palette and
 * follow the light/dark theme automatically.
 */

export const CHART_COLORS = [
  "hsl(var(--chart-1))",
  "hsl(var(--chart-2))",
  "hsl(var(--chart-3))",
  "hsl(var(--chart-4))",
  "hsl(var(--chart-5))",
  "hsl(var(--chart-6))",
] as const;

export const CHART_AXIS_COLOR = "hsl(var(--muted-foreground))";
export const CHART_GRID_COLOR = "hsl(var(--border))";

/** Recharts props for a muted, hairline grid. */
export const axisProps = {
  stroke: CHART_AXIS_COLOR,
  tick: { fill: CHART_AXIS_COLOR, fontSize: 12 },
  tickLine: false,
  axisLine: false,
} as const;

export const gridProps = {
  stroke: CHART_GRID_COLOR,
  strokeDasharray: "3 3",
  vertical: false,
} as const;

/** Styling for a Recharts `<Tooltip>` that matches the flat design system. */
export const tooltipProps = {
  cursor: { fill: "hsl(var(--muted))", opacity: 0.45 },
  contentStyle: {
    backgroundColor: "hsl(var(--popover))",
    border: "1px solid hsl(var(--border))",
    borderRadius: "6px",
    fontSize: "12px",
    boxShadow: "none",
    padding: "8px 10px",
  },
  labelStyle: { color: "hsl(var(--foreground))", fontWeight: 500 },
  itemStyle: { color: "hsl(var(--muted-foreground))", padding: 0 },
} as const;

/** A muted, flat surface for chart legends. */
export const legendProps = {
  wrapperStyle: {
    fontSize: "12px",
    color: "hsl(var(--muted-foreground))",
    paddingTop: "8px",
  },
  iconType: "circle" as const,
  iconSize: 8,
} as const;
