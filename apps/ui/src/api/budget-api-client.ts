import type { Transaction } from "../features/transactions/types";

const API_BASE_URL = "http://localhost:8050";

export const getTransactions = async () => {
  const response = await fetch(`${API_BASE_URL}/transactions`);

  if (!response.ok) {
    throw new Error("Failed to fetch transactions");
  }

  return response.json() as Promise<Transaction[]>;
};

export const migrateIndexedDbData = async ({
  transactions,
  categories,
  subCategories,
  categoryRules,
  budgets,
  transactionAllocations,
}: {
  transactions: Transaction[];
  categories: unknown[];
  subCategories: unknown[];
  categoryRules: unknown[];
  budgets: unknown[];
  transactionAllocations: unknown[];
}) => {
  const response = await fetch(`${API_BASE_URL}/migration/import-indexed-db`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transactions,
      categories,
      subCategories,
      categoryRules,
      budgets,
      transactionAllocations,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to migrate IndexedDB data");
  }

  return response.json();
};

export const addTransaction = async (transaction: Transaction) => {
  const response = await fetch(`${API_BASE_URL}/transactions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(transaction),
  });

  if (!response.ok) {
    throw new Error("Failed to add transaction");
  }

  return response.json() as Promise<Transaction>;
};

export const updateTransaction = async (
  transactionId: number,
  transaction: Partial<Transaction>,
) => {
  const response = await fetch(
    `${API_BASE_URL}/transactions/${transactionId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(transaction),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to update transaction");
  }
};

export const deleteTransaction = async (transactionId: number) => {
  const response = await fetch(
    `${API_BASE_URL}/transactions/${transactionId}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to delete transaction");
  }
};