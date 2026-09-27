from PIL import Image
from pathlib import Path
import numpy as np
import cv2

root = Path("/tmp/gamora-colour-test")
mask_dir = root / "masks"

def detect_colour(pixels):
    # Convert product pixels to HSV
    hsv = cv2.cvtColor(
        pixels.reshape(-1, 1, 3),
        cv2.COLOR_RGB2HSV
    ).reshape(-1, 3)

    h = hsv[:, 0].astype(float)
    s = hsv[:, 1].astype(float)
    v = hsv[:, 2].astype(float)

    # Ignore weak/near-transparent-looking colour information
    valid = np.ones(len(pixels), dtype=bool)

    # BLACK
    black = (v < 65)

    # WHITE
    white = (s < 28) & (v > 205)

    # GRAY / SILVER
    neutral = (s < 35) & (v >= 65)
    dark_gray = neutral & (v < 145)
    gray = neutral & (v >= 145) & (v < 205)
    silver = neutral & (v >= 205)

    # Coloured pixels
    red = ((h < 8) | (h >= 170)) & (s >= 35)
    orange = (h >= 8) & (h < 20) & (s >= 35)
    yellow = (h >= 20) & (h < 38) & (s >= 30)
    green = (h >= 38) & (h < 88) & (s >= 30)
    turquoise = (h >= 88) & (h < 105) & (s >= 30)
    blue = (h >= 105) & (h < 135) & (s >= 30)
    purple = (h >= 135) & (h < 165) & (s >= 30)
    pink = ((h >= 165) | (h < 8)) & (s >= 30) & (v > 150)

    scores = {
        "Black": black.sum(),
        "White": white.sum(),
        "Dark Gray": dark_gray.sum(),
        "Gray": gray.sum(),
        "Silver": silver.sum(),
        "Red": red.sum(),
        "Orange": orange.sum(),
        "Yellow": yellow.sum(),
        "Green": green.sum(),
        "Turquoise": turquoise.sum(),
        "Blue": blue.sum(),
        "Purple": purple.sum(),
        "Pink": pink.sum(),
    }

    # Only ONE colour is returned
    colour = max(scores, key=scores.get)
    share = scores[colour] / len(pixels)

    return colour, share


for f in sorted(root.glob("*/*.jpeg")):

    mask_file = mask_dir / f"{f.parent.name}-{f.stem}-mask.png"

    image = np.array(Image.open(f).convert("RGB"))
    mask = np.array(Image.open(mask_file).convert("L"))

    # BACKGROUND = 0
    # ONLY foreground/product pixels remain
    product_pixels = image[mask >= 60]

    if len(product_pixels) == 0:
        print(f"{f.parent.name}/{f.name} | NO PRODUCT")
        continue

    # Sample only product pixels
    if len(product_pixels) > 30000:
        idx = np.linspace(
            0,
            len(product_pixels) - 1,
            30000
        ).astype(int)

        product_pixels = product_pixels[idx]

    colour, share = detect_colour(product_pixels)

    print(
        f"{f.parent.name}/{f.name} | "
        f"COLOUR={colour} | "
        f"PRODUCT_COLOUR_SHARE={share:.1%}"
    )

