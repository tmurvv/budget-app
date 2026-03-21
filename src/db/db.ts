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

export class BudgetAppDb extends Dexie {
  transactions!: Table<Transaction, number>;
  categories!: Table<CategoryRecord, number>;
  subCategories!: Table<SubCategoryRecord, number>;

  constructor() {
    super("budgetAppDb");

    this.version(2).stores({
      transactions: "++id,&fingerprint,date,amount,description,category,subCategory,notes",
      categories: "++id,&name",
      subCategories: "++id, categoryName, [categoryName+name]",
    });
  }
}

export const db = new BudgetAppDb();