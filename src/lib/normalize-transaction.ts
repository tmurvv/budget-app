import { createTransactionFingerprint } from "./create-transaction-fingerprint";

type CsvTransactionRow = Record<string, string | undefined>;

const getFirstValue = (row: CsvTransactionRow, candidateKeys: string[]) => {
    for (const candidateKey of candidateKeys) {
        const value = row[candidateKey];

        if (typeof value === "string" && value.trim().length > 0) {
            return value.trim();
        }
    }

    return "";
};

const normalizeAmount = (rawAmount: string) => {
    const cleanedAmount = rawAmount.replaceAll(",", "").replace("$", "").trim();
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

export const normalizeTransaction = (row: CsvTransactionRow) => {
    const date = normalizeDate(
        getFirstValue(row, ["date", "Date", "transaction date", "Transaction Date"]),
    );

    const amount = normalizeAmount(
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

    if (description.length === 0) {
        throw new Error("Missing description");
    }

    const fingerprint = createTransactionFingerprint({
        date,
        amount,
        description,
    });

    return {
        date,
        amount,
        description,
        fingerprint,
        raw: row,
    };
};