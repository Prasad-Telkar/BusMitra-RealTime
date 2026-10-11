import { useState, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Search, 
  MapPin, 
  Calculator, 
  History, 
  Bookmark, 
  Navigation, 
  Loader2, 
  Radio, 
  ArrowRight, 
  Crosshair, 
  ChevronRight, 
  Clock, 
  Bus,
  ShieldCheck,
  Info
} from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "https://busmitra-goa.onrender.com";

const MAJOR_GOA_HUBS = [
  { id: "1", name: "Panaji KTC Bus Stand", role: "Central Capital Terminal", routeCount: 218 },
  { id: "135", name: "Margao KTC Bus Stand", role: "South Goa Hub", routeCount: 164 },
  { id: "44", name: "Mapusa KTC Bus Stand", role: "North Coastal Stand", routeCount: 112 },
  { id: "52", name: "Vasco Da Gama Bus Stand", role: "Port City Terminal", routeCount: 78 },
  { id: "30", name: "Ponda KTC Bus Stand", role: "Central Connector", routeCount: 86 },
];

export default function Home() {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [stops, setStops] = useState([]);
  const [isLoadingStops, setIsLoadingStops] = useState(false);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | locating | found | error | denied
  const [locationError, setLocationError] = useState("");

  const [activeFleet, setActiveFleet] = useState([]);
  const [scheduledRoutes, setScheduledRoutes] = useState([]);
  const [savedStops, setSavedStops] = useState([]);

  useEffect(() => {
    fetchStops();
    fetchFleet();
    fetchScheduledRoutes();
    loadSavedStops();
  }, []);

  const loadSavedStops = () => {
    try {
      const saved = JSON.parse(localStorage.getItem('busmitra_saved_stops') || '[]');
      setSavedStops(saved);
    } catch {
      setSavedStops([]);
    }
  };

  const fetchStops = async (searchQuery = "") => {
    setIsLoadingStops(true);
    try {
      const url = searchQuery 
        ? `${API_BASE}/api/search/stops?q=${encodeURIComponent(searchQuery)}&limit=6`
        : `${API_BASE}/api/stops?limit=6`;
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setStops(data);
      }
    } catch (err) {
      console.error("Failed to fetch stops", err);
    } finally {
      setIsLoadingStops(false);
    }
  };

  const fetchFleet = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/fleet`);
      if (res.ok) {
        const data = await res.json();
        setActiveFleet(data.fleet || []);
      }
    } catch {
      setActiveFleet([]);
    }
  };

  const fetchScheduledRoutes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/routes?limit=4`);
      if (res.ok) {
        const data = await res.json();
        setScheduledRoutes(data);
      }
    } catch {
      setScheduledRoutes([]);
    }
  };

  const findNearbyStops = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationError("Geolocation is not supported by your browser.");
      return;
    }

    setLocationStatus("locating");
    setLocationError("");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const res = await fetch(`${API_BASE}/api/stops/nearby?lat=${latitude}&lng=${longitude}&radius=5&limit=5`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              setStops(data);
              setLocationStatus("found");
            } else {
              setLocationStatus("error");
              setLocationError("No bus stops found within 5 km of your location.");
            }
          }
        } catch {
          setLocationStatus("error");
          setLocationError("Failed to fetch nearby stops from server.");
        }
      },
      (err) => {
        setLocationStatus("denied");
        if (err.code === 1) {
          setLocationError("Location permission was disabled. Showing major transit terminals below.");
        } else {
          setLocationError("GPS signal unavailable. Showing Goa transit terminals below.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (query.trim()) {
      navigate(`/journey-planner?to=${encodeURIComponent(query.trim())}`);
    } else {
      navigate("/journey-planner");
    }
  };

  return (
    <div className="bm-passenger-dashboard">
      <div className="bm-dashboard-container">
        
        {/* Top Hero Card */}
        <section className="bm-dash-hero">
          <div className="bm-dash-hero-content">
            <div className="bm-dash-badge">
              <span className="bm-dash-beacon" />
              <span>Goa Kadamba Transit Network</span>
            </div>
            <h1 className="bm-dash-title">Where are you going today?</h1>
            <p className="bm-dash-subtitle">Real-time timetables, direct routing, and live GPS tracking across Goa.</p>

            {/* Quick Search Input */}
            <form className="bm-dash-search-form" onSubmit={handleSearchSubmit}>
              <Search size={18} color="var(--bm-blue-600, #0284C7)" className="bm-dash-search-icon" />
              <input 
                type="text" 
                className="bm-dash-search-input"
                placeholder="Search bus stop, destination, or route name..." 
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  if (e.target.value.length > 2) fetchStops(e.target.value);
                  else if (e.target.value.length === 0) fetchStops();
                }}
              />
              {isLoadingStops ? (
                <Loader2 size={18} className="bm-spin" color="var(--bm-blue-600, #0284C7)" />
              ) : (
                <button type="submit" className="bm-dash-search-btn">
                  <span>Search</span>
                </button>
              )}
            </form>
          </div>
        </section>

        {/* 4-Card Quick Actions Grid */}
        <section className="bm-dash-actions-grid" aria-label="Quick Navigation">
          <Link to="/journey-planner" className="bm-dash-action-card">
            <div className="bm-dac-icon-wrap bm-dac-blue">
              <Navigation size={22} />
            </div>
            <div className="bm-dac-text">
              <span className="bm-dac-title">Plan Journey</span>
              <span className="bm-dac-desc">Point-to-point routes &amp; transfers</span>
            </div>
            <ChevronRight size={18} className="bm-dac-arrow" />
          </Link>

          <Link to="/fare-calculator" className="bm-dash-action-card">
            <div className="bm-dac-icon-wrap bm-dac-amber">
              <Calculator size={22} />
            </div>
            <div className="bm-dac-text">
              <span className="bm-dac-title">Calculate Fare</span>
              <span className="bm-dac-desc">Stage carriage &amp; concessions</span>
            </div>
            <ChevronRight size={18} className="bm-dac-arrow" />
          </Link>

          <Link to="/routes" className="bm-dash-action-card">
            <div className="bm-dac-icon-wrap bm-dac-teal">
              <Radio size={22} />
            </div>
            <div className="bm-dac-text">
              <span className="bm-dac-title">Live Tracking</span>
              <span className="bm-dac-desc">Active buses &amp; route telemetry</span>
            </div>
            <ChevronRight size={18} className="bm-dac-arrow" />
          </Link>

          <Link to="/stops" className="bm-dash-action-card">
            <div className="bm-dac-icon-wrap bm-dac-emerald">
              <MapPin size={22} />
            </div>
            <div className="bm-dac-text">
              <span className="bm-dac-title">Bus Stops</span>
              <span className="bm-dac-desc">3,800+ stands across Goa</span>
            </div>
            <ChevronRight size={18} className="bm-dac-arrow" />
          </Link>
        </section>

        {/* Live Fleet Status Banner */}
        <section className="bm-dash-fleet-section">
          <div className="bm-dash-fleet-card">
            <div className="bm-dfc-header">
              <div className="bm-dfc-title-group">
                <span className={`bm-dfc-dot ${activeFleet.length > 0 ? "active" : "offline"}`} />
                <div>
                  <h3 className="bm-dfc-title">
                    {activeFleet.length > 0 ? "Live Telemetry Broadcast Active" : "Real-Time Telemetry Status"}
                  </h3>
                  <p className="bm-dfc-desc">
                    {activeFleet.length > 0
                      ? `${activeFleet.length} active bus${activeFleet.length > 1 ? "es are" : " is"} broadcasting live GPS.`
                      : "No drivers are currently broadcasting live GPS telemetry. Verified timetable services remain operational."}
                  </p>
                </div>
              </div>
              <span className={activeFleet.length > 0 ? "bm-pill-live" : "bm-pill-timetable"}>
                {activeFleet.length > 0 ? "LIVE GPS" : "TIMETABLE MODE"}
              </span>
            </div>

            {/* If live buses exist, render cards */}
            {activeFleet.length > 0 && (
              <div className="bm-dfc-bus-list">
                {activeFleet.map((bus) => (
                  <div key={bus.activeTripId} className="bm-dfc-bus-item">
                    <div className="bm-dfc-bus-info">
                      <span className="bm-dfc-bus-badge">Bus {bus.busId || bus.activeTripId.slice(-4)}</span>
                      <span className="bm-dfc-bus-route">{bus.routeId || "Active Route"}</span>
                    </div>
                    <div className="bm-dfc-bus-speed">
                      {Math.round(bus.speed * 3.6)} km/h
                    </div>
                    <Link to={`/track/${bus.busId || bus.activeTripId}`} className="bm-dfc-track-btn">
                      <span>Track</span>
                      <ArrowRight size={14} />
                    </Link>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* Nearby Stops / Search Results */}
        <section className="bm-dash-stops-section">
          <div className="bm-dash-section-header">
            <div>
              <h2 className="bm-dash-section-title">
                {query ? "Search Results" : (locationStatus === "found" ? "Stops Nearest to You" : "Major Transit Terminals")}
              </h2>
              <p className="bm-dash-section-sub">
                {locationStatus === "found" ? "Sorted by distance from your coordinates" : "Official KTCL passenger boarding points"}
              </p>
            </div>

            <button 
              type="button" 
              className="bm-dash-detect-btn"
              onClick={findNearbyStops}
              disabled={locationStatus === "locating"}
            >
              {locationStatus === "locating" ? (
                <>
                  <Loader2 size={16} className="bm-spin" />
                  <span>Locating...</span>
                </>
              ) : (
                <>
                  <Crosshair size={16} />
                  <span>Find Stops Near Me</span>
                </>
              )}
            </button>
          </div>

          {locationError && (
            <div className="bm-dash-info-banner">
              <Info size={16} />
              <span>{locationError}</span>
            </div>
          )}

          <div className="bm-dash-stops-grid">
            {stops.length === 0 && !isLoadingStops ? (
              <div className="bm-dash-empty-box">
                <MapPin size={24} color="var(--bm-slate-400, #94A3B8)" />
                <p>No bus stops match your search. Try searching for "Panaji", "Margao", or "Mapusa".</p>
              </div>
            ) : (
              stops.map((stop) => (
                <Link
                  key={stop.stopId || stop._id}
                  to={`/stop/${stop.stopId || stop._id}`}
                  className="bm-dash-stop-card"
                >
                  <div className="bm-dsc-icon">
                    <MapPin size={20} color="var(--bm-blue-600, #0284C7)" />
                  </div>
                  <div className="bm-dsc-body">
                    <h3 className="bm-dsc-name">{stop.name}</h3>
                    <div className="bm-dsc-meta">
                      <span className="bm-dsc-dist">
                        {stop.distance_km ? `${stop.distance_km} km away` : "KTCL Bus Stand"}
                      </span>
                      <span className="bm-dsc-routes">
                        {stop.route_count !== undefined 
                          ? `${stop.route_count} route${stop.route_count === 1 ? '' : 's'}` 
                          : "Scheduled Service"}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="bm-dsc-arrow" />
                </Link>
              ))
            )}
          </div>
        </section>

        {/* Saved Commutes Section */}
        <section className="bm-dash-saved-section">
          <div className="bm-dash-section-header">
            <div>
              <h2 className="bm-dash-section-title">Saved Commutes &amp; Stops</h2>
              <p className="bm-dash-section-sub">Your bookmarked stops for fast daily lookup</p>
            </div>
            <Link to="/saved" className="bm-dash-link-sm">
              <span>View all</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          {savedStops.length === 0 ? (
            <div className="bm-dash-saved-empty">
              <Bookmark size={24} color="var(--bm-slate-400, #94A3B8)" />
              <div>
                <strong>No saved stops yet</strong>
                <p>Tap the bookmark icon on any stop or route detail page to save it for quick access.</p>
              </div>
              <Link to="/stops" className="bm-btn-sm-outline">Browse Stops</Link>
            </div>
          ) : (
            <div className="bm-dash-stops-grid">
              {savedStops.slice(0, 4).map((stop) => (
                <Link
                  key={stop.stopId || stop._id}
                  to={`/stop/${stop.stopId || stop._id}`}
                  className="bm-dash-stop-card"
                >
                  <div className="bm-dsc-icon bm-dsc-saved-icon">
                    <Bookmark size={18} color="var(--bm-blue-700, #0369A1)" />
                  </div>
                  <div className="bm-dsc-body">
                    <h3 className="bm-dsc-name">{stop.name}</h3>
                    <div className="bm-dsc-meta">
                      <span className="bm-dsc-dist">Bookmarked Stop</span>
                    </div>
                  </div>
                  <ChevronRight size={18} className="bm-dsc-arrow" />
                </Link>
              ))}
            </div>
          )}
        </section>

      </div>
    </div>
  );
}
