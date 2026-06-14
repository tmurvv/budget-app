import { Router } from "express";
import { connectMongo } from "../db/mongo-client.js";
import { getTransactionsCollection } from "../db/collections.js";
import { transactionSchema } from "../schemas/transaction-schema.js";

export const transactionsRoute = Router();

const getNextTransactionIds = async ({ count }: { count: number }) => {
  const db = await connectMongo();

  const latestTransaction = await getTransactionsCollection(db).findOne(
    {},
    {
      projection: { _id: 0, id: 1 },
      sort: { id: -1 },
    },
  );

  const startingId = (latestTransaction?.id ?? 0) + 1;

  return Array.from({ length: count }, (_value, index) => {
    return startingId + index;
  });
};

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

transactionsRoute.post("/bulk", async (request, response) => {
  const transactions: unknown[] = Array.isArray(request.body?.transactions)
    ? request.body.transactions
    : [];

  const parseResults = transactions.map((transaction) => {
    return transactionSchema.omit({ id: true }).safeParse(transaction);
  });

  const failedParseResult = parseResults.find((parseResult) => {
    return !parseResult.success;
  });

  if (failedParseResult) {
    response.status(400).json({ message: "Invalid transaction upload data" });
    return;
  }

  const parsedTransactions = parseResults.flatMap((parseResult) => {
    return parseResult.success ? [parseResult.data] : [];
  });

  const db = await connectMongo();

  const fingerprints = parsedTransactions.map((transaction) => {
    return transaction.fingerprint;
  });

  const existingTransactions = await getTransactionsCollection(db)
    .find(
      {
        fingerprint: { $in: fingerprints },
      },
      {
        projection: { _id: 0, fingerprint: 1 },
      },
    )
    .toArray();

  const existingFingerprints = new Set(
    existingTransactions.map((transaction) => {
      return transaction.fingerprint;
    }),
  );

  const newTransactions = parsedTransactions.filter((transaction) => {
    return !existingFingerprints.has(transaction.fingerprint);
  });

  const ids = await getNextTransactionIds({
    count: newTransactions.length,
  });

  const transactionsToInsert = newTransactions.map((transaction, index) => {
    return {
      ...transaction,
      id: ids[index],
    };
  });

  if (transactionsToInsert.length > 0) {
    await getTransactionsCollection(db).insertMany(transactionsToInsert);
  }

  response.status(201).json({
    insertedCount: transactionsToInsert.length,
    duplicateCount: transactions.length - transactionsToInsert.length,
  });
});

transactionsRoute.patch("/:id", async (request, response) => {
  const id = Number(request.params.id);

  const db = await connectMongo();

  await getTransactionsCollection(db).updateOne({ id }, { $set: request.body });

  response.json({ status: "updated" });
});

transactionsRoute.delete("/:id", async (request, response) => {
  const id = Number(request.params.id);

  const db = await connectMongo();

  await db.collection("transactionAllocations").deleteMany({
    transactionId: id,
  });

  await getTransactionsCollection(db).deleteOne({
    id,
  });

  response.json({
    status: "deleted",
  });
});

transactionsRoute.post("/transactions/:id/split", async (request, response) => {
  const transactionId = Number(request.params.id);
  const allocations = Array.isArray(request.body?.allocations)
    ? request.body.allocations
    : [];

  const db = await connectMongo();

  await db.collection("transactionAllocations").deleteMany({
    transactionId,
  });

  if (allocations.length > 0) {
    await db.collection("transactionAllocations").insertMany(allocations);
  }

  response.json({
    status: "split saved",
    allocationCount: allocations.length,
  });
});

transactionsRoute.post("/:id/split", async (request, response) => {
  const transactionId = Number(request.params.id);
  const allocations = Array.isArray(request.body?.allocations)
    ? request.body.allocations
    : [];

  const db = await connectMongo();

  await db.collection("transactionAllocations").deleteMany({
    transactionId,
  });

  if (allocations.length > 0) {
    await db.collection("transactionAllocations").insertMany(allocations);
  }

  response.json({
    status: "saved",
    allocationCount: allocations.length,
  });
});
