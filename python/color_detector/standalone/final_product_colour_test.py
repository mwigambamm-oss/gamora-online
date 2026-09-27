from PIL import Image
from pathlib import Path
from collections import Counter
import numpy as np
import cv2

root = Path("/tmp/gamora-colour-test")
mask_dir = root / "masks"

COLOURS = [
    "Black", "White", "Gray", "Silver",
    "Beige", "Brown", "Red", "Maroon",
    "Pink", "Orange", "Yellow",
    "Green", "Dark Green",
    "Blue", "Navy Blue", "Purple"
]

def get_colour(rgb):
    r, g, b = map(float, rgb)

    mx = max(r, g, b)
    mn = min(r, g, b)
    diff = mx - mn

    # Neutral colours
    if mx < 55:
        return "Black"

    if diff < 18:
        if mx >= 225:
            return "White"
        if mx >= 180:
            return "Silver"
        if mx >= 105:
            return "Gray"
        return "Black"

    # HSV for chromatic colours
    pixel = np.uint8([[[r, g, b]]])
    hsv = cv2.cvtColor(pixel, cv2.COLOR_RGB2HSV)[0, 0]

    h, s, v = map(float, hsv)

    if s < 35:
        if v >= 220:
            return "White"
        if v >= 170:
            return "Silver"
        if v >= 100:
            return "Gray"
        return "Black"

    # Hue ranges
    if h < 8 or h >= 170:
        if v < 100:
            return "Maroon"
        if v > 185 and s < 150:
            return "Pink"
        return "Red"

    if h < 22:
        if v < 145:
            return "Brown"
        return "Orange"

    if h < 38:
        if s < 120 and v > 170:
            return "Beige"
        return "Yellow"

    if h < 88:
        if v < 105:
            return "Dark Green"
        return "Green"

    if h < 135:
        if v < 100:
            return "Navy Blue"
        return "Blue"

    if h < 165:
        if v > 170:
            return "Pink"
        return "Purple"

    return "Red"


for f in sorted(root.glob("*/*.jpeg")):

    mask_file = mask_dir / f"{f.parent.name}-{f.stem}-mask.png"

    image = np.array(Image.open(f).convert("RGB"))
    mask = np.array(Image.open(mask_file).convert("L"))

    # HARD BACKGROUND REMOVAL
    product = image[mask >= 60]

    if len(product) == 0:
        print(f"{f.parent.name}/{f.name} | NO PRODUCT")
        continue

    # deterministic sample
    if len(product) > 40000:
        idx = np.linspace(
            0,
            len(product) - 1,
            40000
        ).astype(int)
        product = product[idx]

    # classify each PRODUCT pixel
    labels = [get_colour(pixel) for pixel in product]

    counts = Counter(labels)

    total = len(labels)

    # ONE colour only
    colour, count = counts.most_common(1)[0]

    confidence = count / total

    print(
        f"{f.parent.name}/{f.name} | "
        f"COLOUR={colour} | "
        f"CONFIDENCE={confidence:.1%}"
    )
