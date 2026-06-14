import { Router } from "express";

import { connectMongo } from "../db/mongo-client.js";

export const budgetsRoute = Router();

budgetsRoute.get("/", async (_request, response) => {
  const db = await connectMongo();

  const budgets = await db
    .collection("budgets")
    .find({}, { projection: { _id: 0 } })
    .sort({ categoryName: 1, subCategoryName: 1 })
    .toArray();

  response.json(budgets);
});

budgetsRoute.patch("/:id", async (request, response) => {
  const id = Number(request.params.id);
  const db = await connectMongo();

  await db.collection("budgets").updateOne(
    { id },
    {
      $set: {
        amount: request.body.amount,
      },
    },
  );

  response.json({ status: "updated" });
});

budgetsRoute.post("/", async (request, response) => {
  const db = await connectMongo();

  await db.collection("budgets").insertOne(request.body);

  response.status(201).json(request.body);
});

budgetsRoute.get("/sub-categories", async (_request, response) => {
  const db = await connectMongo();

  const subCategories = await db
    .collection("subCategories")
    .find({}, { projection: { _id: 0 } })
    .sort({ categoryName: 1, name: 1 })
    .toArray();

  response.json(subCategories);
});
