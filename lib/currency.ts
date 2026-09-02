export type Currency = "TZS" | "USD";

export const USD_TO_TZS = 2640;

export function convertFromTZS(
  amountTZS: number,
  currency: Currency
): number {
  const amount = Number(amountTZS || 0);

  if (currency === "USD") {
    return amount / USD_TO_TZS;
  }

  return amount;
}

export function formatCurrency(
  amountTZS: number,
  currency: Currency
): string {
  const amount = convertFromTZS(amountTZS, currency);

  if (currency === "USD") {
    return `USD ${amount.toLocaleString("en-US", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  return `TZS ${Math.round(amount).toLocaleString("en-US")}`;
}
