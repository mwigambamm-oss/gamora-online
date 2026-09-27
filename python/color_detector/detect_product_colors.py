#!/usr/bin/env python3

import json
import sys
import urllib.request
from pathlib import Path

import cv2
import numpy as np
from PIL import Image
from rembg import remove, new_session


CONFIDENCE_THRESHOLD = 0.70
MIN_COLOUR_COVERAGE = 0.035
MAX_SIDE = 900

COLOUR_NAMES = [
    "Black",
    "White",
    "Red",
    "Blue",
    "Green",
    "Yellow",
    "Orange",
    "Pink",
    "Purple",
    "Brown",
    "Grey",
    "Navy Blue",
    "Light Blue",
    "Dark Blue",
    "Light Green",
    "Dark Green",
    "Beige",
    "Cream",
    "Gold",
    "Silver",
    "Maroon",
    "Burgundy",
    "Turquoise",
    "Teal",
    "Khaki",
]


def load_source(source: str) -> bytes:
    if source.startswith(("http://", "https://")):
        request = urllib.request.Request(
            source,
            headers={
                "User-Agent": "Gamora-Product-Colour-Detector/1.0"
            },
        )
        with urllib.request.urlopen(request, timeout=30) as response:
            return response.read()

    return Path(source).read_bytes()


def resize_rgb(image: Image.Image) -> Image.Image:
    image = image.convert("RGBA")

    width, height = image.size
    largest = max(width, height)

    if largest <= MAX_SIDE:
        return image

    scale = MAX_SIDE / largest

    return image.resize(
        (
            max(1, int(width * scale)),
            max(1, int(height * scale)),
        ),
        Image.Resampling.LANCZOS,
    )


def segment_product(image_bytes: bytes, session):
    result = remove(image_bytes, session=session)

    image = Image.open(
        __import__("io").BytesIO(result)
    ).convert("RGBA")

    image = resize_rgb(image)

    rgba = np.asarray(image)

    rgb = rgba[:, :, :3]
    alpha = rgba[:, :, 3]

    return rgb, alpha


def clean_mask(alpha: np.ndarray) -> np.ndarray:
    # rembg alpha is our primary product/background separator.
    # Keep semi-transparent product edges, but reject almost-transparent
    # background remnants.
    mask = np.where(alpha >= 45, 255, 0).astype(np.uint8)

    kernel = np.ones((3, 3), np.uint8)

    mask = cv2.morphologyEx(
        mask,
        cv2.MORPH_OPEN,
        kernel,
        iterations=1,
    )

    mask = cv2.morphologyEx(
        mask,
        cv2.MORPH_CLOSE,
        kernel,
        iterations=2,
    )

    # Remove tiny disconnected components.
    count, labels, stats, _ = cv2.connectedComponentsWithStats(
        mask,
        connectivity=8,
    )

    if count <= 1:
        return mask

    areas = stats[1:, cv2.CC_STAT_AREA]

    if not len(areas):
        return mask

    largest = int(np.max(areas))
    minimum = max(40, int(mask.size * 0.0005))

    cleaned = np.zeros_like(mask)

    for label in range(1, count):
        area = int(stats[label, cv2.CC_STAT_AREA])

        if area >= minimum and (
            area >= largest * 0.025
            or area >= mask.size * 0.01
        ):
            cleaned[labels == label] = 255

    if cv2.countNonZero(cleaned) < max(
        100,
        int(mask.size * 0.005),
    ):
        return mask

    return cleaned


def rgb_to_hsv(rgb_pixels: np.ndarray) -> np.ndarray:
    bgr = rgb_pixels[:, ::-1].astype(np.uint8)

    return cv2.cvtColor(
        bgr.reshape((-1, 1, 3)),
        cv2.COLOR_BGR2HSV,
    ).reshape((-1, 3))


def classify_pixel(h: float, s: float, v: float):
    # OpenCV hue: 0..179
    # Saturation/value: 0..255

    # Neutral colours first.
    if v <= 48:
        return "Black"

    if s <= 28 and v >= 205:
        return "White"

    if s <= 32 and 65 <= v < 205:
        return "Grey"

    # Brown / beige / cream / khaki are separated before orange/yellow.
    if s >= 35 and 35 <= v <= 190 and (
        h <= 24 or h >= 170
    ):
        if v < 125:
            return "Brown"

    if s <= 75 and v >= 150 and 12 <= h <= 30:
        return "Beige"

    if s <= 65 and v >= 185:
        return "Cream"

    if 18 <= h <= 38 and 45 <= s <= 150 and 70 <= v <= 190:
        return "Khaki"

    # Red / burgundy / maroon.
    if h <= 8 or h >= 172:
        if v < 105:
            return "Maroon"

        if v < 155 and s >= 80:
            return "Burgundy"

        return "Red"

    # Orange.
    if 8 < h <= 22 and s >= 70 and v >= 70:
        return "Orange"

    # Yellow / gold.
    if 22 < h <= 38 and s >= 65 and v >= 80:
        if s >= 110 and v >= 130:
            return "Yellow"

        return "Gold"

    # Green family.
    if 38 < h <= 88 and s >= 45:
        if v < 105:
            return "Dark Green"

        if v >= 175 and s < 150:
            return "Light Green"

        return "Green"

    # Cyan / turquoise / teal.
    if 88 < h <= 105 and s >= 45:
        if v < 150:
            return "Teal"

        return "Turquoise"

    # Blue family.
    if 95 < h <= 135 and s >= 45:
        if v < 85:
            return "Navy Blue"

        if v < 145:
            return "Dark Blue"

        if s < 125 and v >= 175:
            return "Light Blue"

        return "Blue"

    # Purple.
    if 125 < h <= 160 and s >= 45:
        return "Purple"

    # Pink / magenta.
    if 145 < h <= 171 and s >= 35:
        if v >= 150:
            return "Pink"

        return "Purple"

    return None


