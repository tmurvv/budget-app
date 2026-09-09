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
  TableSortLabel,
  FormControlLabel,
  Checkbox,
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

type SortKey = keyof AllocationRow;

type SortDirection = "asc" | "desc";

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

const sortRows = (
  rows: AllocationRow[],
  sortKey: SortKey,
  direction: SortDirection,
): AllocationRow[] => {
  const sorted = [...rows].sort((a, b) => {
    const aValue = a[sortKey];
    const bValue = b[sortKey];

    if (typeof aValue === "string" && typeof bValue === "string") {
      return direction === "asc"
        ? aValue.localeCompare(bValue)
        : bValue.localeCompare(aValue);
    }

    if (typeof aValue === "number" && typeof bValue === "number") {
      return direction === "asc" ? aValue - bValue : bValue - aValue;
    }

    if (typeof aValue === "boolean" && typeof bValue === "boolean") {
      return direction === "asc"
        ? Number(aValue) - Number(bValue)
        : Number(bValue) - Number(aValue);
    }

    return 0;
  });

  return sorted;
};

const getCurrentMonth = () => {
  return DateTime.now().toFormat("yyyy-MM");
};

export const AllocationsPage = () => {
  const [allocationRows, setAllocationRows] = useState<AllocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [hidePaidOff, setHidePaidOff] = useState(false);

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

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedRows = sortRows(allocationRows, sortKey, sortDirection);

  const filteredRows = hidePaidOff
    ? sortedRows.filter((row) => !row.isPaidOff)
    : sortedRows;

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

      <Box sx={{ marginBottom: 2 }}>
        <FormControlLabel
          control={
            <Checkbox
              checked={hidePaidOff}
              onChange={(e) => setHidePaidOff(e.target.checked)}
            />
          }
          label="Hide paid off allocations"
        />
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          marginBottom: 3,
        }}
      >
        <Table size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sortDirection={sortKey === "date" ? sortDirection : false}>
                <TableSortLabel
                  active={sortKey === "date"}
                  direction={sortDirection}
                  onClick={() => handleSort("date")}
                >
                  Date
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortKey === "description" ? sortDirection : false}>
                <TableSortLabel
                  active={sortKey === "description"}
                  direction={sortDirection}
                  onClick={() => handleSort("description")}
                >
                  Description
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortKey === "amount" ? sortDirection : false}>
                <TableSortLabel
                  active={sortKey === "amount"}
                  direction={sortDirection}
                  onClick={() => handleSort("amount")}
                  sx={{ justifyContent: "flex-end" }}
                >
                  Amount
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortKey === "allocatedPerMonth" ? sortDirection : false}>
                <TableSortLabel
                  active={sortKey === "allocatedPerMonth"}
                  direction={sortDirection}
                  onClick={() => handleSort("allocatedPerMonth")}
                  sx={{ justifyContent: "flex-end" }}
                >
                  Allocated per Month
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortKey === "numberOfMonths" ? sortDirection : false}>
                <TableSortLabel
                  active={sortKey === "numberOfMonths"}
                  direction={sortDirection}
                  onClick={() => handleSort("numberOfMonths")}
                  sx={{ justifyContent: "flex-end" }}
                >
                  Number of Months
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortKey === "monthsRemaining" ? sortDirection : false}>
                <TableSortLabel
                  active={sortKey === "monthsRemaining"}
                  direction={sortDirection}
                  onClick={() => handleSort("monthsRemaining")}
                  sx={{ justifyContent: "flex-end" }}
                >
                  Months Remaining
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortKey === "amountRemaining" ? sortDirection : false}>
                <TableSortLabel
                  active={sortKey === "amountRemaining"}
                  direction={sortDirection}
                  onClick={() => handleSort("amountRemaining")}
                  sx={{ justifyContent: "flex-end" }}
                >
                  Amount Remaining
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortKey === "isPaidOff" ? sortDirection : false}>
                <TableSortLabel
                  active={sortKey === "isPaidOff"}
                  direction={sortDirection}
                  onClick={() => handleSort("isPaidOff")}
                  sx={{ justifyContent: "center" }}
                >
                  Paid Off
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredRows.map((row) => (
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
                <TableCell sx={{ textAlign: "right" }}>
                  {formatCurrency(row.amount)}
                </TableCell>
                <TableCell sx={{ textAlign: "right" }}>
                  {formatCurrency(row.allocatedPerMonth)}
                </TableCell>
                <TableCell sx={{ textAlign: "right" }}>{row.numberOfMonths}</TableCell>
                <TableCell sx={{ textAlign: "right" }}>{row.monthsRemaining}</TableCell>
                <TableCell sx={{ textAlign: "right" }}>
                  {formatCurrency(row.amountRemaining)}
                </TableCell>
                <TableCell sx={{ textAlign: "center" }}>
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
