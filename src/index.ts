import { Client, Events, GatewayIntentBits } from 'discord.js';
import { loadEnv } from './config';
import { handleInteraction } from './handlers/interactionHandler';
import { handleMessage } from './handlers/messageHandler';
import { registerGlobalCommands } from './registerCommands';
import { botSettings } from './settings';
import { logger } from './utils/logger';

/**
 * pm2 entry: `pm2 start dist/index.js --name "timetopia"`
 *
 * Gateway intents:
 * - Guilds: required so the bot can join servers and receive slash commands
 * - GuildMessages: receive prefix commands in servers
 * - DirectMessages: receive prefix commands in DMs
 * - MessageContent: privileged intent, required to read `tm!` message text
 *
 * Enable Message Content Intent in the Discord Developer Portal.
 * Do not enable Presence Intent or Server Members Intent.
 */
async function main(): Promise<void> {
  logger.info(`${botSettings.name} starting...`);

  let env;
  try {
    env = loadEnv();
  } catch (error) {
    logger.error(error instanceof Error ? error.message : 'Invalid environment variables');
    process.exit(1);
  }

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.DirectMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.on(Events.InteractionCreate, (interaction) => {
    void handleInteraction(interaction).catch((error: unknown) => {
      logger.error('Interaction handler failed', error);
    });
  });

  client.on(Events.MessageCreate, (message) => {
    void handleMessage(message).catch((error: unknown) => {
      logger.error('Message handler failed', error);
    });
  });

  client.once(Events.ClientReady, (readyClient) => {
    logger.info(`Logged in as ${readyClient.user.tag}`);
    logger.info('Connected to Discord');

    void registerGlobalCommands(env)
      .then((names) => {
        logger.info(`Global slash commands registered: ${names.join(', ')}`);
      })
      .catch((error: unknown) => {
        logger.error('Failed to register commands', error);
      });
  });

  let exiting = false;

  const exitProcess = (code: number): void => {
    if (exiting) return;
    exiting = true;

    try {
      client.destroy();
    } catch (error) {
      logger.error('Failed to close the Discord connection', error);
    }

    // Give Discord's network handles a moment to close. Exiting immediately
    // can crash the process on Windows.
    setTimeout(() => {
      process.exit(code);
    }, 250);
  };

  const shutdown = (signal: string): void => {
    logger.info(`Received ${signal}. Shutting down.`);
    exitProcess(0);
  };

  process.once('SIGINT', () => {
    shutdown('SIGINT');
  });
  process.once('SIGTERM', () => {
    shutdown('SIGTERM');
  });

  process.on('unhandledRejection', (error: unknown) => {
    logger.error('Unhandled promise rejection', error);
  });

  process.on('uncaughtException', (error: unknown) => {
    logger.error('Uncaught exception', error);
    exitProcess(1);
  });

  try {
    await client.login(env.discordToken);
  } catch (error) {
    logger.error('Bot login failed', error);
    exitProcess(1);
  }
}

void main();
