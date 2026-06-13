import cors from "cors";
import express from "express";

import { config } from "./config.js";
import { connectMongo } from "./db/mongo-client.js";
import { healthRoute } from "./routes/health-route.js";
import { transactionsRoute } from "./routes/transactions-route.js";

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

  app.post("/migration/import-indexed-db", async (request, response) => {
    const transactions = Array.isArray(request.body?.transactions)
      ? request.body.transactions
      : [];

    const db = await connectMongo();

    const tableNames = [
      "categories",
      "subCategories",
      "categoryRules",
      "budgets",
      "transactionAllocations",
    ] as const;

    for (const tableName of tableNames) {
      const documents = Array.isArray(request.body?.[tableName])
        ? request.body[tableName]
        : [];

      if (documents.length > 0) {
        await db.collection(tableName).deleteMany({});
        await db.collection(tableName).insertMany(documents);
      }
    }

    response.json({
      importedCount: transactions.length,
    });
  });

  app.listen(config.port, () => {
    console.log(`budget-api listening on port ${config.port}`);
  });
};

void startServer();
