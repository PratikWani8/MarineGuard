from fastapi import APIRouter, Request

router = APIRouter()


@router.get("/health")
def health(request: Request):
    pipeline = getattr(request.app.state, "pipeline", None)

    if pipeline is None:
        return {
            "status": "degraded",
            "service": "marineguard-ai",
            "model_loaded": False,
            "segmentation_loaded": False,
            "device": None,
            "demo_mode": False,
        }

    detector = getattr(pipeline, "detector", None)
    segmenter = getattr(pipeline, "segmenter", None)

    model_loaded = bool(
        getattr(detector, "loaded", False)
    )

    segmentation_loaded = bool(
        getattr(segmenter, "available", False)
    )

    device = getattr(
        detector,
        "device",
        None,
    )

    demo_mode = bool(
        getattr(detector, "demo_mode", False)
        and not model_loaded
    )

    status = (
        "ok"
        if model_loaded or demo_mode
        else "degraded"
    )

    return {
        "status": status,
        "service": "marineguard-ai",
        "model_loaded": model_loaded,
        "segmentation_loaded": segmentation_loaded,
        "device": device,
        "demo_mode": demo_mode,
    }