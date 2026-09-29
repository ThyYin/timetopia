import type { Interaction } from 'discord.js';
import { commandsByName } from '../commands';
import { handleListButton } from '../commands/list';
import { unexpectedErrorEmbed } from '../utils/formatter';
import { logger } from '../utils/logger';

export async function handleInteraction(interaction: Interaction): Promise<void> {
  if (interaction.isButton() && interaction.customId.startsWith('list:')) {
    try {
      await handleListButton(interaction);
    } catch (error) {
      logger.error('List button failed', error);
    }
    return;
  }

  if (interaction.isAutocomplete()) {
    const command = commandsByName.get(interaction.commandName);
    if (!command?.autocomplete) return;

    try {
      await command.autocomplete(interaction);
    } catch (error) {
      logger.error('Autocomplete failed', error);
    }
    return;
  }

  if (!interaction.isChatInputCommand()) return;

  const command = commandsByName.get(interaction.commandName);
  if (!command) return;

  try {
    await command.execute(interaction);
  } catch (error) {
    logger.error('Command failed', error);
    const payload = {
      embeds: [unexpectedErrorEmbed()],
      allowedMentions: { parse: [] as const },
    };

    if (interaction.replied || interaction.deferred) {
      await interaction.followUp(payload).catch(() => undefined);
      return;
    }

    await interaction.reply(payload).catch(() => undefined);
  }
}
