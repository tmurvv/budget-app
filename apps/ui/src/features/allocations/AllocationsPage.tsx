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
  Switch,
  IconButton,
} from "@mui/material";
import EditIcon from "@mui/icons-material/Edit";
import { DateTime } from "luxon";
import { startCase } from "lodash";
import CheckCircleOutlinedIcon from "@mui/icons-material/CheckCircleOutlined";

import {
  getTransactionAllocations,
  getTransactions,
  saveTransactionSplit,
  getSubCategories,
} from "../../api/budget-api-client";
import { TransactionAllocation, Transaction } from "../transactions/types";
import { SplitTransactionDialog } from "../transactions/split-transaction-dialog";
import { CategorySelect, NotesInput, SubcategorySelect } from "../../components";

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
  startMonth: string;
  category?: string;
  subCategory?: string;
};

type SortKey = Exclude<keyof AllocationRow, "startMonth">;

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

const extractStartMonth = (
  allocations: TransactionAllocation[],
): string => {
  if (allocations.length === 0) {
    return DateTime.now().toFormat("yyyy-MM");
  }

  if (allocations[0]?.startMonth) {
    return allocations[0].startMonth;
  }

  const months = allocations.map((a) => a.month).sort();
  return months[0] || DateTime.now().toFormat("yyyy-MM");
};

