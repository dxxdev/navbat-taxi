/** Kiritilgan matndan faqat raqamlar (maks. 9 ta, +998 olib tashlanadi) */
export function digitsFromInput(text: string): string {
  let d = text.replace(/\D/g, "");
  if (d.length > 9 && d.startsWith("998")) d = d.slice(3);
  return d.slice(0, 9);
}

/** 901234567 -> "90 123 45 67" */
export function formatUzPhone(digits: string): string {
  return [digits.slice(0, 2), digits.slice(2, 5), digits.slice(5, 7), digits.slice(7, 9)]
    .filter(Boolean)
    .join(" ");
}

export function isCompletePhone(digits: string): boolean {
  return /^\d{9}$/.test(digits);
}

export function toE164(digits: string): string {
  return `+998${digits}`;
}