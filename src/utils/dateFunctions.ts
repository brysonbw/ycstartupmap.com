/** Get current date year */
export function currentYear(): string {
  const date = new Date();
  return date.getFullYear().toString();
}
