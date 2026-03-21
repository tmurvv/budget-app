export type Transaction = {
  id?: number;
  date: string;
  amount: number;
  description: string;
  fingerprint: string;
  category?: string;
  subCategory?: string;
  raw?: Record<string, any>;
};
