import math
from typing import Any

EARTH_RADIUS_KM = 6371.0
DEFAULT_SPEED_KMH = 5.0

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

    if not math.isfinite(value):
        return default

    return value


def hav(
    a: dict,
    b: dict,
) -> float:
    """
    Calculate great-circle distance between two GPS points.

    Returns:
        Distance in kilometers.
    """

    lat1 = _safe_float(
        a.get("latitude")
    )

    lon1 = _safe_float(
        a.get("longitude")
    )

    lat2 = _safe_float(
        b.get("latitude")
    )

    lon2 = _safe_float(
        b.get("longitude")
    )

    lat1 = math.radians(
        lat1
    )

    lon1 = math.radians(
        lon1
    )

    lat2 = math.radians(
        lat2
    )

    lon2 = math.radians(
        lon2
    )

    dlat = (
        lat2 - lat1
    )

    dlon = (
        lon2 - lon1
    )

    value = (
        math.sin(dlat / 2.0) ** 2
        + math.cos(lat1)
        * math.cos(lat2)
        * math.sin(dlon / 2.0) ** 2
    )

    # Numerical safety.
    value = max(
        0.0,
        min(1.0, value),
    )

    return (
        EARTH_RADIUS_KM
        * 2.0
        * math.asin(
            math.sqrt(value)
        )
    )


def valid_location(
    location: dict,
) -> bool:
    """
    Validate a GPS location dictionary.

    Expected:

        {
            "latitude": ...,
            "longitude": ...
        }
    """

    if not isinstance(
        location,
        dict,
    ):
        return False

    latitude = location.get(
        "latitude"
    )

    longitude = location.get(
        "longitude"
    )

    if (
        latitude is None
        or longitude is None
    ):
        return False

    try:
        latitude = float(
            latitude
        )

        longitude = float(
            longitude
        )

    except (
        TypeError,
        ValueError,
    ):
        return False

    if not (
        math.isfinite(latitude)
        and math.isfinite(longitude)
    ):
        return False

    return (
        -90.0 <= latitude <= 90.0
        and
        -180.0 <= longitude <= 180.0
    )


# ============================================================
# TARGET UTILITIES
# ============================================================

def _hazard_score(
    target: dict,
) -> float:
    """
    Extract and normalize hazard score.
    """

    score = _safe_float(
        target.get(
            "hazard_score",
            0.0,
        )
    )

    return max(
        0.0,
        min(100.0, score),
    )


def _target_priority(
    hazard_score: float,
) -> float:
    """
    Convert hazard score to a normalized priority.

    0   -> 0.0
    100 -> 1.0
    """

    return hazard_score / 100.0


def _target_identifier(
    target: dict,
) -> dict:
    """
    Return useful target identifiers.
    """

    return {
        "track_id": target.get(
            "track_id"
        ),

        "detection_id": (
            target.get(
                "detectionId"
            )
            or target.get(
                "detection_id"
            )
        ),
    }


# ============================================================
# ROUTE PLANNER
# ============================================================

