import { Box, Button, Paper, Typography } from "@mui/material";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

import {
  formatCompactCurrency,
  formatCurrency,
  formatMonthLabel,
} from "./dashboard-formatters";
import type {
  CategoryTotal,
  SubCategoryTotalsByCategory,
} from "./dashboard-types";

const PIE_COLORS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#ec4899",
  "#14b8a6",
];

type CustomPieTooltipProps = {
  active?: boolean;
  payload?: ReadonlyArray<{
    name?: string;
    value?: number;
  }>;
  subCategoryTotals: SubCategoryTotalsByCategory;
};

const CustomPieTooltip = ({
  active,
  payload,
  subCategoryTotals,
}: CustomPieTooltipProps) => {
  if (!active || !payload || !payload.length) {
    return null;
  }

  const categoryName = payload[0]?.name ?? "Unknown";

  const value = Number(payload[0]?.value ?? 0);

  if (categoryName === "Other") {
    return (
      <Box
        sx={{
          backgroundColor: "lightgray",
          color: "black",
          padding: 2,
          borderRadius: 1,
          minWidth: 220,
        }}
      >
        <Typography variant="subtitle2">
          Other — {formatCurrency(value)}
        </Typography>
      </Box>
    );
  }

  const subCategories = subCategoryTotals[categoryName] ?? [];

  return (
    <Box
      sx={{
        backgroundColor: "lightgray",
        color: "black",
        padding: 2,
        borderRadius: 1,
        minWidth: 220,
      }}
    >
      <Typography
        variant="subtitle2"
        sx={{
          marginBottom: 1,
        }}
      >
        {categoryName} — {formatCurrency(value)}
      </Typography>

      {subCategories.slice(0, 6).map((subCategory) => (
        <Box
          key={subCategory.name}
          sx={{
            display: "flex",
            justifyContent: "space-between",
            fontSize: 12,
          }}
        >
          <span>{subCategory.name}</span>

          <span>{formatCurrency(subCategory.total)}</span>
        </Box>
      ))}
    </Box>
  );
};

type CategoryPieChartProps = {
  title: string;
  categoryTotals: CategoryTotal[];
  subCategoryTotals: SubCategoryTotalsByCategory;
  selectedMonth: string;
  selectedMonthIndex: number;
  maxMonthIndex: number;
  onPreviousMonth: () => void;
  onNextMonth: () => void;
};

export const CategoryPieChart = ({
  title,
  categoryTotals,
  subCategoryTotals,
  selectedMonth,
  selectedMonthIndex,
  maxMonthIndex,
  onPreviousMonth,
  onNextMonth,
}: CategoryPieChartProps) => {
  return (
    <Paper
      sx={{
        padding: 3,
        height: 500,
        paddingBottom: 5,
      }}
    >
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "auto 1fr auto",
          alignItems: "center",
          gap: 2,
          marginBottom: 2,
        }}
      >
        <Button
          variant="outlined"
          onClick={onPreviousMonth}
          disabled={selectedMonthIndex <= 0}
        >
          ◀ Previous
        </Button>

        <Typography variant="h5" align="center">
          {title} —{" "}
          {selectedMonth ? formatMonthLabel(selectedMonth) : "No Data"}
        </Typography>

        <Button
          variant="outlined"
          onClick={onNextMonth}
          disabled={selectedMonthIndex >= maxMonthIndex}
        >
          Next ▶
        </Button>
      </Box>

      <ResponsiveContainer width="100%" height="70%">
        <PieChart
          margin={{
            top: 40,
            right: 30,
            bottom: 0,
            left: 30,
          }}
        >
          <Pie
            data={categoryTotals}
            dataKey="total"
            nameKey="name"
            outerRadius={130}
            label={({ name, value }) =>
              `${name} ${formatCompactCurrency(Number(value))}`
            }
            labelLine
          >
            {categoryTotals.map((categoryTotal, categoryIndex) => (
              <Cell
                key={categoryTotal.name}
                fill={PIE_COLORS[categoryIndex % PIE_COLORS.length]}
              />
            ))}
          </Pie>

          <Tooltip
            content={(props) => (
              <CustomPieTooltip
                {...props}
                subCategoryTotals={subCategoryTotals}
              />
            )}
          />
        </PieChart>
      </ResponsiveContainer>
    </Paper>
  );
};
