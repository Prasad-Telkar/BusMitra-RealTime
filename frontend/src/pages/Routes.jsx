import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bus, Map as MapIcon, Bookmark, Search, ChevronRight } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRoutes(query);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const fetchRoutes = async (searchQuery = "") => {
    setLoading(true);
    try {
      const url = searchQuery 
        ? `${API_BASE}/api/search/routes?q=${encodeURIComponent(searchQuery)}&limit=50`
        : `${API_BASE}/api/routes?limit=50`;
      
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setRoutes(data);
      }
    } catch (err) {
      console.error("Failed to fetch routes", err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-screen bg-light">
      <div className="routes-content">
        <h1 className="page-title">Find your bus route</h1>

        <div className="route-search-card" style={{ padding: "16px" }}>
          <div className="search-row" style={{ alignItems: "center" }}>
            <Search size={20} color="var(--teal-800)" />
            <div className="search-input-group" style={{ flex: 1, marginLeft: "12px" }}>
              <input 
                type="text"
                placeholder="Search route number or destination..."
                className="search-value-input"
                style={{ width: "100%", border: "none", outline: "none", fontSize: "16px", background: "transparent" }}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        <div className="results-header">
          <h3>{routes.length} routes found</h3>
          <span>GTFS Schedule</span>
        </div>

        <div className="route-cards">
          {loading && routes.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              Loading routes...
            </div>
          ) : routes.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No routes match your search.
            </div>
          ) : (
            routes.map((route, index) => {
              return (
                <Link 
                  key={route.routeId}
                  to={`/route-detail/${route.routeId}`} 
                  className={`route-result-card`}
                  style={{ display: "block" }}
                >
                  <div className="r-card-top">
                    <div className="r-title-area" style={{ flex: 1 }}>
                      <div className="bus-badge">{route.shortName || "BUS"}</div>
                      <div className="r-route-info" style={{ marginLeft: "12px", paddingRight: "16px" }}>
                        <h4 style={{ lineHeight: "1.3" }}>{route.longName}</h4>
                      </div>
                    </div>
                  </div>
                  
                  <div className="r-card-bottom" style={{ marginTop: "12px" }}>
                    <div className="live-status teal">
                      <span className="live-dot teal"></span> 
                      Scheduled
                    </div>
                    <div className="board-info">
                      View Trips <ChevronRight size={16} color="var(--teal-800)" />
                    </div>
                  </div>
                </Link>
              );
            })
          )}
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
