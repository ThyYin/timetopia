import { describe, expect, it } from 'vitest';
import { resolveLocation, suggestLocations } from '../src/services/locationResolver';

function expectZone(input: string, timeZone: string): void {
  const result = resolveLocation(input);
  expect(result.status, input).toBe('match');
  if (result.status === 'match') {
    expect(result.place.timeZone, input).toBe(timeZone);
  }
}

describe('location resolution', () => {
  it('maps countries and cities to IANA timezones', () => {
    expectZone('Japan', 'Asia/Tokyo');
    expectZone('Malaysia', 'Asia/Kuala_Lumpur');
    expectZone('Tokyo', 'Asia/Tokyo');
    expectZone('New York', 'America/New_York');
    expectZone('Singapore', 'Asia/Singapore');
    expectZone('South Korea', 'Asia/Seoul');
    expectZone('China', 'Asia/Shanghai');
    expectZone('Germany', 'Europe/Berlin');
    expectZone('France', 'Europe/Paris');
    expectZone('United Kingdom', 'Europe/London');
    expectZone('Kuala Lumpur', 'Asia/Kuala_Lumpur');
    expectZone('Los Angeles', 'America/Los_Angeles');
    expectZone('California', 'America/Los_Angeles');
  });

  it('matches locations without caring about letter case', () => {
    const inputs = ['japan', 'Japan', 'JAPAN', 'jApAn'];
    const zones = inputs.map((input) => {
      const result = resolveLocation(input);
      expect(result.status).toBe('match');
      return result.status === 'match' ? result.place.timeZone : '';
    });

    expect(new Set(zones)).toEqual(new Set(['Asia/Tokyo']));
    expectZone('malaysia', 'Asia/Kuala_Lumpur');
    expectZone('MALAYSIA', 'Asia/Kuala_Lumpur');
  });

  it('accepts common abbreviations and spaced names', () => {
    expectZone('MY', 'Asia/Kuala_Lumpur');
    expectZone('JP', 'Asia/Tokyo');
    expectZone('SG', 'Asia/Singapore');
    expectZone('UK', 'Europe/London');
    expectZone('U.K.', 'Europe/London');
    expectZone('NYC', 'America/New_York');
    expectZone('LA', 'America/Los_Angeles');
    expectZone('KL', 'Asia/Kuala_Lumpur');
    expectZone('los angeles', 'America/Los_Angeles');
    expectZone('kuala lumpur', 'Asia/Kuala_Lumpur');
  });

  it('accepts valid IANA timezone ids directly', () => {
    expectZone('Asia/Tokyo', 'Asia/Tokyo');
    expectZone('asia/tokyo', 'Asia/Tokyo');
    expectZone('Europe/London', 'Europe/London');
    expectZone('America/New_York', 'America/New_York');
    expectZone('America/New York', 'America/New_York');
    expectZone('UTC', 'UTC');
    expectZone('GMT', 'UTC');
  });

  it('rejects invalid timezones and unknown places', () => {
    expect(resolveLocation('Not/A_Timezone').status).toBe('not_found');
    expect(resolveLocation('Wakanda').status).toBe('not_found');
    expect(resolveLocation('   ').status).toBe('empty');
  });

  it('does not silently pick a timezone for ambiguous names', () => {
    const georgia = resolveLocation('Georgia');
    expect(georgia.status).toBe('ambiguous');
    if (georgia.status === 'ambiguous') {
      const zones = georgia.candidates.map((candidate) => candidate.timeZone);
      expect(zones).toContain('Asia/Tbilisi');
      expect(zones).toContain('America/New_York');
      expect(zones).toHaveLength(2);
    }

    expect(resolveLocation('Portland').status).toBe('ambiguous');
    expect(resolveLocation('Springfield').status).toBe('ambiguous');

    const unitedStates = resolveLocation('United States');
    expect(unitedStates.status).toBe('ambiguous');
    if (unitedStates.status === 'ambiguous') {
      const zones = unitedStates.candidates.map((candidate) => candidate.timeZone);
      expect(zones).toContain('America/New_York');
      expect(zones).toContain('America/Los_Angeles');
      expect(new Set(zones).size).toBeGreaterThan(1);
    }

    expect(resolveLocation('USA').status).toBe('ambiguous');
    expect(resolveLocation('U.S.A.').status).toBe('ambiguous');

    const australia = resolveLocation('Australia');
    expect(australia.status).toBe('ambiguous');
    if (australia.status === 'ambiguous') {
      const zones = australia.candidates.map((candidate) => candidate.timeZone);
      expect(zones).toContain('Australia/Sydney');
      expect(zones).toContain('Australia/Perth');
    }
  });

  it('shows Japan, Tokyo, and Osaka when autocomplete starts with Jap', () => {
    const suggestions = suggestLocations('Jap');
    const values = suggestions.map((suggestion) => suggestion.value);

    expect(suggestions.length).toBeLessThanOrEqual(25);
    expect(values[0]).toBe('japan');
    expect(values).toContain('tokyo');
    expect(values).toContain('osaka');
    expect(suggestions.some((suggestion) => suggestion.name.includes('🇯🇵'))).toBe(true);
  });

  it('caps autocomplete at 25 choices', () => {
    expect(suggestLocations('a', 100).length).toBeLessThanOrEqual(25);
    expect(suggestLocations('').some((suggestion) => suggestion.value === 'japan')).toBe(true);
  });

  it('labels ambiguous autocomplete choices clearly', () => {
    const suggestions = suggestLocations('Georgia');
    const names = suggestions.map((suggestion) => suggestion.name);

    expect(names).toContain('🇬🇪 Georgia (country)');
    expect(names).toContain('🇺🇸 Georgia (United States)');
  });
});
