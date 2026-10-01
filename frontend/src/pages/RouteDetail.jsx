import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bookmark, Bus, Map as MapIcon, ChevronRight } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

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
    return <div style={{ padding: "20px" }}>Loading route details...</div>;
  }

  if (!route) {
    return <div style={{ padding: "20px" }}>Route not found.</div>;
  }

  return (
    <div className="home-screen bg-light route-detail-screen">
      <div className="routes-content" style={{ paddingBottom: '100px' }}>
        
        <header className="rd-header">
          <button className="icon-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} color="var(--text-main)" />
          </button>
          <div className="rd-title-group">
            <h1>{route.routeNumber || route.shortName || "BUS"}</h1>
            <p>Kadamba &middot; {route.routeName || route.longName}</p>
          </div>
          <button className="icon-btn">
            <Bookmark size={24} color="var(--teal-800)" />
          </button>
        </header>

        <div className="rd-main-info" style={{ marginBottom: "20px" }}>
          <div className="bus-badge">{route.routeNumber || route.shortName || "KTC"}</div>
          <div className="rd-dest-info">
            <div className="rd-dest-line">{route.routeName || route.longName}</div>
            <div className="rd-stops-count">{trips.length} scheduled trips</div>
          </div>
        </div>

        <div className="timeline-section" style={{ background: "transparent", border: "none", padding: 0 }}>
          <div className="timeline-header" style={{ marginBottom: "12px" }}>
            <h3>Scheduled Trips</h3>
          </div>

          <div className="route-cards">
            {trips.length === 0 ? (
              <div style={{ color: "var(--text-muted)", textAlign: "center", padding: "20px" }}>
                No trips scheduled for this route.
              </div>
            ) : (
              trips.map(trip => (
                <Link 
                  key={trip.tripId} 
                  to={`/trip/${trip.tripId}`} 
                  className="route-result-card" 
                  style={{ display: "block" }}
                >
                  <div className="r-card-top" style={{ alignItems: "center" }}>
                    <div className="r-title-area" style={{ flex: 1 }}>
                      <h4 style={{ margin: 0, fontSize: "16px", color: "var(--text-main)" }}>
                        {trip.headsign || route.routeName || route.longName}
                      </h4>
                      <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "var(--text-light)" }}>
                        Service: {trip.serviceId}
                      </p>
                    </div>
                    <ChevronRight size={20} color="var(--border-color)" />
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </div>

      <nav className="bottom-nav">
        <Link to="/passenger" className="nav-item">
          <Bus size={24} />
          Nearby
        </Link>
        <Link to="/routes" className="nav-item active">
          <MapIcon size={24} />
          Routes
        </Link>
        <Link to="/saved" className="nav-item">
          <Bookmark size={24} />
          Saved
        </Link>
      </nav>
    </div>
  );
}
