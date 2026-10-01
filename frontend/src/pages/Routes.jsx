import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bus, Map as MapIcon, Bookmark, Search, ChevronRight, Crosshair, X, ArrowUpDown, Clock, ChevronDown } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

export default function RoutesPage() {
  const [routes, setRoutes] = useState([]);
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchRoutes();
  }, []);

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchRoutes(fromQuery, toQuery);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [fromQuery, toQuery]);

  const fetchRoutes = async (from = "", to = "") => {
    setLoading(true);
    try {
      let url = `${API_BASE}/api/routes?limit=50`;
      if (from || to) {
        const params = new URLSearchParams();
        if (from) params.append("from", from);
        if (to) params.append("to", to);
        params.append("limit", "50");
        url = `${API_BASE}/api/search/routes?${params.toString()}`;
      }
      
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

  const popularDestinations = [
    { from: "Panaji", to: "Margao" },
    { from: "Panaji", to: "Ponda" },
    { from: "Margao", to: "Vasco" },
    { from: "Panaji", to: "Mapusa" },
    { from: "Ponda", to: "Margao" },
    { from: "Panaji", to: "Old Goa" },
  ];

  return (
    <div className="home-screen bg-light">
      <div className="routes-content">
        <h1 className="page-title">Find your bus</h1>

        <div className="route-search-card" style={{ padding: "16px", borderRadius: "12px", border: "1px solid #eaeaea", backgroundColor: "#fff", marginBottom: "16px", boxShadow: "0 2px 8px rgba(0,0,0,0.05)" }}>
          <div style={{ display: "flex", alignItems: "flex-start" }}>
            {/* Icons column */}
            <div style={{ display: "flex", flexDirection: "column", alignItems: "center", marginRight: "16px", paddingTop: "8px" }}>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", backgroundColor: "var(--teal-800)", marginBottom: "4px" }}></div>
              <div style={{ width: "2px", height: "30px", backgroundColor: "#eaeaea", margin: "2px 0" }}></div>
              <div style={{ width: "12px", height: "12px", borderRadius: "50%", border: "2px solid var(--teal-800)", marginTop: "4px", backgroundColor: "white" }}></div>
            </div>
            
            {/* Inputs column */}
            <div style={{ flex: 1 }}>
              {/* FROM Input */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingBottom: "12px", borderBottom: "1px solid #eaeaea" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "10px", fontWeight: "bold", color: "#888", letterSpacing: "1px", marginBottom: "4px" }}>FROM</div>
                  <input 
                    type="text"
                    placeholder="Enter origin..."
                    style={{ width: "100%", border: "none", outline: "none", fontSize: "18px", fontWeight: "600", color: "#333", background: "transparent" }}
                    value={fromQuery}
                    onChange={(e) => setFromQuery(e.target.value)}
                  />
                </div>
                <div style={{ padding: "4px", color: "var(--teal-800)", cursor: "pointer" }}>
                  <Crosshair size={18} />
                </div>
              </div>
              
              {/* TO Input */}
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px" }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: "10px", fontWeight: "bold", color: "#888", letterSpacing: "1px", marginBottom: "4px" }}>TO</div>
                  <input 
                    type="text"
                    placeholder="Enter destination..."
                    style={{ width: "100%", border: "none", outline: "none", fontSize: "18px", fontWeight: "600", color: "#333", background: "transparent" }}
                    value={toQuery}
                    onChange={(e) => setToQuery(e.target.value)}
                  />
                </div>
                {toQuery && (
                  <div style={{ padding: "4px", color: "#888", cursor: "pointer" }} onClick={() => setToQuery('')}>
                    <X size={18} />
                  </div>
                )}
              </div>
            </div>
            
            {/* Swap icon */}
            <div 
              style={{ marginLeft: "12px", alignSelf: "center", padding: "8px", color: "var(--teal-800)", cursor: "pointer" }}
              onClick={() => {
                const temp = fromQuery;
                setFromQuery(toQuery);
                setToQuery(temp);
              }}
            >
              <ArrowUpDown size={20} />
            </div>
          </div>
        </div>

        {/* Filters */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#f0fdf4", color: "var(--teal-800)", padding: "8px 16px", borderRadius: "20px", fontSize: "14px", fontWeight: "500", border: "1px solid #bbf7d0", cursor: "pointer" }}>
            <Clock size={16} /> Leave now <ChevronDown size={16} />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", backgroundColor: "#fff", color: "var(--teal-800)", padding: "8px 16px", borderRadius: "20px", fontSize: "14px", fontWeight: "500", border: "1px solid #eaeaea", cursor: "pointer" }}>
            <Bus size={16} /> Direct buses <ChevronDown size={16} />
          </div>
        </div>

        {!fromQuery && !toQuery ? (
          <div className="popular-routes">
            <h3 style={{ fontSize: "16px", fontWeight: "700", marginBottom: "16px", color: "#333" }}>Popular Destinations in Goa</h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              {popularDestinations.map((dest, i) => (
                <div 
                  key={i} 
                  style={{ 
                    backgroundColor: "#fff", 
                    border: "1px solid #eaeaea", 
                    borderRadius: "8px", 
                    padding: "12px", 
                    display: "flex", 
                    alignItems: "center", 
                    gap: "8px",
                    cursor: "pointer",
                    boxShadow: "0 1px 3px rgba(0,0,0,0.02)"
                  }}
                  onClick={() => {
                    setFromQuery(dest.from);
                    setToQuery(dest.to);
                  }}
                >
                  <MapIcon size={16} color="var(--teal-800)" style={{ flexShrink: 0 }} />
                  <span style={{ fontWeight: "600", fontSize: "13px", color: "#444", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{dest.from} &rarr; {dest.to}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="results-header">
              <h3>{loading ? 'Searching...' : `${routes.length} routes found`}</h3>
              <span>GTFS Schedule</span>
            </div>

            <div className="route-cards">
              {loading && routes.length === 0 ? (
                <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                  Loading routes...
                </div>
              ) : !loading && routes.length === 0 ? (
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
                      <div className="bus-badge">{route.routeNumber || route.shortName || "BUS"}</div>
                      <div className="r-route-info" style={{ marginLeft: "12px", paddingRight: "16px" }}>
                        <h4 style={{ lineHeight: "1.3" }}>{route.routeName || route.longName}</h4>
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
          </>
        )}
      </div>
    </div>
  );
}
