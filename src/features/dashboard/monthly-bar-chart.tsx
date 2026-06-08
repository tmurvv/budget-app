import { Paper, Typography } from "@mui/material";
import {
  Bar,
  BarChart,
  Cell,
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

export const MonthlyBarChart = ({
  title,
  monthlyTotals,
}: MonthlyBarChartProps) => {
  return (
    <Paper sx={{ padding: 3, height: 500, paddingBottom: 5 }}>
      <Typography variant="h6" gutterBottom>
        {title}
      </Typography>

      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={monthlyTotals}>
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

          <Bar dataKey="total">
            {monthlyTotals.map((monthlyTotal, monthIndex) => (
              <Cell
                key={monthlyTotal.month}
                fill={BAR_COLORS[monthIndex % BAR_COLORS.length]}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Paper>
  );
};
