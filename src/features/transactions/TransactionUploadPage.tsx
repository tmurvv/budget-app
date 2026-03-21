import { useState } from "react";
import { Box, Button, CircularProgress, Typography } from "@mui/material";

import { db } from "../../db/db";
import { TransactionTable } from "../../components/TransactionTable";
import { importTransactionsFromCsvFile } from "./transaction-service";
import type { Transaction } from "./types";

const getDisplayableZeroRewardTransactions = (transactions: Transaction[]) => {
  return transactions.filter((transaction) => {
    return transaction.description !== "Payment";
  });
};

export const TransactionUploadPage = () => {
  const [isImporting, setIsImporting] = useState(false);
  const [summaryText, setSummaryText] = useState("");
  const [zeroRewardNoticeText, setZeroRewardNoticeText] = useState("");
  const [notPostedNoticeText, setNotPostedNoticeText] = useState("");
  const [zeroRewardTransactions, setZeroRewardTransactions] = useState<
      Transaction[]
      >([]);
  const [notPostedTransactions, setNotPostedTransactions] = useState<
      Transaction[]
      >([]);

  const handleFileChange = async (
      event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const selectedFile = event.target.files?.[0];

    if (!selectedFile) {
      return;
    }

    try {
      setIsImporting(true);
      setSummaryText("");
      setZeroRewardNoticeText("");
      setNotPostedNoticeText("");
      setZeroRewardTransactions([]);
      setNotPostedTransactions([]);

      const result = await importTransactionsFromCsvFile(selectedFile);

      setSummaryText(
          `Imported ${result.insertedCount} new. Skipped ${result.duplicateCount} duplicates. Skipped ${result.notPostedTransactions.length} not posted (${result.totalRowCount} rows).`,
      );

      setZeroRewardTransactions(
          getDisplayableZeroRewardTransactions(result.zeroRewardTransactions),
      );
      setNotPostedTransactions(result.notPostedTransactions);

      if (result.notPostedTransactions.length > 0) {
        setNotPostedNoticeText(
            "The following transactions have not posted yet and were not imported.",
        );
      }

      if (result.zeroRewardTransactions.length > 0) {
        setZeroRewardNoticeText(
            "The following transactions received 0 reward points, please check their validity online.",
        );
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : "Import failed";
      setSummaryText(message);
      setZeroRewardNoticeText("");
      setNotPostedNoticeText("");
      setZeroRewardTransactions([]);
      setNotPostedTransactions([]);
    } finally {
      setIsImporting(false);
      event.target.value = "";
    }
  };

  const handleClearDb = async () => {
    await db.transactions.clear();
    setSummaryText("Database cleared");
    setZeroRewardNoticeText("");
    setNotPostedNoticeText("");
    setZeroRewardTransactions([]);
    setNotPostedTransactions([]);
  };

  return (
      <Box sx={{ padding: 4, textAlign: "center" }}>
        <Typography variant="h2" gutterBottom>
          Budget App
        </Typography>

        <Typography sx={{ marginBottom: 2 }}>
          Upload a credit card CSV file
        </Typography>

        <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
          <Button variant="contained" component="label" disabled={isImporting}>
            Upload CSV
            <input type="file" hidden accept=".csv" onChange={handleFileChange} />
          </Button>

          <Button
              variant="outlined"
              color="error"
              onClick={handleClearDb}
              disabled={isImporting}
          >
            Clear DB
          </Button>
        </Box>

        {isImporting ? (
            <Box sx={{ marginTop: 2 }}>
              <CircularProgress size={24} />
            </Box>
        ) : null}

        {summaryText ? (
            <Typography sx={{ marginTop: 2, whiteSpace: "pre-line" }}>
              {summaryText}
            </Typography>
        ) : null}

        {notPostedNoticeText ? (
            <Typography sx={{ marginTop: 3 }}>
              {notPostedNoticeText}
            </Typography>
        ) : null}

        <TransactionTable
            title="Transactions Not Yet Posted"
            transactions={notPostedTransactions}
        />

        {zeroRewardNoticeText ? (
            <Typography sx={{ marginTop: 3 }}>
              {zeroRewardNoticeText}
            </Typography>
        ) : null}

        <TransactionTable
            title="Transactions with 0 Reward Points"
            transactions={zeroRewardTransactions}
        />
      </Box>
  );
};