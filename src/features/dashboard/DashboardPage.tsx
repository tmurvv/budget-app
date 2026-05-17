import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import { Box, Button, Paper, Typography } from "@mui/material";
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

const formatCompactCurrency = (amount: number) => {
  return `$${roundCurrency(amount).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

const getMonthKey = (date: string) => {
  const transactionDate = new Date(date);

  return `${transactionDate.getFullYear()}-${String(
    transactionDate.getMonth() + 1,
  ).padStart(2, "0")}`;
};

const formatMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split("-");

  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "long",
    },
  );
};

const getSubCategoryTotalsByCategory = (
  transactions: Array<{
    amount: number;
    category?: string;
    subCategory?: string;
  }>,
) => {
  const result = new Map<string, Map<string, number>>();

  for (const transaction of transactions) {
    const category = transaction.category?.trim() || "Uncategorized";
    const subCategory = transaction.subCategory?.trim() || "Unassigned";

    if (!result.has(category)) {
      result.set(category, new Map());
    }

    const subCategoryMap = result.get(category)!;
    const current = subCategoryMap.get(subCategory) ?? 0;

    subCategoryMap.set(
      subCategory,
      roundCurrency(current + Math.abs(transaction.amount)),
    );
  }

  const final: Record<string, Array<{ name: string; total: number }>> = {};

  for (const [category, subCategoryMap] of result.entries()) {
    final[category] = Array.from(subCategoryMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((firstSubCategory, secondSubCategory) => {
        return secondSubCategory.total - firstSubCategory.total;
      });
  }

  return final;
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
    const monthKey = getMonthKey(transaction.date);
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

const getAvailableMonths = (
  transactions: Array<{
    date: string;
  }>,
) => {
  const uniqueMonths = new Set<string>();

  for (const transaction of transactions) {
    uniqueMonths.add(getMonthKey(transaction.date));
  }

  return Array.from(uniqueMonths).sort((firstMonth, secondMonth) => {
    return firstMonth.localeCompare(secondMonth);
  });
};

const groupSmallCategories = (
  categories: Array<{ name: string; total: number }>,
  threshold = 40,
) => {
  const largeCategories = categories.filter((category) => {
    return category.total >= threshold;
  });

  const smallCategories = categories.filter((category) => {
    return category.total < threshold;
  });

  if (smallCategories.length === 0) {
    return categories;
  }

  const otherTotal = roundCurrency(
    smallCategories.reduce((runningTotal, category) => {
      return runningTotal + category.total;
    }, 0),
  );

  return [...largeCategories, { name: "Other", total: otherTotal }];
};

export const DashboardPage = () => {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(
    null,
  );

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

    const monthlyTotals = getMonthlyTotals(spendingTransactions);
    const availableMonths = getAvailableMonths(spendingTransactions);

    return {
      totalSpending,
      totalIncome,
      uncategorizedCount,
      monthlyTotals,
      availableMonths,
      spendingTransactions,
    };
  }, [transactions]);

  const normalizedSelectedMonthIndex =
    selectedMonthIndex === null
      ? Math.max(dashboardData.availableMonths.length - 1, 0)
      : Math.min(
          Math.max(selectedMonthIndex, 0),
          Math.max(dashboardData.availableMonths.length - 1, 0),
        );

  const selectedMonth =
    dashboardData.availableMonths[normalizedSelectedMonthIndex] ?? "";

  const monthlySpendingTransactions = dashboardData.spendingTransactions.filter(
    (transaction) => {
      if (!selectedMonth) {
        return true;
      }

      return getMonthKey(transaction.date) === selectedMonth;
    },
  );

  const monthlyCategoryTotals = groupSmallCategories(
    getCategoryTotals(monthlySpendingTransactions),
  );

  const monthlySubCategoryTotalsByCategory = getSubCategoryTotalsByCategory(
    monthlySpendingTransactions,
  );

  const handlePreviousMonth = () => {
    setSelectedMonthIndex((currentIndex) => {
      const safeCurrentIndex =
        currentIndex === null
          ? Math.max(dashboardData.availableMonths.length - 1, 0)
          : currentIndex;

      return Math.max(safeCurrentIndex - 1, 0);
    });
  };

  const handleNextMonth = () => {
    setSelectedMonthIndex((currentIndex) => {
      const safeCurrentIndex =
        currentIndex === null
          ? Math.max(dashboardData.availableMonths.length - 1, 0)
          : currentIndex;

      return Math.min(
        safeCurrentIndex + 1,
        Math.max(dashboardData.availableMonths.length - 1, 0),
      );
    });
  };

  const CustomPieTooltip = ({
    active,
    payload,
    subCategoryTotals,
  }: {
    active?: boolean;
    payload?: Array<{ name: string; value: number }>;
    subCategoryTotals: Record<string, Array<{ name: string; total: number }>>;
  }) => {
    if (!active || !payload || !payload.length) {
      return null;
    }

    const categoryName = payload[0].name;
    const value = payload[0].value;

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
        <Typography variant="subtitle2" sx={{ marginBottom: 1 }}>
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
        <Paper sx={{ padding: 3, height: 500, paddingBottom: 5 }}>
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
              onClick={handlePreviousMonth}
              disabled={normalizedSelectedMonthIndex <= 0}
            >
              ◀ Previous
            </Button>

            <Typography variant="h5" align="center">
              Spending by Category —{" "}
              {selectedMonth ? formatMonthLabel(selectedMonth) : "No Data"}
            </Typography>

            <Button
              variant="outlined"
              onClick={handleNextMonth}
              disabled={
                normalizedSelectedMonthIndex >=
                dashboardData.availableMonths.length - 1
              }
            >
              Next ▶
            </Button>
          </Box>

          <ResponsiveContainer width="100%" height="70%">
            <PieChart margin={{ top: 40, right: 30, bottom: 0, left: 30 }}>
              <Pie
                data={monthlyCategoryTotals}
                dataKey="total"
                nameKey="name"
                outerRadius={130}
                label={({ name, value }) =>
                  `${name} ${formatCompactCurrency(Number(value))}`
                }
                labelLine
              >
                {monthlyCategoryTotals.map((categoryTotal, categoryIndex) => (
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
                    subCategoryTotals={monthlySubCategoryTotalsByCategory}
                  />
                )}
              />
            </PieChart>
          </ResponsiveContainer>
        </Paper>

        <Paper sx={{ padding: 3, height: 500, paddingBottom: 5 }}>
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
                formatter={(value) => {
                  return formatCurrency(Number(value ?? 0));
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
