export interface ParsedCommand {
  command: string;
  argument: string;
}

export function parsePrefixedCommand(content: string, prefix: string): ParsedCommand | null {
  const trimmed = content.trim();
  if (!trimmed.toLowerCase().startsWith(prefix.toLowerCase())) return null;

  const rest = trimmed.slice(prefix.length).trim();
  if (!rest) return { command: '', argument: '' };

  const separator = rest.search(/\s/);
  if (separator === -1) {
    return { command: rest.toLowerCase(), argument: '' };
  }

  return {
    command: rest.slice(0, separator).toLowerCase(),
    argument: rest.slice(separator).trim(),
  };
}
