import cv2
import numpy as np


MAX_SAMPLES = 12000
CLUSTERS = 8
MIN_CLUSTER_SHARE = 0.025


def cluster_product_colours(
    rgb: np.ndarray,
    mask: np.ndarray,
):
    """
    Extract dominant visual colour clusters from product pixels.

    Input:
        rgb  - RGB uint8 image
        mask - product foreground mask, uint8

    Output:
        List of clusters sorted by visual significance.
    """

    pixels = rgb[mask > 0]

    if len(pixels) == 0:
        return []

    # Keep clustering fast and deterministic.
    if len(pixels) > MAX_SAMPLES:
        indexes = np.linspace(
            0,
            len(pixels) - 1,
            MAX_SAMPLES,
            dtype=np.int32,
        )
        pixels = pixels[indexes]

    # OpenCV kmeans expects float32.
    samples = pixels.astype(np.float32)

    criteria = (
        cv2.TERM_CRITERIA_EPS
        + cv2.TERM_CRITERIA_MAX_ITER,
        40,
        0.5,
    )

    compactness, labels, centers = cv2.kmeans(
        samples,
        CLUSTERS,
        None,
        criteria,
        3,
        cv2.KMEANS_PP_CENTERS,
    )

    labels = labels.reshape(-1)

    total = len(labels)

    clusters = []

    for index, center in enumerate(centers):
        count = int(np.sum(labels == index))

        if count == 0:
            continue

        share = count / total

        if share < MIN_CLUSTER_SHARE:
            continue

        rgb_center = np.clip(
            np.round(center),
            0,
            255,
        ).astype(np.uint8)

        clusters.append({
            "rgb": [
                int(rgb_center[0]),
                int(rgb_center[1]),
                int(rgb_center[2]),
            ],
            "share": float(share),
            "pixels": count,
        })

    clusters.sort(
        key=lambda item: item["share"],
        reverse=True,
    )

    return clusters
