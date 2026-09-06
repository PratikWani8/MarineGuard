from pathlib import Path
import uuid

import numpy as np


class YOLODetector:
    """
    YOLO-based marine debris detector for MarineGuard AI.

    Supports:
    - CPU inference
    - CUDA inference
    - Automatic device selection
    - Configurable confidence threshold
    - Demo fallback mode
    - Detection IDs
    - Bounding boxes
    - Detection centers
    - Safe model loading
    """

    def __init__(
        self,
        model_path: Path,
        device: str = "auto",
        threshold: float = 0.35,
        demo_mode: bool = True,
    ):
        self.model_path = Path(model_path)

        self.threshold = max(
            0.0,
            min(1.0, float(threshold)),
        )

        self.demo_mode = bool(demo_mode)

        self.model = None
        self.device = "cpu"

        self.load_error = None

        # Resolve requested device
        self.device = self._resolve_device(device)

        # Load YOLO model
        self._load_model()

    # ---------------------------------------------------------
    # DEVICE
    # ---------------------------------------------------------

    def _resolve_device(self, device: str) -> str:
        """
        Resolve the inference device.

        Supported:
        - auto
        - cpu
        - cuda
        - cuda:0
        - cuda:1
        """

        device = str(device or "auto").lower().strip()

        if device == "auto":
            return "cuda:0" if self._cuda_available() else "cpu"

        if device.startswith("cuda"):
            if self._cuda_available():
                return device

            return "cpu"

        return "cpu"

    @staticmethod
    def _cuda_available() -> bool:
        """
        Check whether CUDA is available.
        """

        try:
            import torch

            return bool(torch.cuda.is_available())

        except Exception:
            return False

    # ---------------------------------------------------------
    # MODEL LOADING
    # ---------------------------------------------------------

    def _load_model(self):
        """
        Load the YOLO model safely.
        """

        if not self.model_path.exists():
            self.load_error = (
                f"Model file not found: {self.model_path}"
            )
            self.model = None
            return

        try:
            from ultralytics import YOLO

            self.model = YOLO(
                str(self.model_path)
            )

            # Move model to selected device.
            try:
                self.model.to(self.device)

            except Exception:
                # If CUDA fails, fall back to CPU.
                self.device = "cpu"

                try:
                    self.model.to("cpu")

                except Exception as exc:
                    self.load_error = str(exc)
                    self.model = None

        except ImportError:
            self.load_error = (
                "Ultralytics is not installed"
            )
            self.model = None

        except Exception as exc:
            self.load_error = str(exc)
            self.model = None

    # ---------------------------------------------------------
    # MODEL STATUS
    # ---------------------------------------------------------

    @property
    def loaded(self) -> bool:
        """
        Returns True when the YOLO model is loaded.
        """

        return self.model is not None

    @property
    def status(self) -> dict:
        """
        Return detector status information.
        """

        return {
            "loaded": self.loaded,
            "model_path": str(self.model_path),
            "device": self.device,
            "threshold": self.threshold,
            "demo_mode": self.demo_mode and not self.loaded,
            "load_error": self.load_error,
        }

    # ---------------------------------------------------------
    # PREDICTION
    # ---------------------------------------------------------

    def predict(
        self,
        image: np.ndarray,
    ) -> list[dict]:
        """
        Run YOLO inference on an image.

        Args:
            image: OpenCV BGR image.

        Returns:
            List of normalized detection dictionaries.
        """

        # Validate image
        if image is None:
            return []

        if not isinstance(image, np.ndarray):
            return []

        if image.size == 0:
            return []

        if image.ndim not in (2, 3):
            return []

        # Demo fallback
        if self.model is None:
            if self.demo_mode:
                return self._demo(image)

            return []

        try:
            results = self.model.predict(
                source=image,
                conf=self.threshold,
                device=self.device,
                verbose=False,
            )

        except Exception as exc:
            self.load_error = str(exc)

            # Never silently claim real detections
            # after inference failure.
            if self.demo_mode:
                return self._demo(
                    image,
                    reason="inference_fallback",
                )

            return []

        detections = []

        for result in results:

            names = getattr(
                result,
                "names",
                {},
            )

            boxes = getattr(
                result,
                "boxes",
                None,
            )

            if boxes is None:
                continue

            for box in boxes:

                try:
                    xyxy = (
                        box.xyxy[0]
                        .detach()
                        .cpu()
                        .tolist()
                    )

                    confidence = float(
                        box.conf[0]
                        .detach()
                        .cpu()
                        .item()
                    )

                    class_id = int(
                        box.cls[0]
                        .detach()
                        .cpu()
                        .item()
                    )

                except Exception:
                    continue

                if len(xyxy) != 4:
                    continue

                x1, y1, x2, y2 = map(
                    float,
                    xyxy,
                )

                # Ensure confidence is valid.
                confidence = max(
                    0.0,
                    min(1.0, confidence),
                )

                # Resolve class name.
                if isinstance(names, dict):
                    class_name = names.get(
                        class_id,
                        str(class_id),
                    )
                elif isinstance(names, list):
                    if 0 <= class_id < len(names):
                        class_name = names[class_id]
                    else:
                        class_name = str(class_id)
                else:
                    class_name = str(class_id)

                center_x = (
                    x1 + x2
                ) / 2

                center_y = (
                    y1 + y2
                ) / 2

                detections.append(
                    {
                        "detection_id": (
                            f"D-{uuid.uuid4().hex[:10]}"
                        ),
                        "class": str(class_name),
                        "class_id": class_id,
                        "confidence": round(
                            confidence,
                            4,
                        ),
                        "bbox": {
                            "x1": x1,
                            "y1": y1,
                            "x2": x2,
                            "y2": y2,
                        },
                        "center": {
                            "x": center_x,
                            "y": center_y,
                        },
                        "demo_mode": False,
                    }
                )

        return detections

    # ---------------------------------------------------------
    # DEMO MODE
    # ---------------------------------------------------------

    def _demo(
        self,
        image: np.ndarray,
        reason: str = "model_not_loaded",
    ) -> list[dict]:
        """
        Development-only fallback.

        This does NOT perform actual marine debris inference.
        The detection is explicitly marked as demo data.
        """

        if image is None or image.size == 0:
            return []

        if image.ndim < 2:
            return []

        height, width = image.shape[:2]

        x1 = width * 0.35
        y1 = height * 0.35

        x2 = width * 0.65
        y2 = height * 0.65

        return [
            {
                "detection_id": (
                    f"D-DEMO-{uuid.uuid4().hex[:8]}"
                ),
                "class": "other_debris",
                "class_id": -1,
                "confidence": 0.40,
                "bbox": {
                    "x1": x1,
                    "y1": y1,
                    "x2": x2,
                    "y2": y2,
                },
                "center": {
                    "x": width * 0.50,
                    "y": height * 0.50,
                },
                "demo_mode": True,
                "demo_reason": reason,
            }
        ]