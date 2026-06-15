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

type CategoryBarChartItem = {
  categoryName: string;
  actual: number;
  target: number;
};

type ChartDataPoint = CategoryBarChartItem & {
  fill: string;
  targetFill: string;
};

type CategoryBarChartProps = {
  title: string;
  items: CategoryBarChartItem[];
};

type TargetMarkerProps = {
  cx?: number;
  cy?: number;
  payload?: ChartDataPoint;
};

type ActualBarProps = {
  x?: number;
  y?: number;
  width?: number;
  height?: number;
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

const buildChartData = (items: CategoryBarChartItem[]): ChartDataPoint[] => {
  return items.map((item, itemIndex) => {
    const fill = BAR_COLORS[itemIndex % BAR_COLORS.length];

    return {
      ...item,
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
        x1={cx - 32}
        x2={cx + 32}
        y1={cy}
        y2={cy}
        stroke="#ffffff"
        strokeWidth={7}
        strokeLinecap="round"
      />

      <line
        x1={cx - 29}
        x2={cx + 29}
        y1={cy}
        y2={cy}
        stroke={stroke}
        strokeWidth={3}
        strokeLinecap="round"
      />
    </g>
  );
};

const ActualBar = (props: ActualBarProps) => {
  const { x, y, width, height, payload } = props;

  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    typeof width !== "number" ||
    typeof height !== "number"
  ) {
    return null;
  }

  return (
    <rect
      x={x}
      y={y}
      width={width}
      height={height}
      fill={payload?.fill ?? BAR_COLORS[0]}
      stroke="#ffffff"
      strokeWidth={1.5}
      rx={2}
    />
  );
};

export const CategoryBarChart = ({ title, items }: CategoryBarChartProps) => {
  const chartData = buildChartData(items);

  if (chartData.length === 0) {
    return null;
  }

  return (
    <Paper sx={{ padding: 3, height: 500, paddingBottom: 5 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>

      <ResponsiveContainer width="100%" height="100%">
        <ComposedChart data={chartData}>
          <XAxis
            dataKey="categoryName"
            interval={0}
            angle={-25}
            textAnchor="end"
            height={80}
          />

          <YAxis
            tickFormatter={(value) => {
              return `$${roundCurrency(Number(value)).toFixed(0)}`;
            }}
          />

          <Tooltip
            labelFormatter={(label) => {
              return String(label);
            }}
            formatter={(value, name) => {
              const label =
                name === "actual"
                  ? "Actual"
                  : name === "target"
                    ? "Target"
                    : name === "categoryName"
                      ? ""
                      : String(name);

              if (name === "categoryName") {
                return null;
              }

              return [formatCurrency(Number(value ?? 0)), label];
            }}
          />

          <Bar dataKey="actual" name="Actual" shape={<ActualBar />} />

          <Scatter dataKey="target" name="Target" shape={<TargetMarker />} />

          <ReferenceLine y={0} stroke="#94a3b8" />
        </ComposedChart>
      </ResponsiveContainer>
    </Paper>
  );
};

