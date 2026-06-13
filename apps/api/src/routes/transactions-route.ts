import { Router } from "express";
import { connectMongo } from "../db/mongo-client.js";
import { getTransactionsCollection } from "../db/collections.js";
import { transactionSchema } from "../schemas/transaction-schema.js";

export const transactionsRoute = Router();

transactionsRoute.get("/", async (_request, response) => {
  const db = await connectMongo();

  const transactions = await getTransactionsCollection(db)
    .find({}, { projection: { _id: 0 } })
    .sort({ date: -1 })
    .toArray();

  response.json(transactions);
});

transactionsRoute.post("/", async (request, response) => {
  const parseResult = transactionSchema.safeParse(request.body);

  if (!parseResult.success) {
    response.status(400).json(parseResult.error.flatten());
    return;
  }

  const db = await connectMongo();

  await getTransactionsCollection(db).insertOne(parseResult.data);

  response.status(201).json(parseResult.data);
});

transactionsRoute.patch("/:id", async (request, response) => {
  const id = Number(request.params.id);

  const db = await connectMongo();

  await getTransactionsCollection(db).updateOne(
    { id },
    { $set: request.body },
  );

  response.json({ status: "updated" });
});

transactionsRoute.delete("/:id", async (request, response) => {
  const id = Number(request.params.id);

  const db = await connectMongo();

  await getTransactionsCollection(db).deleteOne({ id });

  response.json({ status: "deleted" });
});
