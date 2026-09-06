import cv2
import numpy as np


class ImagePreprocessor:
    """
    Image preprocessing and quality assessment for
    MarineGuard AI.

    Pipeline:

        Input Image
            ↓
        Grayscale Conversion
            ↓
        Intensity Normalization
            ↓
        Noise Reduction
            ↓
        CLAHE Enhancement
            ↓
        Quality Assessment
            ↓
        Enhanced Image
    """

    def __init__(
        self,
        clahe_clip_limit: float = 2.0,
        clahe_grid_size: tuple[int, int] = (8, 8),
        bilateral_d: int = 7,
        bilateral_sigma_color: float = 45,
        bilateral_sigma_space: float = 45,
    ):
        self.clahe_clip_limit = float(
            clahe_clip_limit
        )

        self.clahe_grid_size = (
            clahe_grid_size
        )

        self.bilateral_d = int(
            bilateral_d
        )

        self.bilateral_sigma_color = float(
            bilateral_sigma_color
        )

        self.bilateral_sigma_space = float(
            bilateral_sigma_space
        )

    # ---------------------------------------------------------
    # HELPERS
    # ---------------------------------------------------------

    @staticmethod
    def _validate_image(
        image: np.ndarray,
    ):
        """
        Validate an input OpenCV image.
        """

        if image is None:
            raise ValueError(
                "Invalid image: image is None"
            )

        if not isinstance(
            image,
            np.ndarray,
        ):
            raise ValueError(
                "Invalid image: expected numpy.ndarray"
            )

        if image.size == 0:
            raise ValueError(
                "Invalid image: image is empty"
            )

        if image.ndim not in (2, 3):
            raise ValueError(
                "Invalid image: unsupported dimensions"
            )

        if image.shape[0] < 2 or image.shape[1] < 2:
            raise ValueError(
                "Invalid image: dimensions are too small"
            )

    @staticmethod
    def _to_grayscale(
        image: np.ndarray,
    ) -> np.ndarray:
        """
        Convert image to uint8 grayscale.
        """

        if image.ndim == 2:
            gray = image.copy()

        elif image.ndim == 3:

            channels = image.shape[2]

            if channels == 1:
                gray = image[:, :, 0]

            elif channels == 3:
                gray = cv2.cvtColor(
                    image,
                    cv2.COLOR_BGR2GRAY,
                )

            elif channels == 4:
                gray = cv2.cvtColor(
                    image,
                    cv2.COLOR_BGRA2GRAY,
                )

            else:
                raise ValueError(
                    "Unsupported image channel count"
                )

        else:
            raise ValueError(
                "Unsupported image format"
            )

        # Convert to uint8 safely.
        if gray.dtype != np.uint8:

            gray = cv2.normalize(
                gray,
                None,
                0,
                255,
                cv2.NORM_MINMAX,
            ).astype(np.uint8)

        return gray

    @staticmethod
    def _normalize(
        gray: np.ndarray,
    ) -> np.ndarray:
        """
        Normalize image intensity to 0-255.
        """

        minimum = float(
            np.min(gray)
        )

        maximum = float(
            np.max(gray)
        )

        # Avoid unnecessary normalization for
        # already valid 8-bit images.
        if (
            gray.dtype == np.uint8
            and minimum >= 0
            and maximum <= 255
        ):
            return gray.copy()

        if maximum <= minimum:
            return np.zeros_like(
                gray,
                dtype=np.uint8,
            )

        return cv2.normalize(
            gray,
            None,
            0,
            255,
            cv2.NORM_MINMAX,
        ).astype(np.uint8)

    @staticmethod
    def _calculate_noise_score(
        gray: np.ndarray,
    ) -> float:
        """
        Estimate high-frequency image noise.

        Returns:
            0 = low noise
            1 = high noise
        """

        blurred = cv2.GaussianBlur(
            gray,
            (5, 5),
            0,
        )

        residual = (
            gray.astype(np.float32)
            - blurred.astype(np.float32)
        )

        noise_std = float(
            np.std(residual)
        )

        return float(
            np.clip(
                noise_std / 35.0,
                0.0,
                1.0,
            )
        )

    @staticmethod
    def _calculate_contrast_score(
        image: np.ndarray,
    ) -> float:
        """
        Estimate image contrast.

        Returns:
            0 = poor contrast
            1 = strong contrast
        """

        std = float(
            np.std(
                image.astype(
                    np.float32
                )
            )
        )

        return float(
            np.clip(
                std / 80.0,
                0.0,
                1.0,
            )
        )

    @staticmethod
    def _calculate_dropout_score(
        gray: np.ndarray,
    ) -> float:
        """
        Estimate the percentage of near-black pixels.

        Returns:
            0 = no dropout
            1 = severe dropout
        """

        return float(
            np.mean(gray <= 3)
        )

    @staticmethod
    def _calculate_saturation_score(
        gray: np.ndarray,
    ) -> float:
        """
        Estimate the percentage of clipped pixels.

        Measures both:
        - near-black pixels
        - near-white pixels
        """

        dark = np.mean(
            gray <= 3
        )

        bright = np.mean(
            gray >= 252
        )

        return float(
            np.clip(
                dark + bright,
                0.0,
                1.0,
            )
        )

    @staticmethod
    def _calculate_sharpness_score(
        image: np.ndarray,
    ) -> float:
        """
        Estimate image sharpness using Laplacian variance.

        Returns:
            0 = blurry
            1 = sharp
        """

        laplacian = cv2.Laplacian(
            image,
            cv2.CV_64F,
        )

        variance = float(
            laplacian.var()
        )

        return float(
            np.clip(
                variance / 500.0,
                0.0,
                1.0,
            )
        )

    # ---------------------------------------------------------
    # MAIN PREPROCESSING
    # ---------------------------------------------------------

    def process(
        self,
        image: np.ndarray,
    ) -> tuple[np.ndarray, dict]:
        """
        Preprocess an image and calculate quality metrics.

        Returns:
            enhanced_image, quality_metadata
        """

        self._validate_image(
            image
        )

        # -----------------------------------------------------
        # GRAYSCALE
        # -----------------------------------------------------

        gray = self._to_grayscale(
            image
        )

        # -----------------------------------------------------
        # NORMALIZATION
        # -----------------------------------------------------

        normalized = self._normalize(
            gray
        )

        # -----------------------------------------------------
        # NOISE REDUCTION
        # -----------------------------------------------------

        denoised = cv2.bilateralFilter(
            normalized,
            self.bilateral_d,
            self.bilateral_sigma_color,
            self.bilateral_sigma_space,
        )

        # -----------------------------------------------------
        # CLAHE
        # -----------------------------------------------------

        clahe = cv2.createCLAHE(
            clipLimit=self.clahe_clip_limit,
            tileGridSize=self.clahe_grid_size,
        )

        enhanced = clahe.apply(
            denoised
        )

        # -----------------------------------------------------
        # QUALITY METRICS
        # -----------------------------------------------------

        noise_score = (
            self._calculate_noise_score(
                normalized
            )
        )

        contrast_score = (
            self._calculate_contrast_score(
                enhanced
            )
        )

        dropout_score = (
            self._calculate_dropout_score(
                normalized
            )
        )

        saturation_score = (
            self._calculate_saturation_score(
                normalized
            )
        )

        sharpness_score = (
            self._calculate_sharpness_score(
                enhanced
            )
        )

        # -----------------------------------------------------
        # QUALITY SCORE
        # -----------------------------------------------------

        quality_score = (
            100.0
            * (
                0.30
                * contrast_score

                + 0.25
                * (1.0 - noise_score)

                + 0.15
                * (1.0 - dropout_score)

                + 0.10
                * (1.0 - saturation_score)

                + 0.20
                * sharpness_score
            )
        )

        quality_score = float(
            np.clip(
                quality_score,
                0.0,
                100.0,
            )
        )

        # -----------------------------------------------------
        # QUALITY LEVEL
        # -----------------------------------------------------

        if quality_score >= 80:
            quality_level = "excellent"

        elif quality_score >= 65:
            quality_level = "good"

        elif quality_score >= 45:
            quality_level = "fair"

        else:
            quality_level = "poor"

        # -----------------------------------------------------
        # RESULT
        # -----------------------------------------------------

        metadata = {
            "quality_score": round(
                quality_score,
                2,
            ),

            "quality_level": quality_level,

            "noise_score": round(
                noise_score,
                4,
            ),

            "contrast_score": round(
                contrast_score,
                4,
            ),

            "dropout_score": round(
                dropout_score,
                4,
            ),

            "saturation_score": round(
                saturation_score,
                4,
            ),

            "sharpness_score": round(
                sharpness_score,
                4,
            ),

            "original_shape": list(
                image.shape
            ),

            "processed_shape": list(
                enhanced.shape
            ),
        }

        return enhanced, metadata

    # ---------------------------------------------------------
    # BACKWARD-COMPATIBLE FUNCTION
    # ---------------------------------------------------------

    def preprocess(
        self,
        image: np.ndarray,
    ) -> tuple[np.ndarray, dict]:
        """
        Alias for process().

        Allows existing pipeline code to continue using:

            preprocessor.preprocess(image)
        """

        return self.process(
            image
        )


# -------------------------------------------------------------
# FUNCTION-STYLE API
# -------------------------------------------------------------

_default_preprocessor = ImagePreprocessor()


def preprocess(
    image: np.ndarray,
) -> tuple[np.ndarray, dict]:
    """
    Backward-compatible function API.

    Example:

        enhanced, quality = preprocess(image)
    """

    return _default_preprocessor.process(
        image
    )