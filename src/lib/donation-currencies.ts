export const DONATION_CURRENCIES = {
  KES: {
    code: "KES",
    label: "Kenyan Shilling (KES)",
    symbol: "Ksh",
    presets: [
      { val: 500, label: "Academy lunch" },
      { val: 1500, label: "Training support" },
      { val: 3000, label: "Boots & kit" },
      { val: 8000, label: "Away travel" },
    ],
  },
  USD: {
    code: "USD",
    label: "US Dollar (USD)",
    symbol: "$",
    presets: [
      { val: 5, label: "Academy lunch" },
      { val: 15, label: "Training support" },
      { val: 30, label: "Boots & kit" },
      { val: 75, label: "Away travel" },
    ],
  },
  GBP: {
    code: "GBP",
    label: "British Pound (GBP)",
    symbol: "£",
    presets: [
      { val: 5, label: "Academy lunch" },
      { val: 10, label: "Training support" },
      { val: 25, label: "Boots & kit" },
      { val: 60, label: "Away travel" },
    ],
  },
  EUR: {
    code: "EUR",
    label: "Euro (EUR)",
    symbol: "€",
    presets: [
      { val: 5, label: "Academy lunch" },
      { val: 15, label: "Training support" },
      { val: 30, label: "Boots & kit" },
      { val: 70, label: "Away travel" },
    ],
  },
} as const;

export type DonationCurrencyCode = keyof typeof DONATION_CURRENCIES;

export const DONATION_CURRENCY_CODES = Object.keys(
  DONATION_CURRENCIES
) as DonationCurrencyCode[];

export function isDonationCurrencyCode(value: string): value is DonationCurrencyCode {
  return value in DONATION_CURRENCIES;
}

export function getDonationCurrency(code?: string | null) {
  if (code && isDonationCurrencyCode(code)) {
    return DONATION_CURRENCIES[code];
  }
  return DONATION_CURRENCIES.KES;
}

export function formatDonationAmount(amount: number, currency?: string | null): string {
  const config = getDonationCurrency(currency);
  const formatted = Number(amount).toLocaleString(undefined, {
    maximumFractionDigits: 0,
  });

  if (config.code === "KES") {
    return `Ksh ${formatted}`;
  }

  return `${config.symbol}${formatted}`;
}

export function getDefaultDonationAmount(currency: DonationCurrencyCode): number {
  return DONATION_CURRENCIES[currency].presets[1]?.val ?? DONATION_CURRENCIES[currency].presets[0].val;
}
