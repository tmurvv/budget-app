import { useEffect, useState } from "react";

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
  Tooltip,
  Typography,
} from "@mui/material";
import RefreshIcon from "@mui/icons-material/Refresh";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import { CategorySelect, NotesInput } from "../../components";
import { Transaction, TransactionAllocation } from "./types";
import { SplitTransactionDialog } from "./split-transaction-dialog";
import { DateTime } from "luxon";
import { AddTransactionDialog } from "./add-transaction-dialog";
import {
  deleteTransaction,
  getSubCategories,
  getTransactionAllocations,
  saveTransactionSplit,
  updateTransaction,
  addRule,
  getRules,
} from "../../api/budget-api-client";

type TransactionTableProps = {
  title: string;
  transactions: Transaction[];
  onRefresh: () => void;
};

const formatCurrency = (amount: number) => {
  return amount.toLocaleString(undefined, {
    style: "currency",
    currency: "CAD",
  });
};

const formatDate = (date: string) => {
  if (!date) {
    return "";
  }

  const dateOnly = date.includes("T") ? date.split("T")[0] : date;

  const [year, month, day] = dateOnly.split("-");

  return `${month}/${day}/${year}`;
};

const getBankDisplay = (bank: Transaction["bank"]) => {
  const bankDisplayMap = {
    RBC: "🔵 RBC",
    ONE: "🟣 ONE",
    MRV: "🟠 MRV",
    MAN: "🟢 MAN",
  } as const;

  return bankDisplayMap[bank];
};

const getDisplayValue = (value: string | undefined) => {
  return value?.trim() ? value : "Unassigned";
};

