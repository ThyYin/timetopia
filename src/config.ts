import path from 'node:path';
import dotenv from 'dotenv';

export interface Env {
  discordToken: string;
  discordClientId: string;
}

/**
 * `.env` lives in the project root. Compiled code runs from `dist/`, so we
 * step up one folder. That keeps `pm2 start dist/index.js` working.
 */
export function resolveEnvPath(moduleDir: string): string {
  return path.resolve(moduleDir, '..', '.env');
}

export function loadEnv(moduleDir: string = __dirname): Env {
  dotenv.config({ path: resolveEnvPath(moduleDir), quiet: true });

  const discordToken = process.env.DISCORD_TOKEN?.trim() ?? '';
  const discordClientId = process.env.DISCORD_CLIENT_ID?.trim() ?? '';
  const missing: string[] = [];

  if (!discordToken) missing.push('DISCORD_TOKEN');
  if (!discordClientId) missing.push('DISCORD_CLIENT_ID');

  if (missing.length > 0) {
    const label = missing.length === 1 ? 'variable' : 'variables';
    throw new Error(
      `Missing required environment ${label}: ${missing.join(', ')}. Copy .env.example to .env and fill them in.`,
    );
  }

  return { discordToken, discordClientId };
}
