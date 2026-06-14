import { Paper, Typography } from "@mui/material";
import {
  Bar,
  ComposedChart,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { formatCurrency, roundCurrency } from "./dashboard-formatters";
import type { MonthlyTotal } from "./dashboard-types";

const BAR_COLORS = [
  "#60a5fa",
  "#34d399",
  "#fbbf24",
  "#f87171",
  "#a78bfa",
  "#22d3ee",
  "#a3e635",
  "#fb923c",
  "#f472b6",
  "#2dd4bf",
];

type ChartDataPoint = MonthlyTotal & {
  fill: string;
  targetFill: string;
};

type MonthlyBarChartProps = {
  title: string;
  monthlyTotals: MonthlyTotal[];
  showTargets?: boolean;
};

type TargetMarkerProps = {
  cx?: number;
  cy?: number;
  payload?: ChartDataPoint;
};

const invertHexColor = (hexColor: string) => {
  const normalizedHex = hexColor.replace("#", "");

  if (normalizedHex.length !== 6) {
    return "#111827";
  }

  const red = 255 - Number.parseInt(normalizedHex.slice(0, 2), 16);
  const green = 255 - Number.parseInt(normalizedHex.slice(2, 4), 16);
  const blue = 255 - Number.parseInt(normalizedHex.slice(4, 6), 16);

  return `#${[red, green, blue]
    .map((colorValue) => {
      return colorValue.toString(16).padStart(2, "0");
    })
    .join("")}`;
};

const buildChartData = (monthlyTotals: MonthlyTotal[]): ChartDataPoint[] => {
  return monthlyTotals.map((monthlyTotal, monthIndex) => {
    const fill = BAR_COLORS[monthIndex % BAR_COLORS.length];

    return {
      ...monthlyTotal,
      fill,
      targetFill: invertHexColor(fill),
    };
  });
};

const TargetMarker = ({ cx, cy, payload }: TargetMarkerProps) => {
  if (typeof cx !== "number" || typeof cy !== "number") {
    return null;
  }

  const stroke = payload?.targetFill ?? "#111827";

  return (
    <g>
      <line
        x1={cx - 40}
        x2={cx + 40}
        y1={cy}
        y2={cy}
        stroke="#ffffff"
        strokeWidth={7}
        strokeLinecap="round"
      />

      <line
        x1={cx - 35}
        x2={cx + 35}
        y1={cy}
        y2={cy}
        stroke={stroke}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </g>
  );
};

export const MonthlyBarChart = ({
  title,
  monthlyTotals,
  showTargets = false,
}: MonthlyBarChartProps) => {
  const chartData = buildChartData(monthlyTotals);

  return (
    <Paper sx={{ padding: 3, height: 500, paddingBottom: 5 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>

      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <XAxis dataKey="monthLabel" />

          <YAxis
            tickFormatter={(value) => {
              return `$${roundCurrency(Number(value)).toFixed(0)}`;
            }}
          />

          <Tooltip
            formatter={(value, name) => {
              const label =
                name === "total"
                  ? "Actual"
                  : name === "targetTotal"
                    ? "Target"
                    : String(name);

              return [formatCurrency(Number(value ?? 0)), label];
            }}
          />

          <Bar
            dataKey="total"
            name="Actual"
            shape={(props) => {
              const fill =
                typeof props.payload?.fill === "string"
                  ? props.payload.fill
                  : BAR_COLORS[0];

              return (
                <rect
                  x={props.x}
                  y={props.y}
                  width={props.width}
                  height={props.height}
                  fill={fill}
                  stroke="#ffffff"
                  strokeWidth={1.5}
                  rx={2}
                />
              );
            }}
          />

          {showTargets ? (
            <Scatter
              dataKey="targetTotal"
              name="Target"
              shape={<TargetMarker />}
            />
          ) : null}

          <ReferenceLine y={0} stroke="#94a3b8" />
        </ComposedChart>
      </ResponsiveContainer>
    </Paper>
  );
};
