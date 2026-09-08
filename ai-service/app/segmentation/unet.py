from pathlib import Path
from typing import Any

import cv2
import numpy as np


class SegmentationService:
    """
    Segmentation service for MarineGuard AI.

    Supports two modes:

    1. Model mode
       A project-specific segmentation model can be
       connected later.

    2. Fallback mode
       Generates a conservative bounding-box mask when
       a segmentation model is unavailable.

    IMPORTANT:
    The fallback mask is explicitly marked as an
    approximation and must not be treated as a true
    segmentation prediction.
    """

    def __init__(
        self,
        model_path: Path,
        threshold: float = 0.50,
        fallback_enabled: bool = False,
    ):
        self.model_path = Path(
            model_path
        )

        self.threshold = float(
            np.clip(
                threshold,
                0.0,
                1.0,
            )
        )

        self.fallback_enabled = bool(
            fallback_enabled
        )

        self.model = None
        self.available = False
        self.load_error = None

        self._load_model()

    # ========================================================
    # MODEL LOADING
    # ========================================================

    def _load_model(self):
        """
        Placeholder for loading a project-specific
        segmentation model.

        The service remains unavailable until a compatible
        model implementation is supplied.
        """

        if not self.model_path.exists():
            self.load_error = (
                f"Segmentation model not found: "
                f"{self.model_path}"
            )

            self.available = False
            return

        # ----------------------------------------------------
        # MODEL INTEGRATION POINT
        # ----------------------------------------------------
        #
        # Example future implementation:
        #
        # self.model = load_unet(
        #     self.model_path
        # )
        #
        # self.available = True
        #
        # ----------------------------------------------------

        self.load_error = (
            "Segmentation checkpoint found, "
            "but no compatible model loader "
            "has been configured."
        )

        self.available = False

    # ========================================================
    # STATUS
    # ========================================================

    @property
    def status(self) -> dict:
        """
        Return segmentation service status.
        """

        return {
            "available": self.available,
            "model_path": str(
                self.model_path
            ),
            "threshold": self.threshold,
            "fallback_enabled": (
                self.fallback_enabled
            ),
            "load_error": self.load_error,
        }

    # ========================================================
    # VALIDATION
    # ========================================================

    @staticmethod
    def _validate_image(
        image: np.ndarray,
    ) -> bool:
        if image is None:
            return False

        if not isinstance(
            image,
            np.ndarray,
        ):
            return False

        if image.size == 0:
            return False

        if image.ndim < 2:
            return False

        return True

    @staticmethod
    def _get_bbox(
        detection: dict,
    ):
        """
        Safely extract bounding-box coordinates.
        """

        if not isinstance(
            detection,
            dict,
        ):
            return None

        bbox = detection.get(
            "bbox"
        )

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

        return x1, y1, x2, y2

    # ========================================================
    # BBOX MASK
    # ========================================================

    def _create_bbox_mask(
        self,
        image: np.ndarray,
        detection: dict,
    ):
        """
        Create an approximate binary mask from the
        detection bounding box.

        This is NOT true segmentation.
        """

        bbox = self._get_bbox(
            detection
        )

        if bbox is None:
            return None

        height, width = (
            image.shape[:2]
        )

        x1, y1, x2, y2 = bbox

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
                width,
                int(round(x2)),
            ),
        )

        y2 = max(
            y1 + 1,
            min(
                height,
                int(round(y2)),
            ),
        )

        mask = np.zeros(
            (height, width),
            dtype=np.uint8,
        )

        mask[
            y1:y2,
            x1:x2
        ] = 255

        return mask

    # ========================================================
    # POLYGON
    # ========================================================

    @staticmethod
    def _mask_to_polygon(
        mask: np.ndarray,
    ):
        """
        Convert a binary mask into the largest polygon.
        """

        if mask is None:
            return None

        contours, _ = cv2.findContours(
            mask,
            cv2.RETR_EXTERNAL,
            cv2.CHAIN_APPROX_SIMPLE,
        )

        if not contours:
            return None

        contour = max(
            contours,
            key=cv2.contourArea,
        )

        area = cv2.contourArea(
            contour
        )

        if area <= 0:
            return None

        perimeter = cv2.arcLength(
            contour,
            True,
        )

        epsilon = (
            0.01 * perimeter
        )

        simplified = cv2.approxPolyDP(
            contour,
            epsilon,
            True,
        )

        return [
            [
                int(point[0][0]),
                int(point[0][1]),
            ]
            for point in simplified
        ]

    # ========================================================
    # MASK AREA
    # ========================================================

    @staticmethod
    def _mask_area(
        mask: np.ndarray,
    ) -> int:
        """
        Return number of foreground pixels.
        """

        if mask is None:
            return 0

        return int(
            np.count_nonzero(
                mask
            )
        )

    # ========================================================
    # MODEL SEGMENTATION
    # ========================================================

    def _segment_with_model(
        self,
        image: np.ndarray,
        detection: dict,
    ) -> dict:
        """
        Model-specific segmentation hook.

        Replace this method when the U-Net or other
        segmentation model is integrated.
        """

        if self.model is None:
            return {
                "segmentation_available": False,
                "mask": None,
                "mask_area": 0,
                "polygon": None,
                "segmentation_confidence": 0.0,
            }

        # ----------------------------------------------------
        # Future model implementation goes here.
        # ----------------------------------------------------

        return {
            "segmentation_available": False,
            "mask": None,
            "mask_area": 0,
            "polygon": None,
            "segmentation_confidence": 0.0,
        }

    # ========================================================
    # MAIN SEGMENTATION
    # ========================================================

    def segment(
        self,
        image: np.ndarray,
        detection: dict,
    ) -> dict:
        """
        Segment a detected object.

        Returns:
            segmentation_available
            mask
            mask_area
            polygon
            segmentation_confidence
        """

        if not self._validate_image(
            image
        ):
            return {
                "segmentation_available": False,
                "mask": None,
                "mask_area": 0,
                "polygon": None,
                "segmentation_confidence": 0.0,
            }

        if not isinstance(
            detection,
            dict,
        ):
            return {
                "segmentation_available": False,
                "mask": None,
                "mask_area": 0,
                "polygon": None,
                "segmentation_confidence": 0.0,
            }

        # ----------------------------------------------------
        # REAL MODEL
        # ----------------------------------------------------

        if self.available:
            return self._segment_with_model(
                image,
                detection,
            )

        # ----------------------------------------------------
        # OPTIONAL FALLBACK
        # ----------------------------------------------------

        if self.fallback_enabled:

            mask = self._create_bbox_mask(
                image,
                detection,
            )

            if mask is None:
                return {
                    "segmentation_available": False,
                    "mask": None,
                    "mask_area": 0,
                    "polygon": None,
                    "segmentation_confidence": 0.0,
                }

            area = self._mask_area(
                mask
            )

            polygon = (
                self._mask_to_polygon(
                    mask
                )
            )

            return {
                "segmentation_available": False,
                "mask": mask,
                "mask_area": area,
                "polygon": polygon,
                "segmentation_confidence": 0.0,
                "fallback": True,
            }

        # ----------------------------------------------------
        # MODEL UNAVAILABLE
        # ----------------------------------------------------

        return {
            "segmentation_available": False,
            "mask": None,
            "mask_area": 0,
            "polygon": None,
            "segmentation_confidence": 0.0,
            "fallback": False,
        }