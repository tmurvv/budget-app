import { useEffect, useState } from "react";
import { Box, Button } from "@mui/material";

import { CategoriesPage } from "./features/categories/CategoriesPage";
import { seedCategories } from "./features/categories/seed-categories";
import { TransactionUploadPage } from "./features/transactions/TransactionUploadPage";
import { TransactionsPage } from "./features/transactions/TransactionsPage";
import { SubCategoriesPage } from "./features/categories/SubCategoriesPage";

const App = () => {
  const [activePage, setActivePage] = useState<
    "upload" | "transactions" | "categories" | "subCategories"
  >("transactions");

  useEffect(() => {
    void seedCategories();
  }, []);

  return (
    <Box sx={{ paddingTop: 2 }}>
      <Box sx={{ display: "flex", gap: 2, justifyContent: "center" }}>
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
      {activePage === "transactions" && <TransactionsPage />}
      {activePage === "upload" && <TransactionUploadPage />}
      {activePage === "categories" && <CategoriesPage />}
      {activePage === "subCategories" && <SubCategoriesPage />}
    </Box>
  );
};

export default App;
