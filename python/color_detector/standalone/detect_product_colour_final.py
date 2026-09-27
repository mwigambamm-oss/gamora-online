from pathlib import Path
from PIL import Image
from rembg import remove, new_session
import numpy as np
import cv2
import sys
import json

MAX_SIDE = 1200
MAX_SAMPLES = 30000
MIN_ALPHA = 60

session = new_session("u2netp")


def resize_image(img):
    w, h = img.size
    scale = min(1.0, MAX_SIDE / max(w, h))
    if scale < 1:
        img = img.resize(
            (int(w * scale), int(h * scale)),
            Image.Resampling.LANCZOS
        )
    return img


def colour_from_rgb(rgb):
    hsv = cv2.cvtColor(
        np.uint8([[rgb]]),
        cv2.COLOR_RGB2HSV
    )[0, 0]

    h, s, v = map(float, hsv)

    # Neutral colours: do not allow tiny RGB differences
    # to become Blue/Green/etc.
    if s < 35:
        if v < 50:
            return "Black"
        if v < 105:
            return "Dark Gray"
        if v < 175:
            return "Gray"
        if v < 220:
            return "Silver"
        return "White"

    if v < 45:
        return "Black"

    if h < 8 or h >= 170:
        return "Red"
    if h < 22:
        return "Orange" if v >= 135 else "Brown"
    if h < 38:
        return "Yellow"
    if h < 88:
        return "Green"
    if h < 105:
        return "Turquoise"
    if h < 135:
        return "Blue"
    if h < 165:
        return "Purple"

    return "Pink"


def detect(path):
    img = resize_image(
        Image.open(path).convert("RGB")
    )

    # Remove background completely.
    rgba = remove(img, session=session)

    rgb = np.asarray(
        rgba.convert("RGB")
    )

    alpha = np.asarray(
        rgba.getchannel("A")
    )

    foreground = alpha >= MIN_ALPHA

    if foreground.sum() == 0:
        return "Unknown", 0.0

    # Strong interior erosion.
    mask = foreground.astype(np.uint8)

    kernel = np.ones((25, 25), np.uint8)
    interior = cv2.erode(
        mask,
        kernel,
        iterations=1
    )

    if interior.sum() < 500:
        interior = mask

    pixels = rgb[interior > 0]

    if len(pixels) > MAX_SAMPLES:
        idx = np.linspace(
            0,
            len(pixels) - 1,
            MAX_SAMPLES
        ).astype(int)

        pixels = pixels[idx]

    # ---------------------------------------------------------
    # Deterministic colour voting
    # ---------------------------------------------------------

    hsv = cv2.cvtColor(
        pixels.reshape(-1, 1, 3),
        cv2.COLOR_RGB2HSV
    ).reshape(-1, 3)

    h = hsv[:, 0].astype(float)
    s = hsv[:, 1].astype(float)
    v = hsv[:, 2].astype(float)

    votes = {}

    def add(name, condition, weight=1.0):
        count = float(condition.sum())
        votes[name] = votes.get(name, 0.0) + count * weight

    # Neutral colours get priority.
    add(
        "Black",
        v < 55,
        1.20
    )

    add(
        "White",
        (s < 35) & (v >= 210),
        1.15
    )

    add(
        "Silver",
        (s < 35) & (v >= 165) & (v < 210),
        1.10
    )

    add(
        "Gray",
        (s < 35) & (v >= 95) & (v < 165),
        1.10
    )

    add(
        "Dark Gray",
        (s < 35) & (v >= 55) & (v < 95),
        1.10
    )

    # Chromatic colours require meaningful saturation.
    chromatic = s >= 35

    add(
        "Red",
        chromatic & ((h < 8) | (h >= 170))
    )

    add(
        "Orange",
        chromatic & (h >= 8) & (h < 22)
    )

    add(
        "Yellow",
        chromatic & (h >= 22) & (h < 38)
    )

    add(
        "Green",
        chromatic & (h >= 38) & (h < 88)
    )

    add(
        "Turquoise",
        chromatic & (h >= 88) & (h < 105)
    )

    add(
        "Blue",
        chromatic & (h >= 105) & (h < 135)
    )

    add(
        "Purple",
        chromatic & (h >= 135) & (h < 165)
    )

    add(
        "Pink",
        chromatic & ((h >= 165) | (h < 8))
    )

    # Brown is orange with lower brightness.
    brown = (
        chromatic &
        (h >= 8) &
        (h < 22) &
        (v < 135)
    )

    votes["Brown"] = votes.get("Brown", 0.0) + (
        float(brown.sum()) * 1.15
    )

    ranked = sorted(
        votes.items(),
        key=lambda x: x[1],
        reverse=True
    )

    if not ranked:
        return "Unknown", 0.0

    colour, score = ranked[0]

    total = sum(v for _, v in ranked)

    confidence = (
        score / total
        if total
        else 0.0
    )

    # Final neutral correction:
    # if the winning colour is chromatic but its actual
    # saturation advantage is weak, use neutral colour.
    if colour in {
        "Blue",
        "Turquoise",
        "Purple",
        "Green",
        "Red",
        "Orange",
        "Pink",
        "Yellow"
    }:
        chromatic_pixels = pixels[s >= 35]

        if len(chromatic_pixels) < len(pixels) * 0.20:
            neutral_pixels = pixels[s < 35]

            if len(neutral_pixels) > 0:
                neutral_hsv = cv2.cvtColor(
                    neutral_pixels.reshape(-1, 1, 3),
                    cv2.COLOR_RGB2HSV
                ).reshape(-1, 3)

                median_rgb = np.median(
                    neutral_pixels,
                    axis=0
                ).astype(np.uint8)

                neutral_colour = colour_from_rgb(
                    median_rgb
                )

                if neutral_colour in {
                    "Black",
                    "Dark Gray",
                    "Gray",
                    "Silver",
                    "White"
                }:
                    colour = neutral_colour
                    confidence = max(
                        confidence,
                        len(neutral_pixels) / len(pixels)
                    )

    return colour, round(
        min(1.0, confidence),
        4
    )


def main():
    results = []

    for raw in sys.argv[1:]:
        path = Path(raw)

        try:
            colour, confidence = detect(path)

            results.append({
                "image": str(path),
                "detectedColor": colour,
                "confidence": confidence,
                "fallback": False
            })

        except Exception as exc:
            results.append({
                "image": str(path),
                "detectedColor": "Unknown",
                "confidence": 0.0,
                "fallback": True,
                "error": str(exc)
            })

    colours = []

    for item in results:
        c = item["detectedColor"]

        if c != "Unknown" and c not in colours:
            colours.append(c)

    print(json.dumps({
        "success": True,
        "images_analyzed": len(results),
        "colors": colours,
        "image_detections": results
    }, indent=2))


if __name__ == "__main__":
    main()
