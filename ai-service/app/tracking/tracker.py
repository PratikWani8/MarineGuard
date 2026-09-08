import math
import time
from typing import Any


class CentroidTracker:
    """
    Lightweight centroid-based multi-frame tracker.

    Tracks detections across consecutive frames using
    Euclidean distance between object centers.

    This is suitable for:
    - Sonar frame sequences
    - Drone survey frames
    - Short-term marine debris tracking

    It is not a replacement for DeepSORT / ByteTrack /
    optical-flow tracking for complex scenes.
    """

    def __init__(
        self,
        max_distance: float = 100.0,
        max_missing_frames: int = 5,
        persistence_frames: int = 5,
    ):
        self.next_id = 1

        self.tracks: dict[str, dict[str, Any]] = {}

        self.max_distance = float(
            max_distance
        )

        self.max_missing_frames = int(
            max_missing_frames
        )

        self.persistence_frames = max(
            1,
            int(persistence_frames)
        )

        self.frame_index = 0

    # =========================================================
    # HELPERS
    # =========================================================

    @staticmethod
    def _safe_float(
        value,
        default: float = 0.0,
    ) -> float:
        """
        Safely convert a value to float.
        """

        try:
            value = float(value)

        except (
            TypeError,
            ValueError,
        ):
            return default

        if not math.isfinite(value):
            return default

        return value

    @staticmethod
    def _distance(
        x1: float,
        y1: float,
        x2: float,
        y2: float,
    ) -> float:
        """
        Euclidean distance between two points.
        """

        return math.hypot(
            x1 - x2,
            y1 - y2,
        )

    def _new_track(
        self,
        x: float,
        y: float,
    ) -> str:
        """
        Create a new track.
        """

        track_id = (
            f"T-{self.next_id:05d}"
        )

        self.next_id += 1

        self.tracks[track_id] = {
            "x": x,
            "y": y,
            "previous_x": x,
            "previous_y": y,
            "frames": 0,
            "missing_frames": 0,
            "first_frame": self.frame_index,
            "last_frame": self.frame_index,
            "velocity_x": 0.0,
            "velocity_y": 0.0,
            "speed_pixels": 0.0,
            "confirmed": False,
        }

        return track_id

    def _match_detection(
        self,
        x: float,
        y: float,
        used: set[str],
    ):
        """
        Find the closest unused existing track.
        """

        best_track = None
        best_distance = float(
            "inf"
        )

        for track_id, track in (
            self.tracks.items()
        ):

            if track_id in used:
                continue

            distance = self._distance(
                x,
                y,
                track["x"],
                track["y"],
            )

            if (
                distance
                < best_distance
                and distance
                <= self.max_distance
            ):
                best_track = (
                    track_id
                )

                best_distance = (
                    distance
                )

        return (
            best_track,
            best_distance,
        )

    # =========================================================
    # TRACK UPDATE
    # =========================================================

    def update(
        self,
        detections: list[dict],
    ) -> list[dict]:
        """
        Update tracks using current-frame detections.

        Each detection receives:

        - track_id
        - frames_seen
        - persistence_score
        - confirmed
        - velocity_x
        - velocity_y
        - speed_pixels
        """

        self.frame_index += 1

        if not isinstance(
            detections,
            list,
        ):
            detections = []

        used_tracks: set[str] = set()

        matched_tracks: set[str] = set()

        # =====================================================
        # MATCH CURRENT DETECTIONS
        # =====================================================

        for detection in detections:

            if not isinstance(
                detection,
                dict,
            ):
                continue

            center = detection.get(
                "center"
            )

            if not isinstance(
                center,
                dict,
            ):
                continue

            cx = self._safe_float(
                center.get("x")
            )

            cy = self._safe_float(
                center.get("y")
            )

            track_id, distance = (
                self._match_detection(
                    cx,
                    cy,
                    used_tracks,
                )
            )

            # -------------------------------------------------
            # Create new track
            # -------------------------------------------------

            if track_id is None:

                track_id = (
                    self._new_track(
                        cx,
                        cy,
                    )
                )

                distance = 0.0

            # -------------------------------------------------
            # Existing track
            # -------------------------------------------------

            track = self.tracks[
                track_id
            ]

            previous_x = self._safe_float(
                track.get(
                    "x"
                )
            )

            previous_y = self._safe_float(
                track.get(
                    "y"
                )
            )

            # Velocity estimate.
            velocity_x = (
                cx - previous_x
            )

            velocity_y = (
                cy - previous_y
            )

            speed_pixels = math.hypot(
                velocity_x,
                velocity_y,
            )

            # Update track.
            track.update({
                "previous_x": previous_x,
                "previous_y": previous_y,
                "x": cx,
                "y": cy,
                "frames": (
                    track["frames"]
                    + 1
                ),
                "missing_frames": 0,
                "last_frame": (
                    self.frame_index
                ),
                "velocity_x": (
                    velocity_x
                ),
                "velocity_y": (
                    velocity_y
                ),
                "speed_pixels": (
                    speed_pixels
                ),
            })

            frames_seen = track[
                "frames"
            ]

            persistence_score = min(
                1.0,
                frames_seen
                / self.persistence_frames,
            )

            confirmed = (
                frames_seen >= 2
            )

            track["confirmed"] = (
                confirmed
            )

            # -------------------------------------------------
            # Detection metadata
            # -------------------------------------------------

            detection[
                "track_id"
            ] = track_id

            detection[
                "frames_seen"
            ] = frames_seen

            detection[
                "persistence_score"
            ] = round(
                persistence_score,
                4,
            )

            detection[
                "confirmed"
            ] = confirmed

            detection[
                "track_distance_pixels"
            ] = round(
                distance,
                2,
            )

            detection[
                "velocity"
            ] = {
                "x": round(
                    velocity_x,
                    2,
                ),
                "y": round(
                    velocity_y,
                    2,
                ),
                "speed_pixels": round(
                    speed_pixels,
                    2,
                ),
            }

            used_tracks.add(
                track_id
            )

            matched_tracks.add(
                track_id
            )

        # =====================================================
        # AGE UNMATCHED TRACKS
        # =====================================================

        tracks_to_delete = []

        for track_id, track in (
            self.tracks.items()
        ):

            if track_id in matched_tracks:
                continue

            track[
                "missing_frames"
            ] += 1

            if (
                track[
                    "missing_frames"
                ]
                > self.max_missing_frames
            ):
                tracks_to_delete.append(
                    track_id
                )

        # =====================================================
        # REMOVE OLD TRACKS
        # =====================================================

        for track_id in tracks_to_delete:
            del self.tracks[
                track_id
            ]

        return detections

    # =========================================================
    # TRACK INFORMATION
    # =========================================================

    def get_track(
        self,
        track_id: str,
    ):
        """
        Return a track by ID.
        """

        return self.tracks.get(
            track_id
        )

    def get_active_tracks(
        self,
    ) -> dict:
        """
        Return all currently active tracks.
        """

        return {
            track_id: dict(track)
            for track_id, track in (
                self.tracks.items()
            )
        }

    def get_confirmed_tracks(
        self,
    ) -> dict:
        """
        Return tracks that have been observed
        in at least two frames.
        """

        return {
            track_id: dict(track)
            for track_id, track in (
                self.tracks.items()
            )
            if track.get(
                "confirmed",
                False,
            )
        }

    def reset(self):
        """
        Reset the tracker completely.
        """

        self.next_id = 1

        self.tracks.clear()

        self.frame_index = 0