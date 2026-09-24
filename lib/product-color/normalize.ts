const COLOR_NORMALIZATION: Record<string, string> = {
  black: "Black",
  white: "White",
  grey: "Grey",
  gray: "Grey",

  red: "Red",
  blue: "Blue",
  green: "Green",
  yellow: "Yellow",
  orange: "Orange",
  pink: "Pink",
  purple: "Purple",
  brown: "Brown",

  navy: "Navy Blue",
  "navy blue": "Navy Blue",
  "dark navy": "Navy Blue",

  "light blue": "Light Blue",
  "dark blue": "Dark Blue",

  "light green": "Light Green",
  "dark green": "Dark Green",

  beige: "Beige",
  cream: "Cream",

  gold: "Gold",
  silver: "Silver",

  maroon: "Maroon",
  burgundy: "Burgundy",

  turquoise: "Turquoise",
  teal: "Teal",
  khaki: "Khaki",

  "off white": "White",
  "pure white": "White",
};

export function normalizeColorName(value: string): string {
  const key = value.trim().toLowerCase();

  return COLOR_NORMALIZATION[key] || value.trim();
}

export function normalizeColors(colors: string[]): string[] {
  const normalized: string[] = [];

  for (const color of colors) {
    const name = normalizeColorName(color);

    if (
      name &&
      !normalized.some(
        (existing) =>
          existing.toLowerCase() === name.toLowerCase()
      )
    ) {
      normalized.push(name);
    }
  }

  return normalized;
}
