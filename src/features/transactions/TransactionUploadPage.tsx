import { useState } from "react";
import {
    Box,
    Button,
    CircularProgress,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    Typography,
} from "@mui/material";

import { db } from "../../db/db";
import { importTransactionsFromCsvFile } from "./transaction-service";

type ZeroRewardTransaction = {
    date: string;
    amount: number;
    description: string;
};

export const TransactionUploadPage = () => {
    const [isImporting, setIsImporting] = useState(false);
    const [resultText, setResultText] = useState("");
    const [zeroRewardTransactions, setZeroRewardTransactions] = useState<ZeroRewardTransaction[]>([]);

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const selectedFile = event.target.files?.[0];

        if (!selectedFile) {
            return;
        }

        try {
            setIsImporting(true);
            setResultText("");
            setZeroRewardTransactions([]);

            const result = await importTransactionsFromCsvFile(selectedFile);

            let message = `Imported ${result.insertedCount} new. Skipped ${result.duplicateCount} duplicates (${result.totalRowCount} rows).`;

            setZeroRewardTransactions(result.zeroRewardTransactions);

            if (result.zeroRewardTransactions.length > 0) {
                message += `\n\nThe following transactions received 0 reward points, please check their validity online.`;
            }

            setResultText(message);
        } catch (error) {
            const message = error instanceof Error ? error.message : "Import failed";
            setResultText(message);
            setZeroRewardTransactions([]);
        } finally {
            setIsImporting(false);
            event.target.value = "";
        }
    };

    const handleClearDb = async () => {
        await db.transactions.clear();
        setResultText("Database cleared");
        setZeroRewardTransactions([]);
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

            {resultText ? (
                <Typography sx={{ marginTop: 2, whiteSpace: "pre-line" }}>
                    {resultText}
                </Typography>
            ) : null}

            {zeroRewardTransactions.length > 0 ? (
                <TableContainer
                    component={Paper}
                    sx={{ marginTop: 3, maxWidth: 900, marginLeft: "auto", marginRight: "auto" }}
                >
                    <Table>
                        <TableHead>
                            <TableRow>
                                <TableCell>Date</TableCell>
                                <TableCell>Description</TableCell>
                                <TableCell align="right">Amount</TableCell>
                            </TableRow>
                        </TableHead>

                        <TableBody>
                            {zeroRewardTransactions
                                .filter((transaction) => transaction.description !== "Payment")
                                .map((transaction, transactionIndex) => (
                                <TableRow
                                    key={`${transaction.fingerprint ?? `${transaction.date}-${transaction.description}-${transaction.amount}`}-${transactionIndex}`}
                                >
                                    <TableCell>{new Date(transaction.date).toLocaleDateString()}</TableCell>
                                    <TableCell>{transaction.description}</TableCell>
                                    <TableCell align="right">
                                        {transaction.amount.toLocaleString(undefined, {
                                            style: "currency",
                                            currency: "CAD",
                                        })}
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            ) : null}
        </Box>
    );
};