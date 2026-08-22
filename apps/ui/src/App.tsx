import { useState } from "react";
import { Box, Button } from "@mui/material";

import { CategoriesProvider } from "./context/CategoriesContext";
import { SubCategoriesPage } from "./features/categories/SubCategoriesPage";
import { BudgetPage } from "./features/budgeting/BudgetPage";
import { DashboardPage } from "./features/dashboard/DashboardPage";
import { TransactionUploadPage } from "./features/transactions/TransactionUploadPage";
import { TransactionsPage } from "./features/transactions/TransactionsPage";

const App = () => {
  const [activePage, setActivePage] = useState<
      "dashboard" | "budget" | "upload" | "transactions" | "subCategories"
      >("dashboard");

  const [transactionCategoryFilter, setTransactionCategoryFilter] = useState("");

  return (
    <CategoriesProvider>
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
              variant={activePage === "subCategories" ? "contained" : "outlined"}
              onClick={() => {
                setActivePage("subCategories");
              }}
          >
           Categories
          </Button>
        </Box>

        {activePage === "dashboard" && (
          <DashboardPage
            onNavigateToCategory={(category) => {
              setTransactionCategoryFilter(category);
              setActivePage("transactions");
            }}
          />
        )}
        {activePage === "budget" && <BudgetPage />}
        {activePage === "transactions" && (
          <TransactionsPage
            initialCategory={transactionCategoryFilter}
            onCategoryFilterChange={setTransactionCategoryFilter}
          />
        )}
        {activePage === "upload" && <TransactionUploadPage />}
        {activePage === "subCategories" && <SubCategoriesPage />}
      </Box>
    </CategoriesProvider>
  );
};

export default App;