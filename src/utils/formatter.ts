import { EmbedBuilder } from 'discord.js';
import type { ResolvedPlace } from '../services/locationResolver';
import { getZonedTime } from '../services/timezoneService';
import { botSettings } from '../settings';
import { sanitizeDisplayText } from './text';

function noticeEmbed(title: string, description: string, color: number): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(color)
    .setTitle(title)
    .setDescription(description)
    .setFooter({ text: `${botSettings.name}` });
}

export function buildTimeEmbed(place: ResolvedPlace, now = new Date()): EmbedBuilder {
  const zoned = getZonedTime(place.timeZone, now);

  return new EmbedBuilder()
    .setColor(botSettings.brandColor)
    .setTitle(place.title)
    .setDescription(
      [
        `🕐 **${zoned.time}**`,
        `📅 ${zoned.date}`,
        '',
        `🌐 ${zoned.timeZone}`,
        `🕓 ${zoned.offset}`,
      ].join('\n'),
    )
    .setFooter({ text: `${botSettings.name}` });
}

export function helpEmbed(): EmbedBuilder {
  return new EmbedBuilder()
    .setColor(botSettings.brandColor)
    .setTitle('Commands')
  .setDescription('Shows the current local time for a country, city, or timezone.\n·')
    .addFields(
      {
        name: '🕒 Time',
        value: [
          `\`${botSettings.prefix}time {location}\``,
          `e.g. \`${botSettings.prefix}time Tokyo\` to display their current time`,
          `·`,
        ].join('\n'),
      },
      {
        name: '☑️ Supported Timezones',
        value: [
          `\`${botSettings.prefix}list\``,
          `or type in a search query`,
          `e.g. \`${botSettings.prefix}list Japan\` to list down timezone places in Japan`,
          `·`,
        ].join('\n'),
      },
    )
    .setFooter({ text: `${botSettings.name}` });
}

export function missingLocationEmbed(): EmbedBuilder {
  return noticeEmbed(
    '❓ Need a location',
    [
      'Please provide a location.',
      '',
      '**Examples**',
      `\`${botSettings.prefix}time Philippines\``,
      `\`${botSettings.prefix}time Tokyo\``,
      `\`${botSettings.prefix}time New York\``,
      '',
      `Browse supported timezones with \`${botSettings.prefix}list\``,
    ].join('\n'),
    botSettings.errorColor,
  );
}

export function unknownLocationEmbed(query: string): EmbedBuilder {
  return noticeEmbed(
    '🤷‍♂️ Location not found',
    [
      `No timezone found for \`${sanitizeDisplayText(query)}\``,
      '',
      'Try a country, city, or recognised timezone.',
      '',
      `Or browse supported timezones with \`${botSettings.prefix}list\` / \`${botSettings.prefix}list {location}\``,
    ].join('\n'),
    botSettings.errorColor,
  );
}

export function ambiguousLocationEmbed(query: string, choices: readonly string[]): EmbedBuilder {
  return noticeEmbed(
    'That name is ambiguous',
    [
      `\`${sanitizeDisplayText(query)}\` could mean more than one place.`,
      '',
      '**Did you mean**',
      ...choices,
    ].join('\n'),
    botSettings.warningColor,
  );
}

export function cooldownEmbed(): EmbedBuilder {
  return noticeEmbed(
    'Slow down',
    'You can check another time in about a second.',
    botSettings.warningColor,
  );
}

export function unknownCommandEmbed(): EmbedBuilder {
  return noticeEmbed(
    'Huh?',
    [
      "I don't know that command...",
      '',
      `Try \`${botSettings.prefix}help\` to browse Timetopia's commands.`,
    ].join('\n'),
    botSettings.errorColor,
  );
}

export function unexpectedErrorEmbed(): EmbedBuilder {
  return noticeEmbed(
    'Something went wrong',
    'I could not look that up. Please try again.',
    botSettings.errorColor,
  );
}

export function listExpiredEmbed(): EmbedBuilder {
  return noticeEmbed(
    'List expired',
    `This list expired. Run \`${botSettings.prefix}list\` again to search.`,
    botSettings.warningColor,
  );
}

export function listPrivateEmbed(): EmbedBuilder {
  return noticeEmbed(
    'Not your list',
    'Only the person who opened this list can turn the page.',
    botSettings.warningColor,
  );
}

export const LIST_PAGE_SIZE = 8;

export function listEmbed(options: {
  query: string;
  places: readonly ResolvedPlace[];
  page: number;
  pageSize: number;
  total: number;
}): EmbedBuilder {
  const { query, places, page, pageSize, total } = options;
  const pageCount = Math.max(1, Math.ceil(total / pageSize));
  const safeQuery = sanitizeDisplayText(query);
  const hasQuery = query.trim().length > 0;
  const lines = places.map((place, index) => {
    const number = page * pageSize + index + 1;
    return `**${number}.** ${place.autocompleteName} — \`${place.timeZone}\``;
  });

  const intro = hasQuery
    ? `Found **${total}** ${total === 1 ? 'place' : 'places'} matching \`${safeQuery}\`.`
    : `These are supported timezones ${botSettings.name} uses.\n\nSearch up a timezone with \`${botSettings.prefix}time {location}\`, or browse specific supported timezones with \`${botSettings.prefix}list {location}\`.`;

  const description = [intro, '', lines.join('\n') || 'Nothing matched that search, try another location.'].join('\n');
  const footer =
    pageCount > 1
      ? `Page ${page + 1} of ${pageCount} · ${botSettings.name}`
      : `${botSettings.name}`;

  return new EmbedBuilder()
    .setColor(hasQuery && total === 0 ? botSettings.warningColor : botSettings.brandColor)
    .setTitle(hasQuery ? `🔎 Timezones for '${safeQuery}'` : '☑️ Supported timezones')
    .setDescription(description.slice(0, 4096))
    .setFooter({ text: footer });
}
