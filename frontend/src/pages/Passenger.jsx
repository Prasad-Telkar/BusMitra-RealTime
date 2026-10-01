import { useState, useEffect } from "react";
import io from "socket.io-client";
import { ArrowLeft, Share2, Map as MapIcon, Info, Bus, Bookmark, AlertTriangle, RefreshCw } from "lucide-react";
import LiveMap from "../components/LiveMap";
import { Link, useNavigate, useParams } from "react-router-dom";

const API_BASE = "http://localhost:5001";

export default function Passenger() {
  const { busId } = useParams();
  const [busLocation, setBusLocation] = useState(null);
  const [etaData, setEtaData] = useState(null);
  const navigate = useNavigate();

  // Determine signal status based on backend ETA data
  const isSignalWeak = etaData?.status === "stale";
  const isOffline = etaData?.status === "offline" || !etaData;

  useEffect(() => {
    const socket = io(API_BASE);

    socket.on("connect", () => {
      console.log("Passenger connected to tracking server");
      socket.emit("watch_bus", { bus_id: busId });
    });

    socket.on("bus_update", (data) => {
      setBusLocation({ lat: data.lat, lng: data.lng });
    });

    // Poll for ETA
    const fetchEta = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/eta/${busId}`);
        if (res.ok) {
          const data = await res.json();
          setEtaData(data);
        }
      } catch (err) {
        console.error("Failed to fetch ETA", err);
      }
    };

    fetchEta();
    const interval = setInterval(fetchEta, 5000); // Check ETA freshness every 5s

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [busId]);

  return (
    <div className="home-screen">
      <div className="passenger-map-layer">
        <LiveMap location={busLocation} />
      </div>

      <div className="passenger-ui-layer">
        {/* TOP UI */}
        <div className="track-top-section">
          <header className="track-header">
            <button className="icon-btn" onClick={() => navigate(-1)}><ArrowLeft size={24} color="var(--text-main)" /></button>
            <div className="track-title-group">
              <h1>Track your bus</h1>
              <p>{etaData ? etaData.route_name : "Loading route..."}</p>
            </div>
            <button className="icon-btn"><Share2 size={24} color="var(--teal-800)" /></button>
          </header>

          {(isSignalWeak || isOffline) ? (
            <div className="track-eta-banner weak-mode">
              <div className="track-eta-left">
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span className="t-label">To your stop</span>
                  <h2 style={{ fontSize: '20px', margin: '4px 0', color: 'var(--text-main)' }}>{etaData?.stops?.[1] || "..."}</h2>
                  <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Current ETA unavailable</span>
                </div>
              </div>
            </div>
          ) : (
            <div className="track-eta-banner">
              <div className="track-eta-left">
                <span className="massive-min teal">{Math.floor(etaData?.eta_minutes || 0)}</span>
                <span className="min-label teal">min</span>
              </div>
              <div className="track-eta-right">
                <span className="t-label" style={{ display: 'flex', justifyContent: 'space-between' }}>
                  To your stop
                  <span style={{ fontSize: '11px', fontWeight: '600', color: 'var(--teal-800)', background: 'var(--teal-100)', padding: '2px 6px', borderRadius: '4px' }}>
                    {etaData?.trip_status || "On Time"}
                  </span>
                </span>
                <h2>{etaData?.stops?.[1] || "..."}</h2>
                <div className="live-status teal">
                  <span className="live-dot teal"></span> Live GPS &middot; {Math.floor(etaData?.signal_age_sec || 0)} sec ago
                </div>
              </div>
            </div>
          )}

          {isOffline && etaData && (
            <div className="weak-signal-banner" style={{ borderLeft: '4px solid #991B1B', backgroundColor: '#FEF2F2' }}>
              <AlertTriangle size={14} color="#991B1B" style={{ marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '12px', color: '#7F1D1D', margin: '0 0 2px 0', padding: 0 }}>Offline - last received {(etaData.signal_age_sec / 60).toFixed(0)} min ago</strong>
                <span style={{ fontSize: '11px', color: '#991B1B', margin: 0 }}>bus is disconnected from network</span>
              </div>
            </div>
          )}
          {isSignalWeak && !isOffline && etaData && (
            <div className="weak-signal-banner">
              <div style={{ width: '4px', height: '100%', backgroundColor: '#D97706', position: 'absolute', left: 0, top: 0 }}></div>
              <AlertTriangle size={14} color="#D97706" style={{ marginTop: '2px' }} />
              <div>
                <strong style={{ display: 'block', fontSize: '12px', color: '#92400E', margin: '0 0 2px 0', padding: 0 }}>Signal Weak - last received {(etaData.signal_age_sec / 60).toFixed(0)} min ago</strong>
                <span style={{ fontSize: '11px', color: '#B45309', margin: 0 }}>location cannot reliably refresh</span>
              </div>
            </div>
          )}
          
          <div className="map-badge-top" style={{ marginTop: (isSignalWeak || isOffline) ? '12px' : '0' }}>Route schematic &middot; not to scale</div>
        </div>

        {/* BOTTOM UI */}
        <div className="track-bottom-section">
          <div className="map-legend">
            <span className="legend-item"><span className="dot dark"></span> You</span>
            <span className="legend-item"><span className="dot amber"></span> Board here</span>
          </div>

          <div className="track-bottom-card">
            <div className="tbc-top">
              <div className="tbc-left">
                <div className={`bus-badge ${(isSignalWeak || isOffline) ? 'amber' : ''}`}>{etaData?.bus_number || "..."}</div>
                <div className="tbc-stop-info">
                  <span className="t-label">{(isSignalWeak || isOffline) ? 'YOUR STOP' : 'NEXT STOP'}</span>
                  <h3>{etaData?.stops?.[1] || "..."}</h3>
                </div>
              </div>
              {(isSignalWeak || isOffline) ? (
                <div style={{ fontSize: '12px', fontWeight: '600', color: '#92400E' }}>Cached</div>
              ) : (
                <div className="tbc-right">
                  <span className="tbc-time">{Math.floor(etaData?.eta_minutes || 0)} min</span>
                  <span className="tbc-time-sub">{(etaData?.distance_km || 0).toFixed(1)} km away</span>
                </div>
              )}
            </div>
            
            <div className="tbc-divider"></div>

            {(isSignalWeak || isOffline) ? (
              <div className="tbc-weak-details">
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', margin: '0 0 4px 0' }}>Last known location &middot; {(etaData?.signal_age_sec / 60).toFixed(0)} min ago</p>
                <p style={{ fontSize: '13px', fontWeight: '700', color: '#92400E', margin: '0 0 8px 0' }}>Old ETA: {Math.floor(etaData?.eta_minutes || 0)} min - not live</p>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.4', margin: '0 0 16px 0' }}>
                  An old estimate, not a live countdown. Fresh estimates resume when the signal improves.
                </p>
                
                <button className="btn-primary" style={{ width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', marginBottom: '12px' }} onClick={fetchEta}>
                  <RefreshCw size={16} /> Retry
                </button>
                <Link to={`/route-detail/${busId}`} className="btn-outline view-route-btn" style={{ width: '100%', marginBottom: '16px' }}>
                  <MapIcon size={16} /> View Route
                </Link>
                
                <div className="tbc-divider" style={{ marginBottom: '12px', marginTop: '0' }}></div>
                <div className="tbc-middle" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '4px' }}>
                  <span className="tbc-desc" style={{ fontSize: '11px' }}>Demo bus {etaData?.bus_number || "..."} - GPS from driver's smartphone</span>
                  <span className="tbc-desc-sub" style={{ fontSize: '11px' }}>Demo data - No official KTC integration</span>
                </div>
              </div>
            ) : (
              <>
                <div className="tbc-middle">
                  <span className="tbc-desc">Demo bus {etaData?.bus_number || "..."}</span>
                  <span className="tbc-desc-sub">GPS from driver's smartphone</span>
                </div>

                <Link to={`/route-detail/${busId}`} className="btn-outline view-route-btn">
                  <MapIcon size={18} /> View Route
                </Link>

                <div className="demo-data-note inline">
                  <Info size={14} /> Demo data &middot; No official KTC integration
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <nav className="bottom-nav">
        <Link to="/passenger" className="nav-item">
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
