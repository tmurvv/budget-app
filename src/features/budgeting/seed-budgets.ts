import { db } from "../../db/db";

import { INITIAL_BUDGETS } from "./budget-values";

export const seedBudgets = async () => {
  for (const budget of INITIAL_BUDGETS) {
    const existingBudget = await db.budgets
      .where("categoryName")
      .equals(budget.categoryName)
      .first();

    if (!existingBudget) {
      await db.budgets.add({
        categoryName: budget.categoryName,
        amount: budget.amount,
      });
    }
  }
};
