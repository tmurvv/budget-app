export type Transaction = {
  id?: number;
  bank: "RBC" | "ONE" | "MRV" | "MAN";
  date: string;
  amount: number;
  description: string;
  fingerprint: string;
  category?: string;
  subCategory?: string;
  notes?: string;
  raw?: Record<string, unknown>;
};