def plan(
    start: dict,
    targets: list[dict] | None,
    return_to_start: bool = False,
    speed_kmh: float = DEFAULT_SPEED_KMH,
) -> dict:
    """
    Generate a hazard-aware AUV cleanup/inspection route.

    The planner uses a nearest-neighbor strategy with
    hazard-based prioritization.

    Higher hazard targets are favored, while distance
    prevents unnecessary long jumps.

    Args:
        start:
            AUV starting location.

        targets:
            Detection objects containing:

                {
                    "location": {
                        "latitude": ...,
                        "longitude": ...
                    },
                    "hazard_score": ...
                }

        return_to_start:
            Whether the AUV should return to its starting point.

        speed_kmh:
            Estimated AUV travel speed.

    Returns:
        Route planning result dictionary.
    """

    # ========================================================
    # VALIDATE START
    # ========================================================

    if not valid_location(
        start
    ):
        raise ValueError(
            "Invalid AUV starting location."
        )

    # ========================================================
    # VALIDATE SPEED
    # ========================================================

    speed_kmh = _safe_float(
        speed_kmh,
        DEFAULT_SPEED_KMH,
    )

    if speed_kmh <= 0:
        speed_kmh = DEFAULT_SPEED_KMH

    # ========================================================
    # PREPARE TARGETS
    # ========================================================

    remaining = []
    skipped = []

    for target in (
        targets or []
    ):

        if not isinstance(
            target,
            dict,
        ):
            skipped.append({
                "track_id": None,
                "detection_id": None,
                "reason": "Target is not an object",
            })

            continue

        location = target.get(
            "location",
            {}
        )

        if not valid_location(
            location
        ):

            identifiers = (
                _target_identifier(
                    target
                )
            )

            skipped.append({
                **identifiers,
                "reason": (
                    "Missing or invalid coordinates"
                ),
            })

            continue

        # Make a shallow copy so that
        # route planning doesn't mutate
        # the caller's data.
        candidate = dict(
            target
        )

        candidate[
            "_hazard_score"
        ] = _hazard_score(
            target
        )

        remaining.append(
            candidate
        )

    # ========================================================
    # ROUTE CONSTRUCTION
    # ========================================================

    current = {
        "latitude": float(
            start["latitude"]
        ),
        "longitude": float(
            start["longitude"]
        ),
    }

    ordered = []

    total_distance = 0.0

    while remaining:

        def route_cost(
            target,
        ):
            distance = hav(
                current,
                target["location"],
            )

            hazard = target[
                "_hazard_score"
            ]

            priority = (
                _target_priority(
                    hazard
                )
            )

            # ------------------------------------------------
            # Cost model
            #
            # Higher hazard reduces effective route cost.
            # Distance remains the dominant physical factor.
            # ------------------------------------------------

            return (
                distance
                / (
                    1.0
                    + priority
                )
            )

        next_target = min(
            remaining,
            key=route_cost,
        )

        distance = hav(
            current,
            next_target[
                "location"
            ],
        )

        total_distance += (
            distance
        )

        # Remove internal scoring field.
        next_target.pop(
            "_hazard_score",
            None,
        )

        ordered.append(
            next_target
        )

        current = {
            "latitude": float(
                next_target[
                    "location"
                ]["latitude"]
            ),

            "longitude": float(
                next_target[
                    "location"
                ]["longitude"]
            ),
        }

        remaining.remove(
            next_target
        )

    # ========================================================
    # RETURN TO START
    # ========================================================

    return_distance = 0.0

    if (
        return_to_start
        and ordered
    ):

        return_distance = hav(
            current,
            start,
        )

        total_distance += (
            return_distance
        )

    # ========================================================
    # ESTIMATED TRAVEL TIME
    # ========================================================

    estimated_duration_minutes = (
        total_distance
        / speed_kmh
        * 60.0
    )

    # ========================================================
    # PRIORITY SCORE
    # ========================================================

    priority_score = sum(
        _hazard_score(
            target
        )
        for target in ordered
    )

    average_hazard = (
        priority_score
        / len(ordered)
        if ordered
        else 0.0
    )

    maximum_hazard = max(
        (
            _hazard_score(
                target
            )
            for target in ordered
        ),
        default=0.0,
    )

    # ========================================================
    # ROUTE RISK
    # ========================================================

    if maximum_hazard >= 80:
        route_risk = "CRITICAL"

    elif maximum_hazard >= 60:
        route_risk = "HIGH"

    elif maximum_hazard >= 40:
        route_risk = "MEDIUM"

    else:
        route_risk = "LOW"

    # ========================================================
    # CLEAN RESULT
    # ========================================================

    return {
        "ordered_targets": ordered,

        "target_count": len(
            ordered
        ),

        "skipped_target_count": len(
            skipped
        ),

        "skipped_targets": skipped,

        "total_distance_km": round(
            total_distance,
            3,
        ),

        "return_distance_km": round(
            return_distance,
            3,
        ),

        "estimated_duration_minutes": round(
            estimated_duration_minutes,
            1,
        ),

        "speed_kmh": round(
            speed_kmh,
            2,
        ),

        "priority_score": round(
            priority_score,
            2,
        ),

        "average_hazard_score": round(
            average_hazard,
            2,
        ),

        "maximum_hazard_score": round(
            maximum_hazard,
            2,
        ),

        "route_risk": route_risk,

        "return_to_start": bool(
            return_to_start
        ),
    }