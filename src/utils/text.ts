export function normalizeLocationQuery(input: string): string {
  return input
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .replace(/&/g, ' and ')
    .replace(/['’`]/g, '')
    .replace(/\./g, '')
    .replace(/[_-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function sanitizeDisplayText(input: string): string {
  const cleaned = input
    .replace(/[`@<>]/g, '')
    .replace(/\s+/g, ' ')
    .trim();

  if (!cleaned) return 'that location';
  if (cleaned.length <= 80) return cleaned;
  return `${cleaned.slice(0, 77)}...`;
}
