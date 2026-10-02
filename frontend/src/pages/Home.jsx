import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Search, MapPin, Calculator, History, Bookmark, Navigation, Loader2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "https://busmitra-goa.onrender.com";

export default function Home() {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();
  const [stops, setStops] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState("idle");

  useEffect(() => {
    fetchStops();
  }, []);

  const fetchStops = async (searchQuery = "") => {
    setIsLoading(true);
    try {
      const url = searchQuery 
        ? `${API_BASE}/api/search/stops?q=${encodeURIComponent(searchQuery)}`
        : `${API_BASE}/api/stops?limit=5`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStops(data);
      }
    } catch (err) {
      console.error("Failed to fetch stops", err);
    } finally {
      setIsLoading(false);
    }
  };

  const findNearbyStops = () => {
    setLocationStatus("locating");
    if (!navigator.geolocation) {
      setLocationStatus("error");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocationStatus("found");
        setIsLoading(true);
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`${API_BASE}/api/stops/nearby?lat=${latitude}&lng=${longitude}&radius=5`);
          if (res.ok) {
            const data = await res.json();
            setStops(data);
            setQuery("");
          }
        } catch (err) {
          console.error("Failed to fetch nearby stops", err);
        } finally {
          setIsLoading(false);
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        setLocationStatus("error");
      },
      { timeout: 10000 }
    );
  };

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
              onChange={(e) => {
                setQuery(e.target.value);
                if (e.target.value.length > 2) fetchStops(e.target.value);
                else if (e.target.value.length === 0) fetchStops();
              }}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && query) {
                  navigate(`/journey-planner?to=${encodeURIComponent(query)}`);
                }
              }}
            />
            {isLoading && <Loader2 className="spinner" size={16} color="var(--teal-600)" />}
          </div>
          
          <button 
            className="btn-outline nearby-btn" 
            onClick={findNearbyStops}
            disabled={locationStatus === "locating"}
            style={{ width: '100%', marginTop: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', padding: '12px', background: 'white', border: '1px solid #E2E8F0', borderRadius: '12px', cursor: 'pointer', color: 'var(--teal-700)', fontWeight: '600' }}
          >
            {locationStatus === "locating" ? (
              <><Loader2 className="spinner" size={18} /> Locating you...</>
            ) : (
              <><Navigation size={18} /> Find stops near me</>
            )}
          </button>

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

        <section className="stops-section" style={{ marginTop: '24px' }}>
          <div className="section-header">
            <h3>{query ? "Search Results" : (locationStatus === "found" ? "Nearby Stops" : "Popular Stops")}</h3>
          </div>

          <div className="stop-cards" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stops.length === 0 && !isLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No stops found. Try a different search.
              </div>
            ) : (
              stops.map((stop) => (
                <Link
                  key={stop.stopId || stop._id}
                  to={`/stop/${stop.stopId || stop._id}`}
                  className="bus-card"
                  style={{ textDecoration: 'none', color: 'inherit', display: 'flex', alignItems: 'center', padding: '16px', gap: '12px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}
                >
                  <div style={{ background: 'var(--teal-50)', padding: '10px', borderRadius: '12px' }}>
                    <MapPin size={24} color="var(--teal-600)" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)' }}>{stop.name}</h4>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {stop.distance_km ? `${stop.distance_km} km away` : "KTCL Bus Stop"}
                    </p>
                    <p style={{ margin: '4px 0 0 0', fontSize: '13px', color: 'var(--text-muted)' }}>
                      {stop.route_count !== undefined 
                        ? (stop.route_count > 0 ? `${stop.route_count} route${stop.route_count > 1 ? 's' : ''} serving this stop` : "No scheduled routes")
                        : ""}
                    </p>
                  </div>
                </Link>
              ))
            )}
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

