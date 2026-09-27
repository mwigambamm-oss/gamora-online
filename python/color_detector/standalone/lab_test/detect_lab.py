from PIL import Image
from pathlib import Path
import numpy as np
import cv2

root = Path("/tmp/gamora-colour-test")
mask_dir = root / "masks"

def classify_lab(rgb):
    arr = np.array([[rgb]], dtype=np.uint8)
    lab = cv2.cvtColor(arr, cv2.COLOR_RGB2LAB)[0, 0].astype(float)

    L, a, b = lab

    # OpenCV LAB ranges:
    # L: 0-255, a/b: 0-255 with 128 ~= neutral

    chroma = np.sqrt((a - 128)**2 + (b - 128)**2)

    if L < 55:
        return "Black"

    if chroma < 12:
        if L > 220:
            return "White"
        if L > 175:
            return "Silver"
        if L > 105:
            return "Gray"
        return "Dark Gray"

    if L > 225 and chroma < 25:
        return "White"

    # warm colours
    if b > 145 and a > 135:
        if L > 175:
            return "Beige"
        if L > 115:
            return "Brown"
        return "Dark Brown"

    # green
    if a < 118 and b < 145:
        if L < 100:
            return "Dark Green"
        return "Green"

    # blue
    if b < 120 and a < 135:
        if L < 100:
            return "Navy Blue"
        return "Blue"

    # red / pink
    if a > 155:
        if L > 170:
            return "Pink"
        return "Red"

    # orange
    if a > 140 and b > 145:
        return "Orange"

    # yellow
    if b > 160:
        return "Yellow"

    return "Gray"


for f in sorted(root.glob("*/*.jpeg")):
    mask_file = mask_dir / f"{f.parent.name}-{f.stem}-mask.png"

    img = np.array(Image.open(f).convert("RGB"))
    mask = np.array(Image.open(mask_file).convert("L"))

    pixels = img[mask >= 60]

    if len(pixels) == 0:
        print(f"{f.parent.name}/{f.name} | NO FOREGROUND")
        continue

    # deterministic sample
    if len(pixels) > 20000:
        idx = np.linspace(0, len(pixels) - 1, 20000).astype(int)
        pixels = pixels[idx]

    # Reduce noise with median blur on sampled pixels
    pixels = pixels.astype(np.uint8)

    names = [classify_lab(p) for p in pixels]

    from collections import Counter
    counts = Counter(names)
    total = len(names)

    top = counts.most_common(5)

    result = " | ".join(
        f"{name}={count/total:.1%}"
        for name, count in top
    )

    print(f"{f.parent.name}/{f.name} | {result}")
