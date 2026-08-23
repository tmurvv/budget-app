import { useEffect, useState } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import { DateTime } from "luxon";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";

import {
  getTransactionAllocations,
  getTransactions,
} from "../../api/budget-api-client";
import { TransactionAllocation } from "../transactions/types";

type AllocationRow = {
  transactionId: number;
  date: string;
  description: string;
  notes?: string;
  amount: number;
  allocatedPerMonth: number;
  numberOfMonths: number;
  monthsRemaining: number;
  amountRemaining: number;
  isPaidOff: boolean;
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

const getCurrentMonth = () => {
  return DateTime.now().toFormat("yyyy-MM");
};

export const AllocationsPage = () => {
  const [allocationRows, setAllocationRows] = useState<AllocationRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allocations, transactions] = await Promise.all([
          getTransactionAllocations(),
          getTransactions(),
        ]);

        const transactionMap = new Map(
          transactions.map((t) => [t.id, t]),
        );

        // Group allocations by transactionId
        const allocationsByTransaction = new Map<
          number,
          TransactionAllocation[]
        >();

        for (const allocation of allocations) {
          if (!allocationsByTransaction.has(allocation.transactionId)) {
            allocationsByTransaction.set(allocation.transactionId, []);
          }
          allocationsByTransaction
            .get(allocation.transactionId)
            ?.push(allocation);
        }

        const currentMonth = getCurrentMonth();
        const rows: AllocationRow[] = [];

        for (const [transactionId, allocs] of allocationsByTransaction) {
          const transaction = transactionMap.get(transactionId);
          if (!transaction) {
            continue;
          }

          const allocatedPerMonth = allocs[0]?.amount ?? 0;
          const numberOfMonths = allocs.length;

          const monthsRemaining = allocs.filter(
            (a) => a.month >= currentMonth,
          ).length;

          const amountRemaining = allocs
            .filter((a) => a.month >= currentMonth)
            .reduce((sum, a) => sum + a.amount, 0);

          const isPaidOff = monthsRemaining === 0;

          rows.push({
            transactionId,
            date: transaction.date,
            description: transaction.description,
            notes: transaction.notes,
            amount: transaction.amount,
            allocatedPerMonth,
            numberOfMonths,
            monthsRemaining,
            amountRemaining,
            isPaidOff,
          });
        }

        // Sort by date (newest first)
        rows.sort(
          (a, b) =>
            new Date(b.date).getTime() - new Date(a.date).getTime(),
        );

        setAllocationRows(rows);
      } catch (error) {
        console.error("Failed to load allocations:", error);
      } finally {
        setLoading(false);
      }
    };

    void loadData();
  }, []);

  const totalAmountRemaining = allocationRows.reduce(
    (sum, row) => sum + row.amountRemaining,
    0,
  );

  const nextMonthAllocations = allocationRows.reduce((sum, row) => {
    // If there are months remaining, next month's allocation is allocatedPerMonth
    return row.monthsRemaining > 0 ? sum + row.allocatedPerMonth : sum;
  }, 0);

  if (loading) {
    return <Typography>Loading allocations...</Typography>;
  }

  if (allocationRows.length === 0) {
    return <Typography>No allocations found.</Typography>;
  }

  return (
    <Box sx={{ padding: 3 }}>
      <Typography variant="h5" sx={{ marginBottom: 3 }}>
        Allocations
      </Typography>

      <TableContainer
        component={Paper}
        sx={{
          marginBottom: 3,
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell>Date</TableCell>
              <TableCell>Description</TableCell>
              <TableCell align="right">Amount</TableCell>
              <TableCell align="right">Allocated per Month</TableCell>
              <TableCell align="right">Number of Months</TableCell>
              <TableCell align="right">Months Remaining</TableCell>
              <TableCell align="right">Amount Remaining</TableCell>
              <TableCell align="center">Paid Off</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {allocationRows.map((row) => (
              <TableRow key={row.transactionId}>
                <TableCell>{formatDate(row.date)}</TableCell>
                <TableCell>
                  {row.notes ? (
                    <Tooltip title={row.notes}>
                      <span>{row.description}</span>
                    </Tooltip>
                  ) : (
                    row.description
                  )}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(row.amount)}
                </TableCell>
                <TableCell align="right">
                  {formatCurrency(row.allocatedPerMonth)}
                </TableCell>
                <TableCell align="right">{row.numberOfMonths}</TableCell>
                <TableCell align="right">{row.monthsRemaining}</TableCell>
                <TableCell align="right">
                  {formatCurrency(row.amountRemaining)}
                </TableCell>
                <TableCell align="center">
                  {row.isPaidOff && (
                    <CheckCircleOutlinedIcon
                      sx={{
                        color: "#10b981",
                        fontSize: 24,
                      }}
                    />
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <Box
        sx={{
          display: "flex",
          justifyContent: "flex-end",
          paddingRight: 2,
        }}
      >
        <Box sx={{ textAlign: "right" }}>
          <Typography variant="subtitle1" fontWeight="bold">
            Allocations Due Next Month:{" "}
            {formatCurrency(nextMonthAllocations)}
          </Typography>
          <Typography variant="subtitle1" fontWeight="bold">
            Total Amount Remaining:{" "}
            {formatCurrency(totalAmountRemaining)}
          </Typography>
        </Box>
      </Box>
    </Box>
  );
};
