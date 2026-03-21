import Dexie, { type Table } from "dexie";

import type { Transaction } from "../features/transactions/types";

export class BudgetAppDb extends Dexie {
    transactions!: Table<Transaction, number>;

    constructor() {
        super("budgetAppDb");

        this.version(1).stores({
            transactions: "++id,&fingerprint,date,amount,description",
        });
    }
}

export const db = new BudgetAppDb();