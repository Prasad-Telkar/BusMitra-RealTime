import { Link } from "react-router-dom";
import { Bus, Map as MapIcon, Bookmark, WifiOff, Clock, MapPin, RefreshCw, NavigationOff } from "lucide-react";

export default function Offline() {
  return (
    <div className="home-screen bg-light">
      <div className="offline-content" style={{ paddingBottom: '100px' }}>
        
        <header className="offline-header">
          <h1>Live service unavailable</h1>
          <p className="oh-subtitle">Goa Kadamba &middot; Offline</p>
        </header>

        <div className="offline-status-block">
          <div className="os-icon-box">
            <WifiOff size={28} color="var(--amber-700)" />
          </div>
          <h2>Offline</h2>
        </div>

        <p className="offline-desc">
          Bus locations cannot refresh. Cached information below is old, not live.
        </p>

        <div className="offline-banner">
          <Clock size={16} color="var(--amber-800)" />
          <span>Last received 8:35 AM - 7 minutes ago</span>
        </div>

        <div className="stop-selector-block">
          <div className="ssb-left">
            <MapPin size={20} color="var(--teal-700)" />
            <div className="ssb-info">
              <h4>Porvorim</h4>
              <p>Previously selected stop</p>
            </div>
          </div>
          <span className="ssb-action">Change</span>
        </div>

        <button className="btn-primary retry-btn">
          <RefreshCw size={18} /> Retry connection
        </button>

        <div className="location-warning-box">
          <div className="lwb-left">
            <NavigationOff size={20} color="var(--text-light)" />
            <div className="lwb-info">
              <h4>Phone location is off</h4>
              <p>Choose a stop manually for now.</p>
            </div>
          </div>
          <span className="lwb-action">Settings</span>
        </div>

        <section className="cached-routes-section">
          <div className="crs-header">
            <div className="crs-title-row">
              <h3>Cached route information</h3>
              <span className="crs-status">Offline</span>
            </div>
            <p className="crs-subtitle">Last received 8:35 AM - Demo K01 route</p>
          </div>

          <div className="cached-route-card">
            <div className="crc-top">
              <div className="bus-badge">K01</div>
              <div className="crc-info">
                <h4>Kadamba &middot; Panaji &rarr; Margao</h4>
                <p>Via Porvorim, Mapusa, Ponda</p>
              </div>
            </div>
            <div className="crc-details">
              <div className="crc-detail-row">
                <MapPin size={14} color="var(--teal-700)" />
                <span>Last known location near Panaji</span>
              </div>
              <div className="crc-detail-row">
                <Clock size={14} color="var(--amber-800)" />
                <span>Old ETA: 15 min at 8:35 &middot; not live</span>
              </div>
              <div className="crc-detail-row gray">
                <span className="dot gray"></span>
                <span>Current ETA unavailable while offline</span>
              </div>
            </div>
          </div>
        </section>

        <div className="offline-footer">
          <p>Live estimates resume after reconnecting.</p>
          <p>Demo data &middot; No official KTC integration</p>
        </div>

      </div>
    </div>
  );
}
