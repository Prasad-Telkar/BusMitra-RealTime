# GPS Ride Data — Drop Your Collected CSVs Here

## Expected CSV Format
One file per bus ride, exported from GPS Logger (or similar app). Required columns:

| Column    | Description                          | Example              |
|-----------|---------------------------------------|-----------------------|
| timestamp | ISO 8601 or any pandas-parseable time | 2026-10-01T09:14:32   |
| lat       | Latitude                              | 15.4909               |
| lng       | Longitude                             | 73.8278                |
| speed     | Speed in m/s (optional, can be blank) | 8.3                    |

## File Naming Convention
Use this pattern so the analysis script can auto-detect route + time of day:

    <route_id>_<YYYYMMDD>_<HHMM>.csv

Examples:
    route12_bus1_20261001_0905.csv   → Route 12, ride started Oct 1 at 9:05 AM
    route4_bus1_20261001_1430.csv    → Route 4, ride started Oct 1 at 2:30 PM

route_id must match an entry in backend/app.py's ROUTES dict (currently: route12_bus1, route4_bus1).

## What Happens To This Data
Run `backend/scripts/analyze_rides.py` (see that file) to compute real average
segment travel time per route/hour-of-day. This replaces the hardcoded peak-hour
guess currently in the `/predict` endpoint with numbers from your actual collected rides.

Even 2-4 rides per route is enough for a legitimate, honestly-labeled baseline —
this is a prototype, not a production ML system, and the pitch should say so.
