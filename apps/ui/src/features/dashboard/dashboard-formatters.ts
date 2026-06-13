export const roundCurrency = (amount: number) => {
  return Math.round((amount + Number.EPSILON) * 100) / 100;
};

export const formatCurrency = (amount: number) => {
  return `$${roundCurrency(amount).toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

export const formatCompactCurrency = (amount: number) => {
  return `$${roundCurrency(amount).toLocaleString(undefined, {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  })}`;
};

export const getMonthKey = (date: string) => {
  const transactionDate = new Date(date);

  return `${transactionDate.getFullYear()}-${String(
    transactionDate.getMonth() + 1,
  ).padStart(2, "0")}`;
};

export const formatMonthLabel = (monthKey: string) => {
  const [year, month] = monthKey.split("-");

  return new Date(Number(year), Number(month) - 1, 1).toLocaleDateString(
    undefined,
    {
      year: "numeric",
      month: "long",
    },
  );
};
