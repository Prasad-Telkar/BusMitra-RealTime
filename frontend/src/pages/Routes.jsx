import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Bus, Map as MapIcon, Bookmark, LocateFixed, ArrowDownUp, X, Clock, ChevronDown, ChevronRight, Footprints } from "lucide-react";
import StopSearchInput from "../components/StopSearchInput";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

export default function RoutesPage() {
  const [buses, setBuses] = useState({});
  const [fromStation, setFromStation] = useState("Panaji");
  const [toStation, setToStation] = useState("Margao");

  useEffect(() => {
    const fetchBuses = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/buses`);
        if (res.ok) {
          const data = await res.json();
          setBuses(data);
        }
      } catch (err) {
        console.error("Failed to fetch buses", err);
      }
    };
    
    fetchBuses();
    const interval = setInterval(fetchBuses, 5000);
    return () => clearInterval(interval);
  }, []);

  const busList = Object.entries(buses);
  const filteredBuses = busList.filter(([_, busData]) => {
    const stops = busData.eta?.stops || [];
    if (stops.length === 0) return false;

    const fromMatch = fromStation.trim().toLowerCase();
    const toMatch = toStation.trim().toLowerCase();

    const fromIdx = fromMatch ? stops.findIndex(s => s.toLowerCase().includes(fromMatch)) : 0;
    const toIdx = toMatch ? stops.findIndex(s => s.toLowerCase().includes(toMatch)) : stops.length - 1;

    if (fromIdx === -1 || toIdx === -1) return false;
    if (fromMatch && toMatch && fromIdx >= toIdx) return false;
    
    return true;
  });

  return (
    <div className="home-screen bg-light">
      <div className="routes-content">
        <h1 className="page-title">Find your bus</h1>

        <div className="route-search-card">
          <div className="search-row">
            <div className="timeline-dot solid"></div>
            <div className="search-input-group" style={{ flex: 1 }}>
              <span className="search-label">FROM</span>
              <StopSearchInput 
                value={fromStation}
                onChange={setFromStation}
                placeholder="Starting point"
              />
            </div>
            <LocateFixed size={18} color="var(--teal-800)" />
          </div>
          
          <div className="search-divider-row">
            <div className="timeline-line"></div>
            <div className="divider-line"></div>
            <ArrowDownUp size={16} color="var(--teal-800)" style={{ cursor: 'pointer' }} onClick={() => {
              const temp = fromStation;
              setFromStation(toStation);
              setToStation(temp);
            }} />
          </div>

          <div className="search-row">
            <div className="timeline-dot outline"></div>
            <div className="search-input-group" style={{ flex: 1 }}>
              <span className="search-label">TO</span>
              <StopSearchInput 
                value={toStation}
                onChange={setToStation}
                placeholder="Destination"
              />
            </div>
            <X size={18} color="var(--text-muted)" style={{ cursor: 'pointer' }} onClick={() => setToStation("")} />
          </div>
        </div>

        <div className="filter-row">
          <button className="filter-btn active">
            <Clock size={14} /> Leave now <ChevronDown size={14} />
          </button>
          <button className="filter-btn outline">
            <Bus size={14} /> Direct buses <ChevronDown size={14} />
          </button>
        </div>

        <div className="results-header">
          <h3>{filteredBuses.length} direct routes</h3>
          <span>Today - Live</span>
        </div>

        <div className="route-cards">
          {filteredBuses.length === 0 ? (
            <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
              No routes available right now.
            </div>
          ) : (
            filteredBuses.map(([busId, busData], index) => {
              const { eta } = busData;
              const isSignalWeak = eta?.status === "stale";
              const isPrimary = index === 0;

              return (
                <Link 
                  key={busId}
                  to={`/route-detail/${busId}`} 
                  className={`route-result-card ${isPrimary ? 'active-route' : ''}`}
                >
                  <div className="r-card-top">
                    <div className="r-title-area">
                      <div className={`bus-badge ${isSignalWeak ? 'amber' : ''}`}>{eta?.bus_number}</div>
                      <div className="r-route-info">
                        <h4>{eta?.stops?.[eta?.stops?.length - 1]}</h4>
                        <p>Via {eta?.stops?.slice(1, -1).join(", ")}</p>
                      </div>
                    </div>
                    {isSignalWeak ? (
                      <div style={{ fontSize: '12px', fontWeight: '600', color: '#92400E' }}>Cached</div>
                    ) : (
                      <div className="r-eta-area">
                        <span className="r-massive-min teal">{Math.floor(eta?.eta_minutes || 0)}</span>
                        <span className="r-min-label">min away</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="r-middle-row">
                    <strong>Bus Ride</strong> &middot; {eta?.stops?.length} stops
                    {isPrimary && <span className="badge-fastest">FASTEST</span>}
                  </div>
                  
                  <div className="r-card-bottom">
                    <div className={isSignalWeak ? "live-status amber" : "live-status teal"}>
                      <span className={isSignalWeak ? "live-dot amber" : "live-dot teal"}></span> 
                      {isSignalWeak ? `Signal Weak · last updated ${Math.floor((eta?.signal_age_sec || 0)/60)}m ago` : `Live · updated ${Math.floor(eta?.signal_age_sec || 0)}s ago`}
                    </div>
                    <div className="board-info">
                      Details <ChevronRight size={16} color="var(--teal-800)" />
                    </div>
                  </div>
                </Link>
              );
            })
          )}
        </div>

        <div className="demo-data-note">
          Official KTC Partner
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
