export type DashboardTransaction = {
  id?: number;
  date: string;
  amount: number;
  category?: string;
  subCategory?: string;
};

export type MonthlyTotal = {
  month: string;
  monthLabel: string;
  total: number;
};

export type CategoryTotal = {
  name: string;
  total: number;
};

export type SubCategoryTotalsByCategory = Record<
  string,
  Array<{ name: string; total: number }>
>;

export type BudgetStatus = {
  categoryName: string;
  subCategoryName?: string;
  budget: number;
  actual: number;
  remaining: number;
  isOverBudget: boolean;
};

export type BudgetViewMode = "category" | "subCategory";
