import { Router } from "express";

import { connectMongo } from "../db/mongo-client.js";

export const categoriesRoute = Router();

categoriesRoute.get("/", async (_request, response) => {
  const db = await connectMongo();

  const categories = await db
    .collection("categories")
    .find({}, { projection: { _id: 0 } })
    .sort({ name: 1 })
    .toArray();

  response.json(categories);
});

categoriesRoute.post("/", async (request, response) => {
  const db = await connectMongo();

  await db.collection("categories").insertOne(request.body);

  response.status(201).json(request.body);
});

categoriesRoute.patch("/:id", async (request, response) => {
  const id = Number(request.params.id);
  const db = await connectMongo();

  const existingCategory = await db.collection("categories").findOne({
    id,
  });

  if (!existingCategory) {
    response.status(404).json({
      message: "Category not found",
    });
    return;
  }

  await db.collection("categories").updateOne(
    { id },
    {
      $set: request.body,
    },
  );

  if (
    typeof request.body.name === "string" &&
    typeof existingCategory.name === "string"
  ) {
    await db.collection("transactions").updateMany(
      { category: existingCategory.name },
      {
        $set: {
          category: request.body.name,
        },
      },
    );

    await db.collection("subCategories").updateMany(
      { categoryName: existingCategory.name },
      {
        $set: {
          categoryName: request.body.name,
        },
      },
    );
  }

  response.json({ status: "updated" });
});

categoriesRoute.delete("/:id", async (request, response) => {
  const id = Number(request.params.id);
  const db = await connectMongo();

  await db.collection("categories").deleteOne({ id });

  response.json({ status: "deleted" });
});
