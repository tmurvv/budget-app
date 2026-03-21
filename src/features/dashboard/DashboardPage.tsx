import { useMemo } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Box, Paper, Typography } from "@mui/material";
import {
  Bar,
  BarChart,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { db } from "../../db/db";

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

const cardStyles = {
  padding: 3,
  minHeight: 120,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  textAlign: "center",
} as const;

const getSubCategoryTotalsByCategory = (transactions) => {
  const result = new Map();

  for (const transaction of transactions) {
    const category = transaction.category?.trim() || "Uncategorized";
    const subCategory = transaction.subCategory?.trim() || "Unassigned";

    if (!result.has(category)) {
      result.set(category, new Map());
    }

    const subMap = result.get(category);
    const current = subMap.get(subCategory) ?? 0;

    subMap.set(
      subCategory,
      Math.round((current + Math.abs(transaction.amount)) * 100) / 100,
    );
  }

  const final = {};

  for (const [category, subMap] of result.entries()) {
    final[category] = Array.from(subMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((a, b) => b.total - a.total);
  }

  return final;
};

const roundCurrency = (amount: number) => {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
};

const formatCurrency = (amount: number) => {
  return roundCurrency(amount).toLocaleString(undefined, {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const formatMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split("-");
  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "short",
    },
  );
};

const getCategoryTotals = (
  transactions: Array<{
    amount: number;
    category?: string;
  }>,
) => {
  const categoryTotals = new Map<string, number>();

  for (const transaction of transactions) {
    const categoryName = transaction.category?.trim() || "Uncategorized";
    const currentTotal = categoryTotals.get(categoryName) ?? 0;

    categoryTotals.set(
      categoryName,
      roundCurrency(currentTotal + Math.abs(transaction.amount)),
    );
  }

  return Array.from(categoryTotals.entries())
    .map(([name, total]) => {
      return {
        name,
        total: roundCurrency(total),
      };
    })
    .sort((firstCategory, secondCategory) => {
      return secondCategory.total - firstCategory.total;
    });
};

const getMonthlyTotals = (
  transactions: Array<{
    date: string;
    amount: number;
  }>,
) => {
  const monthlyTotals = new Map<string, number>();

  for (const transaction of transactions) {
    const transactionDate = new Date(transaction.date);
    const monthKey = `${transactionDate.getFullYear()}-${String(
      transactionDate.getMonth() + 1,
    ).padStart(2, "0")}`;
    const currentTotal = monthlyTotals.get(monthKey) ?? 0;

    monthlyTotals.set(
      monthKey,
      roundCurrency(currentTotal + Math.abs(transaction.amount)),
    );
  }

  return Array.from(monthlyTotals.entries())
    .map(([month, total]) => {
      return {
        month,
        monthLabel: formatMonthLabel(month),
        total: roundCurrency(total),
      };
    })
    .sort((firstMonth, secondMonth) => {
      return firstMonth.month.localeCompare(secondMonth.month);
    });
};

export const DashboardPage = () => {
  const transactions = useLiveQuery(async () => {
    return db.transactions.toArray();
  }, []);

  const dashboardData = useMemo(() => {
    const allTransactions = transactions ?? [];

    const spendingTransactions = allTransactions.filter((transaction) => {
      return transaction.amount > 0;
    });

    const incomeTransactions = allTransactions.filter((transaction) => {
      return transaction.amount < 0;
    });

    const uncategorizedCount = allTransactions.filter((transaction) => {
      return !transaction.category || !transaction.subCategory;
    }).length;

    const totalSpending = roundCurrency(
      spendingTransactions.reduce((runningTotal, transaction) => {
        return runningTotal + transaction.amount;
      }, 0),
    );

    const totalIncome = roundCurrency(
      incomeTransactions.reduce((runningTotal, transaction) => {
        return runningTotal + Math.abs(transaction.amount);
      }, 0),
    );

    return {
      totalSpending,
      totalIncome,
      uncategorizedCount,
      categoryTotals: getCategoryTotals(spendingTransactions),
      monthlyTotals: getMonthlyTotals(spendingTransactions),
      subCategoryTotals: getSubCategoryTotalsByCategory(spendingTransactions),
    };
  }, [transactions]);

  const CustomPieTooltip = ({ active, payload, subCategoryTotals }) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    const categoryName = payload[0].name;
    const value = payload[0].value;

    const subCategories = subCategoryTotals[categoryName] ?? [];

    return (
      <Box
        sx={{
          backgroundColor: "lightgray",
          color: "black",
          padding: 2,
          borderRadius: 1,
          minWidth: 200,
        }}
      >
        <Typography variant="subtitle2" sx={{ marginBottom: 1 }}>
          {categoryName} — {formatCurrency(value)}
        </Typography>

        {subCategories.slice(0, 6).map((sub) => (
          <Box
            key={sub.name}
            sx={{
              display: "flex",
              justifyContent: "space-between",
              fontSize: 12,
            }}
          >
            <span>{sub.name}</span>
            <span>{formatCurrency(sub.total)}</span>
          </Box>
        ))}
      </Box>
    );
  };

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Dashboard
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, minmax(220px, 1fr))",
          gap: 3,
          maxWidth: 1200,
          marginLeft: "auto",
          marginRight: "auto",
          marginBottom: 4,
        }}
      >
        <Paper sx={cardStyles}>
          <Typography variant="h6" gutterBottom>
            Total Spending
          </Typography>
          <Typography variant="h4">
            {formatCurrency(dashboardData.totalSpending)}
          </Typography>
        </Paper>

        <Paper sx={cardStyles}>
          <Typography variant="h6" gutterBottom>
            Total Income
          </Typography>
          <Typography variant="h4">
            {formatCurrency(dashboardData.totalIncome)}
          </Typography>
        </Paper>

        <Paper sx={cardStyles}>
          <Typography variant="h6" gutterBottom>
            Uncategorized Count
          </Typography>
          <Typography variant="h4">
            {dashboardData.uncategorizedCount}
          </Typography>
        </Paper>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: 3,
          maxWidth: 1200,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <Paper sx={{ padding: 3, height: 420 }}>
          <Typography variant="h6" gutterBottom>
            Spending by Category
          </Typography>

          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={dashboardData.categoryTotals}
                dataKey="total"
                nameKey="name"
                outerRadius={130}
                label={({ value }) => formatCurrency(Number(value))}
                labelLine
              >
                {dashboardData.categoryTotals.map(
                  (categoryTotal, categoryIndex) => (
                    <Cell
                      key={categoryTotal.name}
                      fill={PIE_COLORS[categoryIndex % PIE_COLORS.length]}
                    />
                  ),
                )}
              </Pie>
              <Tooltip
                content={(props) => (
                  <CustomPieTooltip
                    {...props}
                    subCategoryTotals={dashboardData.subCategoryTotals}
                  />
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </Paper>

        <Paper sx={{ padding: 3, height: 420 }}>
          <Typography variant="h6" gutterBottom>
            Monthly Spending
          </Typography>

          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={dashboardData.monthlyTotals}>
              <XAxis dataKey="monthLabel" />
              <YAxis
                tickFormatter={(value) => {
                  return `$${roundCurrency(Number(value)).toFixed(0)}`;
                }}
              />
              <Tooltip
                formatter={(value: number) => {
                  return formatCurrency(value);
                }}
              />
              <Bar dataKey="total">
                {dashboardData.monthlyTotals.map((monthlyTotal, monthIndex) => (
                  <Cell
                    key={monthlyTotal.month}
                    fill={BAR_COLORS[monthIndex % BAR_COLORS.length]}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </Paper>
      </Box>
    </Box>
  );
};
