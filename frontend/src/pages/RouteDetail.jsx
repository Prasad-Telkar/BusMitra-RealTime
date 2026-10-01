import { useState, useEffect } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, Bookmark, Bus, Map as MapIcon, LocateFixed } from "lucide-react";

const API_BASE = "http://localhost:5001";

export default function RouteDetail() {
  const { busId } = useParams();
  const navigate = useNavigate();
  const [etaData, setEtaData] = useState(null);

  useEffect(() => {
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
    const interval = setInterval(fetchEta, 5000);
    return () => clearInterval(interval);
  }, [busId]);

  const isSignalWeak = etaData?.status === "stale";
  const stops = etaData?.stops || [];
  const destination = stops.length > 0 ? stops[stops.length - 1] : "Unknown";

  return (
    <div className="home-screen bg-light route-detail-screen">
      <div className="routes-content" style={{ paddingBottom: '100px' }}>
        
        <header className="rd-header">
          <button className="icon-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} color="var(--text-main)" />
          </button>
          <div className="rd-title-group">
            <h1>Route {etaData?.bus_number || "..."}</h1>
            <p>Kadamba &middot; Towards {destination}</p>
          </div>
          <button className="icon-btn">
            <Bookmark size={24} color="var(--teal-800)" />
          </button>
        </header>

        <div className="rd-main-info">
          <div className="bus-badge">{etaData?.bus_number || "..."}</div>
          <div className="rd-dest-info">
            <div className="rd-dest-line">{stops[0]} <span className="arrow">&rarr;</span> {destination}</div>
            <div className="rd-stops-count">{stops.length} stops &middot; via {stops[1]}</div>
          </div>
        </div>

        <div className="rd-arrival-box">
          <div className="arrival-left">
            <span className="arrival-label" style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
              AT {stops[1] ? stops[1].toUpperCase() : "NEXT STOP"}
              <span style={{ fontSize: '10px', fontWeight: '600', color: 'var(--teal-800)', background: 'var(--teal-100)', padding: '2px 6px', borderRadius: '4px' }}>{etaData?.trip_status || "On Time"}</span>
            </span>
            {isSignalWeak ? (
              <h2 style={{ color: '#92400E' }}>Cached Data</h2>
            ) : (
              <h2>Arriving in {Math.floor(etaData?.eta_minutes || 0)} min</h2>
            )}
            <div className={isSignalWeak ? "live-status amber" : "live-status teal"}>
              <span className={isSignalWeak ? "live-dot amber" : "live-dot teal"}></span> 
              {isSignalWeak ? `Signal Weak · ${Math.floor((etaData?.signal_age_sec || 0)/60)}m ago` : `Live GPS · ${Math.floor(etaData?.signal_age_sec || 0)}s ago`}
            </div>
          </div>
          {!isSignalWeak && (
            <div className="arrival-right">
              <span className="massive-min teal">{Math.floor(etaData?.eta_minutes || 0)}</span>
              <span className="min-label">min</span>
            </div>
          )}
        </div>

        <div className="timeline-section">
          <div className="timeline-header">
            <h3>Stops & arrival times</h3>
            <span className="timeline-ampm">AM</span>
          </div>

          <div className="timeline-list">
            
            {/* Map stops dynamically for UI mockup */}
            {stops.map((stop, index) => {
              const isPast = index === 0;
              const isBoarding = index === 1;
              const isLast = index === stops.length - 1;
              
              let className = "future";
              if (isPast) className = "past";
              if (isBoarding) className = "boarding";

              return (
                <div key={stop} className={`timeline-item ${className}`}>
                  <div className="t-graphic">
                    <div className={`t-line-top ${isPast ? 'transparent' : 'teal'}`}></div>
                    <div className={`t-dot ${isPast ? 'grey-solid' : isBoarding ? 'teal-outline' : 'teal-outline'}`}></div>
                    <div className={`t-line-bottom ${isLast ? 'transparent' : 'teal'}`}></div>
                  </div>
                  <div className="t-content">
                    <div className="t-text">
                      <span className="t-stop">{stop}</span>
                      {isPast && <span className="t-sub">Departed</span>}
                      {isBoarding && <span className="t-sub teal-text">Next stop &middot; Your boarding stop</span>}
                      {isLast && <span className="t-sub">Last stop</span>}
                    </div>
                  </div>
                </div>
              );
            })}

          </div>
        </div>

        <div className="rd-footer-note">
          <div className="demo-id-row">
            <Bus size={16} color="var(--text-muted)" />
            <strong>Demo ID {etaData?.bus_number || "..."}</strong> &middot; Illustrative demo timings
          </div>
          <div className="demo-data-note" style={{ marginTop: '4px' }}>
            Demo data - Not official KTC tracking or schedules
          </div>
        </div>

        {/* Action Button Fixed at Bottom but above nav */}
        <div className="action-button-container">
          <Link to={`/track/${busId}`} className="btn-primary">
            <LocateFixed size={20} /> Track this bus
          </Link>
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
