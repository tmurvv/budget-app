import Dexie, { type Table } from "dexie";

import type { Transaction } from "../features/transactions/types";

export type CategoryRecord = {
  id?: number;
  name: string;
};

export class BudgetAppDb extends Dexie {
  transactions!: Table<Transaction, number>;
  categories!: Table<CategoryRecord, number>;

  constructor() {
    super("budgetAppDb");

    this.version(1).stores({
      transactions: "++id,&fingerprint,date,amount,description,category,subCategory",
      categories: "++id,&name",
    });
  }
}

export const db = new BudgetAppDb();