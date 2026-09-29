import type { ActionRowBuilder, ButtonBuilder, EmbedBuilder } from 'discord.js';

export interface CommandReply {
  embed: EmbedBuilder;
  components?: ActionRowBuilder<ButtonBuilder>[];
}
