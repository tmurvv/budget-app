import "dotenv/config";

const mongoUri = process.env.MONGO_URI;
const portValue = process.env.PORT;

if (!mongoUri) {
  throw new Error("MONGO_URI is required");
}

export const config = {
  mongoUri,
  port: portValue ? Number(portValue) : 8050,
  databaseName: "budget-app",
};
