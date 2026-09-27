from __future__ import annotations

import colorsys
import math
from typing import Dict, List, Tuple


ColourReference = Tuple[str, Tuple[int, int, int]]

REFERENCES: List[ColourReference] = [
    ("Black", (25, 25, 25)),
    ("White", (245, 245, 245)),
    ("Grey", (128, 128, 128)),
    ("Red", (190, 45, 45)),
    ("Blue", (45, 90, 190)),
    ("Green", (45, 135, 70)),
    ("Yellow", (225, 195, 45)),
    ("Orange", (220, 125, 35)),
    ("Pink", (220, 120, 155)),
    ("Purple", (125, 70, 155)),
    ("Brown", (125, 75, 50)),
    ("Navy Blue", (30, 55, 110)),
    ("Light Blue", (100, 175, 220)),
    ("Dark Blue", (25, 65, 125)),
    ("Light Green", (125, 180, 110)),
    ("Dark Green", (35, 85, 55)),
    ("Beige", (205, 185, 145)),
    ("Cream", (235, 220, 185)),
    ("Gold", (205, 165, 55)),
    ("Silver", (175, 180, 180)),
    ("Maroon", (110, 35, 40)),
    ("Burgundy", (105, 35, 50)),
    ("Turquoise", (45, 175, 170)),
    ("Teal", (35, 125, 120)),
    ("Khaki", (150, 145, 95)),
]


def _rgb_to_hsv(rgb: Tuple[int, int, int]) -> Tuple[float, float, float]:
    r, g, b = [max(0, min(255, x)) / 255.0 for x in rgb]
    return colorsys.rgb_to_hsv(r, g, b)


def _lab_like(rgb: Tuple[int, int, int]) -> Tuple[float, float, float]:
    """
    Lightweight perceptual representation.
    Good enough for colour ranking without another ML dependency.
    """
    r, g, b = [x / 255.0 for x in rgb]

    def pivot(v: float) -> float:
        return ((v + 0.055) / 1.055) ** 2.4 if v > 0.04045 else v / 12.92

    r, g, b = pivot(r), pivot(g), pivot(b)

    x = (r * 0.4124564 + g * 0.3575761 + b * 0.1804375) / 0.95047
    y = (r * 0.2126729 + g * 0.7151522 + b * 0.0721750)
    z = (r * 0.0193339 + g * 0.1191920 + b * 0.9503041) / 1.08883

    def f(v: float) -> float:
        return v ** (1 / 3) if v > 0.008856 else (7.787 * v) + (16 / 116)

    fx, fy, fz = f(x), f(y), f(z)

    return (
        (116 * fy) - 16,
        500 * (fx - fy),
        200 * (fy - fz),
    )


REF_LAB = {
    name: _lab_like(rgb)
    for name, rgb in REFERENCES
}


def _distance(a: Tuple[float, float, float],
              b: Tuple[float, float, float]) -> float:
    return math.sqrt(sum((x - y) ** 2 for x, y in zip(a, b)))


def _hue_distance(a: float, b: float) -> float:
    d = abs(a - b)
    return min(d, 1.0 - d)


def classify_cluster(rgb: List[int] | Tuple[int, int, int]) -> Dict:
    rgb = tuple(int(x) for x in rgb)

    lab = _lab_like(rgb)
    h, s, v = _rgb_to_hsv(rgb)

    candidates = []

    for name, ref_rgb in REFERENCES:
        ref_lab = REF_LAB[name]
        ref_h, ref_s, ref_v = _rgb_to_hsv(ref_rgb)

        lab_distance = _distance(lab, ref_lab)
        hue_distance = _hue_distance(h, ref_h)

        saturation_distance = abs(s - ref_s)
        value_distance = abs(v - ref_v)

        score = (
            lab_distance * 0.62
            + hue_distance * 100.0 * 0.20
            + saturation_distance * 35.0 * 0.10
            + value_distance * 25.0 * 0.08
        )

        candidates.append(
            {
                "name": name,
                "score": score,
                "lab_distance": lab_distance,
                "hue_distance": hue_distance,
            }
        )

    candidates.sort(key=lambda x: x["score"])

    best = candidates[0]
    second = candidates[1]

    separation = max(0.0, second["score"] - best["score"])

    # Confidence is deliberately conservative.
    distance_confidence = max(
        0.0,
        min(1.0, 1.0 - best["score"] / 55.0)
    )

    separation_confidence = max(
        0.0,
        min(1.0, separation / 18.0)
    )

    confidence = (
        distance_confidence * 0.70
        + separation_confidence * 0.30
    )

    # Explicit neutral-colour handling.
    if v < 0.18:
        best = next(x for x in candidates if x["name"] == "Black")
        confidence = max(confidence, 0.88)

    elif s < 0.10 and v > 0.82:
        best = next(x for x in candidates if x["name"] == "White")
        confidence = max(confidence, 0.88)

    elif s < 0.12 and 0.28 <= v <= 0.82:
        best = next(x for x in candidates if x["name"] == "Grey")
        confidence = max(confidence, 0.80)

    return {
        "name": best["name"],
        "confidence": round(float(confidence), 4),
        "score": round(float(best["score"]), 4),
        "second_name": second["name"],
        "second_score": round(float(second["score"]), 4),
        "separation": round(float(separation), 4),
    }


def classify_clusters(clusters: List[Dict]) -> List[Dict]:
    results = []

    for cluster in clusters:
        rgb = cluster["rgb"]
        share = float(cluster["share"])

        result = classify_cluster(rgb)

        results.append(
            {
                **result,
                "rgb": list(rgb),
                "share": round(share, 4),
            }
        )

    return results
