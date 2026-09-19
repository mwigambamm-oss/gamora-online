export type ProductStructure = {
  description: string;
  key_features: string[];
  specifications: Record<string, string>;
};

const FEATURE_HEADINGS = new Set([
  "feature",
  "features",
  "key feature",
  "key features",
  "vipengele",
  "kipengele",
  "vipengele muhimu",
]);

const SPECIFICATION_HEADINGS = new Set([
  "specification",
  "specifications",
  "technical specification",
  "technical specifications",
  "product specification",
  "product specifications",
  "spec",
  "specs",
  "vipimo",
  "maelezo ya kiufundi",
  "vipimo vya bidhaa",
]);

const COMMON_SPEC_KEYS = [
  "model",
  "type",
  "brand",
  "material",
  "size",
  "color",
  "colour",
  "application",
  "purpose",
  "usage",
  "engine",
  "engine type",
  "power",
  "voltage",
  "capacity",
  "weight",
  "length",
  "width",
  "height",
  "country",
  "warranty",
  "battery",
  "battery type",
  "fuel type",
  "speed",
  "frequency",
  "dimensions",
  "dimension",
];

function clean(value: string): string {
  return value
    .replace(/\r/g, "")
    .replace(/\u00a0/g, " ")
    .trim();
}

function normalizeHeading(value: string): string {
  return clean(value)
    .replace(/^[#*\-–—•·\s]+/, "")
    .replace(/[*#]+$/, "")
    .replace(/[:：]\s*$/, "")
    .replace(/\s+/g, " ")
    .toLowerCase();
}

function stripMarkdown(value: string): string {
  return clean(value)
    .replace(/^\*{1,3}/, "")
    .replace(/\*{1,3}$/, "")
    .replace(/^_{1,3}/, "")
    .replace(/_{1,3}$/, "")
    .trim();
}

function stripBullet(value: string): string {
  return stripMarkdown(value)
    .replace(/^[•●▪◦‣⁃*]\s+/, "")
    .replace(/^[-–—]\s+/, "")
    .replace(/^\d+[.)]\s+/, "")
    .trim();
}

function cleanKey(value: string): string {
  return stripMarkdown(value)
    .replace(/^[-–—•·*]\s*/, "")
    .replace(/[:：]\s*$/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function cleanValue(value: string): string {
  return stripMarkdown(value)
    .replace(/^[:：]\s*/, "")
    .replace(/^[-–—→]\s*/, "")
    .replace(/\s+/g, " ")
    .trim();
}

function isFeatureHeading(value: string): boolean {
  return FEATURE_HEADINGS.has(normalizeHeading(value));
}

function isSpecificationHeading(value: string): boolean {
  return SPECIFICATION_HEADINGS.has(normalizeHeading(value));
}

function isLikelySpecificationKey(key: string): boolean {
  const normalized = cleanKey(key).toLowerCase();
  return COMMON_SPEC_KEYS.includes(normalized);
}

function addSpecification(
  specifications: Record<string, string>,
  key: string,
  value: string
): void {
  const cleanKeyValue = cleanKey(key);
  const cleanValueValue = cleanValue(value);

  if (!cleanKeyValue || !cleanValueValue) {
    return;
  }

  specifications[cleanKeyValue] = cleanValueValue;
}

function parseStructuredSpecificationLine(
  line: string
): { key: string; value: string } | null {
  const text = stripBullet(line);

  if (!text) {
    return null;
  }

  // Key: Value
  const colonMatch = text.match(
    /^([A-Za-z][A-Za-z0-9 /&()'_.]{0,59})\s*[:：]\s*(.+)$/
  );

  if (colonMatch) {
    return {
      key: cleanKey(colonMatch[1]),
      value: cleanValue(colonMatch[2]),
    };
  }

  // Key - Value / Key – Value / Key — Value
  const dashMatch = text.match(
    /^([A-Za-z][A-Za-z0-9 /&()'_.]{0,59})\s*[-–—]\s+(.+)$/
  );

  if (dashMatch) {
    return {
      key: cleanKey(dashMatch[1]),
      value: cleanValue(dashMatch[2]),
    };
  }

  // Key → Value
  const arrowMatch = text.match(
    /^([A-Za-z][A-Za-z0-9 /&()'_.]{0,59})\s*→\s*(.+)$/
  );

  if (arrowMatch) {
    return {
      key: cleanKey(arrowMatch[1]),
      value: cleanValue(arrowMatch[2]),
    };
  }

  // Common specification key followed by its value:
  // Model 56272727
  // Engine Petrol
  // Power 2.5 HP
  const commonKeyPattern = COMMON_SPEC_KEYS
    .slice()
    .sort((a, b) => b.length - a.length)
    .map((key) =>
      key.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")
    )
    .join("|");

  const spaceMatch = text.match(
    new RegExp(
      `^(${commonKeyPattern})\\s+(.+)$`,
      "i"
    )
  );

  if (spaceMatch) {
    return {
      key: cleanKey(spaceMatch[1]),
      value: cleanValue(spaceMatch[2]),
    };
  }

  return null;
}

function splitFeatureLine(line: string): string[] {
  const text = stripBullet(line);

  if (!text) {
    return [];
  }

  if (text.includes(";")) {
    return text
      .split(";")
      .map((item) => clean(item))
      .filter(Boolean);
  }

  return [text];
}

function parseFeatureLines(lines: string[]): string[] {
  const features: string[] = [];

  for (const line of lines) {
    const items = splitFeatureLine(line);

    for (const item of items) {
      if (!item) continue;

      if (
        !features.some(
          (existing) =>
            existing.toLowerCase() === item.toLowerCase()
        )
      ) {
        features.push(item);
      }
    }
  }

  return features;
}

function parseSpecificationLines(
  lines: string[]
): Record<string, string> {
  const specifications: Record<string, string> = {};

  for (const line of lines) {
    const text = stripBullet(line);

    if (!text) {
      continue;
    }

    // Ignore a repeated heading inside the section.
    if (isSpecificationHeading(text)) {
      continue;
    }

    const structured = parseStructuredSpecificationLine(text);

    if (structured) {
      addSpecification(
        specifications,
        structured.key,
        structured.value
      );
      continue;
    }

    /*
     * Plain specification line.
     *
     * Example:
     * Petrol engine
     *
     * Store it as key=value so the existing
     * Record<string, string> structure remains compatible.
     */
    addSpecification(specifications, text, text);
  }

  return specifications;
}

function extractStandaloneStructuredSpecifications(
  lines: string[]
): Record<string, string> {
  const specifications: Record<string, string> = {};

  for (const line of lines) {
    const structured = parseStructuredSpecificationLine(line);

    if (!structured) {
      continue;
    }

    if (!isLikelySpecificationKey(structured.key)) {
      continue;
    }

    addSpecification(
      specifications,
      structured.key,
      structured.value
    );
  }

  return specifications;
}

export function extractSpecifications(
  description: string = ""
): Record<string, string> {
  return normalizeProductDescription(description).specifications;
}

export function normalizeProductDescription(
  description: string = ""
): ProductStructure {
  const original = clean(description);

  if (!original) {
    return {
      description: "",
      key_features: [],
      specifications: {},
    };
  }

  const lines = original
    .split("\n")
    .map((line) => clean(line));

  let featureIndex = -1;
  let specificationIndex = -1;

  for (let index = 0; index < lines.length; index += 1) {
    const line = lines[index];

    if (isFeatureHeading(line) && featureIndex === -1) {
      featureIndex = index;
    }

    if (
      isSpecificationHeading(line) &&
      specificationIndex === -1
    ) {
      specificationIndex = index;
    }
  }

  /*
   * No Features/Specifications heading:
   *
   * Keep the whole description intact.
   * Only extract clearly-labelled common specification lines.
   */
  if (featureIndex === -1 && specificationIndex === -1) {
    const standaloneSpecifications =
      extractStandaloneStructuredSpecifications(lines);

    const descriptionLines = lines.filter(
      (line) => !parseStructuredSpecificationLine(line)
    );

    return {
      description: descriptionLines.join("\n").trim(),
      key_features: [],
      specifications: standaloneSpecifications,
    };
  }

  const sectionIndexes = [
    featureIndex,
    specificationIndex,
  ].filter((index) => index >= 0);

  const firstSectionIndex = Math.min(...sectionIndexes);

  const descriptionLines = lines
    .slice(0, firstSectionIndex)
    .filter(Boolean);

  const keyFeatures: string[] = [];
  const specifications: Record<string, string> = {};

  /*
   * Parse Features section.
   */
  if (featureIndex >= 0) {
    const featureEnd =
      specificationIndex > featureIndex
        ? specificationIndex
        : lines.length;

    const featureLines = lines.slice(
      featureIndex + 1,
      featureEnd
    );

    keyFeatures.push(...parseFeatureLines(featureLines));
  }

  /*
   * Parse Specifications section.
   */
  if (specificationIndex >= 0) {
    const specificationEnd =
      featureIndex > specificationIndex
        ? featureIndex
        : lines.length;

    const specificationLines = lines.slice(
      specificationIndex + 1,
      specificationEnd
    );

    Object.assign(
      specifications,
      parseSpecificationLines(specificationLines)
    );
  }

  return {
    description: descriptionLines.join("\n").trim(),
    key_features: keyFeatures,
    specifications,
  };
}
