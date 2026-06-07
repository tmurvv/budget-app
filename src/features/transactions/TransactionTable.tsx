import { useLiveQuery } from "dexie-react-hooks";

import {
  Box,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  FormControl,
  InputLabel,
  IconButton,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

import { CategorySelect, NotesInput } from "../../components";
import { db } from "../../db/db";
import { Transaction } from "./types";
import { useState } from "react";
import { SplitTransactionDialog } from "./split-transaction-dialog";
import { DateTime } from "luxon";

type TransactionTableProps = {
  title: string;
  transactions: Transaction[];
};

const formatCurrency = (amount: number) => {
  return amount.toLocaleString(undefined, {
    style: "currency",
    currency: "CAD",
  });
};

const formatDate = (date: string) => {
  return new Date(date).toLocaleDateString();
};

export const TransactionTable = (props: TransactionTableProps) => {
  const { title, transactions } = props;
  const [pendingRule, setPendingRule] = useState<{
    transactionId: number;
    matchValue: string;
    categoryName: string;
    subCategoryName?: string;
  } | null>(null);
  const [splitTransaction, setSplitTransaction] = useState<Transaction | null>(
    null,
  );

  const subCategories = useLiveQuery(async () => {
    return db.subCategories.toArray();
  }, []);

  const getNextRulePriority = async () => {
    const rules = await db.categoryRules.toArray();

    if (rules.length === 0) {
      return 100;
    }

    const lowestPriority = rules.reduce((currentLowestPriority, rule) => {
      return Math.min(currentLowestPriority, rule.priority);
    }, rules[0].priority);

    return lowestPriority - 1;
  };

  const handleCategoryChange = async (
    transactionId: number | undefined,
    newCategory: string,
  ) => {
    if (!transactionId) {
      return;
    }

    const transaction = await db.transactions.get(transactionId);

    if (!transaction) {
      return;
    }

    await db.transactions.update(transactionId, {
      category: newCategory,
    });

    setPendingRule({
      transactionId,
      matchValue: transaction.description,
      categoryName: newCategory,
      subCategoryName: "",
    });
  };

  const handleSubCategoryChange = async (
    transactionId: number | undefined,
    newSubCategory: string,
  ) => {
    if (!transactionId) {
      return;
    }

    const transaction = await db.transactions.get(transactionId);

    if (!transaction) {
      return;
    }

    await db.transactions.update(transactionId, {
      subCategory: newSubCategory,
    });

    setPendingRule({
      transactionId,
      matchValue: transaction.description,
      categoryName: transaction.category ?? "",
      subCategoryName: newSubCategory,
    });
  };

  const handleSplitTransaction = async (
    transaction: Transaction,
    numberOfMonths: number,
  ) => {
    const transactionId = transaction.id;

    if (!transactionId) {
      return;
    }

    await db.transactionAllocations
      .where("transactionId")
      .equals(transactionId)
      .delete();

    const monthlyAmount = transaction.amount / numberOfMonths;

    const transactionMonth = DateTime.fromISO(transaction.date).startOf(
      "month",
    );

    const allocations = Array.from(
      { length: numberOfMonths },
      (_, monthIndex) => {
        return {
          transactionId,
          month: transactionMonth
            .plus({ months: monthIndex })
            .toFormat("yyyy-MM"),
          amount: monthlyAmount,
        };
      },
    );

    await db.transactionAllocations.bulkAdd(allocations);

    setSplitTransaction(null);
  };

  const handleDelete = async (transactionId: number | undefined) => {
    if (!transactionId) {
      return;
    }

    await db.transactions.delete(transactionId);
  };

  const getSubCategoryOptions = (categoryName: string | undefined) => {
    if (!categoryName || categoryName === "No Category") {
      return [];
    }

    return (subCategories ?? [])
      .filter((subCategory) => {
        return subCategory.categoryName === categoryName;
      })
      .map((subCategory) => {
        return subCategory.name;
      });
  };

  if (transactions.length === 0) {
    return null;
  }

  return (
    <>
      <TableContainer
        component={Paper}
        sx={{
          marginTop: 3,
          maxWidth: 2400,
          marginLeft: "auto",
          marginRight: "auto",
        }}
      >
        <Typography variant="h6" sx={{ padding: 2, paddingBottom: 0 }}>
          {title}
        </Typography>

        <Table size={"small"}>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Bank</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Sub-category</TableCell>
              <TableCell align="center">Split</TableCell>
              <TableCell>Notes</TableCell>
              <TableCell align="center">Delete</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {transactions.map((transaction, transactionIndex) => (
              <TableRow
                key={
                  transaction.fingerprint ??
                  `${transaction.date}-${transaction.description}-${transaction.amount}-${transactionIndex}`
                }
              >
                <TableCell>{formatDate(transaction.date)}</TableCell>

                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  {transaction.bank === "RBC"
                    ? "🔵 RBC"
                    : transaction.bank === "ONE"
                      ? "🟣 ONE"
                      : "🟢 MAN"}
                </TableCell>

                <TableCell>{transaction.description}</TableCell>

                <TableCell align="right">
                  {formatCurrency(transaction.amount)}
                </TableCell>

                <TableCell>
                  <CategorySelect
                    label="Category"
                    value={transaction.category ?? ""}
                    minWidth={160}
                    onChange={(newCategory) => {
                      void handleCategoryChange(transaction.id, newCategory);
                    }}
                  />
                </TableCell>

                <TableCell>
                  <Select
                    size="small"
                    value={transaction.subCategory ?? ""}
                    displayEmpty
                    disabled={!transaction.category}
                    onChange={(event) => {
                      void handleSubCategoryChange(
                        transaction.id,
                        event.target.value as string,
                      );
                    }}
                    sx={{ minWidth: 180 }}
                  >
                    <MenuItem value="">
                      <em>Unassigned</em>
                    </MenuItem>

                    <MenuItem value="No Sub-category">No Sub-category</MenuItem>

                    {getSubCategoryOptions(transaction.category).map(
                      (subCategory) => (
                        <MenuItem key={subCategory} value={subCategory}>
                          {subCategory}
                        </MenuItem>
                      ),
                    )}
                  </Select>
                </TableCell>
                <TableCell align="center">
                  <Button
                    size="small"
                    variant="outlined"
                    onClick={() => {
                      setSplitTransaction(transaction);
                    }}
                  >
                    Split
                  </Button>
                </TableCell>
                <TableCell>
                  <NotesInput
                    value={transaction.notes}
                    onSave={(newNotes) => {
                      if (!transaction.id) {
                        return;
                      }

                      void db.transactions.update(transaction.id, {
                        notes: newNotes,
                      });
                    }}
                  />
                </TableCell>

                <TableCell align="center">
                  <IconButton
                    color="error"
                    onClick={() => {
                      void handleDelete(transaction.id);
                    }}
                  >
                    <DeleteIcon />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
      <Dialog
        open={Boolean(pendingRule)}
        onClose={() => {
          setPendingRule(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle sx={{ color: "black" }}>
          Save rule for future transactions?
        </DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Match text"
            value={pendingRule?.matchValue ?? ""}
            onChange={(event) => {
              if (!pendingRule) {
                return;
              }

              setPendingRule({
                ...pendingRule,
                matchValue: event.target.value,
              });
            }}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Sub-category</InputLabel>

            <Select
              label="Sub-category"
              value={pendingRule?.subCategoryName ?? ""}
              onChange={(event) => {
                if (!pendingRule) {
                  return;
                }

                setPendingRule({
                  ...pendingRule,
                  subCategoryName: event.target.value,
                });
              }}
            >
              <MenuItem value="">
                <em>Unassigned</em>
              </MenuItem>

              {getSubCategoryOptions(pendingRule?.categoryName).map(
                (subCategory) => {
                  return (
                    <MenuItem key={subCategory} value={subCategory}>
                      {subCategory}
                    </MenuItem>
                  );
                },
              )}
            </Select>
          </FormControl>
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => {
              setPendingRule(null);
            }}
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={async () => {
              if (!pendingRule) {
                return;
              }

              const trimmedMatchValue = pendingRule.matchValue.trim();

              if (!trimmedMatchValue) {
                return;
              }

              const nextPriority = await getNextRulePriority();

              await db.categoryRules.add({
                matchValue: trimmedMatchValue,
                categoryName: pendingRule.categoryName,
                subCategoryName: pendingRule.subCategoryName?.trim() || "",
                priority: nextPriority,
                isActive: true,
              });
              setPendingRule(null);
            }}
          >
            Save rule
          </Button>
        </DialogActions>
      </Dialog>
      {splitTransaction ? (
        <SplitTransactionDialog
          amount={splitTransaction.amount}
          open={Boolean(splitTransaction)}
          onClose={() => {
            setSplitTransaction(null);
          }}
          onSave={async (numberOfMonths) => {
            await handleSplitTransaction(splitTransaction, numberOfMonths);
          }}
        />
      ) : null}
    </>
  );
};
