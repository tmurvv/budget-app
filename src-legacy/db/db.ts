import Dexie, { type Table } from "dexie";

import type { Transaction } from "../features/transactions/types";

export type CategoryRecord = {
  id?: number;
  name: string;
};

export type SubCategoryRecord = {
  id?: number;
  categoryName: string;
  name: string;
};

export type CategoryRuleRecord = {
  id?: number;
  matchValue: string;
  categoryName: string;
  subCategoryName?: string;
  priority: number;
  isActive: boolean;
};

export class BudgetAppDb extends Dexie {
  transactions!: Table<Transaction, number>;
  categories!: Table<CategoryRecord, number>;
  subCategories!: Table<SubCategoryRecord, number>;
  categoryRules!: Table<CategoryRuleRecord, number>;

  constructor() {
    super("budgetAppDb");

    this.version(4).stores({
      transactions:
        "++id,&fingerprint,date,amount,description,bank,category,subCategory,notes",
      categories: "++id,&name",
      subCategories: "++id, categoryName, [categoryName+name]",
      categoryRules: "++id, matchValue, categoryName, priority, isActive",
    });
  }
}

export const db = new BudgetAppDb();

if (typeof window !== "undefined") {
  (window as unknown as { db: typeof db }).db = db;
}