export const TransactionTable = (props: TransactionTableProps) => {
  const { title, transactions, onRefresh } = props;
  const [pendingRule, setPendingRule] = useState<{
    transactionId: number;
    matchValue: string;
    categoryName: string;
    subCategoryName?: string;
  } | null>(null);
  const [splitTransaction, setSplitTransaction] = useState<Transaction | null>(
    null,
  );
  const [editingTransaction, setEditingTransaction] =
    useState<Transaction | null>(null);
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [subCategories, setSubCategories] = useState<
    Array<{
      id?: number;
      categoryName: string;
      name: string;
    }>
  >([]);

  const [transactionAllocations, setTransactionAllocations] = useState<
    TransactionAllocation[]
  >([]);

  useEffect(() => {
    const loadSubCategories = async () => {
      const loadedSubCategories = await getSubCategories();

      setSubCategories(loadedSubCategories);
    };

    const loadAllocations = async () => {
      const loaded = await getTransactionAllocations();
      setTransactionAllocations(loaded);
    };

    void loadSubCategories();
    void loadAllocations();
  }, []);

  const getNextRulePriority = async () => {
    const rules = await getRules();

    if (rules.length === 0) {
      return 100;
    }

    const lowestPriority = rules.reduce((currentLowestPriority, rule) => {
      return Math.min(currentLowestPriority, rule.priority);
    }, rules[0].priority);

    return lowestPriority - 1;
  };

  const handleSplitTransaction = async (
    transaction: Transaction,
    numberOfMonths: number,
  ) => {
    const transactionId = transaction.id;

    if (!transactionId) {
      return;
    }

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

    await saveTransactionSplit(transactionId, allocations);

    const refreshedAllocations = await getTransactionAllocations();
    setTransactionAllocations(refreshedAllocations);

    setSplitTransaction(null);
  };

  const handleSaveEditedTransaction = async ({
    editingTransaction,
    onRefresh,
    setEditingTransaction,
  }: {
    editingTransaction: Transaction | null;
    onRefresh: () => void;
    setEditingTransaction: (transaction: Transaction | null) => void;
  }) => {
    if (!editingTransaction?.id) {
      return;
    }

    await updateTransaction(editingTransaction.id, {
      date: editingTransaction.date,
      description: editingTransaction.description,
      amount: editingTransaction.amount,
      category: editingTransaction.category,
      subCategory: editingTransaction.subCategory,
    });

    setEditingTransaction(null);

    onRefresh();
  };

  const handleDelete = async (transactionId: number | undefined) => {
    console.log("Deleting transaction", transactionId);
    if (!transactionId) {
      return;
    }

    await deleteTransaction(transactionId);
    onRefresh();
  };

  const getSubCategoryOptions = (categoryName: string | undefined) => {
    if (!categoryName || categoryName === "No Category") {
      return [];
    }

    return subCategories
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
      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          maxWidth: 2400,
          marginLeft: "auto",
          marginRight: "auto",
          marginTop: 2,
        }}
      >
        <Button variant="text" onClick={onRefresh}>
          <RefreshIcon />
        </Button>
        <Button
          variant="contained"
          onClick={() => {
            setIsAddTransactionOpen(true);
          }}
        >
          Add Transaction
        </Button>
      </Box>
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

        <Table size="small">
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
              <TableCell align="center">Edit</TableCell>
              <TableCell align="center">Delete</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {transactions.map((transaction, transactionIndex) => (
              <TableRow
                key={
                  transaction.fingerprint ||
                  `${transaction.date}-${transaction.description}-${transaction.amount}-${transactionIndex}`
                }
              >
                <TableCell>{formatDate(transaction.date)}</TableCell>

                <TableCell sx={{ whiteSpace: "nowrap" }}>
                  {getBankDisplay(transaction.bank)}
                </TableCell>

                <TableCell>{transaction.description}</TableCell>

                <TableCell align="right">
                  {formatCurrency(transaction.amount)}
                </TableCell>

                <TableCell>{getDisplayValue(transaction.category)}</TableCell>

                <TableCell>
                  {getDisplayValue(transaction.subCategory)}
                </TableCell>

                <TableCell align="center">
                  {(() => {
                    const splits = transactionAllocations.filter(
                      (a) => a.transactionId === transaction.id,
                    );
                    const hasSplit = splits.length > 0;
                    const tooltipContent = hasSplit ? (
                      <Box>
                        <Typography variant="caption" display="block" sx={{ fontWeight: "bold", mb: 0.5 }}>
                          Split across {splits.length} month{splits.length !== 1 ? "s" : ""}:
                        </Typography>
                        {splits.map((split) => (
                          <Typography key={split.month} variant="caption" display="block">
                            {split.month}: {formatCurrency(split.amount)}
                          </Typography>
                        ))}
                      </Box>
                    ) : "";
                    return (
                      <Tooltip title={tooltipContent} arrow disableHoverListener={!hasSplit}>
                        <Button
                          size="small"
                          variant={hasSplit ? "contained" : "outlined"}
                          onClick={() => {
                            setSplitTransaction(transaction);
                          }}
                        >
                          Split
                        </Button>
                      </Tooltip>
                    );
                  })()}
                </TableCell>

                <TableCell>
                  <NotesInput
                    value={transaction.notes}
                    onSave={async (newNotes) => {
                      if (!transaction.id) {
                        return;
                      }

                      await updateTransaction(transaction.id, {
                        notes: newNotes,
                      });

                      onRefresh();
                    }}
                  />
                </TableCell>

                <TableCell align="center">
                  <IconButton
                    color="primary"
                    onClick={() => {
                      setEditingTransaction(transaction);
                    }}
                  >
                    <EditIcon />
                  </IconButton>
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

              const rules = await getRules();

              const nextRuleId =
                rules.reduce((currentMaxId, rule) => {
                  return Math.max(currentMaxId, rule.id);
                }, 0) + 1;

              await addRule({
                id: nextRuleId,
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

      <Dialog
        open={Boolean(editingTransaction)}
        onClose={() => {
          setEditingTransaction(null);
        }}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>Edit Transaction</DialogTitle>

        <DialogContent>
          <TextField
            fullWidth
            margin="normal"
            label="Date"
            type="date"
            value={
              editingTransaction?.date
                ? editingTransaction.date.slice(0, 10)
                : ""
            }
            onChange={(event) => {
                if (!editingTransaction) {
                    return;
                }

                setEditingTransaction({
                    ...editingTransaction,
                    date: `${event.target.value}T06:00:00.000Z`,
                });
            }}
            slotProps={{
              inputLabel: {
                shrink: true,
              },
            }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Description"
            value={editingTransaction?.description ?? ""}
            onChange={(event) => {
              if (!editingTransaction) {
                return;
              }

              setEditingTransaction({
                ...editingTransaction,
                description: event.target.value,
              });
            }}
          />

          <TextField
            fullWidth
            margin="normal"
            label="Amount"
            type="number"
            value={editingTransaction?.amount ?? ""}
            onChange={(event) => {
              if (!editingTransaction) {
                return;
              }

              setEditingTransaction({
                ...editingTransaction,
                amount: Number(event.target.value),
              });
            }}
          />
        </DialogContent>
        <Box px={3}>
          <CategorySelect
            label="Category"
            value={editingTransaction?.category ?? ""}
            minWidth={160}
            onChange={(newCategory) => {
              if (!editingTransaction) {
                return;
              }

              setEditingTransaction({
                ...editingTransaction,
                category: newCategory,
                subCategory: "",
              });
            }}
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Sub-category</InputLabel>

            <Select
              label="Sub-category"
              value={editingTransaction?.subCategory ?? ""}
              disabled={!editingTransaction?.category}
              onChange={(event) => {
                if (!editingTransaction) {
                  return;
                }

                setEditingTransaction({
                  ...editingTransaction,
                  subCategory: event.target.value,
                });
              }}
            >
              <MenuItem value="">
                <em>Unassigned</em>
              </MenuItem>

              <MenuItem value="No Sub-category">No Sub-category</MenuItem>

              {getSubCategoryOptions(editingTransaction?.category).map(
                (subCategory) => (
                  <MenuItem key={subCategory} value={subCategory}>
                    {subCategory}
                  </MenuItem>
                ),
              )}
            </Select>
          </FormControl>
        </Box>
        <DialogActions>
          <Button
            onClick={() => {
              setEditingTransaction(null);
            }}
          >
            Cancel
          </Button>

          <Button
            variant="contained"
            onClick={() => {
              void handleSaveEditedTransaction({
                editingTransaction,
                onRefresh,
                setEditingTransaction,
              });
            }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
      <AddTransactionDialog
        open={isAddTransactionOpen}
        onClose={() => {
          setIsAddTransactionOpen(false);
        }}
        getSubCategoryOptions={getSubCategoryOptions}
      />
    </>
  );
};
