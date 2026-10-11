import { Link, useNavigate } from "react-router-dom";
import { WifiOff, Clock, MapPin, RefreshCw, ArrowLeft, Home, Navigation } from "lucide-react";
import "./Stops.css";

export default function Offline() {
  const navigate = useNavigate();

  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="stops-page-container" style={{ maxWidth: '640px' }}>
      <button 
        type="button" 
        className="tracker-back-btn" 
        onClick={() => navigate(-1)} 
        title="Back"
        style={{ marginBottom: '8px' }}
      >
        <ArrowLeft size={18} />
      </button>

      <div style={{
        background: '#FFFFFF',
        border: '1px solid #E2E8F0',
        borderRadius: '20px',
        padding: '36px 24px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: '16px',
        boxShadow: '0 4px 16px rgba(15, 23, 42, 0.04)'
      }}>
        <div style={{
          width: '64px',
          height: '64px',
          borderRadius: '18px',
          background: '#FEF3C7',
          color: '#D97706',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          <WifiOff size={32} />
        </div>

        <div>
          <h1 style={{ fontSize: '22px', fontWeight: 800, color: '#0F172A', margin: '0 0 6px 0' }}>
            Live Telemetry Offline
          </h1>
          <p style={{ fontSize: '14px', color: '#64748B', margin: 0, lineHeight: 1.5 }}>
            Unable to establish real-time connection to the BusMitra Goa tracking network. Live bus positions and real-time ETAs cannot refresh while offline.
          </p>
        </div>

        <div style={{
          width: '100%',
          background: '#F8FAFC',
          border: '1px solid #E2E8F0',
          borderRadius: '12px',
          padding: '14px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          textAlign: 'left'
        }}>
          <Clock size={18} color="#0284C7" style={{ flexShrink: 0 }} />
          <span style={{ fontSize: '13px', color: '#475569' }}>
            Scheduled GTFS timetables remain viewable in the Route and Stops directory.
          </span>
        </div>

        <div style={{ display: 'flex', gap: '10px', width: '100%', marginTop: '8px' }}>
          <button 
            type="button" 
            className="btn-primary" 
            onClick={handleRetry}
            style={{ flex: 1 }}
          >
            <RefreshCw size={16} />
            <span>Retry Connection</span>
          </button>

          <Link 
            to="/passenger" 
            className="btn-outline" 
            style={{ flex: 1, textDecoration: 'none', textAlign: 'center' }}
          >
            <span>Passenger Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
}
