export type Transaction = {
    id?: number;
    date: string;           // ISO string
    amount: number;         // positive/negative
    description: string;
    fingerprint: string;    // for dedupe
    raw?: Record<string, any>; // original CSV row (for debugging)
};