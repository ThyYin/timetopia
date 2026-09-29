import type { Message } from 'discord.js';
import { runListCommand } from '../commands/list';
import { runTimeCommand } from '../commands/time';
import type { CommandReply } from '../commands/types';
import { botSettings } from '../settings';
import { helpEmbed, unexpectedErrorEmbed, unknownCommandEmbed } from '../utils/formatter';
import { logger } from '../utils/logger';
import { parsePrefixedCommand } from '../utils/prefix';

export async function handleMessage(message: Message): Promise<void> {
  if (message.author.bot || message.webhookId) return;

  const parsed = parsePrefixedCommand(message.content, botSettings.prefix);
  if (!parsed) return;

  try {
    const reply = replyForPrefix(parsed.command, parsed.argument, message.author.id);
    await message.reply({
      embeds: [reply.embed],
      components: reply.components ?? [],
      allowedMentions: { parse: [] },
    });
  } catch (error) {
    logger.error('Prefix command failed', error);
    await message
      .reply({ embeds: [unexpectedErrorEmbed()], allowedMentions: { parse: [] } })
      .catch(() => undefined);
  }
}

function replyForPrefix(command: string, argument: string, userId: string): CommandReply {
  if (command === '' || command === 'help') return { embed: helpEmbed() };
  if (command === 'time') return runTimeCommand(argument, userId);
  if (command === 'list') return runListCommand(argument, userId);
  return { embed: unknownCommandEmbed() };
}
