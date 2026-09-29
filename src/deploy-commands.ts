import { loadEnv } from './config';
import { registerGlobalCommands } from './registerCommands';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  try {
    const env = loadEnv();
    logger.info('Registering global slash commands...');
    const names = await registerGlobalCommands(env);
    logger.info(`Global slash commands registered: ${names.join(', ')}`);
    logger.info('Restart Discord if a command does not show up right away.');
  } catch (error) {
    logger.error('Failed to register commands', error);
    process.exit(1);
  }
}

void main();
