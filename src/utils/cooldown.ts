import { botSettings } from '../settings';

const lastUsed = new Map<string, number>();

export type CooldownResult = { allowed: true } | { allowed: false; waitMs: number };

export function consumeCooldown(userId: string, now = Date.now()): CooldownResult {
  const previous = lastUsed.get(userId);

  if (previous !== undefined && now - previous < botSettings.cooldownMs) {
    return { allowed: false, waitMs: botSettings.cooldownMs - (now - previous) };
  }

  lastUsed.set(userId, now);

  if (lastUsed.size > 5000) {
    for (const [id, timestamp] of lastUsed) {
      if (now - timestamp >= botSettings.cooldownMs) lastUsed.delete(id);
    }
  }

  return { allowed: true };
}

export function resetCooldowns(): void {
  lastUsed.clear();
}
