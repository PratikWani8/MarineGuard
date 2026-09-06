import math


CLASS_BASE = {
    "ghost_net": 0.90,
    "shipwreck": 0.75,
    "pipe": 0.60,
    "cylinder": 0.55,
    "metal_debris": 0.65,
    "other_debris": 0.50,
    "natural_formation": 0.10,
}


class HazardScorer:
    """
    Calculates environmental hazard/risk scores for
    MarineGuard AI detections.

    IMPORTANT:
    Hazard score represents estimated risk/severity.
    It is intentionally separate from AI confidence.

    Confidence answers:
        "How confident are we that this detection is correct?"

    Hazard score answers:
        "How hazardous or important is this object?"
    """

    DEFAULT_BASE_SCORE = 0.50

    def __init__(
        self,
        class_base=None,
    ):
        self.class_base = {
            **CLASS_BASE,
            **(class_base or {}),
        }

        self._validate_class_base()

    # ---------------------------------------------------------
    # VALIDATION / HELPERS
    # ---------------------------------------------------------

    def _validate_class_base(self):
        """
        Validate class risk priors.
        """

        for cls, value in self.class_base.items():

            if not isinstance(
                value,
                (int, float),
            ):
                raise ValueError(
                    f"Base score for '{cls}' "
                    "must be numeric"
                )

            if not 0.0 <= value <= 1.0:
                raise ValueError(
                    f"Base score for '{cls}' "
                    "must be between 0 and 1"
                )

    @staticmethod
    def _clamp(
        value,
        minimum=0.0,
        maximum=1.0,
    ):
        """
        Safely clamp a numeric value.
        """

        try:
            value = float(value)

        except (
            TypeError,
            ValueError,
        ):
            return minimum

        if not math.isfinite(value):
            return minimum

        return max(
            minimum,
            min(maximum, value),
        )

    @staticmethod
    def _safe_dimensions(
        dimensions,
    ):
        """
        Safely extract estimated area.
        """

        if not isinstance(
            dimensions,
            dict,
        ):
            return 0.0

        available = bool(
            dimensions.get(
                "dimension_estimation_available",
                False,
            )
        )

        if not available:
            return 0.0

        try:
            area = float(
                dimensions.get(
                    "area_m2",
                    0.0,
                )
            )

        except (
            TypeError,
            ValueError,
        ):
            return 0.0

        if not math.isfinite(area):
            return 0.0

        return max(
            0.0,
            area,
        )

    # ---------------------------------------------------------
    # RISK LEVEL
    # ---------------------------------------------------------

    @staticmethod
    def _risk_level(
        score: float,
    ) -> str:
        """
        Convert numerical hazard score into
        a risk category.
        """

        if score >= 80:
            return "CRITICAL"

        if score >= 60:
            return "HIGH"

        if score >= 40:
            return "MEDIUM"

        return "LOW"

    @staticmethod
    def _recommended_action(
        level: str,
    ) -> str:
        """
        Return recommended operational action.
        """

        actions = {
            "CRITICAL": (
                "Immediate inspection recommended"
            ),

            "HIGH": (
                "Prioritize inspection"
            ),

            "MEDIUM": (
                "Monitor and schedule inspection"
            ),

            "LOW": (
                "Continue monitoring"
            ),
        }

        return actions.get(
            level,
            "Continue monitoring",
        )

    # ---------------------------------------------------------
    # MAIN SCORING
    # ---------------------------------------------------------

    def score(
        self,
        cls,
        confidence,
        dimensions,
        persistence,
        artificial_probability,
        location_available,
    ):
        """
        Calculate the hazard score.

        Inputs are normalized to 0-1 where applicable.

        Weighted factors:

        Class risk              35%
        Detection confidence    30%
        Object size             15%
        Artificial probability  10%
        Persistence             10%

        Returns:
            {
                hazard_score,
                risk_level,
                recommended_action,
                components
            }
        """

        # -----------------------------------------------------
        # CLASS
        # -----------------------------------------------------

        class_name = str(
            cls or "other_debris"
        ).lower().strip()

        base = self.class_base.get(
            class_name,
            self.DEFAULT_BASE_SCORE,
        )

        # -----------------------------------------------------
        # CONFIDENCE
        # -----------------------------------------------------

        confidence = self._clamp(
            confidence
        )

        # -----------------------------------------------------
        # PERSISTENCE
        # -----------------------------------------------------

        persistence = self._clamp(
            persistence
        )

        # -----------------------------------------------------
        # ARTIFICIAL PROBABILITY
        # -----------------------------------------------------

        artificial_probability = (
            self._clamp(
                artificial_probability
            )
        )

        # -----------------------------------------------------
        # OBJECT SIZE
        # -----------------------------------------------------

        area_m2 = self._safe_dimensions(
            dimensions
        )

        if area_m2 > 0:
            #
            # 100 m² is treated as a high-size
            # reference point.
            #
            size_factor = min(
                1.0,
                area_m2 / 100.0,
            )

        else:
            #
            # Unknown size should contribute only
            # a small neutral factor rather than
            # pretending the object is tiny.
            #
            size_factor = 0.20

        # -----------------------------------------------------
        # COMPONENT SCORES
        # -----------------------------------------------------

        class_component = (
            0.35 * base
        )

        confidence_component = (
            0.30 * confidence
        )

        size_component = (
            0.15 * size_factor
        )

        artificial_component = (
            0.10 * artificial_probability
        )

        persistence_component = (
            0.10 * persistence
        )

        # -----------------------------------------------------
        # TOTAL SCORE
        # -----------------------------------------------------

        normalized_score = (
            class_component
            + confidence_component
            + size_component
            + artificial_component
            + persistence_component
        )

        score = (
            normalized_score * 100.0
        )

        # -----------------------------------------------------
        # LOCATION PENALTY
        # -----------------------------------------------------

        #
        # Missing geolocation slightly reduces
        # operational confidence in the risk assessment.
        #

        if not bool(location_available):
            score *= 0.95

        score = self._clamp(
            score,
            0.0,
            100.0,
        )

        # -----------------------------------------------------
        # RISK LEVEL
        # -----------------------------------------------------

        risk_level = self._risk_level(
            score
        )

        recommended_action = (
            self._recommended_action(
                risk_level
            )
        )

        # -----------------------------------------------------
        # RESULT
        # -----------------------------------------------------

        return {
            "hazard_score": round(
                score,
                2,
            ),

            "risk_level": risk_level,

            "recommended_action": (
                recommended_action
            ),

            "components": {
                "class": round(
                    base,
                    4,
                ),

                "confidence": round(
                    confidence,
                    4,
                ),

                "size_factor": round(
                    size_factor,
                    4,
                ),

                "artificial_probability": round(
                    artificial_probability,
                    4,
                ),

                "persistence": round(
                    persistence,
                    4,
                ),

                "location_available": bool(
                    location_available
                ),
            },

            "weights": {
                "class": 0.35,
                "confidence": 0.30,
                "size": 0.15,
                "artificial_probability": 0.10,
                "persistence": 0.10,
            },
        }

    # ---------------------------------------------------------
    # CLASS INFORMATION
    # ---------------------------------------------------------

    def get_class_base(
        self,
        cls,
    ) -> float:
        """
        Return the base hazard value for a class.
        """

        return self.class_base.get(
            str(cls).lower().strip(),
            self.DEFAULT_BASE_SCORE,
        )

    def get_class_scores(self):
        """
        Return configured class risk scores.
        """

        return self.class_base.copy()