import math
from typing import Any


EARTH_R = 6_371_000.0


class GeolocationError(ValueError):
    """Raised when geolocation metadata is invalid."""


def _clamp(
    value: float,
    minimum: float,
    maximum: float,
) -> float:
    return max(
        minimum,
        min(maximum, value),
    )


def _normalize_longitude(longitude: float) -> float:
    """
    Normalize longitude to [-180, 180].
    """

    return (
        (longitude + 180.0) % 360.0
    ) - 180.0


def _destination_point(
    latitude: float,
    longitude: float,
    bearing_degrees: float,
    distance_m: float,
) -> tuple[float, float]:
    """
    Calculate a destination coordinate from:
    start coordinate + bearing + distance.

    Uses a spherical Earth approximation.
    """

    lat1 = math.radians(latitude)
    lon1 = math.radians(longitude)
    bearing = math.radians(
        bearing_degrees % 360.0
    )

    angular_distance = (
        distance_m / EARTH_R
    )

    sin_lat1 = math.sin(lat1)
    cos_lat1 = math.cos(lat1)

    sin_lat2 = (
        sin_lat1 * math.cos(angular_distance)
        + cos_lat1
        * math.sin(angular_distance)
        * math.cos(bearing)
    )

    sin_lat2 = _clamp(
        sin_lat2,
        -1.0,
        1.0,
    )

    lat2 = math.asin(sin_lat2)

    y = (
        math.sin(bearing)
        * math.sin(angular_distance)
        * cos_lat1
    )

    x = (
        math.cos(angular_distance)
        - sin_lat1
        * math.sin(lat2)
    )

    lon2 = lon1 + math.atan2(y, x)

    return (
        math.degrees(lat2),
        _normalize_longitude(
            math.degrees(lon2)
        ),
    )


def _validate_metadata(meta: dict[str, Any]) -> bool:
    """
    Validate the minimum metadata required for
    geolocation.
    """

    if not isinstance(meta, dict):
        return False

    required = [
        "latitude",
        "longitude",
        "heading",
        "sonar_range_m",
    ]

    for key in required:
        if meta.get(key) is None:
            return False

    try:
        latitude = float(
            meta["latitude"]
        )

        longitude = float(
            meta["longitude"]
        )

        heading = float(
            meta["heading"]
        )

        sonar_range = float(
            meta["sonar_range_m"]
        )

    except (
        TypeError,
        ValueError,
    ):
        return False

    if not -90.0 <= latitude <= 90.0:
        return False

    if not -180.0 <= longitude <= 180.0:
        return False

    if not math.isfinite(heading):
        return False

    if not math.isfinite(sonar_range):
        return False

    if sonar_range <= 0:
        return False

    return True


