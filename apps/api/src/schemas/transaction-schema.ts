import { z } from "zod";

export const transactionSchema = z.object({
  id: z.number().optional(),
  bank: z.enum(["RBC", "ONE", "MRV", "MAN"]),
  date: z.string(),
  amount: z.number(),
  description: z.string().min(1),
  fingerprint: z.string().min(1),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  notes: z.string().optional(),
  raw: z.record(z.string(), z.unknown()).optional(),
});

export type TransactionDto = z.infer<typeof transactionSchema>;