def calculate_colour_results(
    rgb: np.ndarray,
    mask: np.ndarray,
):
    pixels = rgb[mask > 0]

    if len(pixels) == 0:
        return []

    hsv = rgb_to_hsv(pixels)

    counts = {}

    for h, s, v in hsv:
        colour = classify_pixel(
            float(h),
            float(s),
            float(v),
        )

        if colour:
            counts[colour] = counts.get(colour, 0) + 1

    if not counts:
        return []

    total_classified = sum(counts.values())

    ranked = []

    for colour, count in counts.items():
        coverage = count / len(pixels)
        percentage = count / total_classified

        if coverage < MIN_COLOUR_COVERAGE:
            continue

        # Evidence combines:
        # - how much of the actual product this colour occupies
        # - how dominant it is against competitors
        # - how much of the product was confidently classified.
        competitors = [
            value
            for key, value in counts.items()
            if key != colour
        ]

        strongest_competitor = (
            max(competitors)
            if competitors
            else 0
        )

        dominance = count / max(
            count + strongest_competitor,
            1,
        )

        classified_ratio = (
            total_classified / len(pixels)
        )

        confidence = (
            coverage * 0.45
            + dominance * 0.35
            + classified_ratio * 0.20
        )

        ranked.append({
            "name": colour,
            "confidence": round(
                float(min(0.99, confidence)),
                4,
            ),
            "coverage": round(
                float(coverage),
                4,
            ),
            "percentage": round(
                float(percentage),
                4,
            ),
        })

    ranked.sort(
        key=lambda item: (
            item["coverage"],
            item["confidence"],
        ),
        reverse=True,
    )

    # Suppress duplicate/near-duplicate family noise.
    final = []

    family_groups = {
        "Blue": {
            "Blue",
            "Navy Blue",
            "Dark Blue",
            "Light Blue",
        },
        "Green": {
            "Green",
            "Dark Green",
            "Light Green",
        },
        "Neutral": {
            "Black",
            "White",
            "Grey",
            "Cream",
            "Beige",
        },
        "Red": {
            "Red",
            "Maroon",
            "Burgundy",
        },
    }

    for item in ranked:
        if item["confidence"] < CONFIDENCE_THRESHOLD:
            continue

        colour = item["name"]

        duplicate = False

        for existing in final:
            for group in family_groups.values():
                if (
                    colour in group
                    and existing["name"] in group
                ):
                    # Keep genuinely meaningful variants,
                    # but reject tiny secondary noise.
                    if (
                        item["percentage"] < 0.08
                        and existing["percentage"] > item["percentage"]
                    ):
                        duplicate = True

                    break

            if duplicate:
                break

        if not duplicate:
            final.append(item)

    return final


def detect(images):
    session = new_session("u2netp")

    combined = {}

    successful_images = 0

    for source in images:
        try:
            image_bytes = load_source(source)

            rgb, alpha = segment_product(
                image_bytes,
                session,
            )

            mask = clean_mask(alpha)

            if cv2.countNonZero(mask) == 0:
                continue

            results = calculate_colour_results(
                rgb,
                mask,
            )

            if not results:
                continue

            successful_images += 1

            for result in results:
                name = result["name"]

                if name not in combined:
                    combined[name] = {
                        "name": name,
                        "confidence": result["confidence"],
                        "coverage": result["coverage"],
                        "percentage": result["percentage"],
                        "images": [source],
                    }
                else:
                    current = combined[name]

                    current["confidence"] = max(
                        current["confidence"],
                        result["confidence"],
                    )

                    current["coverage"] = max(
                        current["coverage"],
                        result["coverage"],
                    )

                    current["percentage"] = max(
                        current["percentage"],
                        result["percentage"],
                    )

                    current["images"].append(source)

        except Exception:
            continue

    final = []

    for item in combined.values():
        if item["confidence"] < CONFIDENCE_THRESHOLD:
            continue

        item["images"] = list(
            dict.fromkeys(item["images"])
        )

        final.append({
            "name": item["name"],
            "confidence": round(
                float(item["confidence"]),
                4,
            ),
            "coverage": round(
                float(item["coverage"]),
                4,
            ),
            "percentage": round(
                float(item["percentage"]),
                4,
            ),
            "images": item["images"],
        })

    final.sort(
        key=lambda item: (
            item["percentage"],
            item["confidence"],
        ),
        reverse=True,
    )

    return {
        "success": True,
        "threshold": CONFIDENCE_THRESHOLD,
        "images_analyzed": successful_images,
        "colors": final,
    }


def main():
    try:
        if len(sys.argv) < 2:
            raise ValueError(
                "At least one product image is required"
            )

        images = [
            value.strip()
            for value in sys.argv[1:]
            if value.strip()
        ]

        result = detect(images)

        print(
            json.dumps(
                result,
                ensure_ascii=False,
            )
        )

    except Exception as error:
        print(
            json.dumps(
                {
                    "success": False,
                    "error": str(error),
                },
                ensure_ascii=False,
            )
        )
        sys.exit(1)


if __name__ == "__main__":
    main()
