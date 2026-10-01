import { Outlet, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { MapPin, Map as MapIcon, Bookmark, Bus, Menu, Home, Calculator, Navigation } from "lucide-react";
import NavigationDrawer from "./NavigationDrawer";

export default function PassengerLayout() {
  const location = useLocation();
  const currentPath = location.pathname;
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  return (
    <div className="passenger-layout">
      <NavigationDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Mobile Top Navbar - Hidden on Desktop */}
      <header className="passenger-top-nav mobile-only" style={{ padding: '16px 20px', background: '#fff', borderBottom: '1px solid #eaeaea' }}>
        <div className="ptn-container" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <button 
              onClick={() => setIsDrawerOpen(true)}
              style={{ background: 'transparent', border: 'none', padding: 0, display: 'flex', alignItems: 'center', cursor: 'pointer' }}
            >
              <Menu size={24} color="var(--teal-800)" />
            </button>
            <Link to="/passenger" className="ptn-brand" style={{ color: 'var(--teal-800)' }}>
              <div className="ptn-logo" style={{ background: 'var(--teal-800)', borderRadius: '8px', padding: '4px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bus size={18} color="white" />
              </div>
              <h2 style={{ color: 'var(--teal-800)', margin: 0, fontSize: '20px', fontWeight: 700 }}>BusMitra</h2>
            </Link>
          </div>
        </div>
      </header>

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
      <nav className="bottom-nav mobile-only" style={{ overflowX: 'auto', justifyContent: 'flex-start', paddingBottom: 'env(safe-area-inset-bottom)' }}>
        <Link to="/passenger" className={`nav-item ${currentPath === '/passenger' ? 'active' : ''}`} style={{ minWidth: '70px' }}>
          <Home size={24} />
          <span style={{ fontSize: '10px' }}>Home</span>
        </Link>
        <Link to="/journey-planner" className={`nav-item ${currentPath === '/journey-planner' ? 'active' : ''}`} style={{ minWidth: '70px' }}>
          <Navigation size={24} />
          <span style={{ fontSize: '10px' }}>Plan</span>
        </Link>
        <Link to="/fare-calculator" className={`nav-item ${currentPath === '/fare-calculator' ? 'active' : ''}`} style={{ minWidth: '70px' }}>
          <Calculator size={24} />
          <span style={{ fontSize: '10px' }}>Fare</span>
        </Link>
        <Link to="/passenger" className="nav-item" style={{ minWidth: '70px' }}>
          <MapPin size={24} />
          <span style={{ fontSize: '10px' }}>Stops</span>
        </Link>
        <Link to="/routes" className={`nav-item ${currentPath === '/routes' || currentPath.startsWith('/route-detail') ? 'active' : ''}`} style={{ minWidth: '70px' }}>
          <Bus size={24} />
          <span style={{ fontSize: '10px' }}>Track</span>
        </Link>
        <Link to="/saved" className={`nav-item ${currentPath === '/saved' ? 'active' : ''}`} style={{ minWidth: '70px' }}>
          <Bookmark size={24} />
          <span style={{ fontSize: '10px' }}>Saved</span>
        </Link>
      </nav>
    </div>
  );
}
