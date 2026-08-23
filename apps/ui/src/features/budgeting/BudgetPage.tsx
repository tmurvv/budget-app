import {
  Box,
  Paper,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import { useEffect, useState } from "react";
import { startCase } from "lodash";

import {
  addBudget,
  getBudgets,
  getSubCategories,
  updateBudget,
} from "../../api/budget-api-client";
import { MONTHLY_INCOME } from "./budget-values";

type Budget = {
  id?: number;
  categoryName: string;
  subCategoryName?: string;
  amount: number;
};

type SubCategory = {
  id?: number;
  categoryName: string;
  name: string;
};

const formatCurrency = (amount: number) => {
  return amount.toLocaleString(undefined, {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const parseBudgetAmount = (value: string) => {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return 0;
  }

  return amount;
};

const getBudgetAmount = (
  budgets: Budget[],
  categoryName: string,
  subCategoryName?: string,
) => {
  const budget = budgets.find((currentBudget) => {
    return (
      currentBudget.categoryName === categoryName &&
      (currentBudget.subCategoryName ?? "") === (subCategoryName ?? "")
    );
  });

  return budget?.amount ?? 0;
};

const getCategoryBudgetTotals = (budgets: Budget[]) => {
  const totals = new Map<string, number>();

  for (const budget of budgets) {
    if (!budget.subCategoryName) {
      continue;
    }

    totals.set(
      budget.categoryName,
      (totals.get(budget.categoryName) ?? 0) + budget.amount,
    );
  }

  return Array.from(totals.entries()).map(([categoryName, amount]) => ({
    categoryName,
    amount,
  }));
};

const getNextBudgetId = (budgets: Budget[]) => {
  const maxId = budgets.reduce((currentMaxId, budget) => {
    return Math.max(currentMaxId, budget.id ?? 0);
  }, 0);

  return maxId + 1;
};

export const BudgetPage = () => {
  const [budgetViewMode, setBudgetViewMode] = useState<
    "category" | "subCategory"
  >("category");
  const [editableBudgets, setEditableBudgets] = useState<Budget[]>([]);
  const [subCategories, setSubCategories] = useState<SubCategory[]>([]);

  useEffect(() => {
    const loadBudgetData = async () => {
      const [loadedBudgets, loadedSubCategories] = await Promise.all([
        getBudgets() as Promise<Budget[]>,
        getSubCategories() as Promise<SubCategory[]>,
      ]);

      setEditableBudgets(loadedBudgets);
      setSubCategories(loadedSubCategories);
    };

    void loadBudgetData();
  }, []);

  const totalBudget = getCategoryBudgetTotals(editableBudgets).reduce(
    (runningTotal, budget) => {
      return runningTotal + budget.amount;
    },
    0,
  );

  const remainingIncome = MONTHLY_INCOME - totalBudget;

  return (
    <Box
      sx={{
        padding: 4,
        maxWidth: 900,
        marginLeft: "auto",
        marginRight: "auto",
      }}
    >
      <Typography variant="h4" gutterBottom align="center">
        Budget
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(3, 1fr)",
          gap: 2,
          marginBottom: 3,
        }}
      >
        <Paper sx={{ padding: 2, textAlign: "center" }}>
          <Typography variant="subtitle2">Monthly Income</Typography>
          <Typography variant="h5">{formatCurrency(MONTHLY_INCOME)}</Typography>
        </Paper>

        <Paper sx={{ padding: 2, textAlign: "center" }}>
          <Typography variant="subtitle2">Budgeted Spending</Typography>
          <Typography variant="h5">{formatCurrency(totalBudget)}</Typography>
        </Paper>

        <Paper sx={{ padding: 2, textAlign: "center" }}>
          <Typography variant="subtitle2">Income After Budget</Typography>
          <Typography variant="h5">
            {formatCurrency(remainingIncome)}
          </Typography>
        </Paper>
      </Box>

      <Paper sx={{ padding: 3 }}>
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
          sx={{ marginBottom: 2, backgroundColor: "background.paper" }}
        >
          <ToggleButton value="category">Category</ToggleButton>
          <ToggleButton value="subCategory">Sub-category</ToggleButton>
        </ToggleButtonGroup>

        {budgetViewMode === "category"
          ? getCategoryBudgetTotals(editableBudgets).map((budget) => (
              <Box
                key={budget.categoryName}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "1fr 180px",
                  gap: 2,
                  alignItems: "center",
                  marginBottom: 2,
                }}
              >
                <Typography>{budget.categoryName}</Typography>

                <TextField
                  label="Monthly Budget"
                  type="number"
                  size="small"
                  value={budget.amount}
                  disabled
                />
              </Box>
            ))
          : subCategories.map((subCategory) => {
              const existingBudget = editableBudgets.find((budget) => {
                return (
                  budget.categoryName === subCategory.categoryName &&
                  (budget.subCategoryName ?? "") === subCategory.name
                );
              });

              return (
                <Box
                  key={`${subCategory.categoryName}-${subCategory.name}`}
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 180px",
                    gap: 2,
                    alignItems: "center",
                    marginBottom: 2,
                  }}
                >
                  <Typography>
                    {startCase(subCategory.categoryName)} / {startCase(subCategory.name)}
                  </Typography>

                  <TextField
                    label="Monthly Budget"
                    type="number"
                    size="small"
                    value={getBudgetAmount(
                      editableBudgets,
                      subCategory.categoryName,
                      subCategory.name,
                    )}
                    onChange={(event) => {
                      const amount = parseBudgetAmount(event.target.value);

                      setEditableBudgets((currentBudgets) => {
                        const hasExistingBudget = currentBudgets.some(
                          (budget) => {
                            return (
                              budget.categoryName ===
                                subCategory.categoryName &&
                              (budget.subCategoryName ?? "") ===
                                subCategory.name
                            );
                          },
                        );

                        if (!hasExistingBudget) {
                          return [
                            ...currentBudgets,
                            {
                              id: getNextBudgetId(currentBudgets),
                              categoryName: subCategory.categoryName,
                              subCategoryName: subCategory.name,
                              amount,
                            },
                          ];
                        }

                        return currentBudgets.map((budget) => {
                          const isMatchingBudget =
                            budget.categoryName === subCategory.categoryName &&
                            (budget.subCategoryName ?? "") === subCategory.name;

                          if (!isMatchingBudget) {
                            return budget;
                          }

                          return {
                            ...budget,
                            amount,
                          };
                        });
                      });
                    }}
                    onBlur={() => {
                      const budgetToSave = editableBudgets.find((budget) => {
                        return (
                          budget.categoryName === subCategory.categoryName &&
                          (budget.subCategoryName ?? "") === subCategory.name
                        );
                      });

                      if (!budgetToSave) {
                        return;
                      }

                      if (existingBudget?.id) {
                        void updateBudget(
                          existingBudget.id,
                          budgetToSave.amount,
                        );
                        return;
                      }

                      void addBudget({
                        id: budgetToSave.id ?? getNextBudgetId(editableBudgets),
                        categoryName: subCategory.categoryName,
                        subCategoryName: subCategory.name,
                        amount: budgetToSave.amount,
                      });
                    }}
                  />
                </Box>
              );
            })}

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr 180px",
            gap: 2,
            alignItems: "center",
            paddingTop: 2,
            borderTop: "1px solid #ddd",
          }}
        >
          <Typography fontWeight="bold">Total</Typography>

          <TextField
            label="Monthly Budget"
            type="number"
            size="small"
            value={totalBudget}
            disabled
          />
        </Box>
      </Paper>
    </Box>
  );
};