def locate(
    meta: dict[str, Any],
    center: dict[str, float],
    image_shape,
) -> dict[str, Any]:
    """
    Estimate the geographic position of a detected
    marine object.

    Parameters
    ----------
    meta:
        Survey metadata containing:

        latitude
        longitude
        heading
        sonar_range_m

        Optional:
        side
        depth_m
        horizontal_fov_deg

    center:
        Detection center:

        {
            "x": pixel_x,
            "y": pixel_y
        }

    image_shape:
        OpenCV image shape, normally:

        (height, width, channels)

    Returns
    -------
    dict
        Geolocation result.
    """

    # ---------------------------------------------------------
    # VALIDATE METADATA
    # ---------------------------------------------------------

    if not _validate_metadata(meta):
        return {
            "geolocation_available": False,
            "reason": "invalid_or_missing_metadata",
        }

    # ---------------------------------------------------------
    # VALIDATE IMAGE
    # ---------------------------------------------------------

    if image_shape is None or len(image_shape) < 2:
        return {
            "geolocation_available": False,
            "reason": "invalid_image_shape",
        }

    try:
        height = float(
            image_shape[0]
        )

        width = float(
            image_shape[1]
        )

        pixel_x = float(
            center["x"]
        )

        pixel_y = float(
            center["y"]
        )

    except (
        KeyError,
        TypeError,
        ValueError,
    ):
        return {
            "geolocation_available": False,
            "reason": "invalid_detection_center",
        }

    if width <= 0 or height <= 0:
        return {
            "geolocation_available": False,
            "reason": "invalid_image_dimensions",
        }

    # ---------------------------------------------------------
    # SENSOR POSITION
    # ---------------------------------------------------------

    latitude = float(
        meta["latitude"]
    )

    longitude = float(
        meta["longitude"]
    )

    heading = float(
        meta["heading"]
    ) % 360.0

    sonar_range = float(
        meta["sonar_range_m"]
    )

    # ---------------------------------------------------------
    # NORMALIZE DETECTION POSITION
    # ---------------------------------------------------------

    pixel_x = _clamp(
        pixel_x,
        0.0,
        width,
    )

    pixel_y = _clamp(
        pixel_y,
        0.0,
        height,
    )

    normalized_x = (
        pixel_x / width
    )

    normalized_y = (
        pixel_y / height
    )

    # Horizontal position:
    #
    # -1 = extreme left
    #  0 = image center
    # +1 = extreme right

    cross_track = (
        normalized_x * 2.0
    ) - 1.0

    # ---------------------------------------------------------
    # SENSOR FIELD OF VIEW
    # ---------------------------------------------------------

    horizontal_fov = float(
        meta.get(
            "horizontal_fov_deg",
            90.0,
        )
    )

    horizontal_fov = _clamp(
        horizontal_fov,
        1.0,
        179.0,
    )

    # Detection bearing relative to vessel heading.
    #
    # Example:
    # center pixel -> heading
    # left pixel   -> heading - FOV/2
    # right pixel  -> heading + FOV/2

    relative_bearing = (
        cross_track
        * (horizontal_fov / 2.0)
    )

    bearing = (
        heading
        + relative_bearing
    ) % 360.0

    # ---------------------------------------------------------
    # RANGE ESTIMATION
    # ---------------------------------------------------------

    #
    # The simplest sensor model assumes the maximum
    # observable range corresponds to sonar_range_m.
    #
    # The center of the image represents the nominal
    # forward range rather than zero distance.
    #

    range_factor = max(
        0.0,
        1.0 - abs(cross_track) * 0.35,
    )

    range_m = (
        sonar_range
        * range_factor
    )

    range_m = _clamp(
        range_m,
        0.0,
        sonar_range,
    )

    # ---------------------------------------------------------
    # SIDE / SENSOR OFFSET
    # ---------------------------------------------------------

    side = str(
        meta.get(
            "side",
            "starboard",
        )
    ).lower()

    if side not in (
        "starboard",
        "port",
        "center",
    ):
        side = "starboard"

    # Optional physical sensor offset.
    #
    # Positive = starboard
    # Negative = port

    sensor_offset_m = float(
        meta.get(
            "sensor_offset_m",
            0.0,
        )
    )

    if side == "port":
        sensor_offset_m = -abs(
            sensor_offset_m
        )

    elif side == "starboard":
        sensor_offset_m = abs(
            sensor_offset_m
        )

    # ---------------------------------------------------------
    # OFFSET FROM VESSEL POSITION
    # ---------------------------------------------------------

    if sensor_offset_m != 0:

        offset_bearing = (
            heading + 90.0
        ) % 360.0

        sensor_lat, sensor_lon = (
            _destination_point(
                latitude,
                longitude,
                offset_bearing,
                sensor_offset_m,
            )
        )

    else:
        sensor_lat = latitude
        sensor_lon = longitude

    # ---------------------------------------------------------
    # DESTINATION COORDINATE
    # ---------------------------------------------------------

    detected_latitude, detected_longitude = (
        _destination_point(
            sensor_lat,
            sensor_lon,
            bearing,
            range_m,
        )
    )

    # ---------------------------------------------------------
    # POSITION ACCURACY
    # ---------------------------------------------------------

    #
    # Approximate error based on:
    # - sensor range
    # - pixel position
    # - GPS accuracy supplied by metadata
    #

    base_accuracy = max(
        2.0,
        sonar_range * 0.05,
    )

    gps_accuracy = float(
        meta.get(
            "gps_accuracy_m",
            0.0,
        )
    )

    gps_accuracy = max(
        0.0,
        gps_accuracy,
    )

    position_accuracy = math.sqrt(
        base_accuracy ** 2
        + gps_accuracy ** 2
    )

    # ---------------------------------------------------------
    # RETURN
    # ---------------------------------------------------------

    return {
        "geolocation_available": True,

        "latitude": round(
            detected_latitude,
            7,
        ),

        "longitude": round(
            detected_longitude,
            7,
        ),

        "depth_m": meta.get(
            "depth_m"
        ),

        "range_m": round(
            range_m,
            2,
        ),

        "bearing_deg": round(
            bearing,
            2,
        ),

        "relative_bearing_deg": round(
            relative_bearing,
            2,
        ),

        "position_accuracy_estimate_m": round(
            position_accuracy,
            2,
        ),

        "sensor": {
            "side": side,
            "heading_deg": round(
                heading,
                2,
            ),
            "horizontal_fov_deg": round(
                horizontal_fov,
                2,
            ),
        },

        "pixel": {
            "x": round(
                pixel_x,
                2,
            ),
            "y": round(
                pixel_y,
                2,
            ),
            "normalized_x": round(
                normalized_x,
                4,
            ),
            "normalized_y": round(
                normalized_y,
                4,
            ),
        },
    }