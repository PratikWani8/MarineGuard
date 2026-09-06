# MarineGuard AI — FastAPI AI Service

MarineGuard AI is an edge-oriented side-scan sonar intelligence service for marine debris and anomaly detection. It follows the requested pipeline: preprocessing → YOLO detection → optional U-Net segmentation → acoustic-shadow analysis → natural/artificial filtering → multi-pass tracking → confidence → hazard scoring → dimensions → geolocation → route planning.

## Run

```bash
python -m venv .venv
# Windows: .venv\\Scripts\\activate
# Linux/macOS: source .venv/bin/activate
pip install -r requirements.txt
copy .env.example .env  # Windows
# cp .env.example .env  # Linux/macOS
uvicorn app.main:app --reload --port 8000
```

Open `/docs` for Swagger UI.

## Models

Put a trained sonar YOLO checkpoint at `weights/detection/best.pt` and a compatible segmentation checkpoint at `weights/segmentation/best.pt`. Set `DEMO_MODE=false` for production. The fallback demo mode is explicitly marked and must not be used as evidence of trained sonar performance.

## API

- `GET /api/v1/health`
- `POST /api/v1/analyze` — multipart fields `image`, `metadata`
- `POST /api/v1/analyze/batch` — multipart `images[]`, `metadata` JSON array
- `POST /api/v1/route-plan`
- `POST /api/v1/verify`

The Node.js backend should call this service; the browser should not call port 8000 directly.
