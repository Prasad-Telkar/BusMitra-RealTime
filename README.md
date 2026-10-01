# BusMitra — Full-Stack Prototype

Real GPS tracking for Goa's KTC buses. React frontend + Flask/Socket.IO backend.
No fake data — the driver page uses your phone's actual GPS (`navigator.geolocation`),
and the passenger page shows a real OpenStreetMap map with the bus's real position.

## Project Structure
```
busmitra-app/
├── backend/        Flask + Socket.IO server (GPS relay, ETA calc, /predict endpoint)
└── frontend/       React app (Passenger view + Driver view)
```

## Run It Locally (for development/testing)

### 1. Backend
```bash
cd backend
pip install -r requirements.txt
python app.py
```
Runs on http://localhost:5000

### 2. Frontend
```bash
cd frontend
npm install
npm run dev
```
Runs on http://localhost:5173
- Passenger view: http://localhost:5173/
- Driver view: http://localhost:5173/driver

### 3. Test it with 2 devices on the same WiFi
- On your phone, open the Driver page using your laptop's local IP (e.g. http://192.168.1.x:5173/driver)
- Hit "Start Tracking" and allow location permission
- On your laptop, open the Passenger page — you'll see your phone's real live location on the map

## Deploy for Free (so your demo works anywhere, not just same WiFi)

**Backend → Render.com (free tier)** — `render.yaml` and `Procfile` are already included.
1. Push this repo to GitHub
2. On Render, "New Web Service" → connect the repo → set root directory to `backend`
3. Render auto-detects `render.yaml`. Deploy.
4. Copy the live URL Render gives you (e.g. `https://busmitra-backend.onrender.com`)

**Frontend → Vercel (free tier)** — `vercel.json` is already included.
1. On Vercel, "New Project" → connect the repo → set root directory to `frontend`
2. Add environment variable: `VITE_API_BASE` = your Render backend URL from above
3. Deploy

Once both are live, your driver and passenger pages work from any device with internet —
exactly what you need for a live pitch demo, not just on one WiFi network.

## Using Your Real Collected GPS Data

Once you've logged a few bus rides (see your team's data-collection instructions):
1. Drop the CSV files into the `data/` folder — see `data/README.md` for the exact
   filename format needed (route + date + time)
2. Run:
   ```bash
   cd backend
   python scripts/analyze_rides.py
   ```
3. This prints a real average-duration baseline per route, computed from your actual
   rides. Paste the output into `predict_delay()` in `app.py`, replacing the current
   hardcoded peak-hour guess — now your ETA/delay logic is grounded in real data you
   collected yourself, not an assumption.

Once both are deployed, your driver and passenger pages work from any device with internet —
exactly what you need for a live pitch demo.

## For the CS Pair (ML Model)
The `/predict` endpoint in `backend/app.py` currently uses a simple honest baseline
(peak-hour average comparison). Replace the logic inside `predict_delay()` with your
trained model's prediction — the request/response shape is already set up, so it's a
drop-in swap, no API contract changes needed.

## Known Limitations (be upfront about these in your pitch)
- ETA uses straight-line distance ÷ recent speed, not actual road routing — accurate
  enough for a prototype demo, not production-grade
- In-memory bus state (resets if the backend restarts) — fine for a 3-day prototype,
  swap for a real database (Postgres/Firebase) before any real pilot
- Only tested with 1 bus per route at a time
