import type { AutocompleteInteraction, ChatInputCommandInteraction } from 'discord.js';
import { resolveLocation, suggestLocations } from '../services/locationResolver';
import { consumeCooldown } from '../utils/cooldown';
import {
  ambiguousLocationEmbed,
  buildTimeEmbed,
  cooldownEmbed,
  missingLocationEmbed,
  unknownLocationEmbed,
} from '../utils/formatter';
import { createSlashCommand } from './slashCommand';
import type { CommandReply } from './types';

export const timeCommandData = createSlashCommand(
  'time',
  'Show the current local time for a country, city, or timezone.',
).addStringOption((option) =>
  option
    .setName('location')
    .setDescription('Country, city, region, or IANA timezone')
    .setRequired(true)
    .setAutocomplete(true),
);

export function runTimeCommand(query: string, userId: string, now = Date.now()): CommandReply {
  const cooldown = consumeCooldown(userId, now);
  if (!cooldown.allowed) return { embed: cooldownEmbed() };

  const result = resolveLocation(query);

  if (result.status === 'empty') return { embed: missingLocationEmbed() };
  if (result.status === 'not_found') return { embed: unknownLocationEmbed(result.query) };
  if (result.status === 'ambiguous') {
    return {
      embed: ambiguousLocationEmbed(
        result.query,
        result.candidates.map((candidate) => candidate.autocompleteName),
      ),
    };
  }

  return { embed: buildTimeEmbed(result.place, new Date(now)) };
}

export async function autocompleteTime(interaction: AutocompleteInteraction): Promise<void> {
  const focused = interaction.options.getFocused();
  await interaction.respond(suggestLocations(focused));
}

export async function executeTime(interaction: ChatInputCommandInteraction): Promise<void> {
  const query = interaction.options.getString('location') ?? '';
  const reply = runTimeCommand(query, interaction.user.id);
  await interaction.reply({
    embeds: [reply.embed],
    components: reply.components ?? [],
    allowedMentions: { parse: [] },
  });
}
