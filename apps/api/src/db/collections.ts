import type { Db } from "mongodb";

export const getTransactionsCollection = (db: Db) => {
  return db.collection("transactions");
};
