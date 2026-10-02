import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Search, MapPin, Calculator, History, Bookmark } from "lucide-react";

export default function Home() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  return (
    <div className="home-screen">
      <div className="home-content">
        <header className="home-header">
          <div className="header-top">
            <h1 style={{ margin: 0, fontSize: '24px', color: 'white' }}>BusMitra</h1>
          </div>
          <p className="tagline">Know your bus. Know your time.</p>
        </header>

        <section className="search-section">
          <h1>Where are you going?</h1>
          <div className="search-box">
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search destination, bus or route..." 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query) {
                  navigate(`/journey-planner?to=${encodeURIComponent(query)}`);
                }
              }}
            />
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginTop: '16px' }}>
            <button 
              onClick={() => navigate('/journey-planner')}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '8px', padding: '16px', background: 'white', border: '1px solid #E2E8F0',
                borderRadius: '12px', cursor: 'pointer', color: 'var(--teal-700)', fontWeight: '600'
              }}
            >
              <MapPin size={24} />
              <span>Plan Journey</span>
            </button>
            <button 
              onClick={() => navigate('/fare-calculator')}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                gap: '8px', padding: '16px', background: 'white', border: '1px solid #E2E8F0',
                borderRadius: '12px', cursor: 'pointer', color: 'var(--teal-700)', fontWeight: '600'
              }}
            >
              <Calculator size={24} />
              <span>Calculate Fare</span>
            </button>
          </div>
        </section>

        <section className="live-buses-section" style={{ marginTop: '24px' }}>
          <div className="section-header">
            <h3>Live buses near you</h3>
          </div>
          <div style={{ background: 'white', padding: '24px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '14px' }}>Live arrivals unavailable</p>
          </div>
        </section>
        
        <section className="recent-section" style={{ marginTop: '24px' }}>
          <div className="section-header">
            <h3>Recent journeys</h3>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <History size={24} color="var(--text-muted)" style={{ margin: '0 auto 8px auto' }} />
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>No recent journeys</p>
          </div>
        </section>
        
        <section className="saved-section" style={{ marginTop: '24px', paddingBottom: '24px' }}>
          <div className="section-header">
            <h3>Saved</h3>
          </div>
          <div style={{ background: 'white', padding: '20px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
            <Bookmark size={24} color="var(--text-muted)" style={{ margin: '0 auto 8px auto' }} />
            <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>No saved routes</p>
          </div>
        </section>
      </div>
    </div>
  );
}
