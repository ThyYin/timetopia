import { REST, Routes } from 'discord.js';
import { commands } from './commands';
import type { Env } from './config';

export async function registerGlobalCommands(env: Env): Promise<string[]> {
  const rest = new REST({ version: '10' }).setToken(env.discordToken);

  const registered = (await rest.put(Routes.applicationCommands(env.discordClientId), {
    body: commands.map((command) => command.data.toJSON()),
  })) as { name?: string }[];

  if (!Array.isArray(registered)) {
    return commands.map((command) => `/${command.data.name}`);
  }

  return registered.map((command) => `/${command.name ?? 'command'}`);
}
