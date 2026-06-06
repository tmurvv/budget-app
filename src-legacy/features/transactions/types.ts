export type Transaction = {
  id?: number;
  bank: string;
  date: string;
  amount: number;
  description: string;
  fingerprint: string;
  category?: string;
  subCategory?: string;
  notes?: string;
  raw?: Record<string, any>;
};
