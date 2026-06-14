import type { Budget } from "../budgeting/types";
import {
  formatMonthLabel,
  getMonthKey,
  roundCurrency,
} from "./dashboard-formatters";
import type {
  BudgetStatus,
  CategoryTotal,
  DashboardTransaction,
  MonthlyTotal,
  SubCategoryTotalsByCategory,
} from "./dashboard-types";

export const getSubCategoryTotalsByCategory = (
  transactions: DashboardTransaction[],
): SubCategoryTotalsByCategory => {
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

  const final: SubCategoryTotalsByCategory = {};

  for (const [category, subCategoryMap] of result.entries()) {
    final[category] = Array.from(subCategoryMap.entries())
      .map(([name, total]) => ({ name, total }))
      .sort((first, second) => second.total - first.total);
  }

  return final;
};

export const getCategoryTotals = (
  transactions: DashboardTransaction[],
): CategoryTotal[] => {
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
    .map(([name, total]) => ({
      name,
      total: roundCurrency(total),
    }))
    .sort((first, second) => second.total - first.total);
};

export const getBudgetStatuses = (
  budgets: Budget[],
  transactions: DashboardTransaction[],
): BudgetStatus[] => {
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
    .sort((first, second) =>
      first.categoryName.localeCompare(second.categoryName),
    );
};

export const getSubCategoryBudgetStatuses = (
  budgets: Budget[],
  transactions: DashboardTransaction[],
): BudgetStatus[] => {
  return budgets
    .filter((budget) => Boolean(budget.subCategoryName))
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
    .sort((first, second) => {
      const categoryComparison = first.categoryName.localeCompare(
        second.categoryName,
      );

      if (categoryComparison !== 0) {
        return categoryComparison;
      }

      return (first.subCategoryName ?? "").localeCompare(
        second.subCategoryName ?? "",
      );
    });
};

export const getEffectiveMonthlySpendingTransactions = (
  transactions: DashboardTransaction[],
  transactionAllocations: Array<{
    transactionId: number;
    month: string;
    amount: number;
  }>,
  selectedMonth: string,
): DashboardTransaction[] => {
  const allocationMap = new Map<
    number,
    Array<{ month: string; amount: number }>
  >();

  for (const allocation of transactionAllocations) {
    const current = allocationMap.get(allocation.transactionId) ?? [];
    current.push(allocation);
    allocationMap.set(allocation.transactionId, current);
  }

  const result: DashboardTransaction[] = [];

  for (const transaction of transactions) {
    if (transaction.amount <= 0) {
      continue;
    }

    const allocations = transaction.id
      ? allocationMap.get(transaction.id)
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

export const getMonthlyTotals = (
  transactions: DashboardTransaction[],
): MonthlyTotal[] => {
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
    .map(([month, total]) => ({
      month,
      monthLabel: formatMonthLabel(month),
      total: roundCurrency(total),
    }))
    .sort((first, second) => first.month.localeCompare(second.month));
};

const getMonthlyBudgetTotal = (budgets: Budget[]) => {
  return roundCurrency(
    budgets.reduce((runningTotal, budget) => {
      return runningTotal + budget.amount;
    }, 0),
  );
};

const getMonthProgressRatio = (month: string) => {
  const today = new Date();
  const [year, monthNumber] = month.split("-").map(Number);

  const currentMonthKey = getMonthKey(today.toISOString());

  if (month < currentMonthKey) {
    return 1;
  }

  if (month > currentMonthKey) {
    return 0;
  }

  const daysInMonth = new Date(year, monthNumber, 0).getDate();

  return today.getDate() / daysInMonth;
};

const getProratedBudgetTotal = (budgets: Budget[], month: string) => {
  const monthlyBudgetTotal = getMonthlyBudgetTotal(budgets);
  const monthProgressRatio = getMonthProgressRatio(month);

  return roundCurrency(monthlyBudgetTotal * monthProgressRatio);
};

export const getAllocatedMonthlyTotals = (
  months: string[],
  transactions: DashboardTransaction[],
  transactionAllocations: Array<{
    transactionId: number;
    month: string;
    amount: number;
  }>,
  budgets: Budget[],
): MonthlyTotal[] => {
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
      targetTotal: getProratedBudgetTotal(budgets, month),
    };
  });
};

export const getAvailableMonths = (
  transactions: DashboardTransaction[],
): string[] => {
  const uniqueMonths = new Set<string>();

  for (const transaction of transactions) {
    uniqueMonths.add(getMonthKey(transaction.date));
  }

  return Array.from(uniqueMonths).sort((first, second) => {
    return first.localeCompare(second);
  });
};

export const groupSmallCategories = (
  categories: CategoryTotal[],
  threshold = 40,
): CategoryTotal[] => {
  const largeCategories = categories.filter(
    (category) => category.total >= threshold,
  );
  const smallCategories = categories.filter(
    (category) => category.total < threshold,
  );

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
