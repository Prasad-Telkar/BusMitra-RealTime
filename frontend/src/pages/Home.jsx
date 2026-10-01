import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ChevronDown, MapPin, Bus, ArrowRight, Bookmark, Map as MapIcon, RefreshCw } from "lucide-react";

const API_BASE = "http://localhost:5001";

export default function Home() {
  const [buses, setBuses] = useState({});
  const navigate = useNavigate();

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

  return (
    <div className="home-screen">
      <div className="home-content">
        <header className="home-header">
          <div className="header-top">
            <div className="brand-logo">
              <div style={{ background: 'var(--teal-800)', borderRadius: '8px', padding: '4px' }}>
                <Bus size={20} color="white" />
              </div>
              <h2>BusMitra</h2>
            </div>
            <div className="location-dropdown">
              Goa <ChevronDown size={16} />
            </div>
          </div>
          <p className="tagline">Know your bus. Know your time.</p>
        </header>

        <section className="search-section">
          <h1>Track your bus</h1>
          <div className="search-box">
            <Search size={18} color="var(--text-muted)" />
            <input type="text" placeholder="Search bus number, route, or stop" />
            <div className="language-selector">
              English <ChevronDown size={14} />
            </div>
          </div>
        </section>

        <section className="operator-section">
          <span className="section-label">OPERATOR</span>
          <div className="operator-pills">
            <button className="op-pill active">
              <span className="dot amber"></span> Kadamba
            </button>
            <button className="op-pill inactive">
              <span className="dot gray"></span> Local / private - coming soon
            </button>
          </div>
        </section>

        <section className="live-buses-section">
          <div className="section-header">
            <h3>Live buses</h3>
            <span className="view-all">View all</span>
          </div>

          <div className="bus-cards">
            {busList.length === 0 ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No active buses found right now. Start a trip from the Driver app to see live tracking.
              </div>
            ) : (
              busList.map(([busId, busData], index) => {
                const { eta } = busData;
                const isSignalWeak = eta?.status === "stale";
                const isOffline = eta?.status === "offline";
                const isPrimary = index === 0;

                return (
                  <Link
                    key={busId}
                    to={`/track/${busId}`}
                    className={`bus-card ${isPrimary ? 'primary-card' : 'secondary-card'} ${isSignalWeak || isOffline ? 'weak' : ''}`}
                  >
                    {isPrimary ? (
                      <>
                        <div className="card-top">
                          <div className="card-title-area">
                            <div className={`bus-badge ${isSignalWeak || isOffline ? 'amber' : ''}`}>{eta?.bus_number}</div>
                            <div className="bus-route-info">
                              <h4>{eta?.route_name}</h4>
                              <p>Via {eta?.stops?.slice(1, -1).join(", ")}</p>
                            </div>
                          </div>
                          {isSignalWeak ? (
                            <div style={{ fontSize: '12px', fontWeight: '600', color: '#92400E' }}>Cached</div>
                          ) : (
                            <div className="card-eta-area">
                              <span className="massive-min">{Math.floor(eta?.eta_minutes || 0)}</span>
                              <span className="min-label">min</span>
                            </div>
                          )}
                        </div>

                        <div className="card-next-stop" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div><MapPin size={14} color={isSignalWeak ? "#B45309" : "var(--teal-100)"} /> Next stop: {eta?.stops?.[1] || "Unknown"}</div>
                          <div style={{ fontSize: '12px', fontWeight: '600', color: 'var(--teal-800)', background: 'var(--teal-100)', padding: '2px 6px', borderRadius: '4px' }}>{eta?.trip_status || "On Time"}</div>
                        </div>

                        <div className="card-bottom">
                          <div className={(isSignalWeak || isOffline) ? "live-status amber" : "live-status teal"}>
                            <span className={(isSignalWeak || isOffline) ? "live-dot amber" : "live-dot teal"}></span>
                            {isOffline ? `Offline · last updated ${Math.floor((eta?.signal_age_sec || 0) / 60)}m ago` : isSignalWeak ? `Signal Weak · ${Math.floor((eta?.signal_age_sec || 0) / 60)}m ago` : `Live GPS · ${Math.floor(eta?.signal_age_sec || 0)}s ago`}
                          </div>
                          <div className="track-action">
                            Track bus <ArrowRight size={16} />
                          </div>
                        </div>
                      </>
                    ) : (
                      <div className="card-row">
                        <div className="card-title-area">
                          <div className={`bus-badge ${(isSignalWeak || isOffline) ? 'amber' : ''}`}>{eta?.bus_number}</div>
                          <div className="bus-route-info">
                            <h4>{eta?.route_name}</h4>
                            <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginTop: '4px' }}>
                              <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--teal-800)', background: 'var(--teal-100)', padding: '2px 6px', borderRadius: '4px' }}>{eta?.trip_status || "On Time"}</span>
                              {isOffline ? (
                                <div className="status-delay muted" style={{ marginTop: 0 }}><span className="amber-dot"></span> Offline</div>
                              ) : isSignalWeak ? (
                                <div className="status-delay muted" style={{ marginTop: 0 }}><span className="amber-dot"></span> Signal Weak</div>
                              ) : (
                                <div className="status-delay" style={{ marginTop: 0 }}><span className="delay-dot"></span> Live GPS</div>
                              )}
                            </div>
                            <div className="card-next-stop muted">
                              <MapPin size={14} /> Next: {eta?.stops?.[1] || "Unknown"}
                            </div>
                          </div>
                        </div>
                        {(isSignalWeak || isOffline) ? (
                          <div style={{ fontSize: '12px', fontWeight: '600', color: '#92400E' }}>Cached</div>
                        ) : (
                          <div className="card-eta-area">
                            <span className="massive-min">{Math.floor(eta?.eta_minutes || 0)}</span>
                            <span className="min-label">min</span>
                          </div>
                        )}
                      </div>
                    )}
                  </Link>
                );
              })
            )}
          </div>

          <div className="demo-data-note">
            Demo data · No official KTC integration
          </div>
        </section>
      </div>

      <nav className="bottom-nav">
        <Link to="/passenger" className="nav-item active">
          <Bus size={24} />
          Nearby
        </Link>
        <Link to="/routes" className="nav-item">
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
