import { Link } from "react-router-dom";
import { 
  Home, 
  MapPin, 
  Map as MapIcon, 
  Bookmark, 
  User, 
  Bus, 
  Calculator, 
  Navigation,
  Radio,
  FileText,
  Shield,
  X,
  LogOut
} from "lucide-react";
import "./NavigationDrawer.css";

export default function NavigationDrawer({ isOpen, onClose }) {
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";
  const rememberedUser = localStorage.getItem("busmitra_remembered_username") || "Passenger";

  return (
    <div className={`drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose} role="dialog" aria-modal="true">
      <div className={`drawer-content ${isOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
        
        {/* Drawer Header */}
        <div className="drawer-header">
          <div className="dh-top-row">
            <div className="drawer-brand">
              <div className="drawer-logo-icon">
                <Bus size={20} color="#FFFFFF" strokeWidth={2.4} />
              </div>
              <div>
                <h2>BusMitra</h2>
                <span className="drawer-sub">Goa Transit Network</span>
              </div>
            </div>
            <button className="drawer-close-btn" onClick={onClose} aria-label="Close navigation drawer">
              <X size={20} />
            </button>
          </div>
          <p className="drawer-tagline">"Know your bus. Know your time."</p>
        </div>

        {/* Drawer Navigation Links */}
        <nav className="drawer-nav">
          <div className="drawer-section-title">TRANSIT SERVICES</div>

          <Link to="/passenger" className="drawer-item" onClick={onClose}>
            <Home size={19} color="var(--bm-blue-600, #0284C7)" /> 
            <span>Passenger Dashboard</span>
          </Link>

          <Link to="/journey-planner" className="drawer-item" onClick={onClose}>
            <Navigation size={19} color="var(--bm-teal-600, #0D9488)" /> 
            <span>Journey Planner</span>
          </Link>

          <Link to="/routes" className="drawer-item" onClick={onClose}>
            <Radio size={19} color="var(--bm-blue-600, #0284C7)" /> 
            <span>Routes &amp; Live Buses</span>
          </Link>

          <Link to="/stops" className="drawer-item" onClick={onClose}>
            <MapPin size={19} color="var(--bm-emerald-600, #059669)" /> 
            <span>Bus Stands &amp; Stops</span>
          </Link>

          <Link to="/fare-calculator" className="drawer-item" onClick={onClose}>
            <Calculator size={19} color="var(--bm-amber-600, #D97706)" /> 
            <span>Fare Calculator</span>
          </Link>

          <Link to="/saved" className="drawer-item" onClick={onClose}>
            <Bookmark size={19} color="var(--bm-blue-700, #0369A1)" /> 
            <span>Saved Commutes</span>
          </Link>

          <Link to="/offline" className="drawer-item" onClick={onClose}>
            <FileText size={19} color="var(--bm-slate-600, #475569)" /> 
            <span>Offline Schedules</span>
          </Link>

          <div className="drawer-divider"></div>
          <div className="drawer-section-title">STAFF &amp; PORTALS</div>

          <Link to="/driver" className="drawer-item" onClick={onClose}>
            <Bus size={19} color="var(--bm-blue-700, #0369A1)" /> 
            <span>Driver Portal</span>
          </Link>

          <Link to="/admin" className="drawer-item" onClick={onClose}>
            <Shield size={19} color="var(--bm-blue-800, #075985)" /> 
            <span>Depot Admin Dashboard</span>
          </Link>

          <div className="drawer-divider"></div>
          <div className="drawer-section-title">ACCOUNT</div>

          {isLoggedIn ? (
            <>
              <div className="drawer-user-info">
                <div className="dui-avatar">
                  <User size={18} />
                </div>
                <div className="dui-text">
                  <span className="dui-name">{rememberedUser}</span>
                  <span className="dui-status">Signed In Session</span>
                </div>
              </div>
              <div 
                className="drawer-item drawer-logout" 
                onClick={() => {
                  localStorage.removeItem("isLoggedIn");
                  localStorage.removeItem("busmitra_token");
                  onClose();
                }}
              >
                <LogOut size={19} color="#DC2626" /> 
                <span>Sign Out</span>
              </div>
            </>
          ) : (
            <Link to="/login" className="drawer-item" onClick={onClose}>
              <User size={19} color="var(--bm-blue-600, #0284C7)" /> 
              <span>Sign In / Staff Portal</span>
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
