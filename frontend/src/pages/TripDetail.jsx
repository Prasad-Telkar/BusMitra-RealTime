import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bookmark, Bus, MapPin, Clock, Loader2, Navigation } from "lucide-react";
import { formatTime } from "../utils/timeFormat";
import "./Routes.css";

const API_BASE = import.meta.env.VITE_API_BASE || "https://busmitra-goa.onrender.com";

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
    return (
      <div className="route-detail-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Loader2 className="spinner" size={24} color="#0284C7" />
        <p style={{ marginTop: '12px', color: '#64748B' }}>Loading trip timetable...</p>
      </div>
    );
  }

  if (!trip || stops.length === 0) {
    return (
      <div className="route-detail-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ color: '#0F172A' }}>Trip Timetable Not Found</h2>
        <p style={{ color: '#64748B' }}>Timetable data for trip {tripId} is currently unavailable.</p>
        <button type="button" className="btn-primary" onClick={() => navigate(-1)} style={{ maxWidth: '200px', margin: '20px auto' }}>
          Back to Route
        </button>
      </div>
    );
  }

  const destination = stops[stops.length - 1]?.stopName || "Terminus";
  const origin = stops[0]?.stopName || "Origin";

  return (
    <div className="route-detail-container">
      {/* HEADER CARD */}
      <div className="rd-header-card">
        <button type="button" className="tracker-back-btn" onClick={() => navigate(-1)} title="Back">
          <ArrowLeft size={18} />
        </button>

        <div className="rd-icon-box">
          <Clock size={24} />
        </div>

        <div className="rd-titles">
          <h1>{trip.headsign || `Trip ${trip.tripId}`}</h1>
          <p>{origin} &rarr; {destination} &bull; {stops.length} Stops</p>
        </div>
      </div>

      {/* TIMETABLE STOPS SEQUENCE */}
      <div className="timetable-card">
        <div className="timetable-header-row">
          <h2>Stop-by-Stop Scheduled Sequence</h2>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#059669', background: '#ECFDF5', padding: '4px 8px', border: '1px solid #A7F3D0', borderRadius: '6px' }}>
            OFFICIAL SCHEDULE
          </span>
        </div>

        <div className="timetable-sequence">
          {stops.map((stop, index) => {
            const isFirst = index === 0;
            const isLast = index === stops.length - 1;

            return (
              <div key={stop.stopId || index} className="timetable-stop-item">
                <div className="tt-node-col">
                  <span className={`tt-node-dot ${isFirst ? 'first' : isLast ? 'last' : ''}`}></span>
                  {!isLast && <span className="tt-node-line"></span>}
                </div>

                <div className="tt-info-col">
                  <div>
                    <div className="tt-stop-title">{stop.stopName}</div>
                    <div className="tt-stop-sub">
                      {isFirst ? "Origin Departure" : isLast ? "Final Terminus" : `Stop ${index + 1}`}
                    </div>
                  </div>

                  <div className="tt-time-pill">
                    {formatTime(stop.arrivalTime) || "--:--"}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
