import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Info, Bus, Map as MapIcon, Bookmark } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

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
      <div className="home-screen bg-light">
        <header className="track-header" style={{ padding: '16px 20px', background: 'var(--surface-color)' }}>
          <button className="icon-btn" onClick={() => navigate(-1)}>
            <ArrowLeft size={24} color="var(--text-main)" />
          </button>
          <h2>Loading Bus...</h2>
        </header>
      </div>
    );
  }

  const isLive = etaData && etaData.status === "live";

  return (
    <div className="home-screen bg-light" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <header className="track-header" style={{ background: 'var(--teal-800)', color: 'white', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px', margin: 0 }}>
        <button className="icon-btn" onClick={() => navigate(-1)} style={{ color: 'white', background: 'transparent', padding: 0 }}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>Bus {etaData?.bus_number || busId}</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>{etaData?.route_name || "Unknown Route"}</p>
        </div>
      </header>

      <div className="home-content" style={{ padding: '20px', flex: 1, paddingBottom: '100px' }}>
        
        <div className="card" style={{ marginBottom: '24px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div className="bus-badge" style={{ background: 'var(--amber-400)', color: 'var(--teal-900)' }}>
                {etaData?.bus_number || busId}
              </div>
              <div style={{ fontWeight: '700', fontSize: '16px' }}>KTCL</div>
            </div>
            
            {isLive ? (
              <div className="pill live">
                <span className="dot"></span> LIVE
              </div>
            ) : (
              <div className="pill stale">
                <span className="dot"></span> OFFLINE
              </div>
            )}
          </div>

          <div style={{ background: 'var(--bg-color)', padding: '16px', borderRadius: '12px' }}>
            <span style={{ fontSize: '11px', fontWeight: '800', color: 'var(--teal-800)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>NEXT STOP</span>
            <h3 style={{ margin: '4px 0 0 0', fontSize: '20px', fontWeight: '800', color: 'var(--text-main)' }}>
              {etaData?.stops?.[1] || "Unknown"}
            </h3>
            {isLive && (
              <div style={{ marginTop: '8px', display: 'flex', alignItems: 'baseline', gap: '6px' }}>
                <span style={{ fontSize: '28px', fontWeight: '800', color: 'var(--teal-700)', letterSpacing: '-1px' }}>
                  {Math.floor(etaData?.eta_minutes || 0)}
                </span>
                <span style={{ fontSize: '14px', fontWeight: '600', color: 'var(--text-muted)' }}>min away</span>
              </div>
            )}
          </div>
        </div>

        <Link to={`/track/${busId}`} className="btn-primary" style={{ textDecoration: 'none', marginBottom: '16px' }}>
          <MapIcon size={20} />
          Track Bus on Map
        </Link>
        
        <Link to={`/route-detail/${busId}`} className="btn-outline" style={{ textDecoration: 'none', width: '100%', marginBottom: '24px' }}>
          <Bus size={20} />
          View Full Timetable
        </Link>

        <div className="demo-data-note inline" style={{ display: 'flex', justifyContent: 'center', gap: '6px', color: 'var(--text-muted)' }}>
          <Info size={14} /> Demo bus &middot; GPS from driver's smartphone
        </div>
      </div>

      <nav className="bottom-nav">
        <Link to="/passenger" className="nav-item">
          <MapPin size={24} />
          Stops
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
