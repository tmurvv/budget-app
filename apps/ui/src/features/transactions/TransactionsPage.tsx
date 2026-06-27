import { useEffect, useState } from "react";
import { DateTime } from "luxon";
import { Box, FormControlLabel, Switch, Typography } from "@mui/material";

import { getTransactions } from "../../api/budget-api-client";
import { CategorySelect, SearchInput } from "../../components";
import { TransactionTable } from "./TransactionTable";
import type { Transaction } from "./types";

type TransactionsPageProps = {
  initialCategory?: string;
  onCategoryFilterChange?: (category: string) => void;
};

export const TransactionsPage = ({
  initialCategory = "",
  onCategoryFilterChange,
}: TransactionsPageProps) => {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [showUncategorizedOnly, setShowUncategorizedOnly] = useState(false);
  const [searchText, setSearchText] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);

  const [transactions, setTransactions] = useState<Transaction[]>([]);

  useEffect(() => {
    const loadTransactions = async () => {
      console.time("getTransactions");

      const allTransactions = await getTransactions();

      console.timeEnd("getTransactions");

      const startDate = DateTime.now()
        .minus({ days: 180 })
        .startOf("day")
        .toISO();

      const recentTransactions = allTransactions.filter((transaction) => {
        return transaction.date >= startDate;
      });

      setTransactions(recentTransactions);
    };

    void loadTransactions();
  }, [refreshKey]);

  const filteredTransactions = transactions.filter((transaction) => {
    const normalizedDescription = transaction.description.toLowerCase().trim();
    const normalizedNotes = (transaction.notes ?? "").toLowerCase().trim();
    const normalizedSearchText = searchText.toLowerCase().trim();

    const matchesCategory = !selectedCategory
      ? true
      : transaction.category === selectedCategory;

    const matchesSearch = !normalizedSearchText
      ? true
      : normalizedDescription.includes(normalizedSearchText) ||
        normalizedNotes.includes(normalizedSearchText);

    const hasIncompleteCategorization =
      !transaction.category || !transaction.subCategory;

    const matchesUncategorized = showUncategorizedOnly
      ? hasIncompleteCategorization
      : true;

    return matchesCategory && matchesSearch && matchesUncategorized;
  });

  return (
    <Box sx={{ padding: 4 }}>
      <Typography variant="h4" gutterBottom align="center">
        Transactions
      </Typography>

      <Box sx={{ display: "flex", justifyContent: "center", marginBottom: 2 }}>
        <SearchInput
          label="Search description"
          value={searchText}
          onChange={(value) => {
            setSearchText(value);
          }}
        />
      </Box>

      <Box
        sx={{
          gap: 5,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          marginBottom: 2,
        }}
      >
        <CategorySelect
          label="Category"
          value={selectedCategory}
          useDarkStyles
          onChange={(value) => {
            setSelectedCategory(value);
            onCategoryFilterChange?.(value);
          }}
        />

        <FormControlLabel
          control={
            <Switch
              checked={showUncategorizedOnly}
              onChange={(event) => {
                setShowUncategorizedOnly(event.target.checked);
              }}
            />
          }
          label="Uncategorized only"
        />
      </Box>

      <Typography sx={{ marginBottom: 2 }} align="center">
        {filteredTransactions.length} transactions
      </Typography>

      <TransactionTable
        title="All Transactions"
        transactions={filteredTransactions}
        onRefresh={() => {
          setRefreshKey((currentRefreshKey) => {
            return currentRefreshKey + 1;
          });
        }}
      />
    </Box>
  );
};
