import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { MapPin, Bookmark, ChevronRight, Navigation, Trash2, Bus, Plus } from "lucide-react";
import "./Stops.css";

export default function Saved() {
  const [savedStops, setSavedStops] = useState([]);

  useEffect(() => {
    loadSaved();
  }, []);

  const loadSaved = () => {
    try {
      const stops = JSON.parse(localStorage.getItem('busmitra_saved_stops') || '[]');
      setSavedStops(stops);
    } catch (e) {
      setSavedStops([]);
    }
  };

  const removeStop = (id) => {
    const updated = savedStops.filter(s => (s.stopId || s._id) !== id);
    setSavedStops(updated);
    localStorage.setItem('busmitra_saved_stops', JSON.stringify(updated));
  };

  return (
    <div className="stops-page-container">
      {/* HEADER */}
      <div className="stops-header">
        <span className="stops-badge">Saved Places</span>
        <h1 className="stops-title">Your Saved Bus Stops</h1>
        <p className="stops-subtitle">
          Quickly access and navigate to your everyday stops and transit terminals in Goa.
        </p>
      </div>

      {/* SAVED STOPS LIST */}
      {savedStops.length === 0 ? (
        <div style={{
          background: '#FFFFFF',
          border: '1px solid #E2E8F0',
          borderRadius: '20px',
          padding: '48px 24px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '12px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.03)'
        }}>
          <div style={{
            width: '64px',
            height: '64px',
            borderRadius: '16px',
            background: '#F0F9FF',
            color: '#0284C7',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            <Bookmark size={32} />
          </div>
          <h2 style={{ fontSize: '18px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            No Saved Stops Yet
          </h2>
          <p style={{ fontSize: '14px', color: '#64748B', maxWidth: '380px', margin: 0, lineHeight: 1.5 }}>
            Bookmark stops like Panaji KTC, Margao, or Mapusa to view timetables and plan your commute with one click.
          </p>
          <Link 
            to="/stops" 
            className="btn-primary" 
            style={{ textDecoration: 'none', maxWidth: '220px', marginTop: '12px' }}
          >
            <Plus size={18} />
            <span>Browse All Stops</span>
          </Link>
        </div>
      ) : (
        <div className="stops-grid">
          {savedStops.map(stop => {
            const stopId = stop.stopId || stop._id;
            return (
              <div key={stopId} className="stop-item-card">
                <div className="stop-card-head">
                  <div className="stop-pin-icon" style={{ background: '#FEF3C7', color: '#D97706' }}>
                    <Bookmark size={20} fill="#D97706" />
                  </div>
                  <div className="stop-card-text">
                    <h3 className="stop-card-name">{stop.name}</h3>
                    <p className="stop-card-meta">
                      <span>KTCL Stand</span> &bull; <span>Stop ID: {stopId}</span>
                    </p>
                  </div>
                  <button 
                    type="button"
                    onClick={() => removeStop(stopId)}
                    title="Remove from saved"
                    style={{
                      background: 'none',
                      border: 'none',
                      color: '#94A3B8',
                      cursor: 'pointer',
                      padding: '4px'
                    }}
                  >
                    <Trash2 size={16} />
                  </button>
                </div>

                <div className="stop-card-actions">
                  <Link to={`/stop/${stopId}`} className="stop-btn-details">
                    Timetables
                  </Link>
                  <Link 
                    to={`/journey-planner?to=${encodeURIComponent(stop.name)}&toId=${stopId}`} 
                    className="stop-btn-plan"
                  >
                    <Navigation size={13} />
                    <span>Plan Trip</span>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
