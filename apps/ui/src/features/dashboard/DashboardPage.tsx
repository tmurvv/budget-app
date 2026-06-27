import { useEffect, useMemo, useState } from "react";
import { Box, Paper, Typography } from "@mui/material";

import {
  formatCurrency,
  formatMonthLabel,
  getMonthKey,
  roundCurrency,
} from "./dashboard-formatters";
import { MonthlyBarChart } from "./monthly-bar-chart";
import {
  getBudgets,
  getTransactionAllocations,
  getTransactions,
} from "../../api/budget-api-client";
import { MONTHLY_INCOME } from "../budgeting/budget-values";
import { CategoryPieChart } from "./category-pie-chart";
import { BudgetStatusTable } from "./budget-status-table";
import type { BudgetViewMode } from "./dashboard-types";
import {
  getAllocatedMonthlyTotals,
  getAvailableMonths,
  getBudgetStatuses,
  getCategoryTotals,
  getEffectiveMonthlySpendingTransactions,
  getMonthlyTotals,
  getSubCategoryBudgetStatuses,
  getSubCategoryTotalsByCategory,
  groupSmallCategories,getCategoryActualTargetItems,
} from "./dashboard-helpers";
import { CategoryBarChart } from "./category-bar-chart";
import type { Transaction } from "../transactions/types";
import type { Budget } from "../budgeting/types";
import type { TransactionAllocation } from "../transactions/types";

const cardStyles = {
  padding: 3,
  minHeight: 120,
  display: "flex",
  flexDirection: "column",
  justifyContent: "center",
  textAlign: "center",
} as const;

export const DashboardPage = ({
  onNavigateToCategory,
}: {
  onNavigateToCategory?: (category: string) => void;
}) => {
  const [selectedMonthIndex, setSelectedMonthIndex] = useState<number | null>(
    null,
  );

  const [budgetViewMode, setBudgetViewMode] =
    useState<BudgetViewMode>("category");

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  const [transactionAllocations, setTransactionAllocations] = useState<
    TransactionAllocation[]
  >([]);

  const [budgets, setBudgets] = useState<Budget[]>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      const [loadedTransactions, loadedTransactionAllocations, loadedBudgets] =
        await Promise.all([
          getTransactions(),
          getTransactionAllocations(),
          getBudgets(),
        ]);

      setTransactions(loadedTransactions);
      setTransactionAllocations(loadedTransactionAllocations);
      setBudgets(loadedBudgets);
    };

    void loadDashboardData();
  }, []);

  const dashboardData = useMemo(() => {
    const spendingTransactions = transactions.filter((transaction) => {
      return transaction.amount > 0;
    });

    const incomeTransactions = transactions.filter((transaction) => {
      return transaction.amount < 0;
    });

    const uncategorizedCount = transactions.filter((transaction) => {
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
      transactionAllocations,
      selectedMonth,
    );

  const categoryActualTargetItems = getCategoryActualTargetItems(
    budgets,
    allocatedMonthlySpendingTransactions,
    selectedMonth,
  );

  const allocatedMonthlyTotals = getAllocatedMonthlyTotals(
    dashboardData.availableMonths,
    dashboardData.spendingTransactions,
    transactionAllocations,
    budgets,
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

  const monthlyTotalSpending = roundCurrency(
    allocatedMonthlySpendingTransactions.reduce((runningTotal, transaction) => {
      return runningTotal + transaction.amount;
    }, 0),
  );

  const monthlyTotalBudget = roundCurrency(
    budgets.reduce((runningTotal, budget) => {
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
    budgets,
    allocatedMonthlySpendingTransactions,
  );

  const subCategoryBudgetStatuses = getSubCategoryBudgetStatuses(
    budgets,
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
        <CategoryPieChart
          title="Gross Spending by Category"
          categoryTotals={grossMonthlyCategoryTotals}
          subCategoryTotals={grossMonthlySubCategoryTotalsByCategory}
          selectedMonth={selectedMonth}
          selectedMonthIndex={normalizedSelectedMonthIndex}
          maxMonthIndex={Math.max(dashboardData.availableMonths.length - 1, 0)}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
        />

        <MonthlyBarChart
          title="Gross Monthly Spending"
          monthlyTotals={dashboardData.monthlyTotals}
        />
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
        <CategoryPieChart
          title="Allocated Spending by Category"
          categoryTotals={allocatedMonthlyCategoryTotals}
          subCategoryTotals={allocatedMonthlySubCategoryTotalsByCategory}
          selectedMonth={selectedMonth}
          selectedMonthIndex={normalizedSelectedMonthIndex}
          maxMonthIndex={Math.max(dashboardData.availableMonths.length - 1, 0)}
          onPreviousMonth={handlePreviousMonth}
          onNextMonth={handleNextMonth}
        />

        <MonthlyBarChart
          title="Allocated Monthly Spending"
          monthlyTotals={allocatedMonthlyTotals}
          showTargets
        />
      </Box>
      <Box
        sx={{
          maxWidth: 1200,
          marginLeft: "auto",
          marginRight: "auto",
          marginTop: 3,
          marginBottom: 3,
        }}
      >
        <CategoryBarChart
          title="Category Spending vs Target"
          items={categoryActualTargetItems}
          onCategoryClick={onNavigateToCategory}
        />
      </Box>
      <BudgetStatusTable
        budgetViewMode={budgetViewMode}
        monthlyBudgetStatuses={monthlyBudgetStatuses}
        monthlyTotalSpending={monthlyTotalSpending}
        monthlyTotalBudget={monthlyTotalBudget}
        monthlyBudgetRemaining={monthlyBudgetRemaining}
        onBudgetViewModeChange={setBudgetViewMode}
      />
    </Box>
  );
};
