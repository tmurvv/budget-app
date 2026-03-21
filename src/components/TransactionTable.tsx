import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

type TransactionTableRow = {
  date: string;
  amount: number;
  description: string;
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

  if (transactions.length === 0) {
    return null;
  }

  return (
    <TableContainer
      component={Paper}
      sx={{
        marginTop: 3,
        maxWidth: 900,
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
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};
