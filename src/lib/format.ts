export function formatDZD(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("ar-DZ", { maximumFractionDigits: 0 }).format(value) + " دج";
}

export function effectivePrice(p: { price_dzd: number; discount_price_dzd: number | null }) {
  return p.discount_price_dzd ?? p.price_dzd;
}

export function discountPercent(p: { price_dzd: number; discount_price_dzd: number | null }) {
  if (!p.discount_price_dzd) return 0;
  return Math.round(((p.price_dzd - p.discount_price_dzd) / p.price_dzd) * 100);
}

// Algerian phone validation: 10 digits starting with 0, mobile 05/06/07
export function isValidDZPhone(phone: string): boolean {
  const cleaned = phone.replace(/\s|-/g, "");
  return /^0[567]\d{8}$/.test(cleaned);
}

export function normalizePhone(phone: string): string {
  return phone.replace(/\s|-/g, "");
}
