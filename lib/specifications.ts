export type ProductStructure = {
  description: string;
  key_features: string[];
  specifications: Record<string, string>;
};

const KEY_FEATURES_MARKER =
  /(?:key\s*features?|features?)\s*:?\s*/i;

const SPECIFICATIONS_MARKER =
  /(?:features?\s*\/\s*specifications?|features?\s+and\s+specifications?|specifications?)\s*:?\s*/i;

function clean(value: string): string {
  return value
    .replace(/\r?\n/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function splitFeatures(value: string): string[] {
  const text = value.trim();

  if (!text) return [];

  // Already separated bullets / lines / semicolons
  const separated = text
    .replace(/\r?\n/g, "|")
    .replace(/[•●▪◦]/g, "|")
    .replace(/\s*[;|]\s*/g, "|")
    .split("|")
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);

  if (separated.length > 1) {
    return separated;
  }

  // Common product-feature phrases used by Gamora products.
  // These boundaries allow admin to paste features as normal text.
  const boundaries = [
    /\s+(?=\d+(?:\.\d+)?[- ]?inch\b)/i,
    /\s+(?=LED\b)/i,
    /\s+(?=LCD\b)/i,
    /\s+(?=HDMI\b)/i,
    /\s+(?=VGA\b)/i,
    /\s+(?=USB\b)/i,
    /\s+(?=Bluetooth\b)/i,
    /\s+(?=Wi[- ]?Fi\b)/i,
    /\s+(?=Adjustable\b)/i,
    /\s+(?=Desktop\b)/i,
    /\s+(?=Portable\b)/i,
    /\s+(?=Rechargeable\b)/i,
    /\s+(?=Water[- ]?resistant\b)/i,
    /\s+(?=Suitable for\b)/i,
    /\s+(?=Compatible with\b)/i,
    /\s+(?=Premium\b)/i,
    /\s+(?=Modern\b)/i,
    /\s+(?=Durable\b)/i,
    /\s+(?=Lightweight\b)/i,
    /\s+(?=Wireless\b)/i,
  ];

  let parts = [text];

  for (const boundary of boundaries) {
    parts = parts.flatMap((part) => part.split(boundary));
  }

  return parts
    .map((item) => item.replace(/^[-*]\s*/, "").trim())
    .filter(Boolean);
}

export function extractSpecifications(
  value: string
): Record<string, string> {
  const result: Record<string, string> = {};
  const text = clean(value);

  if (!text) return result;

  const regex =
    /([A-Za-z][A-Za-z0-9 /&()'_-]{1,59}):\s*([^:]+?)(?=\s+[A-Za-z][A-Za-z0-9 /&()'_-]{1,59}:\s|$)/g;

  let match: RegExpExecArray | null;

  while ((match = regex.exec(text)) !== null) {
    const key = clean(match[1]);
    const value = clean(match[2]);

    if (key && value) {
      result[key] = value;
    }
  }

  return result;
}

export function normalizeProductDescription(
  description?: string
): ProductStructure {
  const original = clean(description || "");

  if (!original) {
    return {
      description: "",
      key_features: [],
      specifications: {},
    };
  }

  let descriptionPart = original;
  let keyFeatures: string[] = [];
  let specifications: Record<string, string> = {};

  const specificationMatch = original.match(
    SPECIFICATIONS_MARKER
  );

  if (specificationMatch) {
    const before = original.slice(
      0,
      specificationMatch.index
    );

    const after = original.slice(
      (specificationMatch.index || 0) +
        specificationMatch[0].length
    );

    descriptionPart = clean(before);
    specifications = extractSpecifications(after);
  }

  const keyMatch = descriptionPart.match(
    KEY_FEATURES_MARKER
  );

  if (keyMatch) {
    const before = descriptionPart.slice(
      0,
      keyMatch.index
    );

    const after = descriptionPart.slice(
      (keyMatch.index || 0) + keyMatch[0].length
    );

    descriptionPart = clean(before);
    keyFeatures = splitFeatures(after);
  }

  return {
    description: descriptionPart,
    key_features: Array.from(new Set(keyFeatures)),
    specifications,
  };
}
