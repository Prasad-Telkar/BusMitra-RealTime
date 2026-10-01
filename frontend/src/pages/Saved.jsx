import { Link } from "react-router-dom";
import { Bus, Map as MapIcon, Bookmark, MoreHorizontal, MapPin, CheckSquare, ChevronRight, Plus, BookmarkMinus } from "lucide-react";

export default function Saved() {
  return (
    <div className="home-screen bg-light">
      <div className="saved-content" style={{ paddingBottom: '100px' }}>
        
        <header className="saved-header">
          <div className="sh-top">
            <h1>Your everyday journeys</h1>
            <MoreHorizontal size={24} color="var(--teal-800)" />
          </div>
          <p className="sh-subtitle">Your regular stops and routes, one tap away.</p>
        </header>

        <section className="saved-section">
          <div className="section-header">
            <h3>Saved stops</h3>
            <span className="edit-action">Edit</span>
          </div>

          <div className="saved-cards">
            {/* Saved Stop 1 */}
            <div className="saved-stop-card">
              <div className="ssc-top">
                <div className="ssc-icon">
                  <MapPin size={20} color="var(--teal-700)" />
                </div>
                <div className="ssc-info">
                  <h4>Porvorim</h4>
                  <p>Towards Margao &middot; Boarding stop</p>
                </div>
                <div className="ssc-bookmark">
                  <CheckSquare size={20} color="var(--teal-700)" />
                </div>
              </div>
              <div className="ssc-bottom">
                <span className="ssc-route">K01 &rarr; Margao</span>
                <span className="ssc-eta teal">8 min - Live</span>
                <ChevronRight size={16} color="var(--teal-700)" />
              </div>
            </div>

            {/* Saved Stop 2 */}
            <div className="saved-stop-card">
              <div className="ssc-top">
                <div className="ssc-icon">
                  <MapPin size={20} color="var(--teal-700)" />
                </div>
                <div className="ssc-info">
                  <h4>Margao</h4>
                  <p>Towards Panaji &middot; Destination stop</p>
                </div>
                <div className="ssc-bookmark">
                  <CheckSquare size={20} color="var(--teal-700)" />
                </div>
              </div>
              <div className="ssc-bottom">
                <span className="ssc-route">K01 &rarr; Panaji</span>
                <span className="ssc-eta teal">ETA unavailable</span>
                <ChevronRight size={16} color="var(--teal-700)" />
              </div>
            </div>
          </div>
        </section>

        <section className="saved-section mt-4">
          <div className="section-header">
            <h3>Saved routes</h3>
            <span className="edit-action">Edit</span>
          </div>

          <div className="saved-routes-list">
            {/* Saved Route 1 */}
            <div className="saved-route-item">
              <div className="sr-left">
                <div className="bus-badge">K01</div>
                <div className="sr-info">
                  <h4>Panaji &rarr; Margao</h4>
                  <p>Via Porvorim, Mapusa, Ponda</p>
                  <div className="sr-status teal">
                    <span className="live-dot teal"></span> At Porvorim - 8 min
                  </div>
                </div>
              </div>
              <ChevronRight size={18} color="var(--teal-700)" />
            </div>

            {/* Saved Route 2 */}
            <div className="saved-route-item">
              <div className="sr-left">
                <div className="bus-badge">K03</div>
                <div className="sr-info">
                  <h4>Vasco &rarr; Panaji</h4>
                  <p>Via Dabolim, Chicalim, Cortalim</p>
                  <div className="sr-status teal">
                    <span className="live-dot teal"></span> At Dabolim - 14 min
                  </div>
                </div>
              </div>
              <ChevronRight size={18} color="var(--teal-700)" />
            </div>
          </div>
        </section>

        <button className="btn-outline add-saved-btn">
          <Plus size={18} /> Find a stop or route to save
        </button>

        <div className="demo-data-note inline" style={{ alignItems: 'flex-start', marginTop: '24px' }}>
          <BookmarkMinus size={16} style={{ marginTop: '2px', flexShrink: 0 }} /> 
          <span>Demo data &middot; No official KTC integration. Local / private buses coming soon.</span>
        </div>
      </div>

      <nav className="bottom-nav">
        <Link to="/passenger" className="nav-item">
          <Bus size={24} />
          Nearby
        </Link>
        <Link to="/routes" className="nav-item">
          <MapIcon size={24} />
          Routes
        </Link>
        <Link to="/saved" className="nav-item active">
          <Bookmark size={24} />
          Saved
        </Link>
      </nav>
    </div>
  );
}
