import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bus, Map as MapIcon, Search, ChevronRight, ArrowUpDown, X, Loader2 } from "lucide-react";
import "./Routes.css";

const API_BASE = import.meta.env.VITE_API_BASE || "https://busmitra-goa.onrender.com";

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
        const uniqueRoutes = [];
        const seenNames = new Set();
        for (const route of data) {
          const name = route.routeName || route.longName;
          if (!seenNames.has(name)) {
            seenNames.add(name);
            uniqueRoutes.push(route);
          }
        }
        setRoutes(uniqueRoutes);
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
    <div className="routes-container">
      {/* HEADER */}
      <div className="routes-header">
        <span className="routes-badge">Transit Network</span>
        <h1 className="routes-title">Bus Routes &amp; Lines</h1>
        <p className="routes-sub">
          Search connecting Kadamba Transport Corporation (KTCL) bus services across Goa.
        </p>
      </div>

      {/* SEARCH CARD */}
      <div className="routes-search-card">
        <div className="routes-search-fields">
          <div className="routes-input-box">
            <Search size={16} color="#0284C7" />
            <input 
              type="text" 
              placeholder="Origin stop (e.g. Panaji)..."
              value={fromQuery}
              onChange={(e) => setFromQuery(e.target.value)}
            />
            {fromQuery && (
              <X size={16} color="#94A3B8" style={{ cursor: 'pointer' }} onClick={() => setFromQuery("")} />
            )}
          </div>

          <button 
            type="button" 
            className="routes-swap-btn" 
            onClick={() => {
              const temp = fromQuery;
              setFromQuery(toQuery);
              setToQuery(temp);
            }}
            title="Swap Origin and Destination"
          >
            <ArrowUpDown size={16} />
          </button>

          <div className="routes-input-box">
            <Search size={16} color="#0284C7" />
            <input 
              type="text" 
              placeholder="Destination stop (e.g. Margao)..."
              value={toQuery}
              onChange={(e) => setToQuery(e.target.value)}
            />
            {toQuery && (
              <X size={16} color="#94A3B8" style={{ cursor: 'pointer' }} onClick={() => setToQuery("")} />
            )}
          </div>
        </div>

        {/* POPULAR TRIPS */}
        <div className="popular-chips-wrap">
          <div className="popular-chips-label">Popular Goa Corridors</div>
          <div className="popular-chips-grid">
            {popularDestinations.map((dest, i) => (
              <button 
                key={i} 
                type="button" 
                className="popular-chip-btn"
                onClick={() => {
                  setFromQuery(dest.from);
                  setToQuery(dest.to);
                }}
              >
                <span>{dest.from}</span>
                <span className="arr">&rarr;</span>
                <span>{dest.to}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* RESULTS GRID */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            {fromQuery || toQuery ? "Search Results" : "All Scheduled Routes"}
          </h2>
          <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
            {loading ? "Searching..." : `${routes.length} Routes Available`}
          </span>
        </div>

        {loading ? (
          <div className="routes-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ height: '110px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', opacity: 0.6 }} />
            ))}
          </div>
        ) : routes.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <Bus size={36} color="#94A3B8" style={{ marginBottom: '8px' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', color: '#0F172A' }}>No matching routes found</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>Try clearing the origin or destination filter to browse all routes.</p>
          </div>
        ) : (
          <div className="routes-grid">
            {routes.map(route => {
              const routeId = route.routeId || route._id;
              const routeNum = route.routeNumber || route.shortName || "KTC";
              const routeName = route.routeName || route.longName;
              return (
                <Link key={routeId} to={`/route-detail/${routeId}`} className="route-card-link">
                  <div className="route-card-head">
                    <span className="route-badge">{routeNum}</span>
                    <h3 className="route-name-text">{routeName}</h3>
                  </div>

                  <div className="route-card-bottom">
                    <span className="route-status-tag">
                      <span className="live-dot" style={{ background: '#10B981', width: '6px', height: '6px', borderRadius: '50%' }}></span>
                      Official Schedule
                    </span>
                    <span className="route-action-link">
                      <span>View Trips</span>
                      <ChevronRight size={15} />
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
