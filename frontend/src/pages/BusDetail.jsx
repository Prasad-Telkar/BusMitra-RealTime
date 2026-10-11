import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Info, Bus, Map as MapIcon, Bookmark, Loader2 } from "lucide-react";
import "./Routes.css";

const API_BASE = import.meta.env.VITE_API_BASE || "https://busmitra-goa.onrender.com";

export default function BusDetail() {
  const { busId } = useParams();
  const navigate = useNavigate();
  const [etaData, setEtaData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBusData = async () => {
      try {
        const res = await fetch(`${API_BASE}/api/eta/${busId}`);
        if (res.ok) {
          const data = await res.json();
          setEtaData(data);
        }
      } catch (err) {
        console.error("Failed to fetch bus data", err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBusData();
  }, [busId]);

  if (loading) {
    return (
      <div className="route-detail-container" style={{ textAlign: 'center', padding: '60px 20px' }}>
        <Loader2 className="spinner" size={24} color="#0284C7" />
        <p style={{ marginTop: '12px', color: '#64748B' }}>Loading bus telemetry...</p>
      </div>
    );
  }

  const isLive = etaData && etaData.status === "live";

  return (
    <div className="route-detail-container" style={{ maxWidth: '640px' }}>
      {/* HEADER CARD */}
      <div className="rd-header-card">
        <button type="button" className="tracker-back-btn" onClick={() => navigate(-1)} title="Back">
          <ArrowLeft size={18} />
        </button>

        <div className="rd-icon-box">
          <Bus size={24} />
        </div>

        <div className="rd-titles">
          <h1>Vehicle {etaData?.bus_number || busId}</h1>
          <p>{etaData?.route_name || "Kadamba Transit Corridor"}</p>
        </div>
      </div>

      {/* TELEMETRY STATUS CARD */}
      <div className="timetable-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span className="route-badge">{etaData?.bus_number || busId}</span>
            <span style={{ fontWeight: 800, fontSize: '15px', color: '#0F172A' }}>KTCL Vehicle</span>
          </div>

          <span className={`admin-status-badge ${isLive ? 'live' : 'stale'}`}>
            {isLive ? "● LIVE TELEMETRY" : "▲ SIGNAL WEAK / OFFLINE"}
          </span>
        </div>

        <div style={{ background: '#F8FAFC', padding: '16px', borderRadius: '12px', border: '1px solid #E2E8F0', marginBottom: '20px' }}>
          <span style={{ fontSize: '11px', fontWeight: 800, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            NEXT STOP EN ROUTE
          </span>
          <h3 style={{ margin: '4px 0 0 0', fontSize: '18px', fontWeight: 800, color: '#0F172A' }}>
            {etaData?.stops?.[1] || "Terminus Station"}
          </h3>
          {isLive && (
            <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '4px' }}>
              <span style={{ fontSize: '28px', fontWeight: 800, color: '#0284C7', letterSpacing: '-1px' }}>
                {Math.floor(etaData?.eta_minutes || 0)}
              </span>
              <span style={{ fontSize: '13px', fontWeight: 700, color: '#64748B' }}>min away</span>
            </div>
          )}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <Link to={`/track/${busId}`} className="btn-primary" style={{ textDecoration: 'none' }}>
            <MapIcon size={18} />
            <span>Track Live Position on Map</span>
          </Link>

          <Link to={`/route-detail/${busId}`} className="btn-outline" style={{ textDecoration: 'none', textAlign: 'center' }}>
            <Bus size={18} />
            <span>View Full Corridor Timetable</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
