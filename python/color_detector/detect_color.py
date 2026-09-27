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
    Estimate the actual product area while rejecting the image background.

    Strategy:
    1. Start with a conservative foreground estimate.
    2. Use GrabCut with an inset rectangle to separate the product
       from the surrounding background.
    3. Combine GrabCut with the conservative colour mask.
    4. Remove small components and border-connected background.
    """
    h, w = image.shape[:2]

    if h < 20 or w < 20:
        return np.ones((h, w), dtype=np.uint8) * 255

    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)
    _, s, v = cv2.split(hsv)

    # Initial estimate:
    # coloured/dark pixels are more likely to belong to the product,
    # while bright low-saturation pixels are more likely background.
    initial = np.ones((h, w), dtype=np.uint8) * 255

    light_background = (s < 40) & (v > 210)
    initial[light_background] = 0

    # Remove a thin outer border. Product pixels touching the very edge
    # are treated cautiously because they are often background.
    border = max(2, int(min(h, w) * 0.02))
    initial[:border, :] = 0
    initial[-border:, :] = 0
    initial[:, :border] = 0
    initial[:, -border:] = 0

    kernel_small = np.ones((3, 3), np.uint8)
    initial = cv2.morphologyEx(
        initial,
        cv2.MORPH_OPEN,
        kernel_small,
        iterations=1,
    )
    initial = cv2.morphologyEx(
        initial,
        cv2.MORPH_CLOSE,
        kernel_small,
        iterations=2,
    )

    # GrabCut gives us a second, independent estimate of the product.
    # Keep a small inset so the outer image border is known background.
    margin_x = max(3, int(w * 0.04))
    margin_y = max(3, int(h * 0.04))

    rect_w = max(2, w - 2 * margin_x)
    rect_h = max(2, h - 2 * margin_y)

    grab_mask = np.full(
        (h, w),
        cv2.GC_BGD,
        dtype=np.uint8,
    )

    # The inner rectangle is probable foreground rather than definite
    # foreground. GrabCut can therefore still reject background inside it.
    grab_mask[
        margin_y:margin_y + rect_h,
        margin_x:margin_x + rect_w
    ] = cv2.GC_PR_FGD

    # Strongly coloured/dark regions inside the image are useful
    # foreground hints.
    strong_product = (
        ((s > 45) & (v > 35)) |
        (v < 70)
    )

    grab_mask[strong_product] = cv2.GC_PR_FGD

    # Very bright, low-saturation pixels are strong background hints.
    strong_background = (s < 25) & (v > 220)
    grab_mask[strong_background] = cv2.GC_BGD

    # Outer border is always background.
    grab_mask[:border, :] = cv2.GC_BGD
    grab_mask[-border:, :] = cv2.GC_BGD
    grab_mask[:, :border] = cv2.GC_BGD
    grab_mask[:, -border:] = cv2.GC_BGD

    bgd_model = np.zeros((1, 65), np.float64)
    fgd_model = np.zeros((1, 65), np.float64)

    try:
        cv2.grabCut(
            image,
            grab_mask,
            None,
            bgd_model,
            fgd_model,
            5,
            cv2.GC_INIT_WITH_MASK,
        )

        grab_foreground = np.where(
            (grab_mask == cv2.GC_FGD) |
            (grab_mask == cv2.GC_PR_FGD),
            255,
            0,
        ).astype(np.uint8)
    except cv2.error:
        grab_foreground = initial.copy()

    # Combine both estimates.
    # A union prevents GrabCut from deleting valid product regions,
    # while the following component filtering removes isolated noise.
    combined = cv2.bitwise_or(initial, grab_foreground)

    # Keep only meaningful connected components.
    num_labels, labels, stats, _ = cv2.connectedComponentsWithStats(
        combined,
        connectivity=8,
    )

    if num_labels <= 1:
        return combined

    areas = stats[1:, cv2.CC_STAT_AREA]
    largest_area = int(np.max(areas)) if len(areas) else 0

    if largest_area <= 0:
        return combined

    # Keep the largest component and nearby substantial components.
    # Small isolated areas are normally reflections/background noise.
    keep = np.zeros_like(combined)

    minimum_area = max(80, int(h * w * 0.003))

    for label in range(1, num_labels):
        area = stats[label, cv2.CC_STAT_AREA]
        if area >= minimum_area and area >= largest_area * 0.08:
            keep[labels == label] = 255

    # If filtering became too aggressive, fall back to the largest component.
    if cv2.countNonZero(keep) < max(100, int(h * w * 0.01)):
        largest_label = 1 + int(np.argmax(areas))
        keep = np.where(labels == largest_label, 255, 0).astype(np.uint8)

    kernel = np.ones((5, 5), np.uint8)
    keep = cv2.morphologyEx(
        keep,
        cv2.MORPH_CLOSE,
        kernel,
        iterations=2,
    )
    keep = cv2.morphologyEx(
        keep,
        cv2.MORPH_OPEN,
        kernel,
        iterations=1,
    )

    return keep


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

    product_mask = build_product_mask(image)
    hsv = cv2.cvtColor(image, cv2.COLOR_BGR2HSV)

    if allowed_colors:
        candidates = [
            c.strip()
            for c in allowed_colors
            if c and c.strip() in COLOR_RANGES
        ]
    else:
        candidates = list(COLOR_RANGES.keys())

    total_product_pixels = max(
        cv2.countNonZero(product_mask),
        1,
    )

    # Build raw masks first.
    raw_masks = {}

    for color in candidates:
        raw = hue_mask(
            hsv,
            COLOR_RANGES[color],
            color,
        )

        raw = cv2.bitwise_and(
            raw,
            product_mask,
        )

        # Remove tiny isolated colour noise.
        raw = cv2.morphologyEx(
            raw,
            cv2.MORPH_OPEN,
            np.ones((3, 3), np.uint8),
            iterations=1,
        )

        raw_masks[color] = raw

    # Make colour areas mutually exclusive.
    #
    # Some HSV ranges naturally overlap, especially:
    # Black/Blue, Brown/Orange, Gray/White.
    # A pixel is assigned to the colour whose rule fits it best.
    #
    # This prevents the same pixel from inflating several colours.
    assigned = np.zeros_like(product_mask)

    exclusive_masks = {
        color: np.zeros_like(product_mask)
        for color in candidates
    }

    h, s, v = cv2.split(hsv)

    for y in range(h.shape[0]):
        product_row = product_mask[y] > 0

        for x in np.where(product_row)[0]:
            pixel_scores = []

            for color in candidates:
                ranges = COLOR_RANGES[color]

                sat = float(s[y, x]) / 255.0
                val = float(v[y, x]) / 255.0

                if raw_masks[color][y, x] == 0:
                    continue

                if color == "Black":
                    # Black should be dark AND relatively unsaturated.
                    strength = (
                        (1.0 - val) *
                        (1.0 - min(sat, 0.85))
                    )

                elif color == "White":
                    # White should be bright AND very low saturation.
                    strength = (
                        val *
                        (1.0 - sat)
                    )

                elif color == "Gray":
                    # Gray should have low saturation and mid/high value.
                    strength = (
                        (1.0 - sat) *
                        (0.45 + 0.55 * val)
                    )

                else:
                    # Chromatic colours should have strong saturation.
                    strength = sat * (
                        0.35 + 0.65 * val
                    )

                pixel_scores.append(
                    (strength, color)
                )

            if not pixel_scores:
                continue

            _, best_color = max(
                pixel_scores,
                key=lambda item: item[0],
            )

            exclusive_masks[best_color][y, x] = 255

    results = []

    for color in candidates:
        pixels = cv2.countNonZero(
            exclusive_masks[color]
        )

        if pixels == 0:
            continue

        coverage = pixels / total_product_pixels

        # Very small areas are not reliable product colours.
        if coverage < 0.025:
            continue

        # Calculate how dominant this colour is among all detected
        # product colours.
        competing = [
            cv2.countNonZero(exclusive_masks[c])
            for c in candidates
            if c != color
        ]

        strongest_competitor = (
            max(competing)
            if competing
            else 0
        )

        dominance = pixels / max(
            pixels + strongest_competitor,
            1,
        )

        # Confidence is NOT simply coverage.
        #
        # Coverage = how much of the product has this colour.
        # Dominance = how clearly this colour beats its strongest
        # competing colour.
        #
        # Only extremely strong evidence can reach 99%.
        confidence = (
            (coverage * 0.55) +
            (dominance * 0.45)
        )

        # Require very strong evidence before reporting 99%.
        if (
            coverage >= 0.80 and
            dominance >= 0.90
        ):
            confidence = max(confidence, 0.99)

        elif (
            coverage >= 0.65 and
            dominance >= 0.80
        ):
            confidence = min(confidence, 0.95)

        elif (
            coverage >= 0.45 and
            dominance >= 0.70
        ):
            confidence = min(confidence, 0.90)

        confidence = min(
            0.99,
            max(0.0, confidence),
        )

        results.append({
            "color": color,
            "confidence": round(
                float(confidence),
                4,
            ),
            "coverage": round(
                float(coverage),
                4,
            ),
        })

    results.sort(
        key=lambda item: (
            item["coverage"],
            item["confidence"],
        ),
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
