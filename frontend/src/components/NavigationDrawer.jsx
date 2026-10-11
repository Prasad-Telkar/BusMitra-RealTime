import { Link } from "react-router-dom";
import { Home, MapPin, Map as MapIcon, Bookmark, Bell, User, Settings, Globe, HelpCircle, Bug, Bus, Calculator } from "lucide-react";
import "./NavigationDrawer.css";

export default function NavigationDrawer({ isOpen, onClose }) {
  // Check for some fake auth state since auth is incomplete
  const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

  return (
    <div className={`drawer-overlay ${isOpen ? 'open' : ''}`} onClick={onClose}>
      <div className={`drawer-content ${isOpen ? 'open' : ''}`} onClick={(e) => e.stopPropagation()}>
        
        <div className="drawer-header">
          <div className="drawer-brand">
            <div style={{ background: 'var(--teal-800)', borderRadius: '8px', padding: '4px' }}>
              <Bus size={24} color="white" />
            </div>
            <h2>BusMitra</h2>
          </div>
          <p>"Know your bus. Know your time."</p>
        </div>

        <nav className="drawer-nav">
          <Link to="/passenger" className="drawer-item" onClick={onClose}>
            <Home size={20} /> <span>Home</span>
          </Link>
          <Link to="/journey-planner" className="drawer-item" onClick={onClose}>
            <MapIcon size={20} /> <span>Journey Planner</span>
          </Link>
          <Link to="/fare-calculator" className="drawer-item" onClick={onClose}>
            <Calculator size={20} /> <span>Fare Calculator</span>
          </Link>
          <Link to="/stops" className="drawer-item" onClick={onClose}>
            <MapPin size={20} /> <span>Nearby Stops</span>
          </Link>
          <div className="drawer-item disabled">
            <Bus size={20} /> <span>Track a Bus</span>
          </div>
          <Link to="/routes" className="drawer-item" onClick={onClose}>
            <MapIcon size={20} /> <span>Routes</span>
          </Link>
          <Link to="/saved" className="drawer-item" onClick={onClose}>
            <Bookmark size={20} /> <span>Saved</span>
          </Link>
          <div className="drawer-item disabled">
            <Bell size={20} /> <span>Alerts</span>
          </div>
          <div className="drawer-item disabled">
            <Settings size={20} /> <span>Settings</span>
          </div>
          <div className="drawer-item disabled">
            <Bus size={20} /> <span>About BusMitra</span>
          </div>

          <div className="drawer-divider"></div>
          <div className="drawer-section-title">ACCOUNT</div>

          {isLoggedIn ? (
            <>
              <div className="drawer-item disabled">
                <User size={20} /> <span>Profile</span>
              </div>
              <div className="drawer-item disabled">
                <User size={20} /> <span>My Activity</span>
              </div>
              <div 
                className="drawer-item" 
                style={{ color: '#dc2626' }}
                onClick={() => {
                  localStorage.removeItem("isLoggedIn");
                  onClose();
                }}
              >
                <User size={20} /> <span>Logout</span>
              </div>
            </>
          ) : (
            <Link to="/login" className="drawer-item" onClick={onClose}>
              <User size={20} /> <span>Login / Account</span>
            </Link>
          )}
        </nav>
      </div>
    </div>
  );
}
