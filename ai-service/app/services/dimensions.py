from typing import Any


def _safe_float(
    value: Any,
    default: float = 0.0,
) -> float:
    """
    Safely convert a value to float.
    """

    try:
        value = float(value)

    except (
        TypeError,
        ValueError,
    ):
        return default

    return value


def _clamp(
    value: float,
    minimum: float,
    maximum: float,
) -> float:
    return max(
        minimum,
        min(maximum, value),
    )


def _get_bbox(
    bbox: dict,
):
    """
    Extract bounding box using explicit keys.

    Expected format:

        {
            "x1": ...,
            "y1": ...,
            "x2": ...,
            "y2": ...
        }
    """

    if not isinstance(
        bbox,
        dict,
    ):
        return None

    try:
        x1 = _safe_float(
            bbox["x1"]
        )

        y1 = _safe_float(
            bbox["y1"]
        )

        x2 = _safe_float(
            bbox["x2"]
        )

        y2 = _safe_float(
            bbox["y2"]
        )

    except KeyError:
        return None

    return (
        x1,
        y1,
        x2,
        y2,
    )


def estimate(
    bbox: dict,
    image_shape,
    meta: dict,
) -> dict:
    """
    Estimate the physical dimensions of a detected object.

    The preferred method uses pixel_resolution_m.

    If pixel resolution is unavailable, an approximate
    resolution is derived from sonar_range_m and image width.

    Returns:
        dimension_estimation_available
        length_m
        width_m
        area_m2
        pixel_resolution_m
        estimation_method
    """

    # ---------------------------------------------------------
    # VALIDATE INPUTS
    # ---------------------------------------------------------

    if not isinstance(
        meta,
        dict,
    ):
        return {
            "dimension_estimation_available": False,
            "length_m": None,
            "width_m": None,
            "area_m2": None,
            "pixel_resolution_m": None,
            "estimation_method": "invalid_metadata",
        }

    if image_shape is None or len(image_shape) < 2:
        return {
            "dimension_estimation_available": False,
            "length_m": None,
            "width_m": None,
            "area_m2": None,
            "pixel_resolution_m": None,
            "estimation_method": "invalid_image_shape",
        }

    # ---------------------------------------------------------
    # IMAGE DIMENSIONS
    # ---------------------------------------------------------

    try:
        image_height = int(
            image_shape[0]
        )

        image_width = int(
            image_shape[1]
        )

    except (
        TypeError,
        ValueError,
    ):
        return {
            "dimension_estimation_available": False,
            "length_m": None,
            "width_m": None,
            "area_m2": None,
            "pixel_resolution_m": None,
            "estimation_method": "invalid_image_shape",
        }

    if image_width <= 0 or image_height <= 0:
        return {
            "dimension_estimation_available": False,
            "length_m": None,
            "width_m": None,
            "area_m2": None,
            "pixel_resolution_m": None,
            "estimation_method": "invalid_image_dimensions",
        }

    # ---------------------------------------------------------
    # BOUNDING BOX
    # ---------------------------------------------------------

    coordinates = _get_bbox(
        bbox
    )

    if coordinates is None:
        return {
            "dimension_estimation_available": False,
            "length_m": None,
            "width_m": None,
            "area_m2": None,
            "pixel_resolution_m": None,
            "estimation_method": "invalid_bbox",
        }

    x1, y1, x2, y2 = coordinates

    pixel_width = abs(
        x2 - x1
    )

    pixel_height = abs(
        y2 - y1
    )

    if (
        pixel_width <= 0
        or pixel_height <= 0
    ):
        return {
            "dimension_estimation_available": False,
            "length_m": None,
            "width_m": None,
            "area_m2": None,
            "pixel_resolution_m": None,
            "estimation_method": "invalid_bbox_dimensions",
        }

    # ---------------------------------------------------------
    # RESOLUTION
    # ---------------------------------------------------------

    resolution = meta.get(
        "pixel_resolution_m"
    )

    estimation_method = (
        "pixel_resolution"
    )

    if resolution is not None:
        resolution = _safe_float(
            resolution,
            default=0.0,
        )

        if resolution <= 0:
            resolution = None

    # ---------------------------------------------------------
    # FALLBACK RESOLUTION
    # ---------------------------------------------------------

    if resolution is None:

        sonar_range = meta.get(
            "sonar_range_m"
        )

        if sonar_range is not None:

            sonar_range = _safe_float(
                sonar_range,
                default=0.0,
            )

            if sonar_range > 0:

                resolution = (
                    sonar_range
                    / max(
                        image_width,
                        1,
                    )
                )

                estimation_method = (
                    "sonar_range_approximation"
                )

    # ---------------------------------------------------------
    # NO RESOLUTION
    # ---------------------------------------------------------

    if resolution is None or resolution <= 0:

        return {
            "dimension_estimation_available": False,
            "length_m": None,
            "width_m": None,
            "area_m2": None,
            "pixel_resolution_m": None,
            "estimation_method": "unavailable",
        }

    # ---------------------------------------------------------
    # ESTIMATE DIMENSIONS
    # ---------------------------------------------------------

    physical_width = (
        pixel_width
        * resolution
    )

    physical_height = (
        pixel_height
        * resolution
    )

    length = max(
        physical_width,
        physical_height,
    )

    width = min(
        physical_width,
        physical_height,
    )

    area = (
        length
        * width
    )

    # ---------------------------------------------------------
    # SAFETY LIMITS
    # ---------------------------------------------------------

    length = max(
        0.0,
        length,
    )

    width = max(
        0.0,
        width,
    )

    area = max(
        0.0,
        area,
    )

    # ---------------------------------------------------------
    # RETURN
    # ---------------------------------------------------------

    return {
        "dimension_estimation_available": True,

        "length_m": round(
            length,
            3,
        ),

        "width_m": round(
            width,
            3,
        ),

        "area_m2": round(
            area,
            3,
        ),

        "pixel_resolution_m": round(
            resolution,
            6,
        ),

        "estimation_method": (
            estimation_method
        ),

        "bbox_pixels": {
            "width": round(
                pixel_width,
                2,
            ),
            "height": round(
                pixel_height,
                2,
            ),
        },
    }