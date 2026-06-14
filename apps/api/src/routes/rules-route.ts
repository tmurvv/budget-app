import { Router } from "express";

import { connectMongo } from "../db/mongo-client.js";

export const rulesRoute = Router();

rulesRoute.get("/", async (_request, response) => {
  const db = await connectMongo();

  const rules = await db
    .collection("categoryRules")
    .find({}, { projection: { _id: 0 } })
    .sort({ priority: 1 })
    .toArray();

  response.json(rules);
});

rulesRoute.post("/", async (request, response) => {
  const db = await connectMongo();

  await db.collection("categoryRules").insertOne(request.body);

  response.status(201).json(request.body);
});

rulesRoute.patch("/:id", async (request, response) => {
  const id = Number(request.params.id);
  const db = await connectMongo();

  await db.collection("categoryRules").updateOne(
    { id },
    {
      $set: request.body,
    },
  );

  response.json({ status: "updated" });
});

rulesRoute.delete("/:id", async (request, response) => {
  const id = Number(request.params.id);
  const db = await connectMongo();

  await db.collection("categoryRules").deleteOne({ id });

  response.json({ status: "deleted" });
});
