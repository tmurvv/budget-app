import { Router } from "express";

import { connectMongo } from "../db/mongo-client.js";

export const subCategoriesRoute = Router();

subCategoriesRoute.get("/", async (_request, response) => {
  const db = await connectMongo();

  const subCategories = await db
    .collection("subCategories")
    .find({}, { projection: { _id: 0 } })
    .sort({ categoryName: 1, name: 1 })
    .toArray();

  response.json(subCategories);
});

subCategoriesRoute.post("/", async (request, response) => {
  const db = await connectMongo();

  await db.collection("subCategories").insertOne(request.body);

  response.status(201).json(request.body);
});

subCategoriesRoute.patch("/:id", async (request, response) => {
  const id = Number(request.params.id);
  const db = await connectMongo();

  const existingSubCategory = await db.collection("subCategories").findOne({
    id,
  });

  if (!existingSubCategory) {
    response.status(404).json({
      message: "Sub-category not found",
    });
    return;
  }

  const result = await db.collection("subCategories").updateOne(
    { id },
    {
      $set: request.body,
    },
  );

  if (
    typeof request.body.name === "string" &&
    typeof existingSubCategory.name === "string"
  ) {
    await db.collection("transactions").updateMany(
      {
        category: existingSubCategory.categoryName,
        subCategory: existingSubCategory.name,
      },
      {
        $set: {
          subCategory: request.body.name,
        },
      },
    );
  }
  console.log("sub-category update result", {
    id,
    body: request.body,
    matchedCount: result.matchedCount,
    modifiedCount: result.modifiedCount,
  });

  response.json({ status: "updated" });
});

subCategoriesRoute.delete("/:id", async (request, response) => {
  const id = Number(request.params.id);
  const db = await connectMongo();

  const result = await db.collection("subCategories").deleteOne({ id });

  response.json({
    status: "deleted",
    id,
    deletedCount: result.deletedCount,
  });
});