const sortRows = (
  rows: AllocationRow[],
  sortKey: SortKey,
  direction: SortDirection,
): AllocationRow[] =>
  [...rows].sort((a, b) => {
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

const getCurrentMonth = () => {
  return DateTime.now().toFormat("yyyy-MM");
};

export const AllocationsPage = () => {
  const [allocationRows, setAllocationRows] = useState<AllocationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDirection, setSortDirection] = useState<SortDirection>("desc");
  const [showPaidOff, setShowPaidOff] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedSubCategory, setSelectedSubCategory] = useState("");
  const [editingAllocation, setEditingAllocation] = useState<AllocationRow | null>(null);
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);
  const [_, setAllocationsByTransaction] = useState<Map<number, TransactionAllocation[]>>(new Map());
  const [_, setSubCategories] = useState<
    Array<{
      id?: number;
      categoryName: string;
      name: string;
    }>
  >([]);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [allocations, transactions, loadedSubCategories] = await Promise.all([
          getTransactionAllocations(),
          getTransactions(),
          getSubCategories(),
        ]);

        setSubCategories(loadedSubCategories);

        const transactionMap = new Map(
          transactions.map((t) => [t.id, t]),
        );

        // Group allocations by transactionId
        const allocationsByTxn = new Map<
          number,
          TransactionAllocation[]
        >();

        for (const allocation of allocations) {
          if (!allocationsByTxn.has(allocation.transactionId)) {
            allocationsByTxn.set(allocation.transactionId, []);
          }
          allocationsByTxn
            .get(allocation.transactionId)
            ?.push(allocation);
        }

        setAllocationsByTransaction(allocationsByTxn);

        const currentMonth = getCurrentMonth();
        const rows: AllocationRow[] = [];

        for (const [transactionId, allocs] of allocationsByTxn) {
          const transaction = transactionMap.get(transactionId);
          if (!transaction) {
            continue;
          }

          const allocatedPerMonth = allocs[0]?.amount ?? 0;
          const numberOfMonths = allocs.length;
          const startMonth = extractStartMonth(allocs);

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
            startMonth,
            category: transaction.category,
            subCategory: transaction.subCategory,
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

  const handleEditAllocation = async (numberOfMonths: number, startMonth: string) => {
    if (!editingAllocation || !editingTransaction) {
      return;
    }

    const monthlyAmount = editingTransaction.amount / numberOfMonths;
    const allocationStartMonth = DateTime.fromFormat(startMonth, "yyyy-MM").startOf("month");

    const allocations = Array.from(
      { length: numberOfMonths },
      (_, monthIndex) => {
        return {
          transactionId: editingAllocation.transactionId,
          month: allocationStartMonth
            .plus({ months: monthIndex })
            .toFormat("yyyy-MM"),
          amount: monthlyAmount,
          startMonth: allocationStartMonth.toFormat("yyyy-MM"),
        };
      },
    );

    await saveTransactionSplit(editingAllocation.transactionId, allocations);

    const refreshedAllocations = await getTransactionAllocations();

    const allocationsByTxn = new Map<number, TransactionAllocation[]>();
    for (const allocation of refreshedAllocations) {
      if (!allocationsByTxn.has(allocation.transactionId)) {
        allocationsByTxn.set(allocation.transactionId, []);
      }
      allocationsByTxn
        .get(allocation.transactionId)
        ?.push(allocation);
    }

    setAllocationsByTransaction(allocationsByTxn);

    const currentMonth = getCurrentMonth();
    const updatedRows: AllocationRow[] = [];

    const transactionMap = new Map(
      allocationRows.reduce((acc, row) => {
        acc.set(row.transactionId, {
          id: row.transactionId,
          date: row.date,
          amount: row.amount,
          description: row.description,
          bank: "RBC" as const,
          fingerprint: "",
          notes: row.notes,
        });
        return acc;
      }, new Map<number, Transaction>()),
    );

    for (const [transactionId, allocs] of allocationsByTxn) {
      const transaction = transactionMap.get(transactionId);
      if (!transaction) {
        continue;
      }

      const allocatedPerMonth = allocs[0]?.amount ?? 0;
      const numberOfAllocs = allocs.length;
      const txnStartMonth = extractStartMonth(allocs);

      const monthsRemaining = allocs.filter(
        (a) => a.month >= currentMonth,
      ).length;

      const amountRemaining = allocs
        .filter((a) => a.month >= currentMonth)
        .reduce((sum, a) => sum + a.amount, 0);

      const isPaidOff = monthsRemaining === 0;

      updatedRows.push({
        transactionId,
        date: transaction.date,
        description: transaction.description,
        notes: transaction.notes,
        amount: transaction.amount,
        allocatedPerMonth,
        numberOfMonths: numberOfAllocs,
        monthsRemaining,
        amountRemaining,
        isPaidOff,
        startMonth: txnStartMonth,
        category: allocationRows.find(r => r.transactionId === transactionId)?.category,
        subCategory: allocationRows.find(r => r.transactionId === transactionId)?.subCategory,
      });
    }

    updatedRows.sort(
      (a, b) =>
        new Date(b.date).getTime() - new Date(a.date).getTime(),
    );

    setAllocationRows(updatedRows);
    setEditingAllocation(null);
    setEditingTransaction(null);
  };

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDirection("asc");
    }
  };

  const sortedRows = sortRows(allocationRows, sortKey, sortDirection);

  const filteredRows = sortedRows.filter((row) => {
    if (!showPaidOff && row.isPaidOff) return false;
    if (selectedCategory && row.category !== selectedCategory) return false;
    if (selectedSubCategory && row.subCategory !== selectedSubCategory) return false;
    return true;
  });

  const totalAmountRemaining = filteredRows.reduce(
    (sum, row) => sum + row.amountRemaining,
    0,
  );

  const nextMonthAllocations = filteredRows.reduce((sum, row) => {
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
    <Box sx={{ padding: 3, paddingTop: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 3.5 }}>
        <Typography variant="h3">
          Allocations
        </Typography>
      </Box>

      <Box sx={{ marginBottom: 2, display: "flex", gap: 2, alignItems: "center", justifyContent: "space-between" }}>
        <Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
          <CategorySelect
            label="Filter by Category"
            value={selectedCategory}
            minWidth={160}
            onChange={(newCategory) => {
              setSelectedCategory(newCategory);
              setSelectedSubCategory("");
            }}
            useDarkStyles={true}
          />
          {selectedCategory && (
            <SubcategorySelect
              label="Sub-category"
              value={selectedSubCategory}
              selectedCategory={selectedCategory}
              minWidth={160}
              useDarkStyles={true}
              onChange={(newSubCategory) => setSelectedSubCategory(newSubCategory)}
            />
          )}
        </Box>
        <FormControlLabel
          control={
            <Switch
              checked={showPaidOff}
              onChange={(e) => setShowPaidOff(e.target.checked)}
            />
          }
          label="Show Paid Off"
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
              <TableCell align="center"></TableCell>
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
                  Per Month
                </TableSortLabel>
              </TableCell>
              <TableCell sortDirection={sortKey === "numberOfMonths" ? sortDirection : false}>
                <TableSortLabel
                  active={sortKey === "numberOfMonths"}
                  direction={sortDirection}
                  onClick={() => handleSort("numberOfMonths")}
                  sx={{ justifyContent: "flex-end" }}
                >
                  Num Months
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
              <TableCell>Category</TableCell>
              <TableCell>Sub</TableCell>
              <TableCell>Notes</TableCell>
            </TableRow>
          </TableHead>

          <TableBody>
            {filteredRows.map((row) => (
              <TableRow key={row.transactionId}>
                <TableCell align="center">
                  <Box sx={{ display: "flex", justifyContent: "center", gap: 0.5, alignItems: "center" }}>
                    <Box sx={{ width: 24, height: 24, display: "flex", alignItems: "center", justifyContent: "center" }}>
                      {row.isPaidOff && (
                        <CheckCircleOutlinedIcon
                          sx={{
                            color: "#10b981",
                            fontSize: 24,
                          }}
                        />
                      )}
                    </Box>
                    <IconButton
                      size="small"
                      onClick={() => {
                        setEditingAllocation(row);
                        setEditingTransaction({
                          id: row.transactionId,
                          bank: "RBC",
                          date: row.date,
                          amount: row.amount,
                          description: row.description,
                          fingerprint: "",
                          notes: row.notes,
                        });
                      }}
                    >
                      <EditIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </TableCell>
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
                <TableCell>{row.category && row.category !== "No Category" ? startCase(row.category) : "Unassigned"}</TableCell>
                <TableCell>{row.subCategory && row.subCategory !== "No Sub-category" ? startCase(row.subCategory) : "Unassigned"}</TableCell>
                <TableCell>
                  <NotesInput
                    value={row.notes || ""}
                    onSave={async () => {
                      // Notes are read-only on allocations page - they come from the transaction
                    }}
                    disabled={true}
                  />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      {editingAllocation && editingTransaction ? (
        <SplitTransactionDialog
          amount={editingTransaction.amount}
          open={Boolean(editingAllocation)}
          onClose={() => {
            setEditingAllocation(null);
            setEditingTransaction(null);
          }}
          onSave={handleEditAllocation}
          startMonth={editingAllocation.startMonth}
          numberOfMonths={editingAllocation.numberOfMonths}
        />
      ) : null}

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
