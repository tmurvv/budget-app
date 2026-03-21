import { useLiveQuery } from "dexie-react-hooks";
import {
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
  Typography,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";

import {CategorySelect, NotesInput, TextInput} from "../../components";
import { db } from "../../db/db";

type TransactionTableRow = {
  id?: number;
  date: string;
  amount: number;
  description: string;
  category?: string;
  subCategory?: string;
  notes?: string;
  fingerprint?: string;
};

type TransactionTableProps = {
  title: string;
  transactions: TransactionTableRow[];
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

  const subCategories = useLiveQuery(async () => {
    return db.subCategories.toArray();
  }, []);

  const handleCategoryChange = async (
      transactionId: number | undefined,
      newCategory: string,
  ) => {
    if (!transactionId) {
      return;
    }

    await db.transactions.update(transactionId, {
      category: newCategory,
      subCategory: "",
    });
  };

  const handleSubCategoryChange = async (
      transactionId: number | undefined,
      newSubCategory: string,
  ) => {
    if (!transactionId) {
      return;
    }

    await db.transactions.update(transactionId, {
      subCategory: newSubCategory,
    });
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

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell>Category</TableCell>
              <TableCell>Sub-category</TableCell>
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
  );
};