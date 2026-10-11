import { useState, useEffect } from "react";
import io from "socket.io-client";
import { ArrowLeft, Share2, Map as MapIcon, Info, Bus, AlertTriangle, RefreshCw, Navigation, Check } from "lucide-react";
import LiveMap from "../components/LiveMap";
import { Link, useNavigate, useParams } from "react-router-dom";
import "./Passenger.css";

const API_BASE = import.meta.env.VITE_API_BASE || "https://busmitra-goa.onrender.com";

export default function Passenger() {
  const { busId } = useParams();
  const [busLocation, setBusLocation] = useState(null);
  const [etaData, setEtaData] = useState(null);
  const [copied, setCopied] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();

  // Determine signal status based on backend ETA data
  const isSignalWeak = etaData?.status === "stale";
  const isOffline = etaData?.status === "offline" || !etaData;
  const isLive = !isSignalWeak && !isOffline && etaData;

  // Poll for ETA
  const fetchEta = async () => {
    setIsRefreshing(true);
    try {
      const res = await fetch(`${API_BASE}/api/eta/${busId}`);
      if (res.ok) {
        const data = await res.json();
        setEtaData(data);
      }
    } catch (err) {
      console.error("Failed to fetch ETA", err);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    const socket = io(API_BASE);

    socket.on("connect", () => {
      console.log("Passenger connected to tracking server");
      socket.emit("watch_bus", { bus_id: busId });
    });

    socket.on("bus_update", (data) => {
      if (data && data.lat && data.lng) {
        setBusLocation({ lat: data.lat, lng: data.lng });
      }
    });

    fetchEta();
    const interval = setInterval(fetchEta, 5000); // Check ETA freshness every 5s

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [busId]);

  const activeLocation = busLocation || (etaData?.lat ? { lat: etaData.lat, lng: etaData.lng } : null);

  const handleShare = async () => {
    const shareData = {
      title: `BusMitra — Track Bus ${etaData?.bus_number || busId}`,
      text: `Live tracking for ${etaData?.route_name || 'bus route'} on BusMitra Goa`,
      url: window.location.href,
    };
    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.warn("Share cancelled or failed", err);
      }
    } else {
      navigator.clipboard.writeText(window.location.href);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="tracker-layout">
      {/* FULL MAP CANVAS */}
      <div className="tracker-map-canvas">
        <LiveMap 
          busPosition={activeLocation ? [activeLocation.lat, activeLocation.lng] : null} 
          center={activeLocation ? [activeLocation.lat, activeLocation.lng] : [15.35, 73.95]} 
        />
      </div>

      {/* FLOATING TELEMETRY HUD */}
      <div className="tracker-hud">
        <div className="tracker-card">
          {/* Top Bar with Navigation & Actions */}
          <div className="tracker-nav-bar">
            <button type="button" className="tracker-back-btn" onClick={() => navigate(-1)} title="Back">
              <ArrowLeft size={18} />
            </button>

            <div className="tracker-bus-identity">
              <span className="tracker-bus-pill">{etaData?.bus_number || busId}</span>
              <div className="tracker-bus-titles">
                <h1>{etaData?.route_name || "Bus Tracking"}</h1>
                <p>KTCL Network</p>
              </div>
            </div>

            <button type="button" className="tracker-share-btn" onClick={handleShare} title="Share Tracking Link">
              {copied ? <Check size={18} color="#10B981" /> : <Share2 size={18} />}
            </button>
          </div>

          {/* ETA Highlight Card */}
          <div className={`tracker-eta-box ${isLive ? 'live' : isSignalWeak ? 'weak' : 'offline'}`}>
            <div className="tracker-eta-digits">
              {isOffline ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#B91C1C' }}>Offline</span>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>Telemetry unavailable</span>
                </div>
              ) : isSignalWeak ? (
                <div style={{ display: 'flex', flexDirection: 'column' }}>
                  <span style={{ fontSize: '18px', fontWeight: 800, color: '#B45309' }}>Weak Signal</span>
                  <span style={{ fontSize: '11px', color: '#64748B' }}>ETA cached</span>
                </div>
              ) : (
                <>
                  <span className="tracker-eta-num">{Math.floor(etaData?.eta_minutes || 0)}</span>
                  <span className="tracker-eta-unit">min</span>
                </>
              )}
            </div>

            <div className="tracker-eta-meta">
              <span className="tracker-eta-stop-label">APPROACHING STOP</span>
              <span className="tracker-eta-stop-name">{etaData?.stops?.[1] || etaData?.next_stop || "Terminus"}</span>
              {etaData?.distance_km && (
                <span className="tracker-eta-dist">~{Number(etaData.distance_km).toFixed(1)} km away</span>
              )}
            </div>
          </div>

          {/* Telemetry Status Strip */}
          <div className="tracker-status-strip">
            <div className={`tracker-signal-indicator ${isLive ? 'live' : isSignalWeak ? 'weak' : 'offline'}`}>
              <span className="tracker-signal-dot"></span>
              <span>
                {isLive ? "Live GPS Connected" : isSignalWeak ? "Signal Weak" : "Bus GPS Disconnected"}
              </span>
            </div>

            <div className="tracker-age">
              {etaData?.signal_age_sec !== undefined ? (
                etaData.signal_age_sec < 60 
                  ? `${Math.floor(etaData.signal_age_sec)}s ago`
                  : `${Math.floor(etaData.signal_age_sec / 60)}m ago`
              ) : "Awaiting ping"}
            </div>
          </div>

          {/* Action Row */}
          <div className="tracker-actions-row">
            <Link to={`/route-detail/${busId}`} className="tracker-btn-route">
              <MapIcon size={15} />
              <span>View Full Route</span>
            </Link>

            <button 
              type="button" 
              className="tracker-btn-refresh" 
              onClick={fetchEta} 
              disabled={isRefreshing}
              title="Refresh ETA"
            >
              <RefreshCw size={14} className={isRefreshing ? 'spinning' : ''} />
              <span>Refresh</span>
            </button>
          </div>

          {/* Grounding Notice */}
          <div className="tracker-grounding-notice">
            <Info size={12} />
            <span>Official KTCL Scheduled Route &amp; Driver Telemetry</span>
          </div>
        </div>
      </div>
    </div>
  );
}
