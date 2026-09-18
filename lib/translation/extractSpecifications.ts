export function extractSpecifications(
  description: string
): Record<string, string> {
  if (!description?.trim()) return {};

  const match = description.match(
    /(?:Features\s*\/\s*Specifications|Specifications|Features)\s*:\s*([\s\S]*)$/i
  );

  if (!match?.[1]) return {};

  const content = match[1]
    .replace(/\r\n/g, "\n")
    .trim();

  const knownKeys = [
    // English
    "Available Colours",
    "Available Colors",
    "Storage Capacity",
    "Operating System",
    "Screen Size",
    "Carrying Style",
    "Suitable For",
    "Bag Type",
    "Material",
    "Weight",
    "Gender",
    "Color",
    "Colour",
    "Size",
    "Closure",
    "Strap",
    "Interior",
    "Pockets",
    "Design",
    "Storage",
    "Battery",
    "Processor",
    "RAM",
    "Brand",
    "Model",
    "Type",

    // Swahili
    "Rangi Zinazopatikana",
    "Aina ya mkoba",
    "Aina ya Mkoba",
    "Nyenzo",
    "Uzito",
    "Jinsia",
    "Rangi",
    "Ukubwa",
    "Aina ya Kufunga",
    "Kamba ya Kubebea",
    "Sehemu ya Ndani",
    "Mifuko ya Ndani",
    "Muundo",
    "Namna ya Kubeba",
    "Inafaa kwa",
    "Hifadhi",
    "Betri",
    "Ukubwa wa Skrini",
    "Prosesa",
    "Chapa",
    "Modeli",
    "Aina",
  ];

  /*
   * Sort longest first.
   */
  knownKeys.sort((a, b) => b.length - a.length);

  /*
   * Find every KEY: position in the text.
   */
  const keyRegex = new RegExp(
    `(?:^|\\s)(${knownKeys
      .map((key) =>
        key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
      )
      .join("|")})\\s*:`,
    "gi"
  );

  const matches: Array<{
    key: string;
    start: number;
    valueStart: number;
  }> = [];

  let found: RegExpExecArray | null;

  while ((found = keyRegex.exec(content)) !== null) {
    const fullMatch = found[0];

    /*
     * Locate the actual key inside the matched text.
     */
    const key = found[1].trim();

    /*
     * Position immediately after ":".
     */
    const colonIndex =
      found.index + fullMatch.lastIndexOf(":");

    const valueStart = colonIndex + 1;

    matches.push({
      key,
      start: found.index,
      valueStart,
    });
  }

  const result: Record<string, string> = {};

  /*
   * Each value ends immediately before the next KEY:
   */
  for (let i = 0; i < matches.length; i++) {
    const current = matches[i];
    const next = matches[i + 1];

    const end = next
      ? next.start
      : content.length;

    const value = content
      .slice(current.valueStart, end)
      .trim();

    if (!value) continue;

    result[current.key] = value;
  }

  return result;
}
