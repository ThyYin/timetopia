import { readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';
import { beforeEach, describe, expect, it } from 'vitest';
import { listCommandData, runListCommand } from '../src/commands/list';
import { runTimeCommand, timeCommandData } from '../src/commands/time';
import { helpEmbed } from '../src/utils/formatter';
import { searchCatalog } from '../src/services/locationResolver';
import { resolveEnvPath } from '../src/config';
import { consumeCooldown, resetCooldowns } from '../src/utils/cooldown';
import { parsePrefixedCommand } from '../src/utils/prefix';

function listTypeScriptFiles(directory: string): string[] {
  const entries = readdirSync(directory);
  const files: string[] = [];

  for (const entry of entries) {
    const fullPath = path.join(directory, entry);
    const stats = statSync(fullPath);
    if (stats.isDirectory()) {
      files.push(...listTypeScriptFiles(fullPath));
      continue;
    }
    if (entry.endsWith('.ts')) files.push(fullPath);
  }

  return files;
}

describe('prefix parsing', () => {
  it('keeps spaces inside the location', () => {
    expect(parsePrefixedCommand('tm!time New York', 'tm!')).toEqual({
      command: 'time',
      argument: 'New York',
    });
    expect(parsePrefixedCommand('tm!time Los Angeles', 'tm!')).toEqual({
      command: 'time',
      argument: 'Los Angeles',
    });
    expect(parsePrefixedCommand('tm!time Kuala Lumpur', 'tm!')).toEqual({
      command: 'time',
      argument: 'Kuala Lumpur',
    });
    expect(parsePrefixedCommand('TM!time United Kingdom', 'tm!')).toEqual({
      command: 'time',
      argument: 'United Kingdom',
    });
  });

  it('handles a missing location and ignores other messages', () => {
    expect(parsePrefixedCommand('tm!time', 'tm!')).toEqual({ command: 'time', argument: '' });
    expect(parsePrefixedCommand('hello Japan', 'tm!')).toBeNull();
  });
});

describe('cooldown', () => {
  beforeEach(() => {
    resetCooldowns();
  });

  it('limits one user without blocking everyone else', () => {
    expect(consumeCooldown('ada', 1_000).allowed).toBe(true);
    expect(consumeCooldown('ada', 1_500).allowed).toBe(false);
    expect(consumeCooldown('grace', 1_500).allowed).toBe(true);
    expect(consumeCooldown('ada', 2_000).allowed).toBe(true);
  });
});

describe('time command replies', () => {
  beforeEach(() => {
    resetCooldowns();
  });

  it('asks for a location when the argument is missing', () => {
    const result = runTimeCommand('', 'missing-location', 5_000);
    expect(result.embed.data.title).toBe('Need a location');
    expect(result.embed.data.description).toContain('Please provide a location.');
    expect(result.embed.data.description).toContain('tm!time Japan');
    expect(result.embed.data.description).toContain('/time');
  });

  it('returns a friendly error for an unknown place', () => {
    const result = runTimeCommand('Wakanda', 'unknown-place', 5_000);
    expect(result.embed.data.description).toContain("couldn't find a timezone");
    expect(result.embed.data.description).toContain('Wakanda');
  });

  it('rate limits repeated time lookups for the same user', () => {
    const first = runTimeCommand('Japan', 'spam-user', 10_000);
    const second = runTimeCommand('Japan', 'spam-user', 10_400);
    expect(first.embed.data.title).toContain('Japan');
    expect(second.embed.data.title).toBe('Slow down');
  });
});

describe('list and help embeds', () => {
  beforeEach(() => {
    resetCooldowns();
  });

  it('parses a list search that contains spaces', () => {
    expect(parsePrefixedCommand('tm!list Mal', 'tm!')).toEqual({
      command: 'list',
      argument: 'Mal',
    });
    expect(parsePrefixedCommand('tm!help', 'tm!')).toEqual({ command: 'help', argument: '' });
  });

  it('searches supported places from the start of a name', () => {
    const names = searchCatalog('Mal').map((place) => place.autocompleteName);
    expect(names.some((name) => name.includes('Malaysia'))).toBe(true);
    expect(names.some((name) => name.includes('Malawi'))).toBe(true);
    expect(names.some((name) => name.includes('Maldives'))).toBe(true);
    expect(names.some((name) => name.includes('Mali'))).toBe(true);
    expect(names.some((name) => name.includes('Malta'))).toBe(true);
  });

  it('shows list search results in an embed', () => {
    const reply = runListCommand('Mal', 'list-user', 50_000);
    expect(reply.embed.data.title).toContain('Mal');
    expect(reply.embed.data.description).toContain('Malaysia');
    expect(reply.embed.data.description).toContain('Malawi');
    expect(reply.embed.data.description).toContain('Asia/Kuala_Lumpur');
  });

  it('pages the full place list', () => {
    const reply = runListCommand('', 'all-places', 60_000);
    expect(reply.embed.data.title).toBe('Supported places');
    expect(reply.components?.length).toBe(1);
  });

  it('uses an embed for help', () => {
    const embed = helpEmbed();
    expect(embed.data.title).toBe('TimeTopia');
    expect(embed.data.fields?.some((field) => field.value?.includes('tm!list Japan'))).toBe(true);
  });
});

describe('slash command visibility', () => {
  it('marks slash commands as usable in servers', () => {
    for (const command of [timeCommandData, listCommandData]) {
      const json = command.toJSON();
      expect(json.contexts).toContain(0);
      expect(json.integration_types).toContain(0);
    }
  });
});

describe('deployment safety', () => {
  it('loads .env from the project root when the compiled file is in dist', () => {
    const moduleDir = path.resolve('/opt/timetopia/dist');
    expect(resolveEnvPath(moduleDir)).toBe(path.resolve('/opt/timetopia/.env'));
  });

  it('does not register slash commands for one server', () => {
    const sourceRoot = path.resolve('src');
    const source = listTypeScriptFiles(sourceRoot)
      .map((file) => readFileSync(file, 'utf8'))
      .join('\n');

    expect(source).not.toContain('GUILD_ID');
    expect(source).not.toContain('applicationGuildCommands');
    expect(source).toContain('Routes.applicationCommands');
  });
});
