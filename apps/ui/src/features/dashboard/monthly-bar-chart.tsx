import { Paper, Typography } from "@mui/material";
import {
  Bar,
  BarChart,
  Rectangle,
  ResponsiveContainer,
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

type MonthlyBarChartProps = {
  title: string;
  monthlyTotals: MonthlyTotal[];
};

const buildChartData = (monthlyTotals: MonthlyTotal[]) => {
  return monthlyTotals.map((monthlyTotal, monthIndex) => {
    return {
      ...monthlyTotal,
      fill: BAR_COLORS[monthIndex % BAR_COLORS.length],
    };
  });
};

export const MonthlyBarChart = ({
  title,
  monthlyTotals,
}: MonthlyBarChartProps) => {
  const chartData = buildChartData(monthlyTotals);

  return (
    <Paper sx={{ padding: 3, height: 500, paddingBottom: 5 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData}>
          <XAxis dataKey="monthLabel" />

          <YAxis
            tickFormatter={(value) => {
              return `$${roundCurrency(Number(value)).toFixed(0)}`;
            }}
          />

          <Tooltip
            formatter={(value) => {
              return formatCurrency(Number(value ?? 0));
            }}
          />

          <Bar
            dataKey="total"
            shape={(props) => {
              const fill =
                typeof props.payload?.fill === "string"
                  ? props.payload.fill
                  : BAR_COLORS[0];

              return <Rectangle {...props} fill={fill} />;
            }}
          />
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};
