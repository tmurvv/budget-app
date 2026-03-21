import Papa from "papaparse";

import { db } from "../../db/db";
import { normalizeTransaction } from "../../lib/normalize-transaction";

type CsvRow = Record<string, string | undefined>;

export const importTransactionsFromCsvFile = async (file: File) => {
    const parsedRows = await parseCsvFile(file);
    const normalizedTransactions = parsedRows.map(normalizeTransaction);

    let insertedCount = 0;
    let duplicateCount = 0;

    const zeroRewardTransactions: any[] = [];

    for (const normalizedTransaction of normalizedTransactions) {
        const rewardValue =
            normalizedTransaction.raw?.["Points"] ??
            normalizedTransaction.raw?.["points"];

        if (rewardValue === "0") {
            zeroRewardTransactions.push(normalizedTransaction);
        }

        try {
            await db.transactions.add(normalizedTransaction);
            insertedCount += 1;
        } catch (error) {
            if (isDexieConstraintError(error)) {
                duplicateCount += 1;
                continue;
            }

            throw error;
        }
    }

    return {
        totalRowCount: parsedRows.length,
        insertedCount,
        duplicateCount,
        zeroRewardTransactions,
    };
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

const isDexieConstraintError = (error: unknown) => {
    return error instanceof Error && error.name === "ConstraintError";
};