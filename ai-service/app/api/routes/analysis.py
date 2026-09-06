import json

import cv2
import numpy as np

from fastapi import APIRouter, File, Form, HTTPException, Request, UploadFile

from app.schemas.common import RoutePlanRequest
from app.services.route_planner import plan

router = APIRouter()

def parse_json(value: str, error_message: str):
    try:
        return json.loads(value)
    except json.JSONDecodeError:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_METADATA",
                "message": error_message,
            },
        )


def decode_image(raw: bytes):
    if not raw:
        return None

    return cv2.imdecode(
        np.frombuffer(raw, dtype=np.uint8),
        cv2.IMREAD_COLOR,
    )


@router.post("/analyze")
async def analyze(
    request: Request,
    image: UploadFile = File(...),
    metadata: str = Form(...),
):
    # Parse metadata
    meta = parse_json(
        metadata,
        "metadata must be valid JSON",
    )

    if not isinstance(meta, dict):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_METADATA",
                "message": "metadata must be a JSON object",
            },
        )

    # Required metadata
    required_fields = ["survey_id", "frame_id"]

    missing_fields = [
        field
        for field in required_fields
        if not meta.get(field)
    ]

    if missing_fields:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "MISSING_METADATA",
                "message": "Required metadata fields are missing",
                "fields": missing_fields,
            },
        )

    # Read image
    raw = await image.read()

    max_bytes = (
        request.app.state.settings.max_image_size_mb
        * 1024
        * 1024
    )

    if len(raw) > max_bytes:
        raise HTTPException(
            status_code=413,
            detail={
                "code": "IMAGE_TOO_LARGE",
                "message": "Image exceeds configured size limit",
            },
        )

    # Decode image
    arr = decode_image(raw)

    if arr is None:
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_IMAGE",
                "message": "Unsupported or invalid image",
            },
        )

    # AI pipeline
    try:
        quality, detections, summary, processing_time = (
            request.app.state.pipeline.analyze(
                arr,
                meta,
            )
        )
    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={
                "code": "ANALYSIS_FAILED",
                "message": "Image analysis failed",
            },
        ) from exc

    return {
        "success": True,
        "survey_id": meta["survey_id"],
        "frame_id": meta["frame_id"],
        "processing_time_ms": round(processing_time, 2),
        "quality": quality,
        "detections": detections,
        "summary": summary,
    }


@router.post("/analyze/batch")
async def analyze_batch(
    request: Request,
    images: list[UploadFile] = File(...),
    metadata: str = Form(...),
):
    metas = parse_json(
        metadata,
        "metadata must be a JSON array",
    )

    if not isinstance(metas, list):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_METADATA",
                "message": "metadata must be a JSON array",
            },
        )

    if len(images) != len(metas):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "COUNT_MISMATCH",
                "message": "images and metadata lengths must match",
            },
        )

    max_bytes = (
        request.app.state.settings.max_image_size_mb
        * 1024
        * 1024
    )

    all_detections = []
    qualities = []
    processed_frames = 0
    failed_frames = []

    for index, (upload, meta) in enumerate(zip(images, metas)):
        if not isinstance(meta, dict):
            failed_frames.append(
                {
                    "index": index,
                    "reason": "metadata must be an object",
                }
            )
            continue

        raw = await upload.read()

        if len(raw) > max_bytes:
            failed_frames.append(
                {
                    "index": index,
                    "reason": "image exceeds configured size limit",
                }
            )
            continue

        arr = decode_image(raw)

        if arr is None:
            failed_frames.append(
                {
                    "index": index,
                    "reason": "invalid or unsupported image",
                }
            )
            continue

        try:
            quality, detections, _, _ = (
                request.app.state.pipeline.analyze(
                    arr,
                    meta,
                )
            )

            qualities.append(quality)
            all_detections.extend(detections)
            processed_frames += 1

        except Exception:
            failed_frames.append(
                {
                    "index": index,
                    "reason": "analysis failed",
                }
            )

    confirmed_anomalies = [
        detection
        for detection in all_detections
        if detection.get("confirmed") is True
    ]

    heatmap_points = []

    for detection in all_detections:
        location = detection.get("location", {})

        if not location.get("geolocation_available"):
            continue

        if "latitude" not in location or "longitude" not in location:
            continue

        heatmap_points.append(
            {
                "latitude": location["latitude"],
                "longitude": location["longitude"],
                "intensity": detection.get("hazard_score", 0) / 100,
                "class": detection.get("class", "unknown"),
                "hazard_score": detection.get(
                    "hazard_score",
                    0,
                ),
            }
        )

    return {
        "success": True,
        "detections": all_detections,
        "tracked_objects": all_detections,
        "confirmed_anomalies": confirmed_anomalies,
        "heatmap_points": heatmap_points,
        "summary": {
            "frames": len(images),
            "processed_frames": processed_frames,
            "failed_frames": len(failed_frames),
            "detections": len(all_detections),
            "quality": qualities,
        },
        "errors": failed_frames,
    }


@router.post("/route-plan")
def route_plan(payload: RoutePlanRequest):
    try:
        result = plan(
            payload.start,
            payload.targets,
        )

        return {
            "success": True,
            **result,
        }

    except Exception as exc:
        raise HTTPException(
            status_code=500,
            detail={
                "code": "ROUTE_PLANNING_FAILED",
                "message": "Unable to generate route plan",
            },
        ) from exc


@router.post("/verify")
async def verify(
    image: UploadFile | None = None,
    metadata: str = Form(...),
):
    data = parse_json(
        metadata,
        "metadata must be valid JSON",
    )

    if not isinstance(data, dict):
        raise HTTPException(
            status_code=400,
            detail={
                "code": "INVALID_METADATA",
                "message": "metadata must be a JSON object",
            },
        )

    # Validate image if supplied.
    if image is not None:
        raw = await image.read()

        if raw:
            arr = decode_image(raw)

            if arr is None:
                raise HTTPException(
                    status_code=400,
                    detail={
                        "code": "INVALID_IMAGE",
                        "message": "Unsupported or invalid image",
                    },
                )

    return {
        "success": True,
        "verification_status": "pending_model",
        "confidence": float(
            data.get("confidence", 0)
        ),
        "classification": data.get(
            "classification",
            "unknown",
        ),
    }