import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bookmark, Bus, ChevronRight, Clock, Loader2 } from "lucide-react";
import "./Routes.css";

const API_BASE = import.meta.env.VITE_API_BASE || "https://busmitra-goa.onrender.com";

export default function RouteDetail() {
  const { busId: routeId } = useParams();
  const navigate = useNavigate();
  const [route, setRoute] = useState(null);
  const [trips, setTrips] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchRouteData = async () => {
      try {
        const [routeRes, tripsRes] = await Promise.all([
          fetch(`${API_BASE}/api/routes/${routeId}`),
          fetch(`${API_BASE}/api/routes/${routeId}/trips`)
        ]);
        
        if (routeRes.ok) setRoute(await routeRes.json());
        if (tripsRes.ok) setTrips(await tripsRes.json());
      } catch (err) {
        console.error("Failed to fetch route data", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchRouteData();
  }, [routeId]);

  if (loading) {
    return (
      <div className="route-detail-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Loader2 className="spinner" size={24} color="#0284C7" />
        <p style={{ marginTop: '12px', color: '#64748B' }}>Loading route trips...</p>
      </div>
    );
  }

  if (!route) {
    return (
      <div className="route-detail-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <h2 style={{ color: '#0F172A' }}>Route Not Found</h2>
        <p style={{ color: '#64748B' }}>The requested route could not be found.</p>
        <button type="button" className="btn-primary" onClick={() => navigate(-1)} style={{ maxWidth: '200px', margin: '20px auto' }}>
          Back to Routes
        </button>
      </div>
    );
  }

  const routeNum = route.routeNumber || route.shortName || "BUS";
  const routeName = route.routeName || route.longName;

  return (
    <div className="route-detail-container">
      {/* HEADER CARD */}
      <div className="rd-header-card">
        <button type="button" className="tracker-back-btn" onClick={() => navigate(-1)} title="Back">
          <ArrowLeft size={18} />
        </button>

        <div className="rd-icon-box">
          <Bus size={24} />
        </div>

        <div className="rd-titles">
          <h1>Route {routeNum} &bull; {routeName}</h1>
          <p>Kadamba Transport Corporation &bull; {trips.length} Scheduled Trips</p>
        </div>
      </div>

      {/* SCHEDULED TRIPS LIST */}
      <div className="timetable-card">
        <div className="timetable-header-row">
          <h2>Scheduled Services &amp; Trips</h2>
          <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
            {trips.length} Trips Listed
          </span>
        </div>

        {trips.length === 0 ? (
          <div style={{ color: "#64748B", textAlign: "center", padding: "30px 20px", background: "#F8FAFC", borderRadius: "12px" }}>
            No individual trips currently published for this route in the GTFS timetable.
          </div>
        ) : (
          <div className="routes-grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))' }}>
            {trips.map(trip => (
              <Link 
                key={trip.tripId} 
                to={`/trip/${trip.tripId}`} 
                className="route-card-link"
              >
                <div>
                  <span className="route-badge" style={{ fontSize: '11px', padding: '4px 8px' }}>
                    {trip.serviceId || "DAILY"}
                  </span>
                  <h3 className="route-name-text" style={{ marginTop: '8px' }}>
                    Towards {trip.headsign || routeName}
                  </h3>
                </div>

                <div className="route-card-bottom">
                  <span style={{ color: '#64748B', fontWeight: 600 }}>Trip ID: {trip.tripId}</span>
                  <span className="route-action-link">
                    <span>Timetable</span>
                    <ChevronRight size={14} />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
