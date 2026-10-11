import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { 
  MapPin, 
  Map as MapIcon, 
  Bookmark, 
  Bus, 
  Menu, 
  Home, 
  Calculator, 
  Navigation,
  User,
  Radio
} from "lucide-react";
import NavigationDrawer from "./NavigationDrawer";

export default function PassengerLayout() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="passenger-layout">
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Mobile Top Navbar - Sticky & Clean Blur */}
      <header className="passenger-mobile-top-nav mobile-only">
        <div className="pmtn-inner">
          <div className="pmtn-left">
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="pmtn-menu-btn"
              aria-label="Open Navigation Menu"
            >
              <Menu size={22} color="var(--bm-slate-800, #1E293B)" />
            </button>
            <Link to="/passenger" className="pmtn-brand">
              <div className="pmtn-logo">
                <Bus size={18} color="#FFFFFF" strokeWidth={2.4} />
              </div>
              <div className="pmtn-text">
                <span className="pmtn-title">BusMitra</span>
                <span className="pmtn-badge">Goa Transit</span>
              </div>
            </Link>
          </div>

          <div className="pmtn-right">
            <Link to="/login" className="pmtn-account-btn" aria-label="Account / Login">
              <User size={18} />
            </Link>
          </div>
        </div>
      </header>

      {/* Desktop Top Navbar - Full Width Professional Transit Bar */}
      <header className="passenger-desktop-nav desktop-only">
        <div className="pdn-inner">
          <div className="pdn-left">
            <button 
              onClick={() => setIsDrawerOpen(true)}
              className="pdn-menu-trigger"
              aria-label="Open Navigation Menu"
              title="Menu"
            >
              <Menu size={20} />
            </button>
            <Link to="/passenger" className="pdn-brand">
              <div className="pdn-logo">
                <Bus size={20} color="#FFFFFF" strokeWidth={2.4} />
              </div>
              <div className="pdn-brand-text">
                <span className="pdn-title">BusMitra</span>
                <span className="pdn-sub">Passenger Portal</span>
              </div>
            </Link>
          </div>

          <nav className="pdn-links" aria-label="Passenger Navigation">
            <Link to="/passenger" className={`pdn-link ${currentPath === '/passenger' ? 'active' : ''}`}>
              <Home size={16} /> Overview
            </Link>
            <Link to="/journey-planner" className={`pdn-link ${currentPath === '/journey-planner' ? 'active' : ''}`}>
              <Navigation size={16} /> Plan Journey
            </Link>
            <Link to="/routes" className={`pdn-link ${currentPath === '/routes' || currentPath.startsWith('/route-detail') ? 'active' : ''}`}>
              <Radio size={16} /> Routes &amp; Live
            </Link>
            <Link to="/stops" className={`pdn-link ${currentPath === '/stops' || currentPath.startsWith('/stop/') ? 'active' : ''}`}>
              <MapPin size={16} /> Stops &amp; Hubs
            </Link>
            <Link to="/fare-calculator" className={`pdn-link ${currentPath === '/fare-calculator' ? 'active' : ''}`}>
              <Calculator size={16} /> Fare Calculator
            </Link>
            <Link to="/saved" className={`pdn-link ${currentPath === '/saved' ? 'active' : ''}`}>
              <Bookmark size={16} /> Saved
            </Link>
          </nav>

          <div className="pdn-right">
            <Link to="/login" className="pdn-login-btn">
              <User size={16} />
              <span>Staff / Login</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="passenger-main-area">
        <Outlet />
      </main>

      {/* Mobile Bottom Navbar - Clean Floating Transit Bar */}
      <nav className="passenger-bottom-nav mobile-only" aria-label="Mobile Bottom Navigation">
        <Link to="/passenger" className={`pbn-item ${currentPath === '/passenger' ? 'active' : ''}`}>
          <Home size={20} />
          <span>Home</span>
        </Link>
        <Link to="/journey-planner" className={`pbn-item ${currentPath === '/journey-planner' ? 'active' : ''}`}>
          <Navigation size={20} />
          <span>Plan</span>
        </Link>
        <Link to="/routes" className={`pbn-item ${currentPath === '/routes' || currentPath.startsWith('/route-detail') ? 'active' : ''}`}>
          <Radio size={20} />
          <span>Routes</span>
        </Link>
        <Link to="/stops" className={`pbn-item ${currentPath === '/stops' || currentPath.startsWith('/stop/') ? 'active' : ''}`}>
          <MapPin size={20} />
          <span>Stops</span>
        </Link>
        <Link to="/fare-calculator" className={`pbn-item ${currentPath === '/fare-calculator' ? 'active' : ''}`}>
          <Calculator size={20} />
          <span>Fare</span>
        </Link>
        <Link to="/saved" className={`pbn-item ${currentPath === '/saved' ? 'active' : ''}`}>
          <Bookmark size={20} />
          <span>Saved</span>
        </Link>
      </nav>
    </div>
  );
}
