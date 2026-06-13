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
  app.use(express.json());

  app.use("/health", healthRoute);
  app.use("/transactions", transactionsRoute);

  app.listen(config.port, () => {
    console.log(`budget-api listening on port ${config.port}`);
  });
};

void startServer();
