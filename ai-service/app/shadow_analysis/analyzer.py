import cv2
import numpy as np


class ShadowAnalyzer:
    """
    Acoustic / visual shadow analyzer for MarineGuard AI.

    The analyzer examines regions surrounding a detected object
    and estimates whether a darker region is consistent with
    an object shadow.

    IMPORTANT:
    This is a heuristic shadow detector. It is not a physical
    sonar shadow reconstruction model.
    """

    DIRECTIONS = (
        "left",
        "right",
        "up",
        "down",
    )

    def __init__(
        self,
        contrast_threshold: float = 0.08,
        darkness_ratio: float = 0.72,
        max_region_multiplier: float = 2.0,
        minimum_region_pixels: int = 10,
    ):
        self.contrast_threshold = float(
            contrast_threshold
        )

        self.darkness_ratio = float(
            darkness_ratio
        )

        self.max_region_multiplier = float(
            max_region_multiplier
        )

        self.minimum_region_pixels = int(
            minimum_region_pixels
        )

    # =========================================================
    # HELPERS
    # =========================================================

    @staticmethod
    def _clamp(
        value: float,
        minimum: float = 0.0,
        maximum: float = 1.0,
    ) -> float:
        return max(
            minimum,
            min(maximum, value),
        )

    @staticmethod
    def _extract_bbox(
        bbox: dict,
    ):
        """
        Safely extract bounding-box coordinates.
        """

        if not isinstance(
            bbox,
            dict,
        ):
            return None

        try:
            x1 = float(
                bbox["x1"]
            )

            y1 = float(
                bbox["y1"]
            )

            x2 = float(
                bbox["x2"]
            )

            y2 = float(
                bbox["y2"]
            )

        except (
            KeyError,
            TypeError,
            ValueError,
        ):
            return None

        return (
            x1,
            y1,
            x2,
            y2,
        )

    @staticmethod
    def _mean_intensity(
        region: np.ndarray,
    ) -> float:
        """
        Calculate mean grayscale intensity.
        """

        if region.size == 0:
            return 0.0

        if region.ndim == 3:
            gray = cv2.cvtColor(
                region,
                cv2.COLOR_BGR2GRAY,
            )
        else:
            gray = region

        return float(
            np.mean(gray)
        )

    @staticmethod
    def _prepare_gray(
        image: np.ndarray,
    ) -> np.ndarray:
        """
        Convert image to grayscale and apply light smoothing.
        """

        if image.ndim == 3:
            gray = cv2.cvtColor(
                image,
                cv2.COLOR_BGR2GRAY,
            )
        else:
            gray = image.copy()

        return cv2.GaussianBlur(
            gray,
            (3, 3),
            0,
        )

    # =========================================================
    # REGION EXTRACTION
    # =========================================================

    def _get_region(
        self,
        image: np.ndarray,
        bbox: tuple[int, int, int, int],
        direction: str,
    ):
        """
        Extract a region immediately adjacent to the object.
        """

        x1, y1, x2, y2 = bbox

        height, width = (
            image.shape[:2]
        )

        object_width = (
            x2 - x1 + 1
        )

        object_height = (
            y2 - y1 + 1
        )

        region_width = max(
            int(
                object_width
                * self.max_region_multiplier
            ),
            self.minimum_region_pixels,
        )

        region_height = max(
            int(
                object_height
                * self.max_region_multiplier
            ),
            self.minimum_region_pixels,
        )

        if direction == "right":

            sx1 = x2 + 1
            sx2 = min(
                width,
                sx1 + region_width,
            )

            sy1 = y1
            sy2 = min(
                height,
                y2 + 1,
            )

        elif direction == "left":

            sx2 = x1
            sx1 = max(
                0,
                sx2 - region_width,
            )

            sy1 = y1
            sy2 = min(
                height,
                y2 + 1,
            )

        elif direction == "down":

            sy1 = y2 + 1
            sy2 = min(
                height,
                sy1 + region_height,
            )

            sx1 = x1
            sx2 = min(
                width,
                x2 + 1,
            )

        elif direction == "up":

            sy2 = y1
            sy1 = max(
                0,
                sy2 - region_height,
            )

            sx1 = x1
            sx2 = min(
                width,
                x2 + 1,
            )

        else:
            return np.empty(
                (0, 0),
                dtype=image.dtype,
            )

        if (
            sx1 >= sx2
            or sy1 >= sy2
        ):
            return np.empty(
                (0, 0),
                dtype=image.dtype,
            )

        return image[
            sy1:sy2,
            sx1:sx2,
        ]

    # =========================================================
    # SHADOW EVALUATION
    # =========================================================

    def _evaluate_region(
        self,
        object_mean: float,
        region: np.ndarray,
    ) -> dict:
        """
        Evaluate whether an adjacent region contains
        sufficiently dark shadow-like evidence.
        """

        if region.size == 0:
            return {
                "score": 0.0,
                "contrast": 0.0,
                "detected": False,
                "length_pixels": 0.0,
            }

        region_mean = (
            self._mean_intensity(
                region
            )
        )

        # Normalized brightness difference.
        contrast = max(
            0.0,
            (
                object_mean
                - region_mean
            ) / 255.0,
        )

        # Relative darkness compared with object.
        relative_darkness = (
            region_mean
            / max(
                object_mean,
                1.0,
            )
        )

        detected = (
            relative_darkness
            <= self.darkness_ratio
            and contrast
            >= self.contrast_threshold
        )

        # Combine absolute contrast and
        # relative darkness.
        contrast_score = self._clamp(
            contrast * 2.5
        )

        darkness_score = self._clamp(
            1.0
            - relative_darkness
        )

        score = (
            0.65 * contrast_score
            + 0.35 * darkness_score
        )

        score = self._clamp(
            score
        )

        if detected:

            height, width = (
                region.shape[:2]
            )

            length_pixels = float(
                max(
                    height,
                    width,
                )
            )

        else:
            length_pixels = 0.0

        return {
            "score": score,
            "contrast": contrast,
            "detected": bool(
                detected
            ),
            "length_pixels": (
                length_pixels
            ),
        }

    # =========================================================
    # MAIN ANALYSIS
    # =========================================================

    def analyze(
        self,
        image: np.ndarray,
        bbox: dict,
    ) -> dict:
        """
        Analyze shadow evidence around a detection.

        Returns:

            shadow_score
            shadow_length_pixels
            shadow_direction
            shadow_detected
        """

        # -----------------------------------------------------
        # Validate image
        # -----------------------------------------------------

        if image is None:
            return self._empty_result(
                "invalid_image"
            )

        if not isinstance(
            image,
            np.ndarray,
        ):
            return self._empty_result(
                "invalid_image"
            )

        if image.size == 0:
            return self._empty_result(
                "empty_image"
            )

        if image.ndim not in (
            2,
            3,
        ):
            return self._empty_result(
                "invalid_image_format"
            )

        # -----------------------------------------------------
        # Extract bounding box
        # -----------------------------------------------------

        coordinates = (
            self._extract_bbox(
                bbox
            )
        )

        if coordinates is None:
            return self._empty_result(
                "invalid_bbox"
            )

        x1, y1, x2, y2 = coordinates

        height, width = (
            image.shape[:2]
        )

        # Normalize bbox.
        x1 = max(
            0,
            min(
                width - 1,
                int(round(x1)),
            ),
        )

        y1 = max(
            0,
            min(
                height - 1,
                int(round(y1)),
            ),
        )

        x2 = max(
            x1 + 1,
            min(
                width - 1,
                int(round(x2)),
            ),
        )

        y2 = max(
            y1 + 1,
            min(
                height - 1,
                int(round(y2)),
            ),
        )

        if (
            x2 <= x1
            or y2 <= y1
        ):
            return self._empty_result(
                "invalid_bbox_dimensions"
            )

        # -----------------------------------------------------
        # Convert image to grayscale
        # -----------------------------------------------------

        gray = self._prepare_gray(
            image
        )

        object_region = gray[
            y1:y2 + 1,
            x1:x2 + 1,
        ]

        if object_region.size == 0:
            return self._empty_result(
                "empty_object_region"
            )

        object_mean = (
            self._mean_intensity(
                object_region
            )
        )

        # -----------------------------------------------------
        # Evaluate all directions
        # -----------------------------------------------------

        candidates = []

        for direction in self.DIRECTIONS:

            region = self._get_region(
                gray,
                (
                    x1,
                    y1,
                    x2,
                    y2,
                ),
                direction,
            )

            result = (
                self._evaluate_region(
                    object_mean,
                    region,
                )
            )

            candidates.append({
                "direction": direction,
                **result,
            })

        # -----------------------------------------------------
        # Select strongest candidate
        # -----------------------------------------------------

        best = max(
            candidates,
            key=lambda item: item[
                "score"
            ],
            default=None,
        )

        if best is None:
            return self._empty_result(
                "no_shadow_region"
            )

        # -----------------------------------------------------
        # Final decision
        # -----------------------------------------------------

        shadow_detected = bool(
            best["detected"]
        )

        if shadow_detected:
            shadow_direction = (
                best["direction"]
            )

            shadow_length = float(
                best["length_pixels"]
            )

        else:
            shadow_direction = "none"
            shadow_length = 0.0

        # -----------------------------------------------------
        # Return
        # -----------------------------------------------------

        return {
            "shadow_score": round(
                float(
                    best["score"]
                ),
                4,
            ),

            "shadow_length_pixels": round(
                shadow_length,
                2,
            ),

            "shadow_direction": (
                shadow_direction
            ),

            "shadow_detected": (
                shadow_detected
            ),

            "direction_scores": {
                candidate["direction"]: round(
                    float(
                        candidate["score"]
                    ),
                    4,
                )
                for candidate in candidates
            },

            "object_mean_intensity": round(
                object_mean,
                2,
            ),
        }

    # =========================================================
    # FALLBACK
    # =========================================================

    @staticmethod
    def _empty_result(
        reason: str,
    ) -> dict:
        """
        Standard safe result when shadow analysis
        cannot be performed.
        """

        return {
            "shadow_score": 0.0,
            "shadow_length_pixels": 0.0,
            "shadow_direction": "unknown",
            "shadow_detected": False,
            "reason": reason,
        }