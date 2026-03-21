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
import { db } from "../db/db";
import { CATEGORY_MAP } from "../features/categories/categories";
import { CategorySelect } from "./CategorySelect";

type TransactionTableRow = {
  id?: number;
  date: string;
  amount: number;
  description: string;
  category?: string;
  subCategory?: string;
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

  if (transactions.length === 0) {
    return null;
  }

  const handleDelete = async (transactionId: number | undefined) => {
    if (!transactionId) {
      return;
    }

    await db.transactions.delete(transactionId);
  };

  return (
      <TableContainer
          component={Paper}
          sx={{
            marginTop: 3,
            maxWidth: 1100,
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
                        sx={{ minWidth: 160 }}
                    >
                      <MenuItem value="">
                        <em>None</em>
                      </MenuItem>

                      {(transaction.category
                              ? CATEGORY_MAP[
                              transaction.category as keyof typeof CATEGORY_MAP
                              ] ?? []
                              : []
                      ).map((subCategory) => (
                          <MenuItem key={subCategory} value={subCategory}>
                            {subCategory}
                          </MenuItem>
                      ))}
                    </Select>
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