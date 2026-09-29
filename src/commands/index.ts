import type {
  AutocompleteInteraction,
  ChatInputCommandInteraction,
  RESTPostAPIChatInputApplicationCommandsJSONBody,
} from 'discord.js';
import { autocompleteList, executeList, listCommandData } from './list';
import { autocompleteTime, executeTime, timeCommandData } from './time';

export interface BotCommand {
  data: {
    name: string;
    toJSON(): RESTPostAPIChatInputApplicationCommandsJSONBody;
  };
  execute: (interaction: ChatInputCommandInteraction) => Promise<void>;
  autocomplete?: (interaction: AutocompleteInteraction) => Promise<void>;
}

export const commands: readonly BotCommand[] = [
  {
    data: timeCommandData,
    execute: executeTime,
    autocomplete: autocompleteTime,
  },
  {
    data: listCommandData,
    execute: executeList,
    autocomplete: autocompleteList,
  },
];

export const commandsByName = new Map(commands.map((command) => [command.data.name, command]));
