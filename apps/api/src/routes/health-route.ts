import { Router } from "express";

export const healthRoute = Router();

healthRoute.get("/", (_request, response) => {
  response.json({ status: "ok" });
});
