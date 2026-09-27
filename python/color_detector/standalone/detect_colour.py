import json
import sys
from pathlib import Path

import cv2
import numpy as np
from rembg import new_session, remove


MAX_IMAGE_SIDE = 1200
MAX_SAMPLES = 20000
MIN_PRODUCT_SHARE = 0.02


COLOURS = [
    "Black",
    "White",
    "Gray",
    "Silver",
    "Cream",
    "Beige",
    "Brown",
    "Red",
    "Maroon",
    "Burgundy",
    "Pink",
    "Orange",
    "Yellow",
    "Green",
    "Dark Green",
    "Blue",
    "Navy Blue",
    "Dark Blue",
    "Light Blue",
    "Purple",
    "Turquoise",
]


def resize_image(image):
    h, w = image.shape[:2]
    largest = max(h, w)

    if largest <= MAX_IMAGE_SIDE:
        return image

    scale = MAX_IMAGE_SIDE / largest

    return cv2.resize(
        image,
        (
            max(1, int(w * scale)),
            max(1, int(h * scale)),
        ),
        interpolation=cv2.INTER_AREA,
    )


def load_image(path):
    image = cv2.imread(
        str(path),
        cv2.IMREAD_COLOR,
    )

    if image is None:
        raise ValueError(
            f"Unable to read image: {path}"
        )

    return resize_image(image)


def remove_background(image, session):
    encoded = cv2.imencode(".png", image)[1]

    result = remove(
        encoded.tobytes(),
        session=session,
    )

    rgba = cv2.imdecode(
        np.frombuffer(
            result,
            dtype=np.uint8,
        ),
        cv2.IMREAD_UNCHANGED,
    )

    if rgba is None:
        return None, None

    if (
        len(rgba.shape) == 3
        and rgba.shape[2] == 4
    ):
        rgb = cv2.cvtColor(
            rgba,
            cv2.COLOR_BGRA2RGB,
        )

        alpha = rgba[:, :, 3]

        # Keep reasonably opaque product pixels.
        mask = alpha >= 60

        return rgb, mask

    rgb = cv2.cvtColor(
        rgba,
        cv2.COLOR_BGR2RGB,
    )

    return rgb, np.ones(
        rgb.shape[:2],
        dtype=bool,
    )


def fallback_product_region(image):
    h, w = image.shape[:2]

    # Wider central region than the old detector.
    y1 = int(h * 0.08)
    y2 = int(h * 0.92)
    x1 = int(w * 0.08)
    x2 = int(w * 0.92)

    region = image[
        y1:y2,
        x1:x2,
    ]

    rgb = cv2.cvtColor(
        region,
        cv2.COLOR_BGR2RGB,
    )

    hsv = cv2.cvtColor(
        rgb,
        cv2.COLOR_RGB2HSV,
    )

    saturation = hsv[:, :, 1]
    value = hsv[:, :, 2]

    # Remove obvious white studio/background pixels.
    background = (
        (saturation < 22)
        & (value > 245)
    )

    useful = ~background

    pixels = rgb.reshape(-1, 3)[
        useful.reshape(-1)
    ]

    if len(pixels) < 100:
        pixels = rgb.reshape(-1, 3)

    return np.float32(pixels)


def get_product_pixels(image, session):
    rgb = None
    mask = None

    try:
        rgb, mask = remove_background(
            image,
            session,
        )
    except Exception:
        pass

    if rgb is not None and mask is not None:
        pixels = rgb[mask]

        # Segmentation can occasionally include almost
        # the entire image. Reject suspiciously tiny masks.
        share = len(pixels) / (
            rgb.shape[0] * rgb.shape[1]
        )

        if (
            len(pixels) >= 100
            and share >= MIN_PRODUCT_SHARE
        ):
            return np.float32(pixels), False

    return fallback_product_region(
        image
    ), True


def sample_pixels(pixels):
    if len(pixels) <= MAX_SAMPLES:
        return pixels

    indexes = np.linspace(
        0,
        len(pixels) - 1,
        MAX_SAMPLES,
        dtype=np.int32,
    )

    return pixels[indexes]


def rgb_to_hsv(rgb):
    value = np.uint8(
        np.clip(
            np.round(rgb),
            0,
            255,
        )
    )

    hsv = cv2.cvtColor(
        value.reshape(1, 1, 3),
        cv2.COLOR_RGB2HSV,
    )[0, 0]

    return (
        float(hsv[0]) / 179.0,
        float(hsv[1]) / 255.0,
        float(hsv[2]) / 255.0,
    )


def classify(rgb):
    h, s, v = rgb_to_hsv(rgb)

    # Neutral colours must be handled before hue.
    if v <= 0.12:
        return "Black"

    if s <= 0.08 and v >= 0.91:
        return "White"

    if s <= 0.14 and v <= 0.38:
        return "Dark Gray"

    if s <= 0.14 and v <= 0.72:
        return "Gray"

    if (
        s <= 0.13
        and 0.72 < v < 0.91
    ):
        return "Silver"

    if s <= 0.18 and v >= 0.88:
        return "Cream"

    # Red / pink.
    if h < 0.045 or h >= 0.96:
        if v < 0.42:
            return "Maroon"

        if v < 0.62:
            return "Burgundy"

        if s < 0.38 and v > 0.72:
            return "Pink"

        return "Red"

    # Orange / brown / beige.
    if h < 0.11:
        if v < 0.45:
            return "Brown"

        if s < 0.35 and v > 0.72:
            return "Beige"

        return "Orange"

    # Yellow.
    if h < 0.19:
        if s < 0.35:
            return "Cream"

        return "Yellow"

    # Green.
    if h < 0.46:
        if v < 0.38:
            return "Dark Green"

        return "Green"

    # Cyan / light blue.
    if h < 0.56:
        if v < 0.42:
            return "Dark Blue"

        if s < 0.40:
            return "Light Blue"

        return "Turquoise"

    # Blue.
    if h < 0.72:
        if v < 0.35:
            return "Navy Blue"

        if v < 0.55:
            return "Dark Blue"

        if s < 0.38:
            return "Light Blue"

        return "Blue"

    # Purple.
    if h < 0.87:
        return "Purple"

    # Pink / magenta.
    if h < 0.96:
        return "Pink"

    return "Red"


