import time
from typing import Any

from app.preprocessing.sonar import preprocess
from app.services.dimensions import estimate


class AnalysisPipeline:
    """
    Main MarineGuard AI analysis pipeline.

    Processing flow:

        Input Image
             ↓
        Preprocessing
             ↓
        YOLO Detection
             ↓
        Shadow Analysis
             ↓
        Geological Analysis
             ↓
        Segmentation
             ↓
        Dimension Estimation
             ↓
        Multi-frame Tracking
             ↓
        Geolocation
             ↓
        Confidence Fusion
             ↓
        Hazard Scoring
             ↓
        Final Detection Results
    """

    def __init__(
        self,
        detector,
        segmenter,
        shadow,
        geological,
        tracker,
        confidence,
        hazard,
    ):
        self.detector = detector
        self.segmenter = segmenter
        self.shadow = shadow
        self.geological = geological
        self.tracker = tracker
        self.confidence = confidence
        self.hazard = hazard

    # =========================================================
    # MAIN ANALYSIS
    # =========================================================

    def analyze(
        self,
        image,
        meta,
    ):
        """
        Run complete MarineGuard analysis.

        Returns:

            quality
            detections
            summary
            processing_time_ms
        """

        start = time.perf_counter()

        # =====================================================
        # 1. PREPROCESSING
        # =====================================================

        try:
            processed, quality = preprocess(
                image
            )

        except Exception as exc:
            elapsed = (
                time.perf_counter()
                - start
            ) * 1000

            raise ValueError(
                f"Image preprocessing failed: {exc}"
            ) from exc

        # =====================================================
        # 2. OBJECT DETECTION
        # =====================================================

        try:
            detections = (
                self.detector.predict(
                    processed
                )
            )

        except Exception as exc:
            detections = []

            detection_error = str(
                exc
            )

        else:
            detection_error = None

        if detections is None:
            detections = []

        if not isinstance(
            detections,
            list,
        ):
            detections = []

        # =====================================================
        # 3. PER-DETECTION INTELLIGENCE
        # =====================================================

        processed_detections = []

        for detection in detections:

            if not isinstance(
                detection,
                dict,
            ):
                continue

            # -------------------------------------------------
            # Validate bounding box
            # -------------------------------------------------

            bbox = detection.get(
                "bbox"
            )

            center = detection.get(
                "center"
            )

            if not isinstance(
                bbox,
                dict,
            ):
                continue

            if not isinstance(
                center,
                dict,
            ):
                continue

            # -------------------------------------------------
            # Acoustic Shadow Analysis
            # -------------------------------------------------

            try:
                shadow_result = (
                    self.shadow.analyze(
                        processed,
                        bbox,
                    )
                )

            except Exception as exc:
                shadow_result = {
                    "shadow_available": False,
                    "shadow_score": 0.0,
                    "error": str(exc),
                }

            if not isinstance(
                shadow_result,
                dict,
            ):
                shadow_result = {}

            # -------------------------------------------------
            # Geological / Artificial Analysis
            # -------------------------------------------------

            try:
                geological_result = (
                    self.geological.analyze(
                        processed,
                        detection,
                        shadow_result,
                    )
                )

            except Exception as exc:
                geological_result = {
                    "natural_probability": 0.5,
                    "artificial_probability": 0.0,
                    "classification_decision": "uncertain",
                    "error": str(exc),
                }

            if not isinstance(
                geological_result,
                dict,
            ):
                geological_result = {}

            # -------------------------------------------------
            # Segmentation
            # -------------------------------------------------

            try:
                segmentation_result = (
                    self.segmenter.segment(
                        processed,
                        detection,
                    )
                )

            except Exception as exc:
                segmentation_result = {
                    "segmentation_available": False,
                    "mask": None,
                    "mask_area": 0,
                    "polygon": None,
                    "segmentation_confidence": 0.0,
                    "error": str(exc),
                }

            if not isinstance(
                segmentation_result,
                dict,
            ):
                segmentation_result = {}

            # -------------------------------------------------
            # Physical Dimensions
            # -------------------------------------------------

            try:
                dimensions = estimate(
                    bbox,
                    processed.shape,
                    meta,
                )

            except Exception as exc:
                dimensions = {
                    "dimension_estimation_available": False,
                    "length_m": None,
                    "width_m": None,
                    "area_m2": None,
                    "error": str(exc),
                }

            # -------------------------------------------------
            # Store Intermediate Results
            # -------------------------------------------------

            detection[
                "shadow_analysis"
            ] = shadow_result

            detection[
                "natural_probability"
            ] = self._safe_unit_value(
                geological_result.get(
                    "natural_probability",
                    0.5,
                ),
                default=0.5,
            )

            detection[
                "artificial_probability"
            ] = self._safe_unit_value(
                geological_result.get(
                    "artificial_probability",
                    0.0,
                ),
                default=0.0,
            )

            detection[
                "classification_decision"
            ] = geological_result.get(
                "classification_decision",
                "uncertain",
            )

            detection[
                "segmentation"
            ] = segmentation_result

            detection[
                "dimensions"
            ] = dimensions

            processed_detections.append(
                detection
            )

        detections = processed_detections

        # =====================================================
        # 4. MULTI-FRAME TRACKING
        # =====================================================

        if detections:

            try:
                tracked = (
                    self.tracker.update(
                        detections
                    )
                )

                if tracked is not None:
                    if isinstance(
                        tracked,
                        list,
                    ):
                        detections = tracked

            except Exception as exc:

                # Tracking failure should not
                # destroy valid frame detections.
                for detection in detections:
                    detection[
                        "tracking_error"
                    ] = str(exc)

        # =====================================================
        # 5. GEOLOCATION + CONFIDENCE + HAZARD
        # =====================================================

        for detection in detections:

            if not isinstance(
                detection,
                dict,
            ):
                continue

            # -------------------------------------------------
            # Detector Confidence
            # -------------------------------------------------

            detector_confidence = (
                self._safe_unit_value(
                    detection.get(
                        "confidence",
                        0.0,
                    )
                )
            )

            # -------------------------------------------------
            # Segmentation Confidence
            # -------------------------------------------------

            segmentation = detection.get(
                "segmentation",
                {},
            )

            if not isinstance(
                segmentation,
                dict,
            ):
                segmentation = {}

            segmentation_score = (
                self._safe_unit_value(
                    segmentation.get(
                        "segmentation_confidence",
                        0.0,
                    )
                )
            )

            # -------------------------------------------------
            # Shadow Score
            # -------------------------------------------------

            shadow_analysis = (
                detection.get(
                    "shadow_analysis",
                    {},
                )
            )

            if not isinstance(
                shadow_analysis,
                dict,
            ):
                shadow_analysis = {}

            shadow_score = (
                self._safe_unit_value(
                    shadow_analysis.get(
                        "shadow_score",
                        0.0,
                    )
                )
            )

            # -------------------------------------------------
            # Artificial Probability
            # -------------------------------------------------

            artificial_probability = (
                self._safe_unit_value(
                    detection.get(
                        "artificial_probability",
                        0.0,
                    )
                )
            )

            # -------------------------------------------------
            # Persistence
            # -------------------------------------------------

            persistence_score = (
                self._safe_unit_value(
                    detection.get(
                        "persistence_score",
                        0.0,
                    )
                )
            )

            # -------------------------------------------------
            # Confidence Engine
            # -------------------------------------------------

            try:
                confidence_result = (
                    self.confidence.calculate(
                        detector_confidence,
                        shadow_score,
                        artificial_probability,
                        persistence_score,
                        segmentation_score,
                    )
                )

            except Exception as exc:
                confidence_result = {
                    "confidence": round(
                        detector_confidence * 100,
                        2,
                    ),
                    "confidence_level": "low",
                    "uncertainty": round(
                        (
                            1.0
                            - detector_confidence
                        )
                        * 100,
                        2,
                    ),
                    "reliability": "low",
                    "confidence_error": str(
                        exc
                    ),
                }

            if not isinstance(
                confidence_result,
                dict,
            ):
                confidence_result = {}

            # -------------------------------------------------
            # Geolocation
            # -------------------------------------------------

            try:
                geo_result = self._geo(
                    meta,
                    detection,
                    processed.shape,
                )

            except Exception as exc:
                geo_result = {
                    "geolocation_available": False,
                    "reason": "geolocation_failed",
                    "error": str(exc),
                }

            if not isinstance(
                geo_result,
                dict,
            ):
                geo_result = {
                    "geolocation_available": False
                }

            # -------------------------------------------------
            # Confidence for Hazard Engine
            # -------------------------------------------------

            final_confidence = (
                self._safe_unit_value(
                    float(
                        confidence_result.get(
                            "confidence",
                            detector_confidence * 100,
                        )
                    ) / 100.0
                )
            )

            # -------------------------------------------------
            # Hazard Scoring
            # -------------------------------------------------

            try:
                hazard_result = (
                    self.hazard.score(
                        detection.get(
                            "class",
                            "other_debris",
                        ),
                        final_confidence,
                        detection.get(
                            "dimensions",
                            {},
                        ),
                        persistence_score,
                        artificial_probability,
                        bool(
                            geo_result.get(
                                "geolocation_available",
                                False,
                            )
                        ),
                    )
                )

            except Exception as exc:
                hazard_result = {
                    "hazard_score": 0.0,
                    "risk_level": "LOW",
                    "recommended_action": (
                        "Continue monitoring"
                    ),
                    "hazard_error": str(
                        exc
                    ),
                }

            if not isinstance(
                hazard_result,
                dict,
            ):
                hazard_result = {}

            # -------------------------------------------------
            # Merge Results
            # -------------------------------------------------

            detection.update(
                confidence_result
            )

            detection.update(
                hazard_result
            )

            detection[
                "location"
            ] = geo_result

            # -------------------------------------------------
            # Camera Verification
            # -------------------------------------------------

            detection[
                "camera_verification_required"
            ] = self._requires_camera_verification(
                detection
            )

        # =====================================================
        # 6. SUMMARY
        # =====================================================

        elapsed = (
            time.perf_counter()
            - start
        ) * 1000

        critical_count = sum(
            1
            for detection in detections
            if detection.get(
                "risk_level"
            ) == "CRITICAL"
        )

        high_count = sum(
            1
            for detection in detections
            if detection.get(
                "risk_level"
            ) == "HIGH"
        )

        medium_count = sum(
            1
            for detection in detections
            if detection.get(
                "risk_level"
            ) == "MEDIUM"
        )

        low_count = sum(
            1
            for detection in detections
            if detection.get(
                "risk_level"
            ) == "LOW"
        )

        geolocated_count = sum(
            1
            for detection in detections
            if detection.get(
                "location",
                {}
            ).get(
                "geolocation_available",
                False,
            )
        )

        segmented_count = sum(
            1
            for detection in detections
            if detection.get(
                "segmentation",
                {}
            ).get(
                "segmentation_available",
                False,
            )
        )

        demo_mode = bool(
            getattr(
                self.detector,
                "demo_mode",
                False,
            )
            and not getattr(
                self.detector,
                "loaded",
                False,
            )
        )

        # Some detections may individually
        # be marked as demo.
        detection_demo_mode = any(
            detection.get(
                "demo_mode",
                False,
            )
            for detection in detections
        )

        demo_mode = (
            demo_mode
            or detection_demo_mode
        )

        summary = {
            "detections": len(
                detections
            ),

            "critical": critical_count,

            "high": high_count,

            "medium": medium_count,

            "low": low_count,

            "geolocated": geolocated_count,

            "segmented": segmented_count,

            "model_loaded": bool(
                getattr(
                    self.detector,
                    "loaded",
                    False,
                )
            ),

            "segmentation_loaded": bool(
                getattr(
                    self.segmenter,
                    "available",
                    False,
                )
            ),

            "demo_mode": demo_mode,

            "processing_time_ms": round(
                elapsed,
                2,
            ),
        }

        if detection_error:
            summary[
                "detection_error"
            ] = detection_error

        return (
            quality,
            detections,
            summary,
            elapsed,
        )

    # =========================================================
    # HELPERS
    # =========================================================

    @staticmethod
    def _safe_unit_value(
        value,
        default: float = 0.0,
    ) -> float:
        """
        Safely normalize a value to [0, 1].
        """

        try:
            value = float(value)

        except (
            TypeError,
            ValueError,
        ):
            return default

        if value != value:
            return default

        return max(
            0.0,
            min(1.0, value),
        )

    @staticmethod
    def _requires_camera_verification(
        detection: dict,
    ) -> bool:
        """
        Determine whether a detection should be
        sent for visual/camera verification.

        Current policy:

        - Very high confidence + significant hazard
          -> verification recommended.
        - Demo detections -> verification required.
        - Low-confidence detections -> verification
          recommended for confirmation.
        """

        if detection.get(
            "demo_mode",
            False,
        ):
            return True

        confidence = (
            AnalysisPipeline._safe_unit_value(
                float(
                    detection.get(
                        "confidence",
                        0.0,
                    )
                )
                / 100.0
            )
        )

        hazard_score = (
            AnalysisPipeline._safe_unit_value(
                float(
                    detection.get(
                        "hazard_score",
                        0.0,
                    )
                )
                / 100.0
            )
        )

        risk_level = detection.get(
            "risk_level",
            "LOW",
        )

        # Critical/high-risk objects should
        # receive visual confirmation.
        if risk_level in (
            "CRITICAL",
            "HIGH",
        ):
            return True

        # High-confidence detections with
        # substantial hazard also need confirmation.
        if (
            confidence >= 0.85
            and hazard_score >= 0.60
        ):
            return True

        return False

    # =========================================================
    # GEOLOCATION
    # =========================================================

    @staticmethod
    def _geo(
        meta,
        detection,
        image_shape,
    ):
        """
        Calculate geographic position for a detection.
        """

        from app.geolocation.transform import locate

        center = detection.get(
            "center"
        )

        if not isinstance(
            center,
            dict,
        ):
            return {
                "geolocation_available": False,
                "reason": "missing_detection_center",
            }

        return locate(
            meta,
            center,
            image_shape,
        )