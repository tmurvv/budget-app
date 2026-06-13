import { useEffect, useState } from "react";
import { Box, Button } from "@mui/material";

import { seedCategories } from "./features/categories/seed-categories";
import { CategoriesPage } from "./features/categories/CategoriesPage";
import { SubCategoriesPage } from "./features/categories/SubCategoriesPage";
import { BudgetPage } from "./features/budgeting/BudgetPage";
import { seedBudgets } from "./features/budgeting/seed-budgets";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { TransactionUploadPage } from "./features/transactions/TransactionUploadPage";
import { TransactionsPage } from "./features/transactions/TransactionsPage";

const App = () => {
  const [activePage, setActivePage] = useState<
      "dashboard" | "budget" | "upload" | "transactions" | "categories" | "subCategories"
      >("dashboard");

  useEffect(() => {
    void seedCategories();
    void seedBudgets();
  }, []);

  return (
      <Box sx={{ paddingTop: 2 }}>
        <Box sx={{ display: "flex", gap: 2, justifyContent: "center", flexWrap: "wrap" }}>
          <Button
              variant={activePage === "dashboard" ? "contained" : "outlined"}
              onClick={() => {
                setActivePage("dashboard");
              }}
          >
            Dashboard
          </Button>


          <Button
              variant={activePage === "budget" ? "contained" : "outlined"}
              onClick={() => {
                setActivePage("budget");
              }}
          >
            Budget
          </Button>

          <Button
              variant={activePage === "transactions" ? "contained" : "outlined"}
              onClick={() => {
                setActivePage("transactions");
              }}
          >
            Transactions
          </Button>

          <Button
              variant={activePage === "upload" ? "contained" : "outlined"}
              onClick={() => {
                setActivePage("upload");
              }}
          >
            Upload
          </Button>

          <Button
              variant={activePage === "categories" ? "contained" : "outlined"}
              onClick={() => {
                setActivePage("categories");
              }}
          >
            Categories
          </Button>

          <Button
              variant={activePage === "subCategories" ? "contained" : "outlined"}
              onClick={() => {
                setActivePage("subCategories");
              }}
          >
            Sub-categories
          </Button>
        </Box>

        {activePage === "dashboard" && <DashboardPage />}
        {activePage === "budget" && <BudgetPage />}
        {activePage === "transactions" && <TransactionsPage />}
        {activePage === "upload" && <TransactionUploadPage />}
        {activePage === "categories" && <CategoriesPage />}
        {activePage === "subCategories" && <SubCategoriesPage />}
      </Box>
  );
};

export default App;