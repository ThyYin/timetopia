export interface ZonedTime {
  timeZone: string;
  time: string;
  date: string;
  offset: string;
}

let cachedTimeZones: string[] | undefined;

export function listTimeZones(): readonly string[] {
  if (!cachedTimeZones) {
    cachedTimeZones = Intl.supportedValuesOf('timeZone');
  }

  return cachedTimeZones;
}

export function isValidTimeZone(timeZone: string): boolean {
  try {
    new Intl.DateTimeFormat('en-US', { timeZone }).format(0);
    return true;
  } catch {
    return false;
  }
}

export function canonicalizeTimeZone(input: string): string | null {
  const trimmed = input.trim();
  if (!trimmed) return null;

  if (/^(gmt|utc|etc\/utc|etc\/gmt)$/i.test(trimmed)) return 'UTC';

  const candidate = trimmed.includes('/') ? trimmed.replace(/ /g, '_') : trimmed;
  const supported = listTimeZones();

  if (supported.includes(candidate)) return candidate;

  const lower = candidate.toLowerCase();
  const match = supported.find((timeZone) => timeZone.toLowerCase() === lower);
  if (match) return match;

  if (isValidTimeZone(candidate)) return candidate;
  return null;
}

function part(parts: Intl.DateTimeFormatPart[], type: Intl.DateTimeFormatPartTypes): string {
  return parts.find((item) => item.type === type)?.value ?? '';
}

export function formatUtcOffset(timeZone: string, date: Date): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hourCycle: 'h23',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  const parts = formatter.formatToParts(date);
  let hour = Number(part(parts, 'hour'));
  if (hour === 24) hour = 0;

  const asUtc = Date.UTC(
    Number(part(parts, 'year')),
    Number(part(parts, 'month')) - 1,
    Number(part(parts, 'day')),
    hour,
    Number(part(parts, 'minute')),
    Number(part(parts, 'second')),
  );

  const totalMinutes = Math.round((asUtc - date.getTime()) / 60000);
  if (!Number.isFinite(totalMinutes)) {
    throw new Error(`Could not calculate the UTC offset for ${timeZone}`);
  }

  const sign = totalMinutes >= 0 ? '+' : '-';
  const absolute = Math.abs(totalMinutes);
  const hours = String(Math.floor(absolute / 60)).padStart(2, '0');
  const minutes = String(absolute % 60).padStart(2, '0');
  return `UTC${sign}${hours}:${minutes}`;
}

export function getZonedTime(timeZone: string, date = new Date()): ZonedTime {
  if (!isValidTimeZone(timeZone)) {
    throw new Error(`Invalid timezone: ${timeZone}`);
  }

  const timeParts = new Intl.DateTimeFormat('en-US', {
    timeZone,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(date);

  const hour = part(timeParts, 'hour');
  const minute = part(timeParts, 'minute');
  const period = part(timeParts, 'dayPeriod').toUpperCase();

  const dateParts = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).formatToParts(date);

  return {
    timeZone,
    time: `${hour}:${minute} ${period}`.trim(),
    date: `${part(dateParts, 'weekday')}, ${part(dateParts, 'day')} ${part(dateParts, 'month')} ${part(dateParts, 'year')}`,
    offset: formatUtcOffset(timeZone, date),
  };
}
