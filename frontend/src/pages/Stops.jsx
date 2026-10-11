import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Search, MapPin, Navigation, Loader2, ArrowRight, Bus } from "lucide-react";
import "./Stops.css";

const API_BASE = import.meta.env.VITE_API_BASE || "https://busmitra-goa.onrender.com";

export default function Stops() {
  const [stops, setStops] = useState([]);
  const [query, setQuery] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(false);
  const [locationStatus, setLocationStatus] = useState("idle");
  const navigate = useNavigate();

  useEffect(() => {
    fetchStops();
  }, []);

  const fetchStops = async (searchQuery = "") => {
    setIsLoading(true);
    setError(false);
    try {
      const url = searchQuery 
        ? `${API_BASE}/api/search/stops?q=${encodeURIComponent(searchQuery)}`
        : `${API_BASE}/api/stops?limit=24`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStops(data);
      } else {
        setError(true);
      }
    } catch (err) {
      console.error("Failed to fetch stops", err);
      setError(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSearch = (e) => {
    const val = e.target.value;
    setQuery(val);
    if (val.length >= 2) {
      fetchStops(val);
    } else if (val.length === 0) {
      fetchStops();
    }
  };

  const findNearbyStops = () => {
    setLocationStatus("locating");
    if (!navigator.geolocation) {
      setLocationStatus("error");
      alert("Geolocation is not supported by your browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        setLocationStatus("found");
        setIsLoading(true);
        try {
          const { latitude, longitude } = position.coords;
          const res = await fetch(`${API_BASE}/api/stops/nearby?lat=${latitude}&lng=${longitude}&radius=10`);
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
      (err) => {
        console.error("Geolocation error:", err);
        setLocationStatus("error");
        alert("Unable to acquire your GPS location. Please check location permissions.");
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="stops-page-container">
      {/* HEADER */}
      <div className="stops-header">
        <span className="stops-badge">Transit Network</span>
        <h1 className="stops-title">Bus Stops Directory</h1>
        <p className="stops-subtitle">
          Explore all official Kadamba Transport Corporation (KTCL) stands and local stops across Goa.
        </p>
      </div>

      {/* SEARCH & GEOLOCATION CONTROLS */}
      <div className="stops-controls-card">
        <div className="stops-search-wrapper">
          <Search size={18} color="#0284C7" />
          <input 
            type="text" 
            className="stops-search-input"
            placeholder="Search stop name (e.g. Panaji, Margao, Mapusa)..." 
            value={query}
            onChange={handleSearch}
          />
          {isLoading && <Loader2 className="spinner" size={16} color="#0284C7" />}
        </div>

        <button 
          type="button"
          className="stops-nearby-btn" 
          onClick={findNearbyStops}
          disabled={locationStatus === "locating"}
        >
          {locationStatus === "locating" ? (
            <><Loader2 className="spinner" size={16} /> Locating Stops...</>
          ) : (
            <><Navigation size={16} /> Stops Near Me</>
          )}
        </button>
      </div>

      {/* STOPS LIST */}
      <div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2 style={{ fontSize: '16px', fontWeight: 800, color: '#0F172A', margin: 0 }}>
            {query ? `Search Results for "${query}"` : locationStatus === "found" ? "Stops Nearest to You" : "Official Bus Stands"}
          </h2>
          <span style={{ fontSize: '13px', color: '#64748B', fontWeight: 600 }}>
            {stops.length} Stops Found
          </span>
        </div>

        {isLoading && stops.length === 0 ? (
          <div className="stops-grid">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} style={{ height: '120px', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0', opacity: 0.6 }} />
            ))}
          </div>
        ) : error ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', background: '#FEF2F2', borderRadius: '16px', border: '1px solid #FECACA', color: '#B91C1C' }}>
            Unable to load stops from server. Please verify your connection.
          </div>
        ) : stops.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', background: '#FFFFFF', borderRadius: '16px', border: '1px solid #E2E8F0' }}>
            <MapPin size={36} color="#94A3B8" style={{ marginBottom: '8px' }} />
            <h3 style={{ margin: '0 0 6px 0', fontSize: '17px', color: '#0F172A' }}>No stops found</h3>
            <p style={{ margin: 0, fontSize: '13px', color: '#64748B' }}>Try searching a different stop name like Panaji, Margao, or Vasco.</p>
          </div>
        ) : (
          <div className="stops-grid">
            {stops.map(stop => {
              const stopId = stop.stopId || stop._id;
              return (
                <div key={stopId} className="stop-item-card">
                  <div className="stop-card-head">
                    <div className="stop-pin-icon">
                      <MapPin size={22} />
                    </div>
                    <div className="stop-card-text">
                      <h3 className="stop-card-name">{stop.name}</h3>
                      <div className="stop-card-meta">
                        {stop.distance_km && (
                          <span className="stop-dist-tag">{Number(stop.distance_km).toFixed(1)} km away</span>
                        )}
                        <span>
                          {stop.route_count !== undefined && stop.route_count > 0 
                            ? `${stop.route_count} Route${stop.route_count > 1 ? 's' : ''}` 
                            : 'KTCL Stop'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="stop-card-actions">
                    <Link to={`/stop/${stopId}`} className="stop-btn-details">
                      View Timetables
                    </Link>
                    <Link 
                      to={`/journey-planner?to=${encodeURIComponent(stop.name)}&toId=${stopId}`} 
                      className="stop-btn-plan"
                      title="Plan journey to this stop"
                    >
                      <Navigation size={13} />
                      <span>Plan Trip</span>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
