function sanitize(message: string): string {
  const token = process.env.DISCORD_TOKEN?.trim();
  if (!token) return message;
  return message.split(token).join('[redacted]');
}

function formatError(error: unknown): string {
  if (error instanceof Error) return sanitize(error.message);
  if (typeof error === 'string') return sanitize(error);
  return 'Unexpected error';
}

export const logger = {
  info(message: string): void {
    console.log(`[INFO] ${sanitize(message)}`);
  },

  error(message: string, error?: unknown): void {
    if (error === undefined) {
      console.error(`[ERROR] ${sanitize(message)}`);
      return;
    }

    console.error(`[ERROR] ${sanitize(message)}: ${formatError(error)}`);
  },
};
