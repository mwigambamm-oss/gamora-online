import cv2
import numpy as np


def rgb_to_hsv(rgb):
    value = np.array(
        [[rgb]],
        dtype=np.uint8,
    )

    bgr = value[:, :, ::-1]

    return cv2.cvtColor(
        bgr,
        cv2.COLOR_BGR2HSV,
    )[0, 0]


def classify_cluster(rgb):
    r, g, b = [int(x) for x in rgb]

    h, s, v = rgb_to_hsv(
        [r, g, b]
    )

    h = int(h)
    s = int(s)
    v = int(v)

    # Very dark neutral colours.
    if v <= 48:
        return "Black"

    # Low saturation neutrals.
    if s <= 32:
        if v >= 205:
            return "White"

        if v >= 165:
            return "Cream"

        if v >= 65:
            return "Grey"

        return "Black"

    # Warm low-saturation neutrals.
    if s <= 75 and 12 <= h <= 32:
        if v >= 185:
            return "Beige"

        if v >= 145:
            return "Khaki"

    # Red family.
    if h <= 8 or h >= 172:
        if v < 95:
            return "Maroon"

        if v < 155:
            return "Burgundy"

        return "Red"

    # Orange / yellow / gold.
    if 8 < h <= 22:
        if v < 120:
            return "Brown"

        return "Orange"

    if 22 < h <= 38:
        if v < 115:
            return "Brown"

        if s >= 120 and v >= 135:
            return "Yellow"

        return "Gold"

    # Green family.
    if 38 < h <= 88:
        if v < 90:
            return "Dark Green"

        if v < 135:
            return "Dark Green"

        if s < 70 and v >= 170:
            return "Light Green"

        return "Green"

    # Cyan / turquoise / teal.
    if 88 < h <= 105:
        if v < 125:
            return "Teal"

        return "Turquoise"

    # Blue family.
    if 105 < h <= 135:
        if v < 75:
            return "Navy Blue"

        if v < 135:
            return "Dark Blue"

        if s < 90 and v >= 170:
            return "Light Blue"

        return "Blue"

    # Purple.
    if 125 < h <= 160:
        if v < 110:
            return "Purple"

        return "Purple"

    # Pink.
    if 145 < h <= 171:
        return "Pink"

    return None


def classify_clusters(clusters):
    results = []

    for cluster in clusters:
        rgb = cluster["rgb"]
        share = float(cluster["share"])

        name = classify_cluster(rgb)

        if not name:
            continue

        # Cluster significance.
        #
        # Large clusters receive stronger evidence,
        # while tiny clusters cannot dominate detection.
        share_score = min(
            1.0,
            share / 0.25,
        )

        confidence = (
            share_score * 0.70
            + min(1.0, share / 0.10) * 0.30
        )

        results.append({
            "name": name,
            "rgb": rgb,
            "share": round(share, 4),
            "confidence": round(
                min(0.99, confidence),
                4,
            ),
        })

    return results
