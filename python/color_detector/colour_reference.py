import cv2
import numpy as np


# Canonical Gamora colour references.
#
# Values are RGB examples chosen as stable representatives,
# then converted to LAB/HSV for perceptual comparison.
COLOUR_REFERENCES = {
    "Black": [25, 25, 25],
    "White": [245, 245, 245],
    "Grey": [128, 128, 128],

    "Red": [210, 35, 35],
    "Blue": [35, 90, 190],
    "Green": [45, 130, 65],
    "Yellow": [235, 205, 35],
    "Orange": [230, 115, 30],
    "Pink": [225, 105, 150],
    "Purple": [125, 55, 165],
    "Brown": [120, 75, 45],

    "Navy Blue": [25, 50, 110],
    "Light Blue": [115, 180, 225],
    "Dark Blue": [25, 60, 125],

    "Light Green": [125, 185, 120],
    "Dark Green": [30, 80, 45],

    "Beige": [215, 195, 155],
    "Cream": [235, 225, 195],

    "Gold": [195, 150, 45],
    "Silver": [175, 180, 185],

    "Maroon": [115, 25, 35],
    "Burgundy": [125, 35, 55],

    "Turquoise": [45, 175, 175],
    "Teal": [30, 115, 110],

    "Khaki": [145, 135, 85],
}


def rgb_to_lab(rgb):
    value = np.array(
        [[rgb]],
        dtype=np.uint8,
    )

    return cv2.cvtColor(
        value,
        cv2.COLOR_RGB2LAB,
    )[0, 0].astype(np.float32)


def rgb_to_hsv(rgb):
    value = np.array(
        [[rgb]],
        dtype=np.uint8,
    )

    return cv2.cvtColor(
        value,
        cv2.COLOR_RGB2HSV,
    )[0, 0].astype(np.float32)


REFERENCE_LAB = {
    name: rgb_to_lab(rgb)
    for name, rgb in COLOUR_REFERENCES.items()
}

REFERENCE_HSV = {
    name: rgb_to_hsv(rgb)
    for name, rgb in COLOUR_REFERENCES.items()
}


def lab_distance(a, b):
    return float(
        np.linalg.norm(
            np.asarray(a, dtype=np.float32)
            - np.asarray(b, dtype=np.float32)
        )
    )


def hsv_distance(a, b):
    a = np.asarray(a, dtype=np.float32)
    b = np.asarray(b, dtype=np.float32)

    hue_diff = abs(float(a[0]) - float(b[0]))
    hue_diff = min(hue_diff, 180.0 - hue_diff)

    saturation_diff = abs(
        float(a[1]) - float(b[1])
    )

    value_diff = abs(
        float(a[2]) - float(b[2])
    )

    return (
        hue_diff * 1.8
        + saturation_diff * 0.35
        + value_diff * 0.20
    )


def classify_reference(rgb):
    lab = rgb_to_lab(rgb)
    hsv = rgb_to_hsv(rgb)

    candidates = []

    for name in COLOUR_REFERENCES:
        lab_dist = lab_distance(
            lab,
            REFERENCE_LAB[name],
        )

        hsv_dist = hsv_distance(
            hsv,
            REFERENCE_HSV[name],
        )

        # LAB carries the main perceptual weight.
        # HSV helps preserve hue-family distinctions.
        combined_distance = (
            lab_dist * 0.72
            + hsv_dist * 0.28
        )

        candidates.append({
            "name": name,
            "distance": combined_distance,
            "lab_distance": lab_dist,
            "hsv_distance": hsv_dist,
        })

    candidates.sort(
        key=lambda item: item["distance"]
    )

    best = candidates[0]
    second = candidates[1] if len(candidates) > 1 else None

    return {
        "name": best["name"],
        "distance": round(
            best["distance"],
            4,
        ),
        "lab_distance": round(
            best["lab_distance"],
            4,
        ),
        "hsv_distance": round(
            best["hsv_distance"],
            4,
        ),
        "second_name": (
            second["name"]
            if second
            else None
        ),
        "second_distance": (
            round(second["distance"], 4)
            if second
            else None
        ),
    }
