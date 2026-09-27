import json
import sys
from pathlib import Path

import numpy as np
from rembg import new_session

from detect_product_colors import (
    load_source,
    segment_product,
    clean_mask,
)
from colour_clustering import cluster_product_colours
from colour_reference import classify_reference


CONFIDENCE_THRESHOLD = 0.70
MIN_MEANINGFUL_SHARE = 0.05
MINOR_COLOUR_SHARE = 0.08
MAX_COLOURS = 5


def cluster_confidence(
    cluster_share: float,
    distance: float,
    second_distance: float | None,
):
    # Cluster size evidence.
    size_score = min(
        1.0,
        cluster_share / 0.25,
    )

    # Perceptual distance evidence.
    # Smaller distance = stronger match.
    distance_score = max(
        0.0,
        min(
            1.0,
            1.0 - (distance / 100.0),
        ),
    )

    # Ambiguity evidence.
    if second_distance is None:
        separation_score = 1.0
    else:
        gap = second_distance - distance
        separation_score = max(
            0.0,
            min(
                1.0,
                gap / 25.0,
            ),
        )

    confidence = (
        size_score * 0.45
        + distance_score * 0.35
        + separation_score * 0.20
    )

    return float(
        max(
            0.0,
            min(
                0.99,
                confidence,
            ),
        )
    )


def deduplicate_results(results):
    combined = {}

    for item in results:
        name = item["name"]

        if name not in combined:
            combined[name] = {
                "name": name,
                "share": item["share"],
                "confidence": item["confidence"],
            }
        else:
            current = combined[name]

            current["share"] += item["share"]

            current["confidence"] = max(
                current["confidence"],
                item["confidence"],
            )

    output = list(combined.values())

    output.sort(
        key=lambda item: (
            item["share"],
            item["confidence"],
        ),
        reverse=True,
    )

    return output


def analyze_image(source, session):
    image_bytes = load_source(source)

    rgb, alpha = segment_product(
        image_bytes,
        session,
    )

    mask = clean_mask(alpha)

    product_pixels = int(
        np.count_nonzero(mask)
    )

    total_pixels = int(
        mask.shape[0] * mask.shape[1]
    )

    if product_pixels == 0:
        return []

    clusters = cluster_product_colours(
        rgb,
        mask,
    )

    if not clusters:
        return []

    results = []

    for cluster in clusters:
        share = float(
            cluster["share"]
        )

        # Tiny clusters are noise unless
        # they are large enough to be meaningful.
        if share < MIN_MEANINGFUL_SHARE:
            continue

        reference = classify_reference(
            cluster["rgb"]
        )

        confidence = cluster_confidence(
            share,
            reference["distance"],
            reference["second_distance"],
        )

        results.append({
            "name": reference["name"],
            "confidence": confidence,
            "share": share,
            "rgb": cluster["rgb"],
            "distance": reference["distance"],
        })

    return results


def detect(images):
    session = new_session("u2netp")

    all_results = []
    successful_images = 0

    for source in images:
        try:
            results = analyze_image(
                source,
                session,
            )

            if not results:
                continue

            successful_images += 1

            for result in results:
                item = dict(result)
                item["image"] = source
                all_results.append(item)

        except Exception:
            continue

    if not all_results:
        return {
            "success": True,
            "threshold": CONFIDENCE_THRESHOLD,
            "images_analyzed": successful_images,
            "colors": [],
        }

    combined = {}

    for item in all_results:
        name = item["name"]

        if name not in combined:
            combined[name] = {
                "name": name,
                "share": item["share"],
                "confidence": item["confidence"],
                "images": [item["image"]],
            }
        else:
            current = combined[name]

            current["share"] += item["share"]

            current["confidence"] = max(
                current["confidence"],
                item["confidence"],
            )

            if item["image"] not in current["images"]:
                current["images"].append(
                    item["image"]
                )

    final = []

    for item in combined.values():
        if item["confidence"] < CONFIDENCE_THRESHOLD:
            continue

        final.append({
            "name": item["name"],
            "confidence": round(
                float(item["confidence"]),
                4,
            ),
            "share": round(
                float(item["share"]),
                4,
            ),
            "images": item["images"],
        })

    final.sort(
        key=lambda item: (
            item["share"],
            item["confidence"],
        ),
        reverse=True,
    )

    # Keep the meaningful product colours.
    final = final[:MAX_COLOURS]

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
