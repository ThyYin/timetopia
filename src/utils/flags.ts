const REGIONAL_INDICATOR_A = 0x1f1e6;

export function flagEmoji(countryCode: string | undefined): string | undefined {
  if (!countryCode) return undefined;

  const code = countryCode.trim().toUpperCase();
  if (!/^[A-Z]{2}$/.test(code)) return undefined;

  const first = code.codePointAt(0);
  const second = code.codePointAt(1);
  if (first === undefined || second === undefined) return undefined;

  return String.fromCodePoint(
    REGIONAL_INDICATOR_A + first - 65,
    REGIONAL_INDICATOR_A + second - 65,
  );
}
