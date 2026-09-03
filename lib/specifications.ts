export function extractSpecifications(
  description?: string
): Record<string, string> {
  if (!description) return {};

  const specifications: Record<string, string> = {};

  const lines = description
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  for (const line of lines) {
    const match = line.match(/^([^:]{1,60}):\s*(.+)$/);

    if (!match) continue;

    const key = match[1].trim();
    const value = match[2].trim();

    if (!key || !value) continue;

    specifications[key] = value;
  }

  return specifications;
}
