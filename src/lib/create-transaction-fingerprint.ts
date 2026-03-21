export const createTransactionFingerprint = (params: {
    date: string;
    amount: number;
    description: string;
}) => {
    const normalizedDate = params.date.trim().toLowerCase();
    const normalizedAmount = params.amount.toFixed(2);
    const normalizedDescription = params.description.trim().toLowerCase();

    return [
        normalizedDate,
        normalizedAmount,
        normalizedDescription,
    ].join("|");
};
