import { db } from "../../db/db";

import { INITIAL_BUDGETS } from "./budget-values";

export const seedBudgets = async () => {
  for (const budget of INITIAL_BUDGETS) {
    const existingBudget = await db.budgets
      .filter((currentBudget) => {
        return (
          currentBudget.categoryName === budget.categoryName &&
          (currentBudget.subCategoryName ?? "") ===
            (budget.subCategoryName ?? "")
        );
      })
      .first();

    if (!existingBudget) {
      await db.budgets.add({
        categoryName: budget.categoryName,
        subCategoryName: budget.subCategoryName,
        amount: budget.amount,
      });
    }
  }
};
