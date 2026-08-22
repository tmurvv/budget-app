import type { Transaction } from "../features/transactions/types";
import type { CategoryRule } from "../features/rules/types";

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
  subCategories,
  categoryRules,
  budgets,
  transactionAllocations,
}: {
  transactions: Transaction[];
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

export const addTransactions = async (transactions: Transaction[]) => {
  const response = await fetch(`${API_BASE_URL}/transactions/bulk`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      transactions,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to add transactions");
  }

  return response.json() as Promise<{
    insertedCount: number;
    duplicateCount: number;
  }>;
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

export const getBudgets = async () => {
  const response = await fetch(`${API_BASE_URL}/budgets`);

  if (!response.ok) {
    throw new Error("Failed to fetch budgets");
  }

  return response.json();
};

export const getSubCategories = async () => {
  const response = await fetch(`${API_BASE_URL}/sub-categories`);

  if (!response.ok) {
    throw new Error("Failed to fetch sub-categories");
  }

  return response.json();
};
export const updateBudget = async (budgetId: number, amount: number) => {
  const response = await fetch(`${API_BASE_URL}/budgets/${budgetId}`, {
    method: "PATCH",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      amount,
    }),
  });

  if (!response.ok) {
    throw new Error("Failed to update budget");
  }
};

export const addBudget = async (budget: {
  id: number;
  categoryName: string;
  subCategoryName?: string;
  amount: number;
}) => {
  const response = await fetch(`${API_BASE_URL}/budgets`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(budget),
  });

  if (!response.ok) {
    throw new Error("Failed to add budget");
  }

  return response.json();
};
export const addSubCategory = async (subCategory: {
  id: number;
  categoryName: string;
  name: string;
}) => {
  const response = await fetch(`${API_BASE_URL}/sub-categories`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(subCategory),
  });

  if (!response.ok) {
    throw new Error("Failed to add sub-category");
  }

  return response.json();
};

export const updateSubCategory = async (
  subCategoryId: number,
  updates: Record<string, unknown>,
) => {
  const response = await fetch(
    `${API_BASE_URL}/sub-categories/${subCategoryId}`,
    {
      method: "PATCH",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(updates),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to update sub-category");
  }
};

export const deleteSubCategory = async (subCategoryId: number) => {
  const response = await fetch(
    `${API_BASE_URL}/sub-categories/${subCategoryId}`,
    {
      method: "DELETE",
    },
  );

  if (!response.ok) {
    throw new Error("Failed to delete sub-category");
  }
};

export const saveTransactionSplit = async (
  transactionId: number,
  allocations: Array<{
    transactionId: number;
    month: string;
    amount: number;
  }>,
) => {
  const response = await fetch(
    `${API_BASE_URL}/transactions/${transactionId}/split`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        allocations,
      }),
    },
  );

  if (!response.ok) {
    throw new Error("Failed to save transaction split");
  }
};

export const getTransactionAllocations = async () => {
  const response = await fetch(`${API_BASE_URL}/transaction-allocations`);

  if (!response.ok) {
    throw new Error("Failed to fetch transaction allocations");
  }

  return response.json();
};

export const getRules = async (): Promise<CategoryRule[]> => {
  const response = await fetch(`${API_BASE_URL}/rules`);

  if (!response.ok) {
    throw new Error("Failed to fetch rules");
  }

  return response.json() as Promise<CategoryRule[]>;
};

export const addRule = async (rule: CategoryRule) => {
  const response = await fetch(`${API_BASE_URL}/rules`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(rule),
  });

  if (!response.ok) {
    throw new Error("Failed to add rule");
  }

  return response.json() as Promise<CategoryRule>;
};
