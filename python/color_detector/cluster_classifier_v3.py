from __future__ import annotations

import colorsys
from typing import Dict, List, Tuple


def rgb_to_hsv(rgb):
    r, g, b = [max(0, min(255, int(x))) / 255.0 for x in rgb]
    return colorsys.rgb_to_hsv(r, g, b)


def colour_family(h, s, v):
    """
    Product-aware colour naming.
    Hue is only trusted when saturation is strong enough.
    Low-saturation colours are classified using channel relationships
    instead of arbitrary hue noise.
    """

    r, g, b = [x / 255.0 for x in CURRENT_RGB]

    # ---------- BLACK ----------
    if v <= 0.18:
        return "Black"

    # ---------- STRONG CHROMATIC COLOURS ----------
    # These use hue because saturation is strong enough to trust it.
    if s >= 0.32:

        # Red / burgundy / maroon
        if h >= 0.94 or h < 0.035:
            if v < 0.48:
                return "Burgundy"
            if v < 0.65:
                return "Maroon"
            return "Red"

        # Orange / brown
        if 0.035 <= h < 0.105:
            if v < 0.58:
                return "Brown"
            return "Orange"

        # Yellow / gold
        if 0.105 <= h < 0.19:
            if v < 0.55:
                return "Khaki"
            if v < 0.72:
                return "Gold"
            return "Yellow"

        # Green
        if 0.19 <= h < 0.47:
            if v < 0.45:
                return "Dark Green"
            return "Green"

        # Cyan / teal / turquoise
        if 0.47 <= h < 0.57:
            if h >= 0.515:
                return "Teal"
            return "Turquoise"

        # Blue
        if 0.57 <= h < 0.72:
            if v < 0.42:
                return "Navy Blue"
            if v < 0.62:
                return "Dark Blue"
            return "Blue"

        # Purple
        if 0.72 <= h < 0.88:
            return "Purple"

        # Pink
        if 0.88 <= h < 0.94:
            return "Pink"

    # ---------- LOW / MEDIUM SATURATION ----------
    # Do not trust hue alone here.
    #
    # Determine whether the colour is warm, cool or neutral from RGB.
    max_c = max(r, g, b)
    min_c = min(r, g, b)
    spread = max_c - min_c

    # Near-neutral
    if spread < 0.055:
        if v >= 0.86:
            return "White"
        if v <= 0.30:
            return "Black"
        return "Grey"

    # Warm muted colours
    if r >= g * 1.04 and r >= b * 1.04:

        if v >= 0.82 and s <= 0.18:
            return "Cream"

        if v >= 0.68 and s <= 0.30:
            return "Beige"

        if v < 0.50:
            return "Brown"

        # Muted red / dusty rose
        if r > g * 1.12 and r > b * 1.12:
            if v < 0.62:
                return "Maroon"
            return "Red"

        return "Beige"

    # Cool muted colours
    if b >= r * 1.04 or g >= r * 1.04:

        # Green must have green clearly above blue.
        if g >= b * 1.05 and g >= r * 1.12:
            if v < 0.48:
                return "Dark Green"
            if v >= 0.70:
                return "Light Green"
            return "Green"

        # Blue/cyan only when blue/green relationship supports it.
        if b >= g * 1.02 and b >= r * 1.08:
            if v >= 0.70:
                return "Light Blue"
            if v < 0.45:
                return "Navy Blue"
            return "Blue"

        # Green-blue balanced muted tone
        if g >= r * 1.10 and b >= r * 1.08:
            return "Teal"

    # Remaining muted warm-neutral colours
    if v >= 0.82:
        return "White"

    if v <= 0.30:
        return "Black"

    return "Grey"


def family_confidence(h, s, v, family):
    r, g, b = [x / 255.0 for x in CURRENT_RGB]

    # Very strong neutral signals
    if family == "Black":
        if v <= 0.16:
            return 0.96
        if v <= 0.20:
            return 0.90

    if family == "White":
        if v >= 0.92 and s <= 0.08:
            return 0.96
        if v >= 0.86 and s <= 0.12:
            return 0.90

    if family == "Grey":
        spread = max(r, g, b) - min(r, g, b)
        neutrality = max(0.0, 1.0 - spread / 0.12)
        return min(0.92, 0.62 + neutrality * 0.28)

    # Chromatic confidence
    saturation_strength = min(1.0, s / 0.55)

    if family in {
        "Red", "Orange", "Yellow", "Green",
        "Blue", "Purple", "Pink",
        "Brown", "Maroon", "Burgundy",
        "Teal", "Turquoise"
    }:
        return min(0.96, 0.52 + saturation_strength * 0.44)

    # Muted colours are inherently harder.
    return min(0.90, 0.58 + saturation_strength * 0.25)


CURRENT_RGB = (0, 0, 0)


def classify_cluster(rgb: List[int] | Tuple[int, int, int]) -> Dict:
    global CURRENT_RGB
    CURRENT_RGB = tuple(int(x) for x in rgb)

    h, s, v = rgb_to_hsv(CURRENT_RGB)

    family = colour_family(h, s, v)
    confidence = family_confidence(h, s, v, family)

    return {
        "name": family,
        "confidence": round(float(confidence), 4),
        "hue": round(float(h), 4),
        "saturation": round(float(s), 4),
        "value": round(float(v), 4),
        "rgb": list(CURRENT_RGB),
    }


def classify_clusters(clusters: List[Dict]) -> List[Dict]:
    return [
        {
            **classify_cluster(cluster["rgb"]),
            "share": round(float(cluster["share"]), 4),
        }
        for cluster in clusters
    ]
