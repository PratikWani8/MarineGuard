from contextlib import asynccontextmanager

from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse

from app.config import get_settings

from app.detection.yolo_detector import (
    YOLODetector,
)

from app.segmentation.unet import (
    SegmentationService,
)

from app.shadow_analysis.analyzer import (
    ShadowAnalyzer,
)

from app.geological_filter.filter import (
    GeologicalFilter,
)

from app.tracking.tracker import (
    CentroidTracker,
)

from app.confidence.engine import (
    ConfidenceEngine,
)

from app.hazard.scorer import (
    HazardScorer,
)

from app.services.pipeline import (
    AnalysisPipeline,
)

from app.api.routes import (
    health,
    analysis,
)


# ============================================================
# SETTINGS
# ============================================================

settings = get_settings()

def build_pipeline() -> AnalysisPipeline:
   
    detector = YOLODetector(
        model_path=settings.yolo_path,
        device=settings.device,
        threshold=settings.confidence_threshold,
        demo_mode=settings.demo_mode,
    )

    segmenter = SegmentationService(
        model_path=settings.segmentation_path,
        threshold=settings.segmentation_threshold,
        fallback_enabled=(
            settings.segmentation_fallback_enabled
        ),
    )

    # --------------------------------------------------------
    # Shadow Analyzer
    # --------------------------------------------------------

    shadow = ShadowAnalyzer()

    # --------------------------------------------------------
    # Geological Filter
    # --------------------------------------------------------

    geological = GeologicalFilter()

    # --------------------------------------------------------
    # Tracking
    # --------------------------------------------------------

    if settings.tracking_enabled:

        tracker = CentroidTracker(
            max_distance=(
                settings.tracker_max_distance
            ),
            max_missing_frames=(
                settings.tracker_max_missing_frames
            ),
            persistence_frames=(
                settings.tracker_persistence_frames
            ),
        )

    else:

        tracker = DisabledTracker()

    # --------------------------------------------------------
    # Confidence Engine
    # --------------------------------------------------------

    confidence = ConfidenceEngine(
        weights=settings.confidence_weights
    )

    # --------------------------------------------------------
    # Hazard Scorer
    # --------------------------------------------------------

    hazard = HazardScorer()

    # --------------------------------------------------------
    # Complete Pipeline
    # --------------------------------------------------------

    return AnalysisPipeline(
        detector=detector,
        segmenter=segmenter,
        shadow=shadow,
        geological=geological,
        tracker=tracker,
        confidence=confidence,
        hazard=hazard,
    )


# ============================================================
# DISABLED TRACKER
# ============================================================

class DisabledTracker:
    """
    No-op tracker used when tracking is disabled.

    Keeps the AnalysisPipeline interface unchanged.
    """

    @staticmethod
    def update(
        detections,
    ):
        """
        Return detections without tracking.
        """

        for detection in detections:

            if not isinstance(
                detection,
                dict,
            ):
                continue

            detection.setdefault(
                "track_id",
                None,
            )

            detection.setdefault(
                "frames_seen",
                1,
            )

            detection.setdefault(
                "persistence_score",
                0.0,
            )

            detection.setdefault(
                "confirmed",
                False,
            )

        return detections


# ============================================================
# APPLICATION LIFESPAN
# ============================================================

@asynccontextmanager
async def lifespan(
    application: FastAPI,
):
    """
    Application startup and shutdown lifecycle.
    """

    # --------------------------------------------------------
    # Startup
    # --------------------------------------------------------

    application.state.settings = (
        settings
    )

    application.state.pipeline = (
        build_pipeline()
    )

    yield

    # --------------------------------------------------------
    # Shutdown
    # --------------------------------------------------------

    application.state.pipeline = None


# ============================================================
# FASTAPI APPLICATION
# ============================================================

app = FastAPI(
    title="MarineGuard AI",
    version="1.0.0",
    description=(
        "Side-scan sonar marine debris "
        "intelligence service"
    ),
    lifespan=lifespan,
)


# ============================================================
# GLOBAL EXCEPTION HANDLER
# ============================================================

@app.exception_handler(Exception)
async def unhandled_exception(
    request: Request,
    exc: Exception,
):
    """
    Prevent internal exceptions from exposing
    implementation details.
    """

    return JSONResponse(
        status_code=500,
        content={
            "success": False,
            "error": {
                "code": "INTERNAL_ERROR",
                "message": (
                    "Internal AI service error"
                ),
            },
        },
    )

app.include_router(
    health.router,
    prefix="/api/v1",
)

app.include_router(
    analysis.router,
    prefix="/api/v1",
)