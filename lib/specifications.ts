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
    // Remove Markdown heading/bold markers and UI symbols.
    .replace(/^[#*\-–—•·✓⚙️\s]+/u, "")
    .replace(/[*#]+$/g, "")
    .replace(/[:：]\s*$/g, "")
    .replace(/^[^A-Za-z0-9]+/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function stripAttachedSpecificationHeading(value: string): string {
  return clean(value)
    .replace(/^\*{1,3}specifications?\*{1,3}\s*/i, "")
    .trim();
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
    let text = stripBullet(line);

    if (!text) {
      continue;
    }

    // Remove Specification/Specifications headings, including
    // headings attached directly to the first specification.
    text = stripAttachedSpecificationHeading(text);

    text = text.replace(
      /^\*{1,3}\s*specifications?\s*\*{1,3}\s*/i,
      ""
    ).trim();

    if (!text) {
      continue;
    }

    // Ignore a heading entered on its own line.
    if (isSpecificationHeading(text)) {
      continue;
    }

    /*
     * First preserve structured specifications such as:
     * Model: TGT612131
     * Model - TGT612131
     * Model → TGT612131
     * Model TGT612131
     */
    const structuredItems = text
      .split(/,(?=\s*[A-Za-z][A-Za-z0-9 /&()'_.]{0,59}\s*[:：])/)
      .map((item) => item.trim())
      .filter(Boolean);

    let hadStructured = false;

    for (const structuredItem of structuredItems) {
      const structured =
        parseStructuredSpecificationLine(structuredItem);

      if (!structured) {
        continue;
      }

      hadStructured = true;

      addSpecification(
        specifications,
        structured.key,
        structured.value
      );
    }

    if (hadStructured) {
      continue;
    }

    /*
     * Plain specifications can be entered either:
     *
     * Electric-powered lawn mower
     * Designed for lawn cutting
     *
     * OR:
     *
     * Electric-powered lawn mower, Designed for lawn cutting,
     * Suitable for routine lawn maintenance, Model TGT612131
     *
     * Split comma/semicolon separated values into individual
     * specification items.
     */
    const items = text
      .split(/[;,]/)
      .map((item) => stripBullet(item))
      .map((item) => clean(item))
      .filter(Boolean);

    for (const item of items) {
      if (!item) {
        continue;
      }

      /*
       * If a separated item itself contains a structured
       * specification, preserve it as key/value.
       */
      const itemStructured =
        parseStructuredSpecificationLine(item);

      if (itemStructured) {
        addSpecification(
          specifications,
          itemStructured.key,
          itemStructured.value
        );
        continue;
      }

      /*
       * Plain item is stored as key=value.
       * The existing product UI recognizes key=value as a
       * plain specification and displays it with the red tick.
       */
      addSpecification(
        specifications,
        item,
        item
      );
    }
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

  /*
   * IMPORTANT:
   * Find section headings in the WHOLE description, not only at
   * the beginning of a line. This handles Markdown such as:
   *
   * **Key Features:**
   * ### Key Features:
   * Key Features:
   *
   * and the same variations for Specifications.
   */

  const keyFeaturesRegex =
    /(?:^|\n)\s*(?:[#*_\-–—•·✓⚙️]+\s*)*(?:key\s+)?features?\s*[:：]?\s*(?=\n|$)/i;

  const specificationsRegex =
    /(?:^|\n)\s*(?:[#*_\-–—•·✓⚙️]+\s*)*specifications?\s*(?:[:：]\s*)?(?=\S|$)/im;

  const keyMatch = original.match(keyFeaturesRegex);
  const specificationMatch = original.match(specificationsRegex);

  const keyStart = keyMatch?.index ?? -1;
  const specificationStart = specificationMatch?.index ?? -1;

  /*
   * Case 1:
   * Both sections exist.
   */
  if (keyStart >= 0 && specificationStart >= 0) {
    const keyHeadingLength = keyMatch?.[0].length ?? 0;
    const specificationHeadingLength =
      specificationMatch?.[0].length ?? 0;

    const firstSectionStart = Math.min(
      keyStart,
      specificationStart
    );

    const descriptionText = original
      .slice(0, firstSectionStart)
      .trim();

    const keyFeatures =
      keyStart < specificationStart
        ? parseFeatureLines(
            original
              .slice(keyStart + keyHeadingLength, specificationStart)
              .split("\n")
              .map((line) => clean(line))
              .filter(Boolean)
          )
        : parseFeatureLines(
            original
              .slice(
                specificationStart + specificationHeadingLength,
                keyStart
              )
              .split("\n")
              .map((line) => clean(line))
              .filter(Boolean)
          );

    const specificationText =
      keyStart < specificationStart
        ? original.slice(
            specificationStart + specificationHeadingLength
          )
        : original.slice(
            keyStart + keyHeadingLength
          );

    const specifications = parseSpecificationLines(
      specificationText
        .split("\n")
        .map((line) => clean(line))
        .filter(Boolean)
    );

    return {
      description: descriptionText,
      key_features: keyFeatures,
      specifications,
    };
  }

  /*
   * Case 2:
   * Only Key Features exists.
   */
  if (keyStart >= 0) {
    const keyHeadingLength = keyMatch?.[0].length ?? 0;

    const descriptionText = original
      .slice(0, keyStart)
      .trim();

    const keyFeatures = parseFeatureLines(
      original
        .slice(keyStart + keyHeadingLength)
        .split("\n")
        .map((line) => clean(line))
        .filter(Boolean)
    );

    return {
      description: descriptionText,
      key_features: keyFeatures,
      specifications: {},
    };
  }

  /*
   * Case 3:
   * Only Specifications exists.
   */
  if (specificationStart >= 0) {
    const specificationHeadingLength =
      specificationMatch?.[0].length ?? 0;

    const descriptionText = original
      .slice(0, specificationStart)
      .trim();

    const specifications = parseSpecificationLines(
      original
        .slice(specificationStart + specificationHeadingLength)
        .split("\n")
        .map((line) => clean(line))
        .filter(Boolean)
    );

    return {
      description: descriptionText,
      key_features: [],
      specifications,
    };
  }

  /*
   * Case 4:
   * No explicit sections.
   * Preserve the existing standalone specification behaviour.
   */
  const fallbackLines = original
    .split("\n")
    .map((line) => clean(line))
    .filter(Boolean);

  const standaloneSpecifications =
    extractStandaloneStructuredSpecifications(fallbackLines);

  const descriptionLines = fallbackLines.filter(
    (line) => !parseStructuredSpecificationLine(line)
  );

  return {
    description: descriptionLines.join("\n").trim(),
    key_features: [],
    specifications: standaloneSpecifications,
  };
}
