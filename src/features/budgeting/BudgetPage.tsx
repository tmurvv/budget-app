import { Box, Paper, TextField, Typography } from "@mui/material";
import { useLiveQuery } from "dexie-react-hooks";

import { db } from "../../db/db";
import { MONTHLY_INCOME } from "./budget-values";

const formatCurrency = (amount: number) => {
  return amount.toLocaleString(undefined, {
    style: "currency",
    currency: "CAD",
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

const parseBudgetAmount = (value: string) => {
  const amount = Number(value);

  if (Number.isNaN(amount)) {
    return 0;
  }

  return amount;
};

export const BudgetPage = () => {
  const budgets = useLiveQuery(async () => {
    return db.budgets.orderBy("categoryName").toArray();
  }, []);

  const totalBudget = (budgets ?? []).reduce((runningTotal, budget) => {
    return runningTotal + budget.amount;
  }, 0);

  const remainingIncome = MONTHLY_INCOME - totalBudget;

  return (
    <Box sx={{ padding: 4, maxWidth: 900, marginLeft: "auto", marginRight: "auto" }}>
      <Typography variant="h4" gutterBottom align="center">
        Budget
      </Typography>

      <Box sx={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 2, marginBottom: 3 }}>
        <Paper sx={{ padding: 2, textAlign: "center" }}>
          <Typography variant="subtitle2">Monthly Income</Typography>
          <Typography variant="h5">{formatCurrency(MONTHLY_INCOME)}</Typography>
        </Paper>

        <Paper sx={{ padding: 2, textAlign: "center" }}>
          <Typography variant="subtitle2">Budgeted Spending</Typography>
          <Typography variant="h5">{formatCurrency(totalBudget)}</Typography>
        </Paper>

        <Paper sx={{ padding: 2, textAlign: "center" }}>
          <Typography variant="subtitle2">Income After Budget</Typography>
          <Typography variant="h5">{formatCurrency(remainingIncome)}</Typography>
        </Paper>
      </Box>

      <Paper sx={{ padding: 3 }}>
        {(budgets ?? []).map((budget) => (
          <Box
            key={budget.categoryName}
            sx={{
              display: "grid",
              gridTemplateColumns: "1fr 180px",
              gap: 2,
              alignItems: "center",
              marginBottom: 2,
            }}
          >
            <Typography>{budget.categoryName}</Typography>

            <TextField
              label="Monthly Budget"
              type="number"
              size="small"
              value={budget.amount}
              onChange={(event) => {
                if (budget.id === undefined) {
                  return;
                }

                void db.budgets.update(budget.id, {
                  amount: parseBudgetAmount(event.target.value),
                });
              }}
            />
          </Box>
        ))}
      </Paper>
    </Box>
  );
};
