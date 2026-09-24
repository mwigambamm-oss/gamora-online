import {
  normalizeColorName,
} from "./normalize";

export type RawDetectedColor = {
  name: string;
  confidence: number;
  share?: number;
};

export function classifyAndNormalizeColors(
  detections: RawDetectedColor[]
) {
  const merged = new Map<
    string,
    {
      name: string;
      confidence: number;
      share: number;
    }
  >();

  for (const detection of detections) {
    const name = normalizeColorName(detection.name);

    if (!name) continue;

    const existing = merged.get(name);

    if (!existing) {
      merged.set(name, {
        name,
        confidence: detection.confidence,
        share: detection.share ?? 0,
      });
      continue;
    }

    existing.confidence = Math.max(
      existing.confidence,
      detection.confidence
    );

    existing.share += detection.share ?? 0;
  }

  return [...merged.values()]
    .sort(
      (a, b) =>
        b.share - a.share ||
        b.confidence - a.confidence
    );
}
