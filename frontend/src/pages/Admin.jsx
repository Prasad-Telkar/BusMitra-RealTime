import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, ChevronDown, RefreshCw, Bus, LayoutDashboard, Map as MapIcon, Clock } from "lucide-react";

const API_BASE = "http://localhost:5001";

export default function Admin() {
  const [buses, setBuses] = useState({});

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

  // Compute active count from real data
  const activeCount = Object.keys(buses).length;

  return (
    <div className="admin-layout">
      {/* Desktop Sidebar */}
      <aside className="admin-sidebar">
        <div className="as-brand">
          <div className="as-logo-icon"><Bus size={18} color="#fff" /></div>
          <h2>BusMitra</h2>
        </div>
        <p className="as-slogan">Know your bus.<br/>Know your time.</p>
        
        <div className="as-workspace-info">
          <span className="as-role">GOA - FLEET ADMIN</span>
          <span className="as-ws">Demo workspace</span>
        </div>

        <nav className="as-nav">
          <a href="#" className="as-nav-item active"><LayoutDashboard size={18} /> Fleet overview</a>
          <a href="#" className="as-nav-item"><MapIcon size={18} /> Demo routes</a>
          <a href="#" className="as-nav-item"><HelpCircle size={18} /> Help &amp; guidance</a>
        </nav>

        <div className="as-footer">
          <p><strong>Kadamba demo fleet</strong></p>
          <p>Local / private support coming soon.</p>
        </div>
      </aside>

      <main className="admin-main">
        {/* Mobile Header (Hidden on Desktop) */}
        <header className="admin-header mobile-only">
          <div className="ah-left">
            <h1>BusMitra Fleet</h1>
            <p>Goa &middot; Admin &middot; Demo workspace</p>
            <p className="ah-sub">Demo data &middot; No official KTC integration</p>
          </div>
          <HelpCircle size={24} color="var(--teal-700)" />
        </header>

        {/* Desktop Header */}
        <header className="admin-header desktop-only">
          <div className="ah-left">
            <h1>Fleet overview</h1>
            <p className="ah-sub">Demo data - No official KTC integration</p>
          </div>
          <div className="ah-right">
            <Clock size={16} color="var(--text-muted)" />
            <span>Demo snapshot - 8:42 AM</span>
          </div>
        </header>

        <div className="admin-section-label">SAMPLE FLEET / DEMO &middot; REAL BACKEND DATA</div>

        <div className="stats-grid">
          <div className="stat-card">
            <span className="sc-label">Active</span>
            <span className="sc-value teal">{activeCount}</span>
            <span className="sc-sub">Live from backend</span>
          </div>
          <div className="stat-card">
            <span className="sc-label">On Time</span>
            <span className="sc-value teal">{Object.values(buses).filter(b => b.status !== "stale").length}</span>
            <span className="sc-sub">Live tracking</span>
          </div>
          <div className="stat-card">
            <span className="sc-label">Delayed</span>
            <span className="sc-value">0</span>
            <span className="sc-sub">Slight Delay: possible</span>
          </div>
          <div className="stat-card">
            <span className="sc-label">Signal Weak</span>
            <span className="sc-value">{Object.values(buses).filter(b => b.status === "stale").length}</span>
            <span className="sc-sub">Cached location</span>
          </div>
        </div>
        <p className="admin-note">Data from active backend.</p>

        <div className="admin-filters">
          <div className="af-tabs">
            <div className="af-tab active">Kadamba</div>
            <div className="af-tab disabled">Local / private - coming soon</div>
          </div>
          <div className="af-dropdown">
            <span>All active routes</span>
            <ChevronDown size={16} />
          </div>
        </div>

        <div className="admin-split-view">
          <section className="live-fleet-map-section">
            <div className="lfm-header">
              <h3>Live fleet map</h3>
              <span className="desktop-only">Driver smartphone GPS</span>
              <span className="mobile-only">Online</span>
            </div>
            
            <div className="mock-map-container">
              <div className="mm-badge">DEMO REGION - NOT TO SCALE</div>
              <div className="mm-nodes">
                <span className="mm-loc" style={{ top: '30%', left: '15%' }}>Panaji</span>
                <span className="mm-loc" style={{ top: '15%', left: '70%' }}>Mapusa</span>
                <span className="mm-loc" style={{ top: '50%', left: '80%' }}>Ponda</span>
                <span className="mm-loc" style={{ top: '80%', left: '15%' }}>Vasco</span>
              </div>
              <svg className="mm-lines">
                <line x1="20%" y1="35%" x2="50%" y2="25%" stroke="rgba(0,0,0,0.1)" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="50%" y1="25%" x2="75%" y2="55%" stroke="rgba(0,0,0,0.1)" strokeWidth="2" strokeDasharray="4 4" />
                <line x1="20%" y1="35%" x2="55%" y2="80%" stroke="rgba(0,0,0,0.1)" strokeWidth="2" strokeDasharray="4 4" />
              </svg>
              <div className="mm-buses">
                {Object.values(buses).map((bus, idx) => {
                  const isStale = bus.status === "stale";
                  return (
                    <div key={bus.bus_id} className={`bus-map-pin ${isStale ? 'amber-outline' : 'teal'}`} style={{ top: `${35 + idx * 10}%`, left: `${25 + idx * 10}%` }}>
                      {bus.bus_number}
                    </div>
                  );
                })}
              </div>
            </div>
            <div className="lfm-legend">
              <span className="legend-item"><span className="dot teal"></span> Real GPS</span>
              <span className="legend-item"><span className="dot amber hollow"></span> Weak / Stale</span>
              <span className="legend-item"><span className="dot gray"></span> Offline</span>
            </div>
            <p className="lfm-note">Map pins are illustrative positioning for demo.</p>
          </section>

          <div className="featured-alert-col">
            <h3 className="desktop-only fac-desktop-title">Selected bus</h3>
            <div className="featured-alert-card">
              <div className="fac-header">
                <div className="bus-badge amber">Demo</div>
                <div className="fac-h-text">
                  <span className="fac-op">KADAMBA - DEMO BUS</span>
                  <h4>Select a bus from list</h4>
                </div>
              </div>

              <div className="fac-warning-box">
                <strong>Fleet monitor</strong>
                <p>Clicking on buses will show details here.</p>
              </div>

              <div className="fac-details">
                <p className="fac-desc">
                  This panel will show alerts, delays, and stale connections when integrated with full admin actions.
                </p>
              </div>

              <button className="btn-outline fac-btn" onClick={() => window.location.reload()}>
                <RefreshCw size={16} /> Refresh Backend
              </button>
            </div>
          </div>
        </div>

        <section className="admin-list-section">
          <div className="al-header">
            <h3>Buses &amp; routes</h3>
            <span>{activeCount} active trips</span>
          </div>

          <div className="al-chips">
            <span className="al-chip active">All &middot; {activeCount}</span>
            <span className="al-chip">Live &middot; {Object.values(buses).filter(b => b.status !== "stale").length}</span>
            <span className="al-chip">Signal Weak &middot; {Object.values(buses).filter(b => b.status === "stale").length}</span>
          </div>

          {/* Mobile Cards */}
          <div className="admin-list-cards mobile-only">
            {Object.entries(buses).map(([busId, bus]) => {
              const isStale = bus.status === "stale";
              const destination = bus.stops && bus.stops.length > 0 ? bus.stops[bus.stops.length - 1] : "Unknown";
              const origin = bus.stops && bus.stops.length > 0 ? bus.stops[0] : "Unknown";
              const nextStop = bus.stops && bus.stops.length > 1 ? bus.stops[1] : "Unknown";
              
              return (
                <div key={busId} className={`list-route-card ${isStale ? 'border-teal alert-highlight' : ''}`}>
                  <div className="lrc-header">
                    <div className={`bus-badge ${isStale ? 'amber' : ''}`}>{bus.bus_number}</div>
                    <div className="lrc-title">
                      <h4>{origin} &rarr; {destination}</h4>
                      <span className={`lrc-status ${isStale ? 'gray' : 'teal'}`}>
                        {isStale ? 'Signal Weak' : 'Live'} &middot; {Math.floor(bus.signal_age_sec)} sec ago
                      </span>
                    </div>
                  </div>
                  <p className="lrc-next">
                    {isStale 
                      ? `Last known &middot; ${(bus.signal_age_sec / 60).toFixed(0)} min ago` 
                      : `Next: ${nextStop} \u00B7 ETA ${Math.floor(bus.eta_minutes)} min`
                    }
                  </p>
                  {isStale ? (
                    <p className="lrc-health-row">
                      <span className="teal">Cached -</span> <span className="gray">Current ETA unavailable</span>
                    </p>
                  ) : (
                    <span className="lrc-health teal">On Time</span>
                  )}
                </div>
              );
            })}
          </div>

          {/* Desktop Table */}
          <div className="admin-desktop-table desktop-only">
            <table>
              <thead>
                <tr>
                  <th>Bus</th>
                  <th>Kadamba route</th>
                  <th>Trip timing</th>
                  <th>GPS / connection</th>
                  <th>Next stop / last place</th>
                  <th>ETA</th>
                </tr>
              </thead>
              <tbody>
                {Object.entries(buses).map(([busId, bus]) => {
                  const isStale = bus.status === "stale";
                  const destination = bus.stops && bus.stops.length > 0 ? bus.stops[bus.stops.length - 1] : "Unknown";
                  const origin = bus.stops && bus.stops.length > 0 ? bus.stops[0] : "Unknown";
                  const nextStop = bus.stops && bus.stops.length > 1 ? bus.stops[1] : "Unknown";

                  return (
                    <tr key={busId} className={isStale ? "alert-highlight" : ""}>
                      <td><div className={`bus-badge ${isStale ? 'amber' : ''}`}>{bus.bus_number}</div></td>
                      <td className="fw-bold text-main">{origin} &rarr; {destination}</td>
                      <td className={isStale ? "teal fw-bold" : "teal fw-bold"}>
                        {isStale ? "Cached Data" : "On Time"}
                      </td>
                      <td>
                        <div className="td-stack">
                          <span className={`${isStale ? 'amber' : 'teal'} fw-bold`}>{isStale ? 'Signal Weak' : 'Live GPS'}</span>
                          <span className="text-muted">{Math.floor(bus.signal_age_sec)} sec ago</span>
                        </div>
                      </td>
                      <td>
                        <div className="td-stack">
                          <span className="text-main">{isStale ? `Near ${origin}` : nextStop}</span>
                          <span className="text-muted">{isStale ? 'Last known location' : 'Upcoming'}</span>
                        </div>
                      </td>
                      <td>
                        <div className="td-stack">
                          <span className="fw-bold text-main">{isStale ? 'Unavailable' : `${Math.floor(bus.eta_minutes)} min`}</span>
                          {isStale && <span className="text-muted">Stale, not live</span>}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>

        <p className="admin-footer">
          Real-time data from backend. Map pins are illustrative.
        </p>
      </main>

      <nav className="bottom-nav mobile-only">
        <Link to="/admin" className="nav-item active">
          <HelpCircle size={24} style={{ transform: 'rotate(180deg)', fill: 'var(--teal-700)', color: 'white' }} />
          Fleet
        </Link>
        <Link to="/routes" className="nav-item">
          <MapIcon size={24} />
          Routes
        </Link>
        <Link to="/admin" className="nav-item">
          <HelpCircle size={24} />
          Help
        </Link>
      </nav>
    </div>
  );
}
