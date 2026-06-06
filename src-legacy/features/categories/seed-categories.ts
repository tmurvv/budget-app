import { db } from "../../db/db";
import { CATEGORIES } from "./categories";

export const seedCategories = async () => {
    const existingCount = await db.categories.count();

    if (existingCount > 0) {
        return;
    }

    await db.categories.bulkAdd(
        CATEGORIES.map((category) => {
            return { name: category };
        }),
    );
};