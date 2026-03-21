import Papa from "papaparse";

import { db } from "../../db/db";
import { normalizeTransaction } from "../../lib/normalize-transaction";
import type { Transaction } from "./types";

type CsvRow = Record<string, string | undefined>;

type ImportTransactionsResult = {
  totalRowCount: number;
  insertedCount: number;
  duplicateCount: number;
  zeroRewardTransactions: Transaction[];
  notPostedTransactions: Transaction[];
};

const parseCsvFile = async (file: File) => {
  return new Promise<CsvRow[]>((resolve, reject) => {
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error) => {
        reject(error);
      },
    });
  });
};

const getPointsValue = (transaction: Transaction) => {
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

const buildZeroRewardTransactions = (transactions: Transaction[]) => {
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
      const pointsValue = Number(getPointsValue(transaction));
      return pointsValue > 0;
    });

    if (hasAnyPositivePoints) {
      continue;
    }

    zeroRewardTransactions.push(groupedTransactions[0]);
  }

  return zeroRewardTransactions;
};

export const importTransactionsFromCsvFile = async (
    file: File,
): Promise<ImportTransactionsResult> => {
  const parsedRows = await parseCsvFile(file);
  const normalizedTransactions = parsedRows.map(normalizeTransaction);

  const notPostedTransactions = normalizedTransactions.filter((transaction) => {
    return transaction.raw?.["Posted Date"] === "-";
  });

  const postedTransactions = normalizedTransactions.filter((transaction) => {
    return transaction.raw?.["Posted Date"] !== "-";
  });

  const { dedupedTransactions, duplicateCount } =
      dedupeTransactions(postedTransactions);

  const zeroRewardTransactions = buildZeroRewardTransactions(postedTransactions);

  await db.transactions.bulkPut(dedupedTransactions);

  return {
    totalRowCount: parsedRows.length,
    insertedCount: dedupedTransactions.length,
    duplicateCount,
    zeroRewardTransactions,
    notPostedTransactions,
  };
};