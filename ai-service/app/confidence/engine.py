class ConfidenceEngine:
    """
    Confidence fusion engine for MarineGuard AI.

    Combines multiple evidence sources into a single
    confidence score:

    - Model detection confidence
    - Shadow evidence
    - Artificial-object evidence
    - Temporal persistence
    - Segmentation confidence
    """

    DEFAULT_WEIGHTS = {
        "model": 0.50,
        "shadow": 0.20,
        "artificial": 0.15,
        "persistence": 0.10,
        "segmentation": 0.05,
    }

    def __init__(self, weights=None):
        """
        Initialize the confidence engine.

        Args:
            weights: Optional custom weight dictionary.
        """

        self.weights = {
            **self.DEFAULT_WEIGHTS,
            **(weights or {}),
        }

        self._normalize_weights()

    def _normalize_weights(self):
        """
        Validate and normalize weights so that
        their total equals 1.0.
        """

        for key, value in self.weights.items():

            if not isinstance(value, (int, float)):
                raise ValueError(
                    f"Weight '{key}' must be numeric"
                )

            if value < 0:
                raise ValueError(
                    f"Weight '{key}' cannot be negative"
                )

        total = sum(self.weights.values())

        if total <= 0:
            raise ValueError(
                "Confidence weights must have a positive total"
            )

        self.weights = {
            key: value / total
            for key, value in self.weights.items()
        }

    @staticmethod
    def _clamp(value):
        """
        Safely convert an evidence value to a range of 0-1.
        """

        try:
            value = float(value)
        except (TypeError, ValueError):
            return 0.0

        return max(
            0.0,
            min(1.0, value)
        )

    def calculate(
        self,
        model,
        shadow,
        artificial,
        persistence,
        segmentation,
    ):
        """
        Calculate the final confidence score.

        All input values should ideally be between 0 and 1.

        Returns:
            dict containing:
                confidence
                confidence_level
                uncertainty
                reliability
        """

        evidence = {
            "model": self._clamp(model),
            "shadow": self._clamp(shadow),
            "artificial": self._clamp(artificial),
            "persistence": self._clamp(persistence),
            "segmentation": self._clamp(segmentation),
        }

        confidence = sum(
            self.weights[key] * evidence[key]
            for key in self.weights
        )

        confidence = max(
            0.0,
            min(1.0, confidence)
        )

        uncertainty = 1.0 - confidence

        # Confidence classification
        if confidence >= 0.80:
            confidence_level = "high"
            reliability = "high"

        elif confidence >= 0.60:
            confidence_level = "medium"
            reliability = "moderate"

        else:
            confidence_level = "low"
            reliability = "low"

        return {
            "confidence": round(
                confidence * 100,
                2
            ),
            "confidence_level": confidence_level,
            "uncertainty": round(
                uncertainty * 100,
                2
            ),
            "reliability": reliability,
        }

    def calculate_from_dict(self, evidence):
        """
        Calculate confidence directly from an evidence dictionary.

        Example:

            engine.calculate_from_dict({
                "model": 0.90,
                "shadow": 0.80,
                "artificial": 0.70,
                "persistence": 0.85,
                "segmentation": 0.90
            })
        """

        evidence = evidence or {}

        return self.calculate(
            model=evidence.get("model", 0.0),
            shadow=evidence.get("shadow", 0.0),
            artificial=evidence.get("artificial", 0.0),
            persistence=evidence.get("persistence", 0.0),
            segmentation=evidence.get("segmentation", 0.0),
        )

    def get_weights(self):
        """
        Return the normalized confidence weights.
        """

        return self.weights.copy()