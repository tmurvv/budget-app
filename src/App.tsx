import { TransactionsPage } from "./features/transactions/TransactionsPage";
import { TransactionUploadPage } from "./features/transactions/TransactionUploadPage";
import { Divider } from "@mui/material";

const App = () => {
  return (
    <>
      <TransactionUploadPage />
      <Divider />
      <TransactionsPage />
    </>
  );
};

export default App;
