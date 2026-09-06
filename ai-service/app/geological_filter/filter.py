import cv2
import numpy as np


class GeologicalFilter:
    """
    Heuristic geological / artificial-object classifier.

    This module does not replace a trained classification model.
    It combines visual evidence such as:

    - Edge density
    - Object shape
    - Elongation
    - Shadow evidence
    - Texture

    Output probabilities are heuristic estimates and should
    be treated as supporting evidence.
    """

    def __init__(
        self,
        artificial_threshold: float = 0.60,
        natural_threshold: float = 0.60,
    ):
        self.artificial_threshold = float(
            artificial_threshold
        )

        self.natural_threshold = float(
            natural_threshold
        )

    # ---------------------------------------------------------
    # HELPERS
    # ---------------------------------------------------------

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
    def _get_bbox(detection: dict):
        """
        Safely extract x1, y1, x2, y2.

        Explicit keys are used instead of relying on
        dictionary insertion order.
        """

        bbox = detection.get("bbox")

        if not isinstance(bbox, dict):
            return None

        try:
            x1 = float(bbox["x1"])
            y1 = float(bbox["y1"])
            x2 = float(bbox["x2"])
            y2 = float(bbox["y2"])

        except (
            KeyError,
            TypeError,
            ValueError,
        ):
            return None

        return x1, y1, x2, y2

    @staticmethod
    def _calculate_texture_score(
        roi: np.ndarray,
    ) -> float:
        """
        Estimate texture complexity using grayscale
        standard deviation.

        Returns a normalized 0-1 score.
        """

        if roi.size == 0:
            return 0.0

        gray = cv2.cvtColor(
            roi,
            cv2.COLOR_BGR2GRAY,
        )

        std = float(
            np.std(gray)
        )

        return float(
            np.clip(
                std / 64.0,
                0.0,
                1.0,
            )
        )

    @staticmethod
    def _calculate_edge_density(
        roi: np.ndarray,
    ) -> float:
        """
        Calculate the percentage of pixels that
        are detected as edges.
        """

        if roi.size == 0:
            return 0.0

        gray = cv2.cvtColor(
            roi,
            cv2.COLOR_BGR2GRAY,
        )

        # Slight blur reduces noise-driven edges.
        gray = cv2.GaussianBlur(
            gray,
            (3, 3),
            0,
        )

        edges = cv2.Canny(
            gray,
            50,
            150,
        )

        return float(
            np.mean(edges > 0)
        )

    @staticmethod
    def _calculate_shape_features(
        roi: np.ndarray,
    ) -> dict:
        """
        Calculate simple geometric features
        from the detection ROI.
        """

        height, width = roi.shape[:2]

        height = max(
            height,
            1,
        )

        width = max(
            width,
            1,
        )

        aspect_ratio = (
            width / height
        )

        inverse_ratio = (
            height / width
        )

        elongated = (
            aspect_ratio >= 2.0
            or inverse_ratio >= 2.0
        )

        # Higher value means more elongated.
        elongation = min(
            max(
                aspect_ratio,
                inverse_ratio,
            ) / 4.0,
            1.0,
        )

        return {
            "aspect_ratio": round(
                aspect_ratio,
                4,
            ),
            "elongated": elongated,
            "elongation": round(
                elongation,
                4,
            ),
        }

    @staticmethod
    def _extract_shadow_score(
        shadow: dict,
    ) -> float:
        """
        Safely extract shadow score.
        """

        if not isinstance(shadow, dict):
            return 0.0

        try:
            score = float(
                shadow.get(
                    "shadow_score",
                    0.0,
                )
            )

        except (
            TypeError,
            ValueError,
        ):
            return 0.0

        return float(
            np.clip(
                score,
                0.0,
                1.0,
            )
        )

    # ---------------------------------------------------------
    # MAIN ANALYSIS
    # ---------------------------------------------------------

    def analyze(
        self,
        image: np.ndarray,
        detection: dict,
        shadow: dict,
    ) -> dict:
        """
        Analyze whether a detected object is more likely
        artificial or natural.

        Returns:
            {
                natural_probability,
                artificial_probability,
                classification_decision,
                evidence
            }
        """

        # -----------------------------------------------------
        # IMAGE VALIDATION
        # -----------------------------------------------------

        if image is None:
            return self._uncertain_result(
                "invalid_image"
            )

        if not isinstance(
            image,
            np.ndarray,
        ):
            return self._uncertain_result(
                "invalid_image"
            )

        if image.size == 0:
            return self._uncertain_result(
                "empty_image"
            )

        if image.ndim != 3:
            return self._uncertain_result(
                "invalid_image_format"
            )

        # -----------------------------------------------------
        # BBOX
        # -----------------------------------------------------

        bbox = self._get_bbox(
            detection
        )

        if bbox is None:
            return self._uncertain_result(
                "invalid_bbox"
            )

        x1, y1, x2, y2 = bbox

        image_height, image_width = (
            image.shape[:2]
        )

        # Normalize coordinates.
        x1 = int(
            self._clamp(
                x1,
                0,
                image_width - 1,
            )
        )

        y1 = int(
            self._clamp(
                y1,
                0,
                image_height - 1,
            )
        )

        x2 = int(
            self._clamp(
                x2,
                x1 + 1,
                image_width,
            )
        )

        y2 = int(
            self._clamp(
                y2,
                y1 + 1,
                image_height,
            )
        )

        # -----------------------------------------------------
        # ROI
        # -----------------------------------------------------

        roi = image[
            y1:y2,
            x1:x2,
        ]

        if roi.size == 0:
            return self._uncertain_result(
                "empty_detection_roi"
            )

        # -----------------------------------------------------
        # VISUAL FEATURES
        # -----------------------------------------------------

        edge_density = (
            self._calculate_edge_density(
                roi
            )
        )

        texture_score = (
            self._calculate_texture_score(
                roi
            )
        )

        shape = (
            self._calculate_shape_features(
                roi
            )
        )

        shadow_score = (
            self._extract_shadow_score(
                shadow
            )
        )

        # -----------------------------------------------------
        # ARTIFICIAL OBJECT SCORE
        # -----------------------------------------------------

        #
        # Evidence weighting:
        #
        # Shape        -> 20%
        # Edges        -> 20%
        # Shadow       -> 25%
        # Texture      -> 15%
        # Base prior   -> 20%
        #

        base_prior = 0.20

        shadow_evidence = (
            0.25
            * shadow_score
        )

        edge_evidence = (
            0.20
            * self._clamp(
                edge_density * 5.0
            )
        )

        texture_evidence = (
            0.15
            * texture_score
        )

        shape_evidence = (
            0.20
            * shape["elongation"]
        )

        artificial = (
            base_prior
            + shadow_evidence
            + edge_evidence
            + texture_evidence
            + shape_evidence
        )

        artificial = self._clamp(
            artificial
        )

        natural = self._clamp(
            1.0 - artificial
        )

        # -----------------------------------------------------
        # CLASSIFICATION
        # -----------------------------------------------------

        if (
            artificial
            >= self.artificial_threshold
        ):
            decision = "artificial"

        elif (
            natural
            >= self.natural_threshold
        ):
            decision = "natural"

        else:
            decision = "uncertain"

        # -----------------------------------------------------
        # RESULT
        # -----------------------------------------------------

        return {
            "natural_probability": round(
                natural,
                4,
            ),

            "artificial_probability": round(
                artificial,
                4,
            ),

            "classification_decision": decision,

            "evidence": {
                "shadow_score": round(
                    shadow_score,
                    4,
                ),

                "edge_density": round(
                    edge_density,
                    4,
                ),

                "texture_score": round(
                    texture_score,
                    4,
                ),

                "aspect_ratio": shape[
                    "aspect_ratio"
                ],

                "elongated": shape[
                    "elongated"
                ],

                "elongation": shape[
                    "elongation"
                ],
            },

            "bbox": {
                "x1": x1,
                "y1": y1,
                "x2": x2,
                "y2": y2,
            },
        }

    # ---------------------------------------------------------
    # UNCERTAIN RESULT
    # ---------------------------------------------------------

    @staticmethod
    def _uncertain_result(
        reason: str,
    ) -> dict:
        """
        Standard safe fallback result.
        """

        return {
            "natural_probability": 0.5,
            "artificial_probability": 0.5,
            "classification_decision": "uncertain",
            "evidence": {
                "reason": reason,
            },
        }