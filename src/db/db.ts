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

export type BudgetRecord = {
  id?: number;
  categoryName: string;
  subCategoryName?: string;
  amount: number;
};

export type TransactionAllocation = {
  id?: number;
  transactionId: number;
  month: string;
  amount: number;
};

export class BudgetAppDb extends Dexie {
  transactions!: Table<Transaction, number>;
  categories!: Table<CategoryRecord, number>;
  subCategories!: Table<SubCategoryRecord, number>;
  categoryRules!: Table<CategoryRuleRecord, number>;
  budgets!: Table<BudgetRecord, number>;
  transactionAllocations!: Table<TransactionAllocation, number>;

  constructor() {
    super("budgetAppDb");

    this.version(4).stores({
      transactions:
        "++id,&fingerprint,date,amount,description,bank,category,subCategory,notes",
      categories: "++id,&name",
      subCategories: "++id, categoryName, [categoryName+name]",
      categoryRules: "++id, matchValue, categoryName, priority, isActive",
    });

    this.version(5).stores({
      transactions:
        "++id,&fingerprint,date,amount,description,bank,category,subCategory,notes",
      categories: "++id,&name",
      subCategories: "++id, categoryName, [categoryName+name]",
      categoryRules: "++id, matchValue, categoryName, priority, isActive",
      budgets: "++id,&categoryName,amount",
    });

    this.version(6).stores({
      transactions:
        "++id,&fingerprint,date,amount,description,bank,category,subCategory,notes",
      categories: "++id,&name",
      subCategories: "++id, categoryName, [categoryName+name]",
      categoryRules: "++id, matchValue, categoryName, priority, isActive",
      budgets: "++id,&categoryName,amount",
      transactionAllocations: "++id, transactionId, month",
    });

    this.version(7).stores({
      transactions:
        "++id,&fingerprint,date,amount,description,bank,category,subCategory,notes",
      categories: "++id,&name",
      subCategories: "++id, categoryName, [categoryName+name]",
      categoryRules: "++id, matchValue, categoryName, priority, isActive",
      budgets:
        "++id, categoryName, subCategoryName, [categoryName+subCategoryName]",
      transactionAllocations: "++id, transactionId, month",
    });
  }
}

export const db = new BudgetAppDb();

if (typeof window !== "undefined") {
  (window as unknown as { db: typeof db }).db = db;
}
