import { ambiguousAliases, locations, popularLocationIds, type Location } from '../data/locations';
import { flagEmoji } from '../utils/flags';
import { normalizeLocationQuery } from '../utils/text';
import { canonicalizeTimeZone, isValidTimeZone, listTimeZones } from './timezoneService';

export interface ResolvedPlace {
  id: string;
  title: string;
  autocompleteName: string;
  timeZone: string;
}

export type ResolveResult =
  | { status: 'empty' }
  | { status: 'match'; place: ResolvedPlace }
  | { status: 'ambiguous'; query: string; candidates: ResolvedPlace[] }
  | { status: 'not_found'; query: string };

export interface LocationSuggestion {
  name: string;
  value: string;
}

const locationById = new Map<string, Location>();
const aliasIndex = new Map<string, Location>();
const ambiguousByKey = new Map<string, readonly Location[]>();

function heading(location: Location): string {
  const base =
    location.representativeCity &&
    normalizeLocationQuery(location.representativeCity) !== normalizeLocationQuery(location.name)
      ? `${location.name} — ${location.representativeCity}`
      : location.name;

  return location.qualifier ? `${base} (${location.qualifier})` : base;
}

function autocompleteName(location: Location): string {
  const flag = flagEmoji(location.countryCode);
  const prefix = flag ? `${flag} ` : '';
  const qualifier = location.qualifier ? ` (${location.qualifier})` : '';
  const name = `${prefix}${location.name}${qualifier}`;
  return name.length > 100 ? name.slice(0, 100) : name;
}

function titleFor(location: Location): string {
  const flag = flagEmoji(location.countryCode);
  const label = heading(location);
  const full = flag ? `${flag} ${label}` : label;
  return full.length > 256 ? full.slice(0, 256) : full;
}

export function toPlace(location: Location): ResolvedPlace {
  return {
    id: location.id,
    title: titleFor(location),
    autocompleteName: autocompleteName(location),
    timeZone: location.timezone,
  };
}

function requireLocation(id: string, source: string): Location {
  const location = locationById.get(id);
  if (!location) {
    throw new Error(`${source} points at missing location "${id}"`);
  }
  return location;
}

function indexLocations(): void {
  for (const location of locations) {
    if (locationById.has(location.id)) {
      throw new Error(`Duplicate location id: ${location.id}`);
    }

    if (!isValidTimeZone(location.timezone)) {
      throw new Error(`Location "${location.id}" has an invalid timezone: ${location.timezone}`);
    }

    locationById.set(location.id, location);
  }

  for (const [alias, ids] of Object.entries(ambiguousAliases)) {
    const key = normalizeLocationQuery(alias);
    if (!key) throw new Error('Ambiguous alias cannot be empty');
    if (ambiguousByKey.has(key)) throw new Error(`Duplicate ambiguous alias: ${alias}`);
    if (ids.length < 2) throw new Error(`Ambiguous alias "${alias}" needs at least two places`);

    ambiguousByKey.set(
      key,
      ids.map((id) => requireLocation(id, `Ambiguous alias "${alias}"`)),
    );
  }

  for (const location of locations) {
    const explicit = location.aliases.map((alias) => normalizeLocationQuery(alias));
    const generated = [
      normalizeLocationQuery(location.name),
      normalizeLocationQuery(location.id.replace(/-/g, ' ')),
    ];

    for (const key of explicit) {
      if (ambiguousByKey.has(key)) {
        throw new Error(
          `Alias "${key}" on "${location.id}" conflicts with an ambiguous location name`,
        );
      }
    }

    for (const key of [...explicit, ...generated]) {
      if (!key || ambiguousByKey.has(key)) continue;

      const owner = aliasIndex.get(key);
      if (owner && owner.id !== location.id) {
        throw new Error(`Alias "${key}" is used by both "${owner.id}" and "${location.id}"`);
      }

      aliasIndex.set(key, location);
    }
  }

  for (const id of popularLocationIds) {
    requireLocation(id, 'Popular location list');
  }
}

indexLocations();

function placeFromTimeZone(timeZone: string): ResolvedPlace {
  const countries = locations.filter(
    (location) => location.kind === 'country' && location.timezone === timeZone,
  );
  const country = countries[0];
  if (countries.length === 1 && country) return toPlace(country);

  const sameZone = locations.filter((location) => location.timezone === timeZone);
  const only = sameZone[0];
  if (sameZone.length === 1 && only) return toPlace(only);

  const cityPart = timeZone.split('/').pop()?.replace(/_/g, ' ') ?? '';
  const named = sameZone.find(
    (location) => normalizeLocationQuery(location.name) === normalizeLocationQuery(cityPart),
  );
  if (named) return toPlace(named);

  return {
    id: timeZone,
    title: timeZone,
    autocompleteName: timeZone,
    timeZone,
  };
}

