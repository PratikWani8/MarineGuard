from typing import Any, Optional

from pydantic import (
    BaseModel,
    ConfigDict,
    Field,
    field_validator,
)


# ============================================================
# SONAR METADATA
# ============================================================

class SonarMetadata(BaseModel):
    """
    Metadata associated with a MarineGuard sonar/image frame.
    """

    model_config = ConfigDict(
        extra="ignore"
    )

    survey_id: str = Field(
        ...,
        min_length=1,
        description="Unique survey identifier",
    )

    frame_id: int | str = Field(
        ...,
        description="Frame identifier",
    )

    latitude: Optional[float] = Field(
        default=None,
        ge=-90.0,
        le=90.0,
    )

    longitude: Optional[float] = Field(
        default=None,
        ge=-180.0,
        le=180.0,
    )

    heading: Optional[float] = Field(
        default=None,
        ge=0.0,
        lt=360.0,
        description="Vessel heading in degrees",
    )

    sonar_range_m: Optional[float] = Field(
        default=None,
        gt=0.0,
        description="Maximum sonar range in meters",
    )

    pixel_resolution_m: Optional[float] = Field(
        default=None,
        gt=0.0,
        description="Meters represented by one image pixel",
    )

    ping_spacing_m: Optional[float] = Field(
        default=None,
        gt=0.0,
        description="Distance between sonar pings",
    )

    depth_m: Optional[float] = Field(
        default=None,
        ge=0.0,
        description="Water depth in meters",
    )

    side: Optional[str] = Field(
        default=None,
        description="Sensor side: port, starboard, or center",
    )

    timestamp: Optional[str] = Field(
        default=None,
        description="Frame timestamp",
    )

    horizontal_fov_deg: Optional[float] = Field(
        default=None,
        gt=0.0,
        lt=180.0,
        description="Horizontal sensor field of view",
    )

    sensor_offset_m: Optional[float] = Field(
        default=None,
        description="Sensor offset from vessel reference point",
    )

    gps_accuracy_m: Optional[float] = Field(
        default=None,
        ge=0.0,
        description="Estimated GPS accuracy",
    )

    @field_validator("survey_id")
    @classmethod
    def validate_survey_id(cls, value: str) -> str:
        value = value.strip()

        if not value:
            raise ValueError(
                "survey_id cannot be empty"
            )

        return value

    @field_validator("side")
    @classmethod
    def validate_side(
        cls,
        value: Optional[str],
    ) -> Optional[str]:

        if value is None:
            return None

        value = value.strip().lower()

        allowed = {
            "port",
            "starboard",
            "center",
        }

        if value not in allowed:
            raise ValueError(
                "side must be one of: "
                "port, starboard, center"
            )

        return value


# ============================================================
# DETECTION
# ============================================================

class Detection(BaseModel):
    """
    Standardized MarineGuard detection.
    """

    detection_id: str

    class_name: str = Field(
        alias="class"
    )

    confidence: float = Field(
        ge=0.0,
        le=1.0,
    )

    bbox: dict[str, float]

    center: dict[str, float]

    demo_mode: bool = False

    class_id: Optional[int] = None

    model_config = ConfigDict(
        populate_by_name=True,
        extra="allow",
    )


# ============================================================
# ANALYSIS RESPONSE
# ============================================================

class AnalyzeResponse(BaseModel):
    """
    Response returned by the image analysis endpoint.
    """

    success: bool

    survey_id: str

    frame_id: int | str

    processing_time_ms: float = Field(
        ge=0.0
    )

    quality: dict[str, Any]

    detections: list[
        dict[str, Any]
    ] = Field(
        default_factory=list
    )

    summary: dict[str, Any] = Field(
        default_factory=dict
    )


# ============================================================
# ROUTE PLANNING
# ============================================================

class RoutePlanRequest(BaseModel):
    """
    Route planning request.
    """

    start: dict[str, float]

    targets: list[
        dict[str, Any]
    ] = Field(
        default_factory=list
    )

    restricted_zones: list[
        dict[str, Any]
    ] = Field(
        default_factory=list
    )

    @field_validator("start")
    @classmethod
    def validate_start(
        cls,
        value: dict[str, float],
    ):
        if not isinstance(
            value,
            dict,
        ):
            raise ValueError(
                "start must be an object"
            )

        if (
            "latitude" not in value
            or "longitude" not in value
        ):
            raise ValueError(
                "start must contain latitude "
                "and longitude"
            )

        latitude = float(
            value["latitude"]
        )

        longitude = float(
            value["longitude"]
        )

        if not -90.0 <= latitude <= 90.0:
            raise ValueError(
                "start latitude must be "
                "between -90 and 90"
            )

        if not -180.0 <= longitude <= 180.0:
            raise ValueError(
                "start longitude must be "
                "between -180 and 180"
            )

        return value


# ============================================================
# VERIFY RESPONSE
# ============================================================

class VerifyResponse(BaseModel):
    """
    Object verification response.
    """

    success: bool

    verification_status: str

    confidence: float = Field(
        ge=0.0,
        le=1.0,
    )

    classification: str