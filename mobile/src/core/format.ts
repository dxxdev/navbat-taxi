// 120000 -> "120 000 so'm"
export function formatNumber(value: number): string {
  return Math.round(value)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, " ");
}

export function formatSom(value: number): string {
  return `${formatNumber(value)} so'm`;
}

// Foydalanuvchi kiritgan matndan faqat raqamlarni olib, son qaytaradi (bo'sh bo'lsa NaN)
export function parseSom(text: string): number {
  const digits = text.replace(/\D/g, "");
  return digits === "" ? NaN : Number(digits);
}