import { randomBytes } from 'node:crypto';
import {
  ActionRowBuilder,
  ButtonBuilder,
  ButtonStyle,
  type AutocompleteInteraction,
  type ButtonInteraction,
  type ChatInputCommandInteraction,
} from 'discord.js';
import { searchCatalog, suggestLocations } from '../services/locationResolver';
import { consumeCooldown } from '../utils/cooldown';
import {
  cooldownEmbed,
  LIST_PAGE_SIZE,
  listEmbed,
  listExpiredEmbed,
  listPrivateEmbed,
} from '../utils/formatter';
import { logger } from '../utils/logger';
import { createSlashCommand } from './slashCommand';
import type { CommandReply } from './types';

export const listCommandData = createSlashCommand(
  'list',
  'Search the places and timezones TimeTopia supports.',
).addStringOption((option) =>
  option
    .setName('query')
    .setDescription('Optional search, such as Mal or Tokyo')
    .setRequired(false)
    .setAutocomplete(true),
);

interface ListSession {
  userId: string;
  query: string;
  page: number;
  expiresAt: number;
}

const sessions = new Map<string, ListSession>();
const SESSION_MS = 3 * 60 * 1000;

function pruneSessions(now: number): void {
  for (const [id, session] of sessions) {
    if (session.expiresAt <= now) sessions.delete(id);
  }
}

function rememberSession(userId: string, query: string, page: number, now: number): string {
  pruneSessions(now);
  const id = randomBytes(4).toString('hex');
  sessions.set(id, { userId, query, page, expiresAt: now + SESSION_MS });
  return id;
}

export function buildListReply(query: string, page: number, sessionId?: string): CommandReply {
  const results = searchCatalog(query);
  const pageCount = Math.max(1, Math.ceil(results.length / LIST_PAGE_SIZE));
  const safePage = Math.min(Math.max(page, 0), pageCount - 1);
  const places = results.slice(safePage * LIST_PAGE_SIZE, (safePage + 1) * LIST_PAGE_SIZE);
  const embed = listEmbed({
    query,
    places,
    page: safePage,
    pageSize: LIST_PAGE_SIZE,
    total: results.length,
  });

  if (!sessionId || pageCount <= 1) return { embed };

  const row = new ActionRowBuilder<ButtonBuilder>().addComponents(
    new ButtonBuilder()
      .setCustomId(`list:prev:${sessionId}`)
      .setLabel('Previous')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safePage <= 0),
    new ButtonBuilder()
      .setCustomId(`list:next:${sessionId}`)
      .setLabel('Next')
      .setStyle(ButtonStyle.Secondary)
      .setDisabled(safePage >= pageCount - 1),
  );

  return { embed, components: [row] };
}

export function runListCommand(query: string, userId: string, now = Date.now()): CommandReply {
  const cooldown = consumeCooldown(userId, now);
  if (!cooldown.allowed) return { embed: cooldownEmbed() };

  const results = searchCatalog(query);
  const pageCount = Math.max(1, Math.ceil(results.length / LIST_PAGE_SIZE));
  const sessionId = pageCount > 1 ? rememberSession(userId, query, 0, now) : undefined;
  return buildListReply(query, 0, sessionId);
}

export async function autocompleteList(interaction: AutocompleteInteraction): Promise<void> {
  const focused = interaction.options.getFocused();
  await interaction.respond(suggestLocations(focused));
}

export async function executeList(interaction: ChatInputCommandInteraction): Promise<void> {
  const query = interaction.options.getString('query') ?? '';
  const reply = runListCommand(query, interaction.user.id);
  await interaction.reply({
    embeds: [reply.embed],
    components: reply.components ?? [],
    allowedMentions: { parse: [] },
  });
}

export async function handleListButton(interaction: ButtonInteraction): Promise<void> {
  const match = /^list:(prev|next):([a-f0-9]+)$/.exec(interaction.customId);
  if (!match) return;

  const direction = match[1];
  const sessionId = match[2];
  const session = sessionId ? sessions.get(sessionId) : undefined;

  if (!session || session.expiresAt <= Date.now()) {
    if (sessionId) sessions.delete(sessionId);
    await interaction.reply({
      embeds: [listExpiredEmbed()],
      ephemeral: true,
      allowedMentions: { parse: [] },
    });
    return;
  }

  if (session.userId !== interaction.user.id) {
    await interaction.reply({
      embeds: [listPrivateEmbed()],
      ephemeral: true,
      allowedMentions: { parse: [] },
    });
    return;
  }

  const pageCount = Math.max(1, Math.ceil(searchCatalog(session.query).length / LIST_PAGE_SIZE));
  session.page = Math.min(
    Math.max(session.page + (direction === 'next' ? 1 : -1), 0),
    pageCount - 1,
  );
  session.expiresAt = Date.now() + SESSION_MS;
  const reply = buildListReply(session.query, session.page, sessionId);

  try {
    await interaction.update({
      embeds: [reply.embed],
      components: reply.components ?? [],
      allowedMentions: { parse: [] },
    });
  } catch (error) {
    logger.error('Failed to update list page', error);
  }
}
