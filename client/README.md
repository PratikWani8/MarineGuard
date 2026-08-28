# MarineGuard AI — Frontend

React/Vite command-center frontend for MarineGuard AI.

## Architecture

```text
React :5173
   |
   | REST + Socket.IO
   v
Node/Express :5000
   |\
   | \__ FastAPI AI :8000
   |
   \____ MongoDB
```

The browser only communicates with the Node backend. The FastAPI service is never exposed to frontend code.

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

Open:

`http://localhost:5173`

## Environment

```env
VITE_API_URL=http://localhost:5000/api/v1
```

Do not add `AI_SERVICE_URL`, MongoDB credentials, or AI credentials to the frontend environment.

## Pages

- `/login`
- `/dashboard`
- `/surveys`
- `/surveys/:surveyId`
- `/analysis/:frameId`
- `/detections/:detectionId`
- `/map`
- `/missions`
- `/reports`

## Backend contract

The frontend calls only:

- `POST /auth/login`
- `GET /auth/me`
- `POST /surveys`
- `GET /surveys`
- `GET /surveys/:surveyId`
- `DELETE /surveys/:surveyId`
- `POST /surveys/:surveyId/frames`
- `POST /surveys/:surveyId/analyze`
- `GET /detections`
- `GET /detections/:detectionId`
- `PATCH /detections/:detectionId/status`
- `GET /dashboard/overview`
- `GET /dashboard/heatmap`
- `POST /missions/plan`
- `POST /detections/:detectionId/verify`
- `GET /reports/survey/:surveyId/json`
- `GET /reports/survey/:surveyId/csv`
- `GET /reports/survey/:surveyId/pdf`

## Notes

- Authentication uses the JWT returned by the Node backend.
- Socket.IO connects to the backend origin derived from `VITE_API_URL`.
- Maps use OpenStreetMap tiles through Leaflet.
- No dummy detection results are inserted by the frontend.
- If AI geolocation is unavailable, the UI reports that instead of fabricating coordinates.
