import { MongoClient } from "mongodb";
import { config } from "../config.js";

const mongoClient = new MongoClient(config.mongoUri);

export const connectMongo = async () => {
  await mongoClient.connect();

  return mongoClient.db(config.databaseName);
};
