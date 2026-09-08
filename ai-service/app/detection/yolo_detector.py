from pathlib import Path
import uuid

import cv2
import numpy as np


class YOLODetector:
    """
    YOLO-based marine debris / anomaly detector.

    Features:
    - CPU inference
    - CUDA inference
    - Automatic device selection
    - Grayscale SSS -> 3-channel conversion
    - Configurable confidence threshold
    - Configurable IoU threshold
    - Configurable image size
    - Detection IDs
    - Bounding boxes
    - Detection centers
    - Class names
    - Detailed inference diagnostics
    - Optional demo fallback
    """

    def __init__(
        self,
        model_path: Path,
        device: str = "auto",
        threshold: float = 0.20,
        iou_threshold: float = 0.45,
        image_size: int = 640,
        demo_mode: bool = False,
    ):
        self.model_path = Path(model_path)

        self.threshold = max(
            0.0,
            min(1.0, float(threshold)),
        )

        self.iou_threshold = max(
            0.0,
            min(1.0, float(iou_threshold)),
        )

        self.image_size = int(
            image_size or 640
        )

        self.demo_mode = bool(
            demo_mode
        )

        self.model = None

        self.device = "cpu"

        self.load_error = None

        self.last_inference = {
            "image_width": None,
            "image_height": None,
            "raw_count": 0,
            "returned_count": 0,
            "classes": [],
            "confidences": [],
        }

        # -----------------------------------------------------
        # DEVICE
        # -----------------------------------------------------

        self.device = self._resolve_device(
            device
        )

        # -----------------------------------------------------
        # LOAD MODEL
        # -----------------------------------------------------

        self._load_model()

    # =========================================================
    # DEVICE
    # =========================================================

    def _resolve_device(
        self,
        device: str,
    ) -> str:

        device = str(
            device or "auto"
        ).lower().strip()

        if device == "auto":
            if self._cuda_available():
                return "cuda:0"

            return "cpu"

        if device.startswith("cuda"):

            if self._cuda_available():
                return device

            print(
                "CUDA requested but unavailable. "
                "Falling back to CPU."
            )

            return "cpu"

        return "cpu"

    @staticmethod
    def _cuda_available() -> bool:

        try:
            import torch

            return bool(
                torch.cuda.is_available()
            )

        except Exception:
            return False

    # =========================================================
    # MODEL LOADING
    # =========================================================

    def _load_model(self):

        print()
        print(
            "========================================"
        )

        print(
            "Loading MarineGuard YOLO model"
        )

        print(
            "========================================"
        )

        print(
            "Model:",
            self.model_path
        )

        print(
            "Device:",
            self.device
        )

        print(
            "Confidence threshold:",
            self.threshold
        )

        print(
            "IoU threshold:",
            self.iou_threshold
        )

        print(
            "Image size:",
            self.image_size
        )

        # -----------------------------------------------------
        # Check file
        # -----------------------------------------------------

        if not self.model_path.exists():

            self.load_error = (
                f"Model file not found: "
                f"{self.model_path}"
            )

            print(
                "❌",
                self.load_error
            )

            self.model = None

            return

        # -----------------------------------------------------
        # Load
        # -----------------------------------------------------

        try:

            from ultralytics import YOLO

            self.model = YOLO(
                str(self.model_path)
            )

            print(
                "✅ YOLO model loaded"
            )

            # -------------------------------------------------
            # Model class information
            # -------------------------------------------------

            names = getattr(
                self.model,
                "names",
                None,
            )

            print(
                "Model classes:",
                names
            )

            if names:

                if isinstance(
                    names,
                    dict,
                ):
                    print(
                        "Number of classes:",
                        len(names)
                    )

                    for class_id, name in names.items():

                        print(
                            f"  {class_id}: {name}"
                        )

                elif isinstance(
                    names,
                    list,
                ):
                    print(
                        "Number of classes:",
                        len(names)
                    )

                    for class_id, name in enumerate(
                        names
                    ):

                        print(
                            f"  {class_id}: {name}"
                        )

            # -------------------------------------------------
            # Move model
            # -------------------------------------------------

            try:

                self.model.to(
                    self.device
                )

            except Exception as exc:

                print(
                    "⚠️ Device initialization failed:"
                )

                print(
                    exc
                )

                print(
                    "Falling back to CPU."
                )

                self.device = "cpu"

                self.model.to(
                    "cpu"
                )

            print(
                "Final inference device:",
                self.device
            )

            print(
                "========================================"
            )

            print()

        except ImportError:

            self.load_error = (
                "Ultralytics is not installed. "
                "Install it with: pip install ultralytics"
            )

            print(
                "❌",
                self.load_error
            )

            self.model = None

        except Exception as exc:

            self.load_error = str(
                exc
            )

            print(
                "❌ YOLO model loading failed:"
            )

            print(
                self.load_error
            )

            self.model = None

    # =========================================================
    # STATUS
    # =========================================================

    @property
    def loaded(self) -> bool:

        return self.model is not None

    @property
    def status(self) -> dict:

        return {
            "loaded": self.loaded,
            "model_path": str(
                self.model_path
            ),
            "device": self.device,
            "threshold": self.threshold,
            "iou_threshold": self.iou_threshold,
            "image_size": self.image_size,
            "demo_mode": (
                self.demo_mode
                and not self.loaded
            ),
            "load_error": self.load_error,
            "last_inference": (
                self.last_inference
            ),
        }

    # =========================================================
    # IMAGE PREPARATION
    # =========================================================

    @staticmethod
    def _prepare_image(
        image: np.ndarray,
    ) -> np.ndarray:

        if image is None:
            raise ValueError(
                "Image is None"
            )

        if not isinstance(
            image,
            np.ndarray,
        ):
            raise ValueError(
                "Image must be a numpy ndarray"
            )

        if image.size == 0:
            raise ValueError(
                "Image is empty"
            )

        # -----------------------------------------------------
        # Grayscale
        # -----------------------------------------------------

        if image.ndim == 2:

            print(
                "SSS image is grayscale. "
                "Converting to BGR."
            )

            image = cv2.cvtColor(
                image,
                cv2.COLOR_GRAY2BGR,
            )

        # -----------------------------------------------------
        # Single-channel 3D
        # -----------------------------------------------------

        elif (
            image.ndim == 3
            and image.shape[2] == 1
        ):

            image = cv2.cvtColor(
                image,
                cv2.COLOR_GRAY2BGR,
            )

        # -----------------------------------------------------
        # BGRA
        # -----------------------------------------------------

        elif (
            image.ndim == 3
            and image.shape[2] == 4
        ):

            print(
                "Converting BGRA image to BGR."
            )

            image = cv2.cvtColor(
                image,
                cv2.COLOR_BGRA2BGR,
            )

        # -----------------------------------------------------
        # RGB/BGR
        # -----------------------------------------------------

        elif (
            image.ndim == 3
            and image.shape[2] == 3
        ):

            pass

        else:

            raise ValueError(
                f"Unsupported image shape: "
                f"{image.shape}"
            )

        # -----------------------------------------------------
        # uint8
        # -----------------------------------------------------

        if image.dtype != np.uint8:

            image = np.clip(
                image,
                0,
                255,
            ).astype(
                np.uint8
            )

        # -----------------------------------------------------
        # Check dimensions
        # -----------------------------------------------------

        height, width = image.shape[:2]

        if width <= 0 or height <= 0:

            raise ValueError(
                "Invalid image dimensions"
            )

        return image

    # =========================================================
    # PREDICTION
    # =========================================================

    def predict(
        self,
        image: np.ndarray,
    ) -> list[dict]:

        print()
        print(
            "========================================"
        )

        print(
            "MARINEGUARD YOLO INFERENCE"
        )

        print(
            "========================================"
        )

        # -----------------------------------------------------
        # Prepare image
        # -----------------------------------------------------

        try:

            image = self._prepare_image(
                image
            )

        except Exception as exc:

            print(
                "❌ Image preparation failed:"
            )

            print(
                exc
            )

            return []

        height, width = image.shape[:2]

        print(
            "Image dimensions:",
            f"{width} x {height}"
        )

        print(
            "Image dtype:",
            image.dtype
        )

        print(
            "Image channels:",
            image.shape[2]
        )

        self.last_inference = {
            "image_width": width,
            "image_height": height,
            "raw_count": 0,
            "returned_count": 0,
            "classes": [],
            "confidences": [],
        }

        # -----------------------------------------------------
        # Model unavailable
        # -----------------------------------------------------

        if self.model is None:

            print(
                "❌ YOLO model is not loaded."
            )

            print(
                "Reason:",
                self.load_error
            )

            if self.demo_mode:

                print(
                    "⚠️ Running DEMO mode."
                )

                return self._demo(
                    image,
                    reason="model_not_loaded",
                )

            return []

        # -----------------------------------------------------
        # Run YOLO
        # -----------------------------------------------------

        try:

            print(
                "Running YOLO..."
            )

            results = self.model.predict(
                source=image,

                conf=self.threshold,

                iou=self.iou_threshold,

                imgsz=self.image_size,

                device=self.device,

                verbose=False,

                save=False,

                save_txt=False,

                save_conf=False,
            )

        except Exception as exc:

            self.load_error = str(
                exc
            )

            print()
            print(
                "❌ YOLO inference failed:"
            )

            print(
                self.load_error
            )

            if self.demo_mode:

                print(
                    "⚠️ Running DEMO fallback."
                )

                return self._demo(
                    image,
                    reason="inference_fallback",
                )

            return []

        # -----------------------------------------------------
        # Validate results
        # -----------------------------------------------------

        if not results:

            print(
                "⚠️ YOLO returned no result objects."
            )

            return []

        detections = []

        # =====================================================
        # PROCESS RESULTS
        # =====================================================

        for result_index, result in enumerate(
            results
        ):

            print()
            print(
                f"YOLO result #{result_index + 1}"
            )

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

                print(
                    "⚠️ No boxes returned."
                )

                continue

            try:

                box_count = len(
                    boxes
                )

            except Exception:

                box_count = 0

            print(
                "Raw boxes:",
                box_count
            )

            self.last_inference[
                "raw_count"
            ] += box_count

            if box_count == 0:

                print(
                    "⚠️ YOLO detected ZERO objects."
                )

                print(
                    "Try checking the model, "
                    "training classes, or threshold."
                )

                continue

            # -------------------------------------------------
            # Each box
            # -------------------------------------------------

            for box_index, box in enumerate(
                boxes
            ):

                try:

                    # -----------------------------------------
                    # Bounding box
                    # -----------------------------------------

                    xyxy_tensor = getattr(
                        box,
                        "xyxy",
                        None,
                    )

                    if xyxy_tensor is None:

                        print(
                            f"Box {box_index}: "
                            "missing xyxy"
                        )

                        continue

                    xyxy = (
                        xyxy_tensor[0]
                        .detach()
                        .cpu()
                        .numpy()
                        .tolist()
                    )

                    # -----------------------------------------
                    # Confidence
                    # -----------------------------------------

                    conf_tensor = getattr(
                        box,
                        "conf",
                        None,
                    )

                    if conf_tensor is None:

                        print(
                            f"Box {box_index}: "
                            "missing confidence"
                        )

                        continue

                    confidence = float(
                        conf_tensor[0]
                        .detach()
                        .cpu()
                        .item()
                    )

                    # -----------------------------------------
                    # Class
                    # -----------------------------------------

                    cls_tensor = getattr(
                        box,
                        "cls",
                        None,
                    )

                    if cls_tensor is None:

                        print(
                            f"Box {box_index}: "
                            "missing class"
                        )

                        continue

                    class_id = int(
                        cls_tensor[0]
                        .detach()
                        .cpu()
                        .item()
                    )

                except Exception as exc:

                    print(
                        f"⚠️ Failed to parse "
                        f"box {box_index}:"
                    )

                    print(
                        exc
                    )

                    continue

                # ------------------------------------------------
                # Validate bbox
                # ------------------------------------------------

                if len(xyxy) != 4:

                    print(
                        f"Invalid bbox for box "
                        f"{box_index}:",
                        xyxy
                    )

                    continue

                x1, y1, x2, y2 = map(
                    float,
                    xyxy,
                )

                # ------------------------------------------------
                # Clamp coordinates
                # ------------------------------------------------

                x1 = max(
                    0.0,
                    min(
                        float(width),
                        x1,
                    ),
                )

                y1 = max(
                    0.0,
                    min(
                        float(height),
                        y1,
                    ),
                )

                x2 = max(
                    0.0,
                    min(
                        float(width),
                        x2,
                    ),
                )

                y2 = max(
                    0.0,
                    min(
                        float(height),
                        y2,
                    ),
                )

                # ------------------------------------------------
                # Make sure box isn't inverted
                # ------------------------------------------------

                if x2 < x1:

                    x1, x2 = (
                        x2,
                        x1,
                    )

                if y2 < y1:

                    y1, y2 = (
                        y2,
                        y1,
                    )

                # ------------------------------------------------
                # Confidence
                # ------------------------------------------------

                confidence = max(
                    0.0,
                    min(
                        1.0,
                        confidence,
                    ),
                )

                # ------------------------------------------------
                # Class name
                # ------------------------------------------------

                if isinstance(
                    names,
                    dict,
                ):

                    class_name = names.get(
                        class_id,
                        str(class_id),
                    )

                elif isinstance(
                    names,
                    list,
                ):

                    if (
                        0 <= class_id
                        < len(names)
                    ):

                        class_name = names[
                            class_id
                        ]

                    else:

                        class_name = str(
                            class_id
                        )

                else:

                    class_name = str(
                        class_id
                    )

                # ------------------------------------------------
                # Center
                # ------------------------------------------------

                center_x = (
                    x1 + x2
                ) / 2.0

                center_y = (
                    y1 + y2
                ) / 2.0

                # ------------------------------------------------
                # Detection
                # ------------------------------------------------

                detection = {
                    "detection_id": (
                        f"D-"
                        f"{uuid.uuid4().hex[:10]}"
                    ),

                    "class": str(
                        class_name
                    ),

                    "classification": str(
                        class_name
                    ),

                    "class_id": class_id,

                    "confidence": round(
                        confidence,
                        4,
                    ),

                    "confidence_percent": round(
                        confidence * 100,
                        2,
                    ),

                    "bbox": {
                        "x1": round(
                            x1,
                            2,
                        ),
                        "y1": round(
                            y1,
                            2,
                        ),
                        "x2": round(
                            x2,
                            2,
                        ),
                        "y2": round(
                            y2,
                            2,
                        ),
                    },

                    "center": {
                        "x": round(
                            center_x,
                            2,
                        ),
                        "y": round(
                            center_y,
                            2,
                        ),
                    },

                    "demo_mode": False,
                }

                detections.append(
                    detection
                )

                # ------------------------------------------------
                # Debug
                # ------------------------------------------------

                print()
                print(
                    "✅ DETECTION"
                )

                print(
                    "Class:",
                    class_name
                )

                print(
                    "Class ID:",
                    class_id
                )

                print(
                    "Confidence:",
                    f"{confidence:.4f}"
                )

                print(
                    "Confidence %:",
                    f"{confidence * 100:.2f}%"
                )

                print(
                    "Bounding box:",
                    (
                        round(x1, 2),
                        round(y1, 2),
                        round(x2, 2),
                        round(y2, 2),
                    )
                )

        # =====================================================
        # FINAL
        # =====================================================

        classes = []

        confidences = []

        for detection in detections:

            classes.append(
                detection["class"]
            )

            confidences.append(
                detection["confidence"]
            )

        self.last_inference[
            "returned_count"
        ] = len(
            detections
        )

        self.last_inference[
            "classes"
        ] = classes

        self.last_inference[
            "confidences"
        ] = confidences

        print()
        print(
            "========================================"
        )

        print(
            "YOLO INFERENCE COMPLETE"
        )

        print(
            "Raw boxes:",
            self.last_inference[
                "raw_count"
            ]
        )

        print(
            "Returned detections:",
            len(detections)
        )

        print(
            "Classes:",
            classes
        )

        print(
            "========================================"
        )

        print()

        return detections

    # =========================================================
    # DEMO MODE
    # =========================================================

    def _demo(
        self,
        image: np.ndarray,
        reason: str = "model_not_loaded",
    ) -> list[dict]:

        if (
            image is None
            or image.size == 0
        ):
            return []

        height, width = image.shape[:2]

        x1 = width * 0.35
        y1 = height * 0.35

        x2 = width * 0.65
        y2 = height * 0.65

        return [
            {
                "detection_id": (
                    f"D-DEMO-"
                    f"{uuid.uuid4().hex[:8]}"
                ),

                "class": "other_debris",

                "classification": "other_debris",

                "class_id": -1,

                "confidence": 0.40,

                "confidence_percent": 40.0,

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