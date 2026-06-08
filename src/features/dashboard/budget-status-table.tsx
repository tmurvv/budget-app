import {
  Box,
  Paper,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import { formatCurrency } from "./dashboard-formatters";
import type { BudgetStatus, BudgetViewMode } from "./dashboard-types";

type BudgetStatusTableProps = {
  budgetViewMode: BudgetViewMode;
  monthlyBudgetStatuses: BudgetStatus[];
  monthlyTotalSpending: number;
  monthlyTotalBudget: number;
  monthlyBudgetRemaining: number;
  onBudgetViewModeChange: (budgetViewMode: BudgetViewMode) => void;
};

export const BudgetStatusTable = ({
  budgetViewMode,
  monthlyBudgetStatuses,
  monthlyTotalSpending,
  monthlyTotalBudget,
  monthlyBudgetRemaining,
  onBudgetViewModeChange,
}: BudgetStatusTableProps) => {
  return (
    <Paper
      sx={{
        padding: 3,
        maxWidth: 1200,
        marginLeft: "auto",
        marginRight: "auto",
        marginY: 4,
      }}
    >
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 2,
        }}
      >
        <Typography variant="h6">
          {budgetViewMode === "category"
            ? "Budget by Category"
            : "Budget by Sub-category"}
        </Typography>

        <ToggleButtonGroup
          exclusive
          size="small"
          value={budgetViewMode}
          onChange={(_, nextViewMode: BudgetViewMode | null) => {
            if (!nextViewMode) {
              return;
            }

            onBudgetViewModeChange(nextViewMode);
          }}
        >
          <ToggleButton value="category">Category</ToggleButton>
          <ToggleButton value="subCategory">Sub-category</ToggleButton>
        </ToggleButtonGroup>
      </Box>

      {monthlyBudgetStatuses.map((budgetStatus) => (
        <Box
          key={`${budgetStatus.categoryName}-${budgetStatus.subCategoryName ?? ""}`}
          sx={{
            display: "grid",
            gridTemplateColumns: "1fr repeat(3, 120px)",
            gap: 2,
            paddingTop: 1,
            paddingBottom: 1,
            borderBottom: "1px solid #eee",
          }}
        >
          <Typography>
            {budgetViewMode === "category"
              ? budgetStatus.categoryName
              : `${budgetStatus.categoryName} / ${budgetStatus.subCategoryName}`}
          </Typography>

          <Typography align="right">
            {formatCurrency(budgetStatus.actual)}
          </Typography>

          <Typography align="right">
            {formatCurrency(budgetStatus.budget)}
          </Typography>

          <Typography
            align="right"
            whiteSpace="nowrap"
            color={budgetStatus.isOverBudget ? "error" : "text.primary"}
          >
            {budgetStatus.isOverBudget
              ? `${formatCurrency(Math.abs(budgetStatus.remaining))} over`
              : `${formatCurrency(budgetStatus.remaining)} left`}
          </Typography>
        </Box>
      ))}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "1fr repeat(3, 120px)",
          gap: 2,
          paddingTop: 2,
          fontWeight: "bold",
        }}
      >
        <Typography fontWeight="bold">Total</Typography>

        <Typography align="right" fontWeight="bold">
          {formatCurrency(monthlyTotalSpending)}
        </Typography>

        <Typography align="right" fontWeight="bold">
          {formatCurrency(monthlyTotalBudget)}
        </Typography>

        <Typography align="right" fontWeight="bold" whiteSpace="nowrap">
          {monthlyBudgetRemaining < 0
            ? `${formatCurrency(Math.abs(monthlyBudgetRemaining))} over`
            : `${formatCurrency(monthlyBudgetRemaining)} left`}
        </Typography>
      </Box>
    </Paper>
  );
};
