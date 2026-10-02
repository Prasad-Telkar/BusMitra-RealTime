import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, ChevronDown, MapPin, Navigation, Loader2 } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

export default function Stops() {
  const [stops, setStops] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [locationStatus, setLocationStatus] = useState("idle");
  const navigate = useNavigate();

  useEffect(() => {
    fetchStops();
  }, []);

  const fetchStops = async (searchQuery = "") => {
    setIsLoading(true);
    try {
      const url = searchQuery 
        ? `${API_BASE}/api/search/stops?q=${encodeURIComponent(searchQuery)}`
        : `${API_BASE}/api/stops?limit=15`;
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

  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length > 2) {
      fetchStops(val);
    } else if (val.length === 0) {
      fetchStops();
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
            <h1 style={{ margin: 0, fontSize: '24px', color: 'white' }}>Bus Stops</h1>
          </div>
          <p className="tagline">Find a stop and see buses serving it.</p>
        </header>

        <section className="search-section">
          <div className="search-box">
            <Search size={18} color="var(--text-muted)" />
            <input 
              type="text" 
              placeholder="Search bus stop..." 
              value={query}
              onChange={handleSearch}
            />
            {isLoading && <Loader2 className="spinner" size={16} color="var(--teal-600)" />}
          </div>
          
          <button 
            className="btn-outline nearby-btn" 
            onClick={findNearbyStops}
            disabled={locationStatus === "locating"}
            style={{ width: '100%', marginTop: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px' }}
          >
            {locationStatus === "locating" ? (
              <><Loader2 className="spinner" size={18} /> Locating you...</>
            ) : (
              <><Navigation size={18} /> Use My Location</>
            )}
          </button>
        </section>

        <section className="live-buses-section" style={{ marginTop: '24px' }}>
          <div className="section-header">
            <h3>{query ? "Search Results" : (locationStatus === "found" ? "Stops near you" : "Popular Stops")}</h3>
          </div>

          <div className="stop-cards" style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {stops.length === 0 && !isLoading ? (
              <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                No stops found. Try a different search.
              </div>
            ) : (
              stops.map((stop) => (
                <div key={stop.stopId || stop._id} className="bus-card" style={{ display: 'flex', flexDirection: 'column', padding: '16px', gap: '12px', background: 'white', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
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
                  </div>
                  <Link
                    to={`/stop/${stop.stopId || stop._id}`}
                    style={{
                      background: '#F1F5F9',
                      color: 'var(--teal-700)',
                      textAlign: 'center',
                      padding: '10px',
                      borderRadius: '8px',
                      textDecoration: 'none',
                      fontWeight: '600',
                      fontSize: '14px',
                      display: 'block'
                    }}
                  >
                    View Stop
                  </Link>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
