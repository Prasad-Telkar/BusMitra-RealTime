"""
Analyze collected GPS ride CSVs and compute a real average-duration baseline
per route and hour-of-day. Run this after dropping ride CSVs into /data.

Usage:
    cd backend
    python scripts/analyze_rides.py

Outputs a baseline dict you can paste directly into app.py's predict_delay()
to replace the hardcoded peak_hours guess with real collected averages.
"""
import pandas as pd
import glob
import os
import re
import json

DATA_DIR = os.path.join(os.path.dirname(__file__), "..", "..", "data")

def parse_filename(path):
    """Extract route_id and start hour from filename like route12_bus1_20261001_0905.csv"""
    name = os.path.basename(path).replace(".csv", "")
    m = re.match(r"(.+)_(\d{8})_(\d{2})(\d{2})", name)
    if not m:
        return None, None
    route_id, _date, hour, _minute = m.groups()
    return route_id, int(hour)

def ride_duration_minutes(df):
    ts = pd.to_datetime(df["timestamp"])
    return (ts.max() - ts.min()).total_seconds() / 60

def main():
    files = glob.glob(os.path.join(DATA_DIR, "*.csv"))
    if not files:
        print(f"No ride CSVs found in {DATA_DIR}. Drop your collected rides there first.")
        return

    records = []
    for f in files:
        route_id, hour = parse_filename(f)
        if route_id is None:
            print(f"Skipping {f} — filename doesn't match expected pattern.")
            continue
        df = pd.read_csv(f)
        if "timestamp" not in df.columns:
            print(f"Skipping {f} — no 'timestamp' column.")
            continue
        duration = ride_duration_minutes(df)
        records.append({"route_id": route_id, "hour": hour, "duration_min": duration, "file": os.path.basename(f)})
        print(f"{os.path.basename(f)}: route={route_id} hour={hour} duration={duration:.1f} min")

    if not records:
        print("No valid ride files parsed.")
        return

    summary = pd.DataFrame(records)
    baseline = (
        summary.groupby("route_id")["duration_min"]
        .mean()
        .round(1)
        .to_dict()
    )

    print("\n--- Baseline average duration per route (minutes) ---")
    print(json.dumps(baseline, indent=2))
    print("\nPaste this into backend/app.py's predict_delay() to replace the hardcoded guess.")
    print(f"Based on {len(records)} real collected ride(s) across {summary['route_id'].nunique()} route(s).")

if __name__ == "__main__":
    main()
