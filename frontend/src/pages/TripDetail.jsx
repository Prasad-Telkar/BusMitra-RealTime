import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bookmark, Bus, Map as MapIcon, LocateFixed } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

export default function TripDetail() {
  const { tripId } = useParams();
  const navigate = useNavigate();
  const [trip, setTrip] = useState(null);
  const [stops, setStops] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTripData = async () => {
      try {
        const [tripRes, stopsRes] = await Promise.all([
          fetch(`${API_BASE}/api/trips/${tripId}`),
          fetch(`${API_BASE}/api/trips/${tripId}/stops`)
        ]);
        
        if (tripRes.ok) setTrip(await tripRes.json());
        if (stopsRes.ok) setStops(await stopsRes.json());
      } catch (err) {
        console.error("Failed to fetch trip data", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchTripData();
  }, [tripId]);

  if (loading) {
    return <div style={{ padding: "20px" }}>Loading trip timetable...</div>;
  }

  if (!trip || stops.length === 0) {
    return <div style={{ padding: "20px" }}>Trip or timetable not found.</div>;
  }

  const destination = stops[stops.length - 1]?.stopName || "Unknown";

  return (
    <div className="home-screen bg-light route-detail-screen">
      <div className="routes-content" style={{ paddingBottom: '100px' }}>
        
        <header className="rd-header">
          <button className="icon-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} color="var(--text-main)" />
          </button>
          <div className="rd-title-group">
            <h1>{trip.headsign || trip.tripId}</h1>
            <p>Kadamba &middot; Towards {destination}</p>
          </div>
          <button className="icon-btn">
            <Bookmark size={24} color="var(--teal-800)" />
          </button>
        </header>

        <div className="rd-main-info" style={{ marginBottom: "20px" }}>
          <div className="bus-badge">KTC</div>
          <div className="rd-dest-info">
            <div className="rd-dest-line">{stops[0]?.stopName} <span className="arrow">&rarr;</span> {destination}</div>
            <div className="rd-stops-count">{stops.length} stops scheduled</div>
          </div>
        </div>

        <div className="timeline-section">
          <div className="timeline-header">
            <h3>Timetable</h3>
            <span className="timeline-ampm">SCHEDULED</span>
          </div>

          <div className="timeline-list">
            {stops.map((stop, index) => {
              const isPast = false; // We can integrate live location later to mark past stops
              const isBoarding = false; 
              const isLast = index === stops.length - 1;
              
              let className = "future";
              if (isPast) className = "past";
              if (isBoarding) className = "boarding";

              return (
                <div key={stop.stopId} className={`timeline-item ${className}`}>
                  <div className="t-graphic">
                    <div className={`t-line-top ${isPast ? 'transparent' : 'teal'}`}></div>
                    <div className={`t-dot ${isPast ? 'grey-solid' : isBoarding ? 'teal-outline' : 'teal-outline'}`}></div>
                    <div className={`t-line-bottom ${isLast ? 'transparent' : 'teal'}`}></div>
                  </div>
                  <div className="t-content">
                    <div className="t-text" style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                      <div>
                        <span className="t-stop">{stop.stopName}</span>
                        {isLast && <span className="t-sub">Last stop</span>}
                      </div>
                      <div style={{ textAlign: "right", color: "var(--teal-800)", fontWeight: "600" }}>
                        {stop.arrivalTime || "--:--:--"}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="rd-footer-note">
          <div className="demo-id-row">
            <Bus size={16} color="var(--text-muted)" />
            <strong>GTFS Schedule</strong> &middot; Official KTC Data
          </div>
          <div className="demo-data-note" style={{ marginTop: '4px' }}>
            Live tracking will be blended here soon
          </div>
        </div>
      </div>
    </div>
  );
}
