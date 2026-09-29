import { describe, expect, it } from 'vitest';
import { buildTimeEmbed } from '../src/utils/formatter';
import { resolveLocation } from '../src/services/locationResolver';
import { formatUtcOffset, getZonedTime, isValidTimeZone } from '../src/services/timezoneService';

describe('timezone calculations', () => {
  it('rejects timezones Intl does not recognise', () => {
    expect(isValidTimeZone('Not/A_Timezone')).toBe(false);
    expect(isValidTimeZone('Asia/Tokyo')).toBe(true);
  });

  it('calculates the UTC offset from the current date instead of a fixed map', () => {
    const winter = new Date('2026-01-15T17:00:00.000Z');
    const summer = new Date('2026-07-15T16:00:00.000Z');

    expect(formatUtcOffset('America/New_York', winter)).toBe('UTC-05:00');
    expect(formatUtcOffset('America/New_York', summer)).toBe('UTC-04:00');
    expect(formatUtcOffset('Europe/London', new Date('2026-01-15T12:00:00.000Z'))).toBe(
      'UTC+00:00',
    );
    expect(formatUtcOffset('Europe/London', new Date('2026-07-15T11:00:00.000Z'))).toBe(
      'UTC+01:00',
    );
    expect(formatUtcOffset('Asia/Kuala_Lumpur', winter)).toBe('UTC+08:00');
    expect(formatUtcOffset('Asia/Kuala_Lumpur', summer)).toBe('UTC+08:00');
    expect(formatUtcOffset('Asia/Tokyo', winter)).toBe('UTC+09:00');
    expect(formatUtcOffset('America/Phoenix', winter)).toBe('UTC-07:00');
    expect(formatUtcOffset('America/Phoenix', summer)).toBe('UTC-07:00');
    expect(formatUtcOffset('America/Denver', summer)).toBe('UTC-06:00');
    expect(formatUtcOffset('Australia/Sydney', new Date('2026-01-15T01:00:00.000Z'))).toBe(
      'UTC+11:00',
    );
    expect(formatUtcOffset('Australia/Brisbane', new Date('2026-01-15T02:00:00.000Z'))).toBe(
      'UTC+10:00',
    );
  });

  it('formats 12-hour time and a readable date', () => {
    const moment = new Date('2026-09-29T13:35:00.000Z');
    const japan = getZonedTime('Asia/Tokyo', moment);
    const malaysia = getZonedTime('Asia/Kuala_Lumpur', moment);

    expect(japan.time).toBe('10:35 PM');
    expect(japan.date).toBe('Tuesday, 29 September 2026');
    expect(japan.offset).toBe('UTC+09:00');
    expect(malaysia.time).toBe('9:35 PM');
    expect(malaysia.date).toBe('Tuesday, 29 September 2026');
    expect(malaysia.offset).toBe('UTC+08:00');
  });

  it('builds the Discord embed from the resolved place', () => {
    const moment = new Date('2026-09-29T13:35:00.000Z');
    const japan = resolveLocation('Japan');
    const malaysia = resolveLocation('Malaysia');
    expect(japan.status).toBe('match');
    expect(malaysia.status).toBe('match');
    if (japan.status !== 'match' || malaysia.status !== 'match') return;

    const japanEmbed = buildTimeEmbed(japan.place, moment);
    const malaysiaEmbed = buildTimeEmbed(malaysia.place, moment);

    expect(japanEmbed.data.title).toBe('🇯🇵 Japan — Tokyo');
    expect(japanEmbed.data.description).toContain('🕐 **10:35 PM**');
    expect(japanEmbed.data.description).toContain('📅 Tuesday, 29 September 2026');
    expect(japanEmbed.data.description).toContain('🌐 Asia/Tokyo');
    expect(japanEmbed.data.description).toContain('🕓 UTC+09:00');
    expect(japanEmbed.data.footer?.text).toBe('TimeTopia • Timezone information');

    expect(malaysiaEmbed.data.title).toBe('🇲🇾 Malaysia — Kuala Lumpur');
    expect(malaysiaEmbed.data.description).toContain('🕐 **9:35 PM**');
    expect(malaysiaEmbed.data.description).toContain('🌐 Asia/Kuala_Lumpur');
    expect(malaysiaEmbed.data.description).toContain('🕓 UTC+08:00');
  });
});
