import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Bookmark, Bus, Navigation, Loader2, Calendar } from "lucide-react";
import io from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { formatTime } from "../utils/timeFormat";
import "./Stops.css";

// Leaflet default marker fix
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const API_BASE = import.meta.env.VITE_API_BASE || "https://busmitra-goa.onrender.com";

export default function StopDetail() {
  const { stopId } = useParams();
  const navigate = useNavigate();
  const [stopDetails, setStopDetails] = useState(null);
  const [isStopLoading, setIsStopLoading] = useState(true);

  const [schedules, setSchedules] = useState([]);
  const [isSchedulesLoading, setIsSchedulesLoading] = useState(true);

  const [routes, setRoutes] = useState([]);
  const [isRoutesLoading, setIsRoutesLoading] = useState(true);

  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchStopDetails();
    fetchSchedules();
    fetchRoutes();
  }, [stopId]);

  useEffect(() => {
    if (stopDetails) {
      const saved = JSON.parse(localStorage.getItem('busmitra_saved_stops') || '[]');
      setIsSaved(saved.some(s => (s.stopId || s._id) === (stopDetails.stopId || stopDetails._id)));
    }
  }, [stopDetails]);

  const toggleSave = () => {
    if (!stopDetails) return;
    const saved = JSON.parse(localStorage.getItem('busmitra_saved_stops') || '[]');
    const id = stopDetails.stopId || stopDetails._id;
    if (isSaved) {
      const newSaved = saved.filter(s => (s.stopId || s._id) !== id);
      localStorage.setItem('busmitra_saved_stops', JSON.stringify(newSaved));
      setIsSaved(false);
    } else {
      saved.push(stopDetails);
      localStorage.setItem('busmitra_saved_stops', JSON.stringify(saved));
      setIsSaved(true);
    }
  };

  const fetchStopDetails = async () => {
    setIsStopLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/search/stops?q=`);
      if (res.ok) {
        const data = await res.json();
        const stop = data.find(s => s.stopId === stopId || s._id === stopId);
        if (stop) setStopDetails(stop);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsStopLoading(false);
    }
  };

  const fetchSchedules = async () => {
    setIsSchedulesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/stops/${stopId}/schedules`);
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.services || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsSchedulesLoading(false);
    }
  };

  const fetchRoutes = async () => {
    setIsRoutesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/stops/${stopId}/routes`);
      if (res.ok) {
        const data = await res.json();
        setRoutes(data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsRoutesLoading(false);
    }
  };

  const lat = stopDetails?.latitude || stopDetails?.lat;
  const lng = stopDetails?.longitude || stopDetails?.lng;

  return (
    <div className="stop-detail-layout">
      {/* HEADER CARD */}
      <div className="stop-detail-header-card">
        <div className="stop-detail-title-group">
          <button 
            type="button" 
            className="tracker-back-btn" 
            onClick={() => navigate(-1)} 
            title="Back"
          >
            <ArrowLeft size={18} />
          </button>

          <div className="stop-detail-icon">
            <MapPin size={24} />
          </div>

          <div>
            <h1 className="stop-detail-h1">
              {isStopLoading ? "Loading Bus Stand..." : (stopDetails?.name || `Stop ${stopId}`)}
            </h1>
            <p className="stop-detail-sub">
              Official KTCL Terminal &bull; Stop ID: {stopId}
            </p>
          </div>
        </div>

        <div className="stop-detail-actions">
          {stopDetails && (
            <button 
              type="button" 
              className={`stop-bookmark-btn ${isSaved ? 'saved' : ''}`}
              onClick={toggleSave}
            >
              <Bookmark size={15} fill={isSaved ? "currentColor" : "none"} />
              <span>{isSaved ? "Bookmarked" : "Save Stop"}</span>
            </button>
          )}

          {stopDetails && (
            <button
              type="button"
              className="stop-navigate-btn"
              onClick={() => navigate(`/journey-planner?to=${encodeURIComponent(stopDetails.name)}&toId=${stopId}`)}
            >
              <Navigation size={15} />
              <span>Plan Trip Here</span>
            </button>
          )}
        </div>
      </div>

      {/* STOP MAP PREVIEW */}
      {lat && lng && (
        <div className="stop-map-card">
          <MapContainer 
            center={[lat, lng]} 
            zoom={15} 
            style={{ height: '100%', width: '100%' }}
            zoomControl={false}
          >
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
            <Marker position={[lat, lng]}>
              <Popup>{stopDetails?.name}</Popup>
            </Marker>
          </MapContainer>
        </div>
      )}

      {/* SCHEDULED TIMETABLE BOARD */}
      <div className="stop-section-block">
        <div className="stop-section-title">
          <Clock size={18} color="#0284C7" />
          <span>Scheduled Departures &amp; Services</span>
        </div>

        {isSchedulesLoading ? (
          <div style={{ padding: '24px', textAlign: 'center', color: '#64748B' }}>
            <Loader2 className="spinner" size={20} color="#0284C7" />
            <p style={{ marginTop: '8px', fontSize: '13px' }}>Loading timetable...</p>
          </div>
        ) : schedules.length === 0 ? (
          <div style={{ padding: '24px', textAlign: 'center', background: '#F8FAFC', borderRadius: '12px', color: '#64748B', fontSize: '14px' }}>
            No scheduled departures found for this stop in current GTFS feed.
          </div>
        ) : (
          <div className="stop-schedule-grid">
            {schedules.map((trip, idx) => (
              <div key={idx} className="stop-schedule-card">
                <div>
                  <div className="stop-schedule-route">Route {trip.routeName}</div>
                  <div className="stop-schedule-dest">To: {trip.headsign || "Destination"}</div>
                </div>
                <div className="stop-schedule-time">
                  {formatTime(trip.arrivalTime) || "Scheduled"}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* CONNECTING ROUTES */}
      <div className="stop-section-block">
        <div className="stop-section-title">
          <Bus size={18} color="#0284C7" />
          <span>Routes Serving This Stand</span>
        </div>

        {isRoutesLoading ? (
          <div style={{ padding: '20px', textAlign: 'center', color: '#64748B' }}>
            <Loader2 className="spinner" size={20} color="#0284C7" />
          </div>
        ) : routes.length === 0 ? (
          <div style={{ padding: '20px', textAlign: 'center', background: '#F8FAFC', borderRadius: '12px', color: '#64748B', fontSize: '14px' }}>
            No registered routes currently linked to this stop.
          </div>
        ) : (
          <div className="stop-routes-pills">
            {routes.map((route, idx) => {
              const busId = route.busId || route._id || route.id;
              return (
                <Link 
                  key={idx} 
                  to={busId ? `/route-detail/${busId}` : "#"} 
                  className="stop-route-chip"
                >
                  <strong>{route.shortName || route.routeName || "Route"}</strong>
                  <span>{route.longName || route.routeName || ""}</span>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