def colour_score(rgb):
    h, s, v = rgb_to_hsv(rgb)

    name = classify(rgb)

    # Confidence is based on how clearly the pixel cluster
    # belongs to its colour family.
    if name == "Black":
        score = 0.92 + max(
            0.0,
            (0.16 - v) * 0.5,
        )

    elif name == "White":
        score = 0.90 + max(
            0.0,
            (0.10 - s) * 0.3,
        )

    elif name in (
        "Gray",
        "Silver",
    ):
        score = 0.84 + max(
            0.0,
            (0.18 - s) * 0.3,
        )

    else:
        score = 0.76 + min(
            0.20,
            s * 0.20,
        )

    return min(0.99, score)


def analyse_pixels(pixels):
    pixels = sample_pixels(pixels)

    # Convert all pixels to HSV at once.
    rgb_uint8 = np.uint8(
        np.clip(
            np.round(pixels),
            0,
            255,
        )
    )

    hsv = cv2.cvtColor(
        rgb_uint8.reshape(
            -1,
            1,
            3,
        ),
        cv2.COLOR_RGB2HSV,
    ).reshape(-1, 3)

    h = hsv[:, 0].astype(
        np.float32
    ) / 179.0

    s = hsv[:, 1].astype(
        np.float32
    ) / 255.0

    v = hsv[:, 2].astype(
        np.float32
    ) / 255.0

    names = []

    # Classification vectorised by broad colour family.
    for hue, sat, val in zip(
        h,
        s,
        v,
    ):
        names.append(
            classify(
                pixels[len(names)]
            )
        )

    counts = {}

    rgb_sums = {}

    for name, rgb in zip(
        names,
        pixels,
    ):
        counts[name] = (
            counts.get(name, 0)
            + 1
        )

        if name not in rgb_sums:
            rgb_sums[name] = np.zeros(
                3,
                dtype=np.float64,
            )

        rgb_sums[name] += rgb

    total = len(pixels)

    results = []

    for name, count in counts.items():
        coverage = count / total

        if coverage < 0.015:
            continue

        mean_rgb = (
            rgb_sums[name] / count
        )

        confidence = colour_score(
            mean_rgb
        )

        # Coverage contributes, but does not dominate.
        confidence = (
            0.72 * confidence
            + 0.28 * min(
                1.0,
                coverage / 0.45,
            )
        )

        results.append(
            {
                "color": name,
                "confidence": round(
                    float(
                        min(
                            0.99,
                            confidence,
                        )
                    ),
                    3,
                ),
                "coverage": round(
                    float(coverage),
                    4,
                ),
                "rgb": [
                    round(
                        float(x),
                        1,
                    )
                    for x in mean_rgb
                ],
            }
        )

    results.sort(
        key=lambda x: (
            x["coverage"],
            x["confidence"],
        ),
        reverse=True,
    )

    return results


def analyse_image(path, session):
    image = load_image(path)

    pixels, fallback = get_product_pixels(
        image,
        session,
    )

    detections = analyse_pixels(
        pixels
    )

    if not detections:
        return {
            "success": False,
            "image": str(path),
            "detectedColor": "",
            "confidence": 0.0,
            "coverage": 0.0,
            "alternatives": [],
            "fallback": fallback,
        }

    primary = detections[0]

    return {
        "success": True,
        "image": str(path),
        "detectedColor": primary["color"],
        "confidence": primary["confidence"],
        "coverage": primary["coverage"],
        "alternatives": detections[1:5],
        "fallback": fallback,
    }


def main():
    paths = [
        Path(x)
        for x in sys.argv[1:]
        if x.strip()
    ]

    if not paths:
        print(
            json.dumps(
                {
                    "success": False,
                    "images_analyzed": 0,
                    "colors": [],
                    "image_detections": [],
                    "error": "No images supplied",
                }
            )
        )
        return

    try:
        session = new_session(
            "u2netp"
        )

        image_detections = []
        colors = []

        for path in paths:
            try:
                result = analyse_image(
                    path,
                    session,
                )

                image_detections.append(
                    result
                )

                if result[
                    "detectedColor"
                ]:
                    colors.append(
                        result[
                            "detectedColor"
                        ]
                    )

            except Exception as error:
                image_detections.append(
                    {
                        "success": False,
                        "image": str(path),
                        "detectedColor": "",
                        "confidence": 0.0,
                        "coverage": 0.0,
                        "alternatives": [],
                        "error": str(error),
                    }
                )

        unique_colors = []

        for color in colors:
            if color not in unique_colors:
                unique_colors.append(
                    color
                )

        print(
            json.dumps(
                {
                    "success": bool(
                        colors
                    ),
                    "images_analyzed": len(
                        image_detections
                    ),
                    "colors": unique_colors,
                    "image_detections": image_detections,
                },
                ensure_ascii=False,
            )
        )

    except Exception as error:
        print(
            json.dumps(
                {
                    "success": False,
                    "images_analyzed": 0,
                    "colors": [],
                    "image_detections": [],
                    "error": str(error),
                }
            )
        )


if __name__ == "__main__":
    main()
