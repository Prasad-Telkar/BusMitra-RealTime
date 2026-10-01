import { Outlet, Link, useLocation } from "react-router-dom";
import { MapPin, Map as MapIcon, Bookmark, Bus } from "lucide-react";

export default function PassengerLayout() {
  const location = useLocation();
  const currentPath = location.pathname;

  return (
    <div className="passenger-layout">
      {/* Desktop Top Navbar - Hidden on Mobile */}
      <header className="passenger-top-nav desktop-only">
        <div className="ptn-container">
          <Link to="/passenger" className="ptn-brand">
            <div className="ptn-logo">
              <Bus size={20} color="white" />
            </div>
            <h2>BusMitra</h2>
          </Link>
          <nav className="ptn-links">
            <Link to="/passenger" className={`ptn-link ${currentPath === '/passenger' ? 'active' : ''}`}>
              <MapPin size={18} /> Stops
            </Link>
            <Link to="/routes" className={`ptn-link ${currentPath === '/routes' ? 'active' : ''}`}>
              <MapIcon size={18} /> Routes
            </Link>
            <Link to="/saved" className={`ptn-link ${currentPath === '/saved' ? 'active' : ''}`}>
              <Bookmark size={18} /> Saved
            </Link>
          </nav>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="passenger-main-area">
        <Outlet />
      </main>

      {/* Mobile Bottom Navbar - Hidden on Desktop */}
      <nav className="bottom-nav mobile-only">
        <Link to="/passenger" className={`nav-item ${currentPath === '/passenger' ? 'active' : ''}`}>
          <MapPin size={24} />
          <span>Stops</span>
        </Link>
        <Link to="/routes" className={`nav-item ${currentPath === '/routes' || currentPath.startsWith('/route-detail') ? 'active' : ''}`}>
          <MapIcon size={24} />
          <span>Routes</span>
        </Link>
        <Link to="/saved" className={`nav-item ${currentPath === '/saved' ? 'active' : ''}`}>
          <Bookmark size={24} />
          <span>Saved</span>
        </Link>
      </nav>
    </div>
  );
}
