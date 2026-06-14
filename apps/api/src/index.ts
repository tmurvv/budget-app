import cors from "cors";
import express from "express";

import { config } from "./config.js";
import { connectMongo } from "./db/mongo-client.js";
import { healthRoute } from "./routes/health-route.js";
import { transactionsRoute } from "./routes/transactions-route.js";
import { budgetsRoute } from "./routes/budgets-route.js";
import { categoriesRoute } from "./routes/categories-route.js";
import { rulesRoute } from "./routes/rules-route.js";
import { subCategoriesRoute } from "./routes/sub-categories-route.js";

const startServer = async () => {
  const db = await connectMongo();

  await db.collection("transactions").createIndex(
    { fingerprint: 1 },
    {
      unique: true,
      sparse: true,
    },
  );

  const app = express();

  app.use(cors());
  app.use(
    express.json({
      limit: "10mb",
    }),
  );

  app.use("/health", healthRoute);
  app.use("/transactions", transactionsRoute);
  app.use("/budgets", budgetsRoute);
  app.use("/categories", categoriesRoute);
  app.use("/sub-categories", subCategoriesRoute);
  app.use("/rules", rulesRoute);
  app.get("/transaction-allocations", async (_request, response) => {
    const db = await connectMongo();

    const allocations = await db
      .collection("transactionAllocations")
      .find({}, { projection: { _id: 0 } })
      .toArray();

    response.json(allocations);
  });
  app.listen(config.port, () => {
    console.log(`budget-api listening on port ${config.port}`);
  });
};

void startServer();
