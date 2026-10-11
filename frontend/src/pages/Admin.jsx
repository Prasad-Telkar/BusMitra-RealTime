import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { 
  Bus, LayoutDashboard, Map as MapIcon, Clock, RefreshCw, 
  HelpCircle, ChevronRight, Activity, ShieldCheck, Database,
  Radio, ArrowRight
} from "lucide-react";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import "./Admin.css";

const API_BASE = import.meta.env.VITE_API_BASE || "https://busmitra-goa.onrender.com";

const createBusIcon = (busNumber, isStale) => {
  return new L.DivIcon({
    html: `<div style="background: ${isStale ? '#D97706' : '#0284C7'}; color: white; font-weight: 800; font-size: 11px; padding: 4px 8px; border-radius: 6px; border: 2px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.2); white-space: nowrap;">${busNumber}</div>`,
    className: "custom-leaflet-marker",
    iconSize: [44, 24],
    iconAnchor: [22, 12],
  });
};

export default function Admin() {
  const [buses, setBuses] = useState({});
  const [routes, setRoutes] = useState([]);
  const [activeTab, setActiveTab] = useState("fleet"); // 'fleet' | 'routes'
  const [selectedAdminBus, setSelectedAdminBus] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const fetchBuses = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/fleet`);
      if (res.ok) {
        const data = await res.json();
        const fleetData = (data.fleet || []).reduce((acc, bus) => {
          acc[bus.activeTripId] = {
            bus_id: bus.activeTripId,
            bus_number: bus.busId || "Unknown",
            route_name: bus.routeId || "Unknown Route",
            eta_minutes: 0,
            status: bus.stalenessSeconds > 120 ? "stale" : "live",
            lat: bus.lat,
            lng: bus.lng,
            driver_id: bus.driverId || "Unassigned",
            stalenessSeconds: bus.stalenessSeconds || 0
          };
          return acc;
        }, {});
        setBuses(fleetData);
      }
    } catch (err) {
      console.error("Failed to fetch fleet telemetry", err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/routes?limit=100`);
      if (res.ok) {
        const data = await res.json();
        setRoutes(data);
      }
    } catch (err) {
      console.error("Failed to fetch routes", err);
    }
  };

  useEffect(() => {
    fetchBuses();
    fetchRoutes();
    const interval = setInterval(fetchBuses, 5000);
    return () => clearInterval(interval);
  }, []);

  const activeCount = Object.keys(buses).length;
  const liveCount = Object.values(buses).filter(b => b.status === "live").length;
  const staleCount = Object.values(buses).filter(b => b.status === "stale").length;

  const filteredRoutes = routes.filter(r => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    const name = (r.routeName || r.longName || "").toLowerCase();
    const num = (r.routeNumber || r.shortName || "").toLowerCase();
    return name.includes(q) || num.includes(q);
  });

  return (
    <div className="admin-dashboard-layout">
      {/* SIDEBAR NAVIGATION */}
      <aside className="admin-sidebar-nav">
        <div className="as-brand-area">
          <div className="as-brand-logo">
            <Bus size={22} />
          </div>
          <div>
            <h2 className="as-brand-title">BusMitra</h2>
            <span className="as-brand-sub">Fleet Control</span>
          </div>
        </div>

        <nav className="as-links-list">
          <button 
            type="button" 
            className={`as-nav-btn ${activeTab === 'fleet' ? 'active' : ''}`}
            onClick={() => setActiveTab('fleet')}
          >
            <LayoutDashboard size={18} />
            <span>Fleet Operations</span>
          </button>

          <button 
            type="button" 
            className={`as-nav-btn ${activeTab === 'routes' ? 'active' : ''}`}
            onClick={() => setActiveTab('routes')}
          >
            <MapIcon size={18} />
            <span>Route Master ({routes.length})</span>
          </button>

          <Link to="/passenger" className="as-nav-btn" style={{ textDecoration: 'none', marginTop: 'auto' }}>
            <Activity size={18} />
            <span>Passenger Portal</span>
          </Link>

          <Link to="/driver" className="as-nav-btn" style={{ textDecoration: 'none' }}>
            <Radio size={18} />
            <span>Driver Terminal</span>
          </Link>
        </nav>

        <div className="as-sidebar-footer">
          <p style={{ margin: 0 }}><strong>Kadamba Transport Corp</strong></p>
          <p style={{ margin: '4px 0 0 0', opacity: 0.7 }}>State Mobility Network &bull; Goa</p>
        </div>
      </aside>

      {/* MAIN STAGE */}
      <main className="admin-main-stage">
        {/* TOP BAR */}
        <header className="admin-stage-header">
          <div className="admin-header-title">
            <h1>{activeTab === 'fleet' ? "Live Fleet Telemetry" : "Official Route Master"}</h1>
            <p>
              {activeTab === 'fleet' 
                ? "Real-time active driver GPS broadcasts connected to Goa transit network." 
                : "Imported GTFS schedule lines and corridors for Kadamba Transport Corporation."}
            </p>
          </div>

          <div className="admin-header-actions">
            <button 
              type="button" 
              className="admin-refresh-btn" 
              onClick={fetchBuses} 
              disabled={isLoading}
            >
              <RefreshCw size={14} className={isLoading ? 'spinning' : ''} />
              <span>Poll Server</span>
            </button>
          </div>
        </header>

        {/* CONTENT BODY */}
        <div className="admin-content-body">
          {/* KPI CARDS */}
          <div className="admin-stats-grid">
            <div className="admin-kpi-card">
              <span className="admin-kpi-label">ACTIVE BUSES IN SERVICE</span>
              <div className="admin-kpi-value blue">{activeCount}</div>
              <span className="admin-kpi-sub">Broadcasting telemetry</span>
            </div>

            <div className="admin-kpi-card">
              <span className="admin-kpi-label">LIVE GPS SIGNALS</span>
              <div className="admin-kpi-value green">{liveCount}</div>
              <span className="admin-kpi-sub">Ping received &lt; 120 sec</span>
            </div>

            <div className="admin-kpi-card">
              <span className="admin-kpi-label">CACHED / STALE</span>
              <div className="admin-kpi-value amber">{staleCount}</div>
              <span className="admin-kpi-sub">Signal delayed or patchy</span>
            </div>

            <div className="admin-kpi-card">
              <span className="admin-kpi-label">REGISTERED ROUTES</span>
              <div className="admin-kpi-value">{routes.length}</div>
              <span className="admin-kpi-sub">KTCL Network coverage</span>
            </div>
          </div>

          {activeTab === 'fleet' ? (
            /* FLEET VIEW: MAP + BUS TABLE */
            <>
              <div className="admin-split-grid">
                {/* LIVE MAP */}
                <div className="admin-panel-card">
                  <div className="admin-panel-header">
                    <h2 className="admin-panel-title">Geospatial Fleet Map</h2>
                    <span style={{ fontSize: '12px', color: '#64748B', fontWeight: 600 }}>
                      Goa State Bounds
                    </span>
                  </div>

                  <div className="admin-map-box">
                    <MapContainer center={[15.35, 73.95]} zoom={10} style={{ height: "100%", width: "100%" }} zoomControl={true}>
                      <TileLayer
                        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      />
                      {Object.values(buses).map((bus) => {
                        const isStale = bus.status === "stale";
                        if (!bus.lat || !bus.lng) return null;
                        return (
                          <Marker 
                            key={bus.bus_id} 
                            position={[bus.lat, bus.lng]} 
                            icon={createBusIcon(bus.bus_number, isStale)}
                            eventHandlers={{ click: () => setSelectedAdminBus(bus) }}
                          >
                            <Popup>
                              <strong>{bus.bus_number}</strong><br/>
                              {bus.route_name}<br/>
                              Driver: {bus.driver_id}
                            </Popup>
                          </Marker>
                        );
                      })}
                    </MapContainer>
                  </div>
                </div>

                {/* SELECTED BUS INSPECTOR */}
                <div className="admin-panel-card">
                  <div className="admin-panel-header">
                    <h2 className="admin-panel-title">Vehicle Inspector</h2>
                  </div>

                  {selectedAdminBus ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span className="route-badge" style={{ fontSize: '14px', padding: '6px 12px' }}>
                          {selectedAdminBus.bus_number}
                        </span>
                        <span className={`admin-status-badge ${selectedAdminBus.status}`}>
                          {selectedAdminBus.status === 'live' ? "● ACTIVE TELEMETRY" : "▲ SIGNAL WEAK"}
                        </span>
                      </div>

                      <div style={{ background: '#F8FAFC', padding: '14px', borderRadius: '12px', border: '1px solid #E2E8F0', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div>
                          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800 }}>ASSIGNED ROUTE</div>
                          <div style={{ fontSize: '15px', fontWeight: 700, color: '#0F172A' }}>{selectedAdminBus.route_name}</div>
                        </div>

                        <div>
                          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800 }}>DRIVER OPERATOR ID</div>
                          <div style={{ fontSize: '14px', fontWeight: 600, color: '#0F172A' }}>{selectedAdminBus.driver_id}</div>
                        </div>

                        <div>
                          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800 }}>CURRENT COORDINATES</div>
                          <div style={{ fontSize: '13px', color: '#475569', fontFamily: 'monospace' }}>
                            {selectedAdminBus.lat?.toFixed(5)}, {selectedAdminBus.lng?.toFixed(5)}
                          </div>
                        </div>

                        <div>
                          <div style={{ fontSize: '11px', color: '#64748B', fontWeight: 800 }}>LAST SIGNAL AGE</div>
                          <div style={{ fontSize: '13px', color: '#475569' }}>
                            {Math.floor(selectedAdminBus.stalenessSeconds)} seconds ago
                          </div>
                        </div>
                      </div>

                      <Link 
                        to={`/track/${selectedAdminBus.bus_id}`} 
                        className="btn-primary"
                        style={{ textDecoration: 'none', textAlign: 'center' }}
                      >
                        View Public Tracking View
                      </Link>
                    </div>
                  ) : (
                    <div style={{ padding: '40px 20px', textAlign: 'center', color: '#64748B' }}>
                      <Bus size={32} color="#94A3B8" style={{ marginBottom: '8px' }} />
                      <p style={{ margin: 0, fontSize: '14px' }}>
                        Click any bus pin on the map or select from the fleet table below to inspect real-time diagnostics.
                      </p>
                    </div>
                  )}
                </div>
              </div>

              {/* ACTIVE FLEET TELEMETRY TABLE */}
              <div className="admin-panel-card">
                <div className="admin-panel-header">
                  <h2 className="admin-panel-title">Active Fleet Roster ({activeCount} Vehicles)</h2>
                </div>

                <div className="admin-table-wrapper">
                  <table className="admin-table-view">
                    <thead>
                      <tr>
                        <th>Vehicle No</th>
                        <th>Route Service</th>
                        <th>Driver ID</th>
                        <th>Coordinates</th>
                        <th>Last Ping</th>
                        <th>Status</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {activeCount === 0 ? (
                        <tr>
                          <td colSpan={7} style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                            No buses currently broadcasting GPS. Start a trip in the Driver Portal to view live telemetry.
                          </td>
                        </tr>
                      ) : (
                        Object.values(buses).map(bus => (
                          <tr key={bus.bus_id} onClick={() => setSelectedAdminBus(bus)} style={{ cursor: 'pointer' }}>
                            <td>
                              <span style={{ fontWeight: 800, color: '#0F172A' }}>{bus.bus_number}</span>
                            </td>
                            <td>{bus.route_name}</td>
                            <td>{bus.driver_id}</td>
                            <td style={{ fontFamily: 'monospace', fontSize: '12px' }}>
                              {bus.lat?.toFixed(4)}, {bus.lng?.toFixed(4)}
                            </td>
                            <td>{Math.floor(bus.stalenessSeconds)}s ago</td>
                            <td>
                              <span className={`admin-status-badge ${bus.status}`}>
                                {bus.status === 'live' ? "● LIVE" : "▲ STALE"}
                              </span>
                            </td>
                            <td>
                              <span style={{ color: '#0284C7', fontWeight: 700, fontSize: '12px', display: 'flex', alignItems: 'center', gap: '2px' }}>
                                Inspect <ChevronRight size={13} />
                              </span>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          ) : (
            /* ROUTE MASTER TAB */
            <div className="admin-panel-card">
              <div className="admin-panel-header" style={{ flexWrap: 'wrap', gap: '12px' }}>
                <h2 className="admin-panel-title">Kadamba Route Master Directory</h2>
                <input 
                  type="text" 
                  placeholder="Filter routes by name or number..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #CBD5E1',
                    fontSize: '13px',
                    outline: 'none',
                    minWidth: '260px'
                  }}
                />
              </div>

              <div className="admin-table-wrapper">
                <table className="admin-table-view">
                  <thead>
                    <tr>
                      <th>Line / Badge</th>
                      <th>Corridor Route Name</th>
                      <th>Route ID</th>
                      <th>Agency</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredRoutes.length === 0 ? (
                      <tr>
                        <td colSpan={5} style={{ textAlign: 'center', padding: '32px', color: '#64748B' }}>
                          No routes matching search criteria.
                        </td>
                      </tr>
                    ) : (
                      filteredRoutes.slice(0, 50).map(r => (
                        <tr key={r.routeId}>
                          <td>
                            <span className="route-badge" style={{ fontSize: '12px', padding: '4px 8px' }}>
                              {r.routeNumber || r.shortName || "BUS"}
                            </span>
                          </td>
                          <td style={{ fontWeight: 700, color: '#0F172A' }}>
                            {r.routeName || r.longName}
                          </td>
                          <td style={{ color: '#64748B', fontFamily: 'monospace', fontSize: '12px' }}>
                            {r.routeId}
                          </td>
                          <td>Kadamba Transport Corp</td>
                          <td>
                            <Link 
                              to={`/route-detail/${r.routeId}`}
                              style={{ color: '#0284C7', fontWeight: 700, textDecoration: 'none' }}
                            >
                              View Trips &rarr;
                            </Link>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
