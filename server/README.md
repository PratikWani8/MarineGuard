# MarineGuard AI — Backend

Production-oriented Node.js/Express orchestration backend for MarineGuard AI.

## Architecture

React frontend → Node.js/Express → MongoDB
                              ↘ Python FastAPI AI service

The browser never calls the AI service directly.

## Stack

- Node.js 20+
- Express
- MongoDB/Mongoose
- JWT + bcrypt
- Axios
- Multer
- Socket.IO
- Helmet/CORS/rate limiting
- CSV + PDF reporting

## Run

```bash
npm install
copy .env.example .env
npm run dev
```

Linux/macOS:

```bash
cp .env.example .env
npm install
npm run dev
```

Set a strong `JWT_SECRET` and a reachable `MONGO_URI`.

## Services

Backend:

`http://localhost:5000`

API:

`http://localhost:5000/api/v1`


## AI contract

The backend calls:

- `GET /api/v1/health`
- `POST /api/v1/analyze`
- `POST /api/v1/analyze/batch`
- `POST /api/v1/route-plan`
- `POST /api/v1/verify`

The AI service URL is server-side only through `AI_SERVICE_URL`.

## Notes

- Sonar uploads are stored under `uploads/sonar`.
- Camera verification uploads are stored under `uploads/camera`.
- Generated reports are stored under `reports`.
- Physical dimensions and coordinates are only persisted when the AI service reports them as available.
- The YOLO/U-Net training workflow belongs to the Python AI service; this backend only orchestrates inference and stores results.
