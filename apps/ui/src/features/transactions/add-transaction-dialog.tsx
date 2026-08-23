import { useState } from "react";
import { startCase } from "lodash";
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
} from "@mui/material";

import { CategorySelect } from "../../components";
import { addTransaction } from "../../api/budget-api-client";
import { getTransactions } from "../../api/budget-api-client";

type AddTransactionDialogProps = {
  open: boolean;
  onClose: () => void;
  getSubCategoryOptions: (categoryName: string | undefined) => string[];
};

const getNextTransactionId = async () => {
  const transactions = await getTransactions();

  if (transactions.length === 0) {
    return 1;
  }

  const maxId = transactions.reduce((currentMaxId, transaction) => {
    return Math.max(currentMaxId, transaction.id ?? 0);
  }, 0);

  return maxId + 1;
};

export const AddTransactionDialog = ({
  open,
  onClose,
  getSubCategoryOptions,
}: AddTransactionDialogProps) => {
  const [manualTransaction, setManualTransaction] = useState({
    date: new Date().toISOString().slice(0, 10),
    description: "",
    amount: "",
    category: "",
    subCategory: "",
  });

  const handleAddTransaction = async () => {
    const amount = Number(manualTransaction.amount);

    if (
      !manualTransaction.date ||
      !manualTransaction.description.trim() ||
      Number.isNaN(amount)
    ) {
      return;
    }
    const nextTransactionId = await getNextTransactionId();
    await addTransaction({
      id: nextTransactionId,
      bank: "MRV",
      date: `${manualTransaction.date}T06:00:00.000Z`,
      amount,
      description: manualTransaction.description.trim(),
      category: manualTransaction.category,
      fingerprint: crypto.randomUUID(),
      subCategory: manualTransaction.subCategory,
      raw: {
        source: "manual",
      },
    });

    setManualTransaction({
      date: new Date().toISOString().slice(0, 10),
      description: "",
      amount: "",
      category: "",
      subCategory: "",
    });

    onClose();
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>Add Transaction</DialogTitle>

      <DialogContent>
        <TextField
          fullWidth
          margin="normal"
          label="Date"
          type="date"
          value={manualTransaction.date}
          onChange={(event) => {
            setManualTransaction({
              ...manualTransaction,
              date: event.target.value,
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
          value={manualTransaction.description}
          onChange={(event) => {
            setManualTransaction({
              ...manualTransaction,
              description: event.target.value,
            });
          }}
        />

        <TextField
          fullWidth
          margin="normal"
          label="Amount"
          type="number"
          value={manualTransaction.amount}
          onChange={(event) => {
            setManualTransaction({
              ...manualTransaction,
              amount: event.target.value,
            });
          }}
        />

        <CategorySelect
          label="Category"
          value={manualTransaction.category}
          minWidth={160}
          onChange={(newCategory) => {
            setManualTransaction({
              ...manualTransaction,
              category: newCategory,
              subCategory: "",
            });
          }}
        />

        <FormControl fullWidth margin="normal">
          <InputLabel>Sub-category</InputLabel>

          <Select
            label="Sub-category"
            value={manualTransaction.subCategory}
            disabled={!manualTransaction.category}
            onChange={(event) => {
              setManualTransaction({
                ...manualTransaction,
                subCategory: event.target.value,
              });
            }}
          >
            <MenuItem value="">
              <em>Unassigned</em>
            </MenuItem>

            <MenuItem value="No Sub-category">No Sub-category</MenuItem>

            {getSubCategoryOptions(manualTransaction.category).map(
              (subCategory) => (
                <MenuItem key={subCategory} value={subCategory}>
                  {startCase(subCategory)}
                </MenuItem>
              ),
            )}
          </Select>
        </FormControl>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>

        <Button
          variant="contained"
          onClick={() => {
            void handleAddTransaction();
          }}
        >
          Add
        </Button>
      </DialogActions>
    </Dialog>
  );
};
