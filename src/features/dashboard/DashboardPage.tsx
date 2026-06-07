import { useMemo, useState } from "react";
import { useLiveQuery } from "dexie-react-hooks";
import {
  Box,
  Button,
  Paper,
  ToggleButtonGroup,
  ToggleButton,
  Typography,
} from "@mui/material";
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

import { db, type BudgetRecord } from "../../db/db";
import { MONTHLY_INCOME } from "../budgeting/budget-values";

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
  return `$${roundCurrency(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
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

    const subCategoryMap = result.get(category);

    if (!subCategoryMap) {
      continue;
    }

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

const getBudgetStatuses = (
  budgets: BudgetRecord[],
  transactions: Array<{
    amount: number;
    category?: string;
  }>,
) => {
  const categoryTotals = getCategoryTotals(transactions);

  const actualByCategory = new Map<string, number>();

  for (const categoryTotal of categoryTotals) {
    actualByCategory.set(categoryTotal.name, categoryTotal.total);
  }

  const budgetByCategory = new Map<string, number>();

  for (const budget of budgets) {
    const currentBudget = budgetByCategory.get(budget.categoryName) ?? 0;

    budgetByCategory.set(budget.categoryName, currentBudget + budget.amount);
  }

  return Array.from(budgetByCategory.entries())
    .map(([categoryName, budget]) => {
      const actual = actualByCategory.get(categoryName) ?? 0;

      const remaining = roundCurrency(budget - actual);

      return {
        categoryName,
        budget,
        actual,
        remaining,
        isOverBudget: remaining < 0,
      };
    })
    .sort((firstBudget, secondBudget) => {
      return firstBudget.categoryName.localeCompare(secondBudget.categoryName);
    });
};

const getEffectiveMonthlySpendingTransactions = (
  transactions: Array<{
    id?: number;
    date: string;
    amount: number;
    category?: string;
    subCategory?: string;
  }>,
  transactionAllocations: Array<{
    transactionId: number;
    month: string;
    amount: number;
  }>,
  selectedMonth: string,
) => {
  const allocationMap = new Map<
    number,
    Array<{ month: string; amount: number }>
  >();

  for (const allocation of transactionAllocations) {
    const current = allocationMap.get(allocation.transactionId) ?? [];

    current.push(allocation);

    allocationMap.set(allocation.transactionId, current);
  }

  const result: Array<{
    date: string;
    amount: number;
    category?: string;
    subCategory?: string;
  }> = [];

  for (const transaction of transactions) {
    if (transaction.amount <= 0) {
      continue;
    }

    const transactionId = transaction.id;

    const allocations = transactionId
      ? allocationMap.get(transactionId)
      : undefined;

    if (allocations && allocations.length > 0) {
      const matchingAllocation = allocations.find((allocation) => {
        return allocation.month === selectedMonth;
      });

      if (matchingAllocation) {
        result.push({
          date: `${matchingAllocation.month}-01`,
          amount: matchingAllocation.amount,
          category: transaction.category,
          subCategory: transaction.subCategory,
        });
      }

      continue;
    }

    if (getMonthKey(transaction.date) === selectedMonth) {
      result.push(transaction);
    }
  }

  return result;
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

const getAllocatedMonthlyTotals = (
  months: string[],
  transactions: Array<{
    id?: number;
    date: string;
    amount: number;
    category?: string;
    subCategory?: string;
  }>,
  transactionAllocations: Array<{
    transactionId: number;
    month: string;
    amount: number;
  }>,
) => {
  return months.map((month) => {
    const monthlyTransactions = getEffectiveMonthlySpendingTransactions(
      transactions,
      transactionAllocations,
      month,
    );

    const total = monthlyTransactions.reduce((runningTotal, transaction) => {
      return runningTotal + Math.abs(transaction.amount);
    }, 0);

    return {
      month,
      monthLabel: formatMonthLabel(month),
      total: roundCurrency(total),
    };
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

const getSubCategoryBudgetStatuses = (
  budgets: BudgetRecord[],
  transactions: Array<{
    amount: number;
    category?: string;
    subCategory?: string;
  }>,
) => {
  return budgets
    .filter((budget) => {
      return Boolean(budget.subCategoryName);
    })
    .map((budget) => {
      const actual = roundCurrency(
        transactions
          .filter((transaction) => {
            return (
              transaction.category === budget.categoryName &&
              transaction.subCategory === budget.subCategoryName
            );
          })
          .reduce((runningTotal, transaction) => {
            return runningTotal + Math.abs(transaction.amount);
          }, 0),
      );

      const remaining = roundCurrency(budget.amount - actual);

      return {
        categoryName: budget.categoryName,
        subCategoryName: budget.subCategoryName ?? "",
        budget: budget.amount,
        actual,
        remaining,
        isOverBudget: remaining < 0,
      };
    })
    .sort((firstBudget, secondBudget) => {
      const categoryComparison = firstBudget.categoryName.localeCompare(
        secondBudget.categoryName,
      );

      if (categoryComparison !== 0) {
        return categoryComparison;
      }

      return firstBudget.subCategoryName.localeCompare(
        secondBudget.subCategoryName,
      );
    });
};

export const DashboardPage = () => {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(
    null,
  );
  const [budgetViewMode, setBudgetViewMode] = useState<
    "category" | "subCategory"
  >("category");

  const transactions = useLiveQuery(async () => {
    return db.transactions.toArray();
  }, []);

  const transactionAllocations = useLiveQuery(async () => {
    return db.transactionAllocations.toArray();
  }, []);

  const budgets = useLiveQuery(async () => {
    return db.budgets.toArray();
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

  const grossMonthlySpendingTransactions =
    dashboardData.spendingTransactions.filter((transaction) => {
      return getMonthKey(transaction.date) === selectedMonth;
    });

  const allocatedMonthlySpendingTransactions =
    getEffectiveMonthlySpendingTransactions(
      dashboardData.spendingTransactions,
      transactionAllocations ?? [],
      selectedMonth,
    );

  const allocatedMonthlyTotals = getAllocatedMonthlyTotals(
    dashboardData.availableMonths,
    dashboardData.spendingTransactions,
    transactionAllocations ?? [],
  );

  const grossMonthlyCategoryTotals = groupSmallCategories(
    getCategoryTotals(grossMonthlySpendingTransactions),
  );

  const allocatedMonthlyCategoryTotals = groupSmallCategories(
    getCategoryTotals(allocatedMonthlySpendingTransactions),
  );

  const grossMonthlySubCategoryTotalsByCategory =
    getSubCategoryTotalsByCategory(grossMonthlySpendingTransactions);

  const allocatedMonthlySubCategoryTotalsByCategory =
    getSubCategoryTotalsByCategory(allocatedMonthlySpendingTransactions);

  const budgetRecords = budgets ?? [];

  const monthlyTotalSpending = roundCurrency(
    allocatedMonthlySpendingTransactions.reduce((runningTotal, transaction) => {
      return runningTotal + transaction.amount;
    }, 0),
  );

  const monthlyTotalBudget = roundCurrency(
    budgetRecords.reduce((runningTotal, budget) => {
      return runningTotal + budget.amount;
    }, 0),
  );

  const monthlyIncomeRemaining = roundCurrency(
    MONTHLY_INCOME - monthlyTotalSpending,
  );

  const monthlyBudgetRemaining = roundCurrency(
    monthlyTotalBudget - monthlyTotalSpending,
  );

  const categoryBudgetStatuses = getBudgetStatuses(
    budgetRecords,
    allocatedMonthlySpendingTransactions,
  );

  const subCategoryBudgetStatuses = getSubCategoryBudgetStatuses(
    budgetRecords,
    allocatedMonthlySpendingTransactions,
  );

  const monthlyBudgetStatuses =
    budgetViewMode === "category"
      ? categoryBudgetStatuses
      : subCategoryBudgetStatuses;

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
    payload?: ReadonlyArray<{
      name?: string;
      value?: number;
    }>;
    subCategoryTotals: Record<string, Array<{ name: string; total: number }>>;
  }) => {
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

  const renderCategoryPieChart = (
    title: string,
    categoryTotals: Array<{ name: string; total: number }>,
    subCategoryTotals: Record<string, Array<{ name: string; total: number }>>,
  ) => {
    return (
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
            {title} —{" "}
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

  const renderMonthlyBarChart = (
    title: string,
    monthlyTotals: Array<{ month: string; monthLabel: string; total: number }>,
  ) => {
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

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Dashboard
      </Typography>

      <Typography variant="h5" gutterBottom align="center">
        {selectedMonth ? formatMonthLabel(selectedMonth) : "Current Month"}
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(4, minmax(200px, 1fr))",
          gap: 3,
          maxWidth: 1200,
          marginLeft: "auto",
          marginRight: "auto",
          marginBottom: 4,
        }}
      >
        <Paper sx={cardStyles}>
          <Typography variant="h6" gutterBottom>
            Monthly Income
          </Typography>
          <Typography variant="h4">{formatCurrency(MONTHLY_INCOME)}</Typography>
        </Paper>

        <Paper sx={cardStyles}>
          <Typography variant="h6" gutterBottom>
            Allocated Monthly Spending
          </Typography>
          <Typography variant="h4">
            {formatCurrency(monthlyTotalSpending)}
          </Typography>
        </Paper>

        <Paper sx={cardStyles}>
          <Typography variant="h6" gutterBottom>
            Cash Remaining
          </Typography>
          <Typography variant="h4">
            {formatCurrency(monthlyIncomeRemaining)}
          </Typography>
        </Paper>

        <Paper sx={cardStyles}>
          <Typography variant="h6" gutterBottom>
            Budget Status
          </Typography>
          <Typography variant="h4">
            {monthlyBudgetRemaining < 0
              ? `${formatCurrency(Math.abs(monthlyBudgetRemaining))} over`
              : `${formatCurrency(monthlyBudgetRemaining)} left`}
          </Typography>
        </Paper>
      </Box>

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
            Gross Total Spending
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
          marginBottom: 4,
        }}
      >
        {renderCategoryPieChart(
          "Gross Spending by Category",
          grossMonthlyCategoryTotals,
          grossMonthlySubCategoryTotalsByCategory,
        )}

        {renderMonthlyBarChart(
          "Gross Monthly Spending",
          dashboardData.monthlyTotals,
        )}
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
        {renderCategoryPieChart(
          "Allocated Spending by Category",
          allocatedMonthlyCategoryTotals,
          allocatedMonthlySubCategoryTotalsByCategory,
        )}

        {renderMonthlyBarChart(
          "Allocated Monthly Spending",
          allocatedMonthlyTotals,
        )}
      </Box>

      <Paper
        sx={{
          padding: 3,
          maxWidth: 1200,
          marginLeft: "auto",
          marginRight: "auto",
          marginY: 4,
        }}
      >
        <Box
          sx={{
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 2,
          }}
        >
          <Typography variant="h6">
            {budgetViewMode === "category"
              ? "Budget by Category"
              : "Budget by Sub-category"}
          </Typography>

          <ToggleButtonGroup
            exclusive
            size="small"
            value={budgetViewMode}
            onChange={(_, nextViewMode: "category" | "subCategory" | null) => {
              if (!nextViewMode) {
                return;
              }

              setBudgetViewMode(nextViewMode);
            }}
          >
            <ToggleButton value="category">Category</ToggleButton>
            <ToggleButton value="subCategory">Sub-category</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {monthlyBudgetStatuses.map((budgetStatus) => (
          <Box
            key={`${budgetStatus.categoryName}-${budgetStatus.subCategoryName ?? ""}`}
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr repeat(3, 120px)",
              gap: 2,
              paddingTop: 1,
              paddingBottom: 1,
              borderBottom: "1px solid #eee",
            }}
          >
            <Typography>
              {budgetViewMode === "category"
                ? budgetStatus.categoryName
                : `${budgetStatus.categoryName} / ${budgetStatus.subCategoryName}`}
            </Typography>
            <Typography align="right">
              {formatCurrency(budgetStatus.actual)}
            </Typography>
            <Typography align="right">
              {formatCurrency(budgetStatus.budget)}
            </Typography>
            <Typography
              align="right"
              whiteSpace="nowrap"
              color={budgetStatus.isOverBudget ? "error" : "text.primary"}
            >
              {budgetStatus.isOverBudget
                ? `${formatCurrency(Math.abs(budgetStatus.remaining))} over`
                : `${formatCurrency(budgetStatus.remaining)} left`}
            </Typography>
          </Box>
        ))}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr repeat(3, 120px)",
            gap: 2,
            paddingTop: 2,
            fontWeight: "bold",
          }}
        >
          <Typography fontWeight="bold">Total</Typography>
          <Typography align="right" fontWeight="bold">
            {formatCurrency(monthlyTotalSpending)}
          </Typography>
          <Typography align="right" fontWeight="bold">
            {formatCurrency(monthlyTotalBudget)}
          </Typography>
          <Typography align="right" fontWeight="bold" whiteSpace="nowrap">
            {monthlyBudgetRemaining < 0
              ? `${formatCurrency(Math.abs(monthlyBudgetRemaining))} over`
              : `${formatCurrency(monthlyBudgetRemaining)} left`}
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};