export function resolveLocation(input: string): ResolveResult {
  const trimmed = input.trim();
  if (!trimmed) return { status: 'empty' };

  const query = trimmed.length > 100 ? trimmed.slice(0, 100) : trimmed;
  const byId = locationById.get(query.toLowerCase());
  if (byId) return { status: 'match', place: toPlace(byId) };

  const key = normalizeLocationQuery(query);
  const ambiguous = ambiguousByKey.get(key);
  if (ambiguous) {
    return {
      status: 'ambiguous',
      query,
      candidates: ambiguous.map((location) => toPlace(location)),
    };
  }

  const match = aliasIndex.get(key);
  if (match) return { status: 'match', place: toPlace(match) };

  const timeZone = canonicalizeTimeZone(query);
  if (timeZone) return { status: 'match', place: placeFromTimeZone(timeZone) };

  return { status: 'not_found', query };
}

interface ScoredChoice {
  score: number;
  rank: number;
  name: string;
  value: string;
  sortName: string;
}

function consider(choices: Map<string, ScoredChoice>, choice: ScoredChoice): void {
  const existing = choices.get(choice.value);
  if (!existing || choice.score > existing.score) {
    choices.set(choice.value, choice);
  }
}

function scoreLocation(location: Location, key: string): number {
  const name = normalizeLocationQuery(location.name);
  const idKey = normalizeLocationQuery(location.id.replace(/-/g, ' '));
  const aliases = location.aliases.map((alias) => normalizeLocationQuery(alias));

  if (name === key || idKey === key || aliases.includes(key)) return 100;
  if (name.startsWith(key) || idKey.startsWith(key)) return 80;
  if (aliases.some((alias) => alias.startsWith(key))) return 70;

  // Short pieces like "us" or "la" should not match the middle of another word.
  if (key.length < 3) return 0;

  if (name.includes(key) || aliases.some((alias) => alias.includes(key))) return 50;
  if (location.timezone.toLowerCase().includes(key.replace(/ /g, '_'))) return 30;
  return 0;
}

function countryCodesForQuery(key: string): Set<string> {
  const codes = new Set<string>();

  for (const location of locations) {
    if (location.kind !== 'country' || !location.countryCode) continue;

    const name = normalizeLocationQuery(location.name);
    const aliases = location.aliases.map((alias) => normalizeLocationQuery(alias));
    if (name.startsWith(key) || aliases.some((alias) => alias.startsWith(key))) {
      codes.add(location.countryCode);
    }
  }

  return codes;
}

function collectChoices(query: string, includeTimeZones: boolean): ScoredChoice[] {
  const key = normalizeLocationQuery(query);
  const choices = new Map<string, ScoredChoice>();
  const relatedCountries = countryCodesForQuery(key);

  for (const location of locations) {
    let score = scoreLocation(location, key);
    if (
      score < 65 &&
      location.kind !== 'country' &&
      location.countryCode &&
      relatedCountries.has(location.countryCode)
    ) {
      score = 65;
    }

    if (score <= 0) continue;

    consider(choices, {
      score,
      rank: location.rank ?? 50,
      name: autocompleteName(location),
      value: location.id,
      sortName: location.name,
    });
  }

  for (const [alias, group] of ambiguousByKey) {
    let score = 0;
    if (alias === key) score = 96;
    else if (alias.startsWith(key)) score = 72;
    else if (key.length >= 3 && alias.includes(key)) score = 42;
    if (score <= 0) continue;

    for (const location of group) {
      consider(choices, {
        score,
        rank: location.rank ?? 50,
        name: autocompleteName(location),
        value: location.id,
        sortName: location.name,
      });
    }
  }

  if (includeTimeZones && (query.includes('/') || key.length >= 3)) {
    const zoneQuery = query.trim().replace(/ /g, '_').toLowerCase();
    for (const timeZone of listTimeZones()) {
      const lower = timeZone.toLowerCase();
      let score = 0;
      if (lower === zoneQuery) score = 100;
      else if (lower.startsWith(zoneQuery)) score = 60;
      else if (zoneQuery.length >= 4 && lower.includes(zoneQuery)) score = 25;
      if (score <= 0) continue;

      consider(choices, {
        score,
        rank: 40,
        name: timeZone,
        value: timeZone,
        sortName: timeZone,
      });
    }
  }

  return [...choices.values()].sort(
    (left, right) =>
      right.score - left.score ||
      left.rank - right.rank ||
      left.sortName.localeCompare(right.sortName) ||
      left.name.localeCompare(right.name),
  );
}

export function suggestLocations(query: string, limit = 25): LocationSuggestion[] {
  const cappedLimit = Math.min(Math.max(limit, 0), 25);
  const trimmed = query.trim();

  if (!trimmed) {
    return popularLocationIds
      .flatMap((id) => {
        const location = locationById.get(id);
        if (!location) return [];
        return [{ name: autocompleteName(location), value: location.id }];
      })
      .slice(0, cappedLimit);
  }

  return collectChoices(trimmed, true)
    .slice(0, cappedLimit)
    .map((choice) => ({ name: choice.name, value: choice.value }));
}

export function searchCatalog(query: string): ResolvedPlace[] {
  const trimmed = query.trim();

  if (!trimmed) {
    return [...locations]
      .sort((left, right) => left.name.localeCompare(right.name) || left.id.localeCompare(right.id))
      .map((location) => toPlace(location));
  }

  return collectChoices(trimmed, false).flatMap((choice) => {
    const location = locationById.get(choice.value);
    return location ? [toPlace(location)] : [];
  });
}
