#!/usr/bin/env python3

import sys
import json
import urllib.request
import tempfile
import os

import cv2
import numpy as np


COLOR_RANGES = {
    "Black":    {"h": None,       "s": (0, 255),   "v": (0, 55)},
    "White":    {"h": None,       "s": (0, 55),    "v": (180, 255)},
    "Gray":     {"h": None,       "s": (0, 60),    "v": (55, 190)},
    "Red":      {"h": [(0, 10), (170, 180)], "s": (70, 255), "v": (60, 255)},
    "Orange":   {"h": (10, 25),   "s": (70, 255), "v": (60, 255)},
    "Yellow":   {"h": (25, 38),   "s": (60, 255), "v": (70, 255)},
    "Green":    {"h": (38, 85),   "s": (50, 255), "v": (45, 255)},
    "Cyan":     {"h": (85, 100),  "s": (50, 255), "v": (45, 255)},
    "Blue":     {"h": (100, 135), "s": (50, 255), "v": (45, 255)},
    "Purple":   {"h": (135, 165), "s": (45, 255), "v": (45, 255)},
    "Pink":     {"h": (165, 180), "s": (35, 255), "v": (60, 255)},
    "Brown":    {"h": (5, 25),    "s": (45, 255), "v": (30, 170)},
}


def load_image(source):
    if source.startswith(("http://", "https://")):
        req = urllib.request.Request(
            source,
            headers={"User-Agent": "Gamora-Color-Detector/1.0"},
        )
        with urllib.request.urlopen(req, timeout=20) as response:
            data = np.frombuffer(response.read(), dtype=np.uint8)
        image = cv2.imdecode(data, cv2.IMREAD_COLOR)
        return image

    image = cv2.imread(source)
    return image


def resize_image(image, max_side=900):
    h, w = image.shape[:2]
    scale = min(1.0, max_side / max(h, w))
    if scale == 1.0:
        return image
    return cv2.resize(
        image,
        (int(w * scale), int(h * scale)),
        interpolation=cv2.INTER_AREA,
    )


def build_product_mask(image):
    """
    Conservative foreground estimation.

    We avoid assuming that every colored pixel is the product.
    Very bright/low-saturation background pixels are suppressed,
    while retaining colored and dark product areas.
    """
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    h, s, v = cv2.split(hsv)

    foreground = np.ones_like(s, dtype=np.uint8) * 255

    # Suppress typical white/light studio background.
    background = (s < 35) & (v > 205)
    foreground[background] = 0

    # Suppress extreme border-connected background.
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(
        foreground,
        connectivity=8,
    )

    if num_labels > 1:
        largest = 1 + np.argmax(stats[1:, cv2.CC_STAT_AREA])
        component = (labels == largest).astype(np.uint8) * 255

        # If the mask is too small, keep the conservative pixel mask.
        ratio = cv2.countNonZero(component) / float(component.size)
        if ratio >= 0.05:
            foreground = component

    kernel = np.ones((5, 5), np.uint8)
    foreground = cv2.morphologyEx(
        foreground,
        cv2.MORPH_CLOSE,
        kernel,
        iterations=2,
    )
    foreground = cv2.morphologyEx(
        foreground,
        cv2.MORPH_OPEN,
        kernel,
        iterations=1,
    )

    return foreground


def hue_mask(hsv, ranges, color):
    h, s, v = cv2.split(hsv)

    if color in ("Black", "White", "Gray"):
        return cv2.inRange(
            hsv,
            np.array([0, ranges["s"][0], ranges["v"][0]], dtype=np.uint8),
            np.array([179, ranges["s"][1], ranges["v"][1]], dtype=np.uint8),
        )

    if color == "Brown":
        return cv2.inRange(
            hsv,
            np.array([ranges["h"][0], ranges["s"][0], ranges["v"][0]], dtype=np.uint8),
            np.array([ranges["h"][1], ranges["s"][1], ranges["v"][1]], dtype=np.uint8),
        )

    h_range = ranges["h"]

    if isinstance(h_range, list):
        mask = cv2.inRange(
            hsv,
            np.array([h_range[0][0], ranges["s"][0], ranges["v"][0]], dtype=np.uint8),
            np.array([h_range[0][1], ranges["s"][1], ranges["v"][1]], dtype=np.uint8),
        )
        mask2 = cv2.inRange(
            hsv,
            np.array([h_range[1][0], ranges["s"][0], ranges["v"][0]], dtype=np.uint8),
            np.array([h_range[1][1], ranges["s"][1], ranges["v"][1]], dtype=np.uint8),
        )
        return cv2.bitwise_or(mask, mask2)

    return cv2.inRange(
        hsv,
        np.array([h_range[0], ranges["s"][0], ranges["v"][0]], dtype=np.uint8),
        np.array([h_range[1], ranges["s"][1], ranges["v"][1]], dtype=np.uint8),
    )


def detect_colors(image, allowed_colors=None):
    image = resize_image(image)

    mask = build_product_mask(image)
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    if allowed_colors:
        candidates = [
            c.strip()
            for c in allowed_colors
            if c and c.strip() in COLOR_RANGES
        ]
    else:
        candidates = list(COLOR_RANGES.keys())

    total = max(cv2.countNonZero(mask), 1)
    results = []

    for color in candidates:
        color_mask = hue_mask(hsv, COLOR_RANGES[color], color)
        color_mask = cv2.bitwise_and(color_mask, mask)

        pixels = cv2.countNonZero(color_mask)
        ratio = pixels / total

        if pixels == 0:
            continue

        # Coverage is the amount of the detected product occupied
        # by this colour. Confidence is deliberately different:
        # it rewards strong dominance but does not automatically
        # turn every large colour area into 99%.
        if ratio >= 0.70:
            confidence = 0.99
        elif ratio >= 0.50:
            confidence = 0.90 + ((ratio - 0.50) / 0.20) * 0.08
        elif ratio >= 0.30:
            confidence = 0.75 + ((ratio - 0.30) / 0.20) * 0.15
        elif ratio >= 0.18:
            confidence = 0.60 + ((ratio - 0.18) / 0.12) * 0.15
        elif ratio >= 0.12:
            confidence = 0.45 + ((ratio - 0.12) / 0.06) * 0.15
        else:
            confidence = ratio * 3.75

        confidence = min(0.99, max(0.0, confidence))

        results.append({
            "color": color,
            "confidence": round(float(confidence), 4),
            "coverage": round(float(ratio), 4),
        })

    results.sort(
        key=lambda item: (item["coverage"], item["confidence"]),
        reverse=True,
    )

    return results


def main():
    if len(sys.argv) < 2:
        print(json.dumps({
            "success": False,
            "error": "Image URL or path is required"
        }))
        sys.exit(1)

    source = sys.argv[1]

    allowed = None
    if len(sys.argv) >= 3 and sys.argv[2].strip():
        allowed = [
            item.strip()
            for item in sys.argv[2].split(",")
            if item.strip()
        ]

    image = load_image(source)

    if image is None:
        print(json.dumps({
            "success": False,
            "error": "Could not load image"
        }))
        sys.exit(1)

    results = detect_colors(image, allowed)

    print(json.dumps({
        "success": True,
        "results": results[:5],
    }))


if __name__ == "__main__":
    main()
