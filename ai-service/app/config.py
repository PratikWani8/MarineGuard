from functools import lru_cache
from pathlib import Path

from pydantic import Field, field_validator
from pydantic_settings import (
    BaseSettings,
    SettingsConfigDict,
)


# ============================================================
# BASE DIRECTORY
# ============================================================

BASE_DIR = Path(
    __file__
).resolve().parent.parent


# ============================================================
# SETTINGS
# ============================================================

class Settings(BaseSettings):
    """
    Central configuration for MarineGuard AI.

    Values can be supplied through environment variables
    or a .env file.

    Example:

        AI_SERVICE_PORT=8000
        DEVICE=auto
        DEMO_MODE=true
    """

    model_config = SettingsConfigDict(
        env_file=".env",
        env_file_encoding="utf-8",
        extra="ignore",
        case_sensitive=False,
    )

    # ========================================================
    # API SERVER
    # ========================================================

    ai_service_host: str = Field(
        default="0.0.0.0",
        description="FastAPI bind host",
    )

    ai_service_port: int = Field(
        default=8000,
        ge=1,
        le=65535,
        description="FastAPI service port",
    )

    # ========================================================
    # MODEL PATHS
    # ========================================================

    yolo_model_path: str = Field(
        default="weights/detection/best_detector.pt",
        description="YOLO model path relative to project root",
    )

    segmentation_model_path: str = Field(
        default="weights/segmentation/best_detector.pt",
        description="Segmentation model path relative to project root",
    )

    # ========================================================
    # INFERENCE
    # ========================================================

    device: str = Field(
        default="auto",
        description="Inference device: auto, cpu, cuda, cuda:0, etc.",
    )

    confidence_threshold: float = Field(
        default=0.35,
        ge=0.0,
        le=1.0,
        description="YOLO detection confidence threshold",
    )

    # ========================================================
    # CONFIDENCE ENGINE
    # ========================================================

    model_weight: float = Field(
        default=0.50,
        ge=0.0,
        le=1.0,
    )

    shadow_weight: float = Field(
        default=0.20,
        ge=0.0,
        le=1.0,
    )

    artificial_weight: float = Field(
        default=0.15,
        ge=0.0,
        le=1.0,
    )

    persistence_weight: float = Field(
        default=0.10,
        ge=0.0,
        le=1.0,
    )

    segmentation_weight: float = Field(
        default=0.05,
        ge=0.0,
        le=1.0,
    )

    # ========================================================
    # TRACKING
    # ========================================================

    tracking_enabled: bool = True

    tracker_max_distance: float = Field(
        default=100.0,
        gt=0.0,
        description="Maximum centroid matching distance in pixels",
    )

    tracker_max_missing_frames: int = Field(
        default=5,
        ge=0,
        description="Frames before an inactive track is removed",
    )

    tracker_persistence_frames: int = Field(
        default=5,
        ge=1,
        description="Frames required for full persistence score",
    )

    # ========================================================
    # IMAGE PROCESSING
    # ========================================================

    max_image_size_mb: int = Field(
        default=50,
        ge=1,
        le=500,
        description="Maximum uploaded image size",
    )

    pixel_resolution_default_m: float = Field(
        default=0.05,
        gt=0.0,
        description="Fallback meters-per-pixel resolution",
    )

    # ========================================================
    # SEGMENTATION
    # ========================================================

    segmentation_threshold: float = Field(
        default=0.50,
        ge=0.0,
        le=1.0,
    )

    segmentation_fallback_enabled: bool = False

    # ========================================================
    # DEMO / VERIFICATION
    # ========================================================

    demo_mode: bool = True

    camera_verification_threshold: float = Field(
        default=0.85,
        ge=0.0,
        le=1.0,
        description="Confidence threshold for camera verification",
    )

    # ========================================================
    # ROUTE PLANNING
    # ========================================================

    auv_speed_kmh: float = Field(
        default=5.0,
        gt=0.0,
        description="Estimated AUV travel speed",
    )

    route_return_to_start: bool = False

    # ========================================================
    # GEOLOCATION
    # ========================================================

    default_horizontal_fov_deg: float = Field(
        default=90.0,
        gt=0.0,
        lt=180.0,
    )

    default_gps_accuracy_m: float = Field(
        default=5.0,
        ge=0.0,
    )

    # ========================================================
    # VALIDATORS
    # ========================================================

    @field_validator(
        "ai_service_host"
    )
    @classmethod
    def validate_host(
        cls,
        value: str,
    ) -> str:

        value = value.strip()

        if not value:
            raise ValueError(
                "ai_service_host cannot be empty"
            )

        return value

    @field_validator(
        "device"
    )
    @classmethod
    def validate_device(
        cls,
        value: str,
    ) -> str:

        value = value.strip().lower()

        allowed = {
            "auto",
            "cpu",
            "cuda",
        }

        if (
            value not in allowed
            and not value.startswith(
                "cuda:"
            )
        ):
            raise ValueError(
                "device must be auto, cpu, cuda, "
                "or cuda:<index>"
            )

        return value

    @field_validator(
        "yolo_model_path",
        "segmentation_model_path",
    )
    @classmethod
    def validate_model_path(
        cls,
        value: str,
    ) -> str:

        value = value.strip()

        if not value:
            raise ValueError(
                "Model path cannot be empty"
            )

        return value

    # ========================================================
    # WEIGHTS
    # ========================================================

    @property
    def confidence_weights(
        self,
    ) -> dict[str, float]:
        """
        Return confidence-engine weights.

        They are normalized so custom environment
        values do not accidentally produce a total
        greater or less than 1.
        """

        weights = {
            "model": self.model_weight,
            "shadow": self.shadow_weight,
            "artificial": self.artificial_weight,
            "persistence": self.persistence_weight,
            "segmentation": self.segmentation_weight,
        }

        total = sum(
            weights.values()
        )

        if total <= 0:
            raise ValueError(
                "Confidence weights must have "
                "a positive total"
            )

        return {
            key: value / total
            for key, value in weights.items()
        }

    # ========================================================
    # MODEL PATH PROPERTIES
    # ========================================================

    @property
    def yolo_path(self) -> Path:
        """
        Absolute path to YOLO model.
        """

        path = Path(
            self.yolo_model_path
        )

        if path.is_absolute():
            return path

        return (
            BASE_DIR / path
        )

    @property
    def segmentation_path(
        self,
    ) -> Path:
        """
        Absolute path to segmentation model.
        """

        path = Path(
            self.segmentation_model_path
        )

        if path.is_absolute():
            return path

        return (
            BASE_DIR / path
        )

    # ========================================================
    # MODEL STATUS
    # ========================================================

    @property
    def model_paths(self) -> dict[str, str]:
        """
        Return model paths as strings.
        """

        return {
            "yolo": str(
                self.yolo_path
            ),
            "segmentation": str(
                self.segmentation_path
            ),
        }


# ============================================================
# SETTINGS SINGLETON
# ============================================================

@lru_cache(maxsize=1)
def get_settings() -> Settings:
    """
    Return cached application settings.
    """

    return Settings()