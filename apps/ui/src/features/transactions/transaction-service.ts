import Papa from "papaparse";

import type { Transaction } from "./types";
import { addTransactions, getRules } from "../../api/budget-api-client";

type CsvRow = Record<string, string | undefined>;

type ImportTransactionsResult = {
  totalRowCount: number;
  insertedCount: number;
  duplicateCount: number;
  zeroRewardTransactions: Transaction[];
  notPostedTransactions: Transaction[];
};

type BankCode = "MAN" | "RBC" | "ONE";

type BankFormat = "rewardsCard" | "alternateBank" | "manulifeOne";

type BankFormatConfig = {
  bank: BankCode;
  bankFormat: BankFormat;
  supportsPoints: boolean;
  supportsPostedDate: boolean;
};

type RawCsvRow = string[];

const parseCsvFile = async (file: File) => {
  return new Promise<CsvRow[]>((resolve, reject) => {
    Papa.parse<RawCsvRow>(file, {
      header: false,
      skipEmptyLines: true,
      complete: (results) => {
        const rows = results.data;

        const firstRow = rows[0] ?? [];

        const isManulifeOne = firstRow[0]?.startsWith("Manulife One Account");

        if (isManulifeOne) {
          resolve(
            rows.map((row) => ({
              Account: row[0],
              Date: row[1],
              Amount: row[2],
              Description: row[3],
            })),
          );

          return;
        }

        const headers = firstRow;

        resolve(
          rows.slice(1).map((row) => {
            return headers.reduce<CsvRow>((result, header, index) => {
              result[header] = row[index];

              return result;
            }, {});
          }),
        );
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

const getFirstValue = (row: CsvRow, candidateKeys: string[]) => {
  for (const candidateKey of candidateKeys) {
    const value = row[candidateKey];

    if (typeof value === "string" && value.trim().length > 0) {
      return value.trim();
    }
  }

  return "";
};

const parseRawAmount = (rawAmount: string) => {
  const cleanedAmount = rawAmount
    .replaceAll(",", "")
    .replaceAll("$", "")
    .trim();

  const parsedAmount = Number(cleanedAmount);

  if (Number.isNaN(parsedAmount)) {
    throw new Error(`Invalid amount: ${rawAmount}`);
  }

  return parsedAmount;
};

const normalizeDate = (rawDate: string) => {
  const parsedDate = new Date(rawDate);

  if (Number.isNaN(parsedDate.getTime())) {
    throw new Error(`Invalid date: ${rawDate}`);
  }

  return parsedDate.toISOString();
};

const createTransactionFingerprint = (params: {
  bank: BankCode;
  date: string;
  amount: number;
  description: string;
}) => {
  const normalizedBank = params.bank.trim().toLowerCase();
  const normalizedDate = params.date.trim().toLowerCase();
  const normalizedAmount = params.amount.toFixed(2);
  const normalizedDescription = params.description.trim().toLowerCase();

  return [
    normalizedBank,
    normalizedDate,
    normalizedAmount,
    normalizedDescription,
  ].join("|");
};

const detectBankFormat = (row: CsvRow): BankFormatConfig => {
  const rowKeys = Object.keys(row);

  const hasManulifeOneShape =
    rowKeys.includes("Account") &&
    rowKeys.includes("Date") &&
    rowKeys.includes("Amount") &&
    rowKeys.includes("Description");

  if (hasManulifeOneShape) {
    return {
      bank: "ONE",
      bankFormat: "manulifeOne",
      supportsPoints: false,
      supportsPostedDate: false,
    };
  }

  const hasManShape =
    rowKeys.includes("Posted Date") ||
    rowKeys.includes("Points") ||
    rowKeys.includes("Description");

  if (hasManShape) {
    return {
      bank: "MAN",
      bankFormat: "rewardsCard",
      supportsPoints: true,
      supportsPostedDate: true,
    };
  }

  const hasRbcShape =
    rowKeys.includes("Description 1") &&
    rowKeys.includes("Description 2") &&
    (rowKeys.includes("CAD$") || rowKeys.includes("USD$"));

  if (hasRbcShape) {
    return {
      bank: "RBC",
      bankFormat: "alternateBank",
      supportsPoints: false,
      supportsPostedDate: false,
    };
  }

  throw new Error(
    `Unsupported CSV format. Found columns: ${rowKeys.join(", ")}`,
  );
};

const normalizeManTransaction = (
  row: CsvRow,
  bankFormatConfig: BankFormatConfig,
): Transaction => {
  const date = normalizeDate(
    getFirstValue(row, [
      "date",
      "Date",
      "transaction date",
      "Transaction Date",
    ]),
  );

  const amount = parseRawAmount(
    getFirstValue(row, ["amount", "Amount", "posted amount", "Posted Amount"]),
  );

  const description = getFirstValue(row, [
    "description",
    "Description",
    "merchant",
    "Merchant",
    "details",
    "Details",
  ]);

  if (!description) {
    throw new Error("Missing description");
  }

  const fingerprint = createTransactionFingerprint({
    bank: bankFormatConfig.bank,
    date,
    amount,
    description,
  });

  return {
    bank: bankFormatConfig.bank,
    date,
    amount,
    description,
    fingerprint,
    raw: row,
  };
};
const normalizeManulifeOneTransaction = (
  row: CsvRow,
  bankFormatConfig: BankFormatConfig,
): Transaction => {
  const date = normalizeDate(getFirstValue(row, ["Date"]));

  const parsedAmount = parseRawAmount(getFirstValue(row, ["Amount"]));

  const amount = parsedAmount * -1;

  const description = getFirstValue(row, ["Description"]);

  if (!description) {
    throw new Error("Missing description");
  }

  const fingerprint = createTransactionFingerprint({
    bank: bankFormatConfig.bank,
    date,
    amount,
    description,
  });

  return {
    bank: bankFormatConfig.bank,
    date,
    amount,
    description,
    fingerprint,
    raw: row,
  };
};
const normalizeRbcTransaction = (
  row: CsvRow,
  bankFormatConfig: BankFormatConfig,
): Transaction => {
  const date = normalizeDate(getFirstValue(row, ["Transaction Date", "Date"]));

  const rawAmount = getFirstValue(row, ["CAD$", "USD$"]);

  const parsedAmount = parseRawAmount(rawAmount);

  const amount = parsedAmount * -1;

  const descriptionOne = getFirstValue(row, ["Description 1"]);
  const descriptionTwo = getFirstValue(row, ["Description 2"]);

  const description = [descriptionOne, descriptionTwo]
    .filter((value) => value.length > 0)
    .join(" - ");

  if (!description) {
    throw new Error("Missing description");
  }

  const fingerprint = createTransactionFingerprint({
    bank: bankFormatConfig.bank,
    date,
    amount,
    description,
  });

  return {
    bank: bankFormatConfig.bank,
    date,
    amount,
    description,
    fingerprint,
    raw: row,
  };
};

const normalizeTransactionForBank = (
  row: CsvRow,
  bankFormatConfig: BankFormatConfig,
) => {
  if (bankFormatConfig.bankFormat === "rewardsCard") {
    return normalizeManTransaction(row, bankFormatConfig);
  }

  if (bankFormatConfig.bankFormat === "manulifeOne") {
    return normalizeManulifeOneTransaction(row, bankFormatConfig);
  }

  return normalizeRbcTransaction(row, bankFormatConfig);
};

const getPointsValue = (
  transaction: Transaction,
  bankFormatConfig: BankFormatConfig,
) => {
  if (!bankFormatConfig.supportsPoints) {
    return null;
  }

  return transaction.raw?.Points ?? transaction.raw?.points ?? "";
};

const dedupeTransactions = (transactions: Transaction[]) => {
  const seenFingerprints = new Set<string>();
  const dedupedTransactions: Transaction[] = [];
  let duplicateCount = 0;

  for (const transaction of transactions) {
    if (seenFingerprints.has(transaction.fingerprint)) {
      duplicateCount += 1;
      continue;
    }

    seenFingerprints.add(transaction.fingerprint);
    dedupedTransactions.push(transaction);
  }

  return {
    dedupedTransactions,
    duplicateCount,
  };
};

const buildZeroRewardTransactions = (
  transactions: Transaction[],
  bankFormatConfig: BankFormatConfig,
) => {
  if (!bankFormatConfig.supportsPoints) {
    return [];
  }

  const transactionsByFingerprint = new Map<string, Transaction[]>();

  for (const transaction of transactions) {
    const existingTransactions =
      transactionsByFingerprint.get(transaction.fingerprint) ?? [];

    existingTransactions.push(transaction);
    transactionsByFingerprint.set(
      transaction.fingerprint,
      existingTransactions,
    );
  }

  const zeroRewardTransactions: Transaction[] = [];

  for (const groupedTransactions of transactionsByFingerprint.values()) {
    const hasAnyPositivePoints = groupedTransactions.some((transaction) => {
      const pointsValue = Number(
        getPointsValue(transaction, bankFormatConfig) ?? "",
      );

      return pointsValue > 0;
    });

    if (hasAnyPositivePoints) {
      continue;
    }

    zeroRewardTransactions.push(groupedTransactions[0]);
  }

  return zeroRewardTransactions;
};

const normalizeText = (value: string) => {
  return value.trim().toUpperCase();
};

const findCategoryFromRules = async ({
  description,
}: {
  description: string;
}) => {
  const normalizedDescription = normalizeText(description);

  const rules = (await getRules())
    .filter((rule) => {
      return rule.isActive;
    })
    .sort((firstRule, secondRule) => {
      return firstRule.priority - secondRule.priority;
    });

  for (const rule of rules) {
    const normalizedMatchValue = normalizeText(rule.matchValue);

    if (normalizedDescription.includes(normalizedMatchValue)) {
      return rule;
    }
  }

  return null;
};

export const importTransactionsFromCsvFile = async (
  file: File,
): Promise<ImportTransactionsResult> => {
  const parsedRows = await parseCsvFile(file);

  if (parsedRows.length === 0) {
    return {
      totalRowCount: 0,
      insertedCount: 0,
      duplicateCount: 0,
      zeroRewardTransactions: [],
      notPostedTransactions: [],
    };
  }

  const firstNonEmptyRow = parsedRows.find((row) => {
    return Object.values(row).some((value) => {
      return typeof value === "string" && value.trim().length > 0;
    });
  });

  if (!firstNonEmptyRow) {
    return {
      totalRowCount: 0,
      insertedCount: 0,
      duplicateCount: 0,
      zeroRewardTransactions: [],
      notPostedTransactions: [],
    };
  }

  const bankFormatConfig = detectBankFormat(firstNonEmptyRow);

  const normalizedTransactions = await Promise.all(
    parsedRows.map(async (row) => {
      const normalizedTransaction = normalizeTransactionForBank(
        row,
        bankFormatConfig,
      );

      const matchedRule = await findCategoryFromRules({
        description: normalizedTransaction.description,
      });

      return {
        ...normalizedTransaction,
        category: matchedRule?.categoryName ?? "",
        subCategory: matchedRule?.subCategoryName ?? "",
      };
    }),
  );

  const notPostedTransactions = bankFormatConfig.supportsPostedDate
    ? normalizedTransactions.filter((transaction) => {
        return transaction.raw?.["Posted Date"] === "-";
      })
    : [];

  const postedTransactions = bankFormatConfig.supportsPostedDate
    ? normalizedTransactions.filter((transaction) => {
        return transaction.raw?.["Posted Date"] !== "-";
      })
    : normalizedTransactions;

  const { dedupedTransactions, duplicateCount } =
    dedupeTransactions(postedTransactions);

  const zeroRewardTransactions = buildZeroRewardTransactions(
    postedTransactions,
    bankFormatConfig,
  );

  const importResult = await addTransactions(dedupedTransactions);

  return {
    totalRowCount: parsedRows.length,
    insertedCount: importResult.insertedCount,
    duplicateCount,
    zeroRewardTransactions,
    notPostedTransactions,
  };
};
