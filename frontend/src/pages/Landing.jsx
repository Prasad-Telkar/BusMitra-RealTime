import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Bus, 
  MapPin, 
  Navigation, 
  Search, 
  Calculator, 
  ArrowRight, 
  ArrowUpDown, 
  Clock, 
  ShieldCheck, 
  Crosshair, 
  Loader2, 
  Sparkles, 
  User, 
  Bookmark, 
  Compass,
  AlertCircle,
  Radio,
  ChevronRight,
  Info
} from "lucide-react";
import { API_BASE } from "../lib/api";
import "./Landing.css";

export default function Landing() {
  const navigate = useNavigate();

  // Search in Hero
  const [heroSearch, setHeroSearch] = useState("");

  // Journey Planner inputs
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [isLocatingOrigin, setIsLocatingOrigin] = useState(false);

  // Transit Data from APIs
  const [routes, setRoutes] = useState([]);
  const [filteredRoutes, setFilteredRoutes] = useState([]);
  const [activeFilter, setActiveFilter] = useState("ALL");
  const [routesLoading, setRoutesLoading] = useState(true);

  // Live fleet status
  const [liveBusesCount, setLiveBusesCount] = useState(0);

  // Nearby Stops
  const [stops, setStops] = useState([]);
  const [stopsLoading, setStopsLoading] = useState(true);
  const [geoStatus, setGeoStatus] = useState("idle"); // idle | locating | found | denied

  // Load initial routes, fleet status, and stops
  useEffect(() => {
    fetchRoutes();
    fetchLiveBuses();
    fetchInitialStops();
  }, []);

  const fetchRoutes = async () => {
    setRoutesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/routes`);
      if (res.ok) {
        const data = await res.json();
        // Take a clean sample of up to 12 popular routes
        setRoutes(data || []);
        setFilteredRoutes((data || []).slice(0, 6));
      }
    } catch (err) {
      console.warn("Failed to load routes:", err);
    } finally {
      setRoutesLoading(false);
    }
  };

  const fetchLiveBuses = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/buses`);
      if (res.ok) {
        const data = await res.json();
        const activeCount = Array.isArray(data) 
          ? data.filter(b => b.live || b.status === "active").length 
          : 0;
        setLiveBusesCount(activeCount);
      }
    } catch (err) {
      console.warn("Live buses check:", err);
    }
  };

  const fetchInitialStops = async () => {
    setStopsLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/stops?limit=6`);
      if (res.ok) {
        const data = await res.json();
        setStops(data || []);
      }
    } catch (err) {
      console.warn("Failed to load stops:", err);
    } finally {
      setStopsLoading(false);
    }
  };

  // Route filter chips handler
  const handleFilterChange = (filterKey) => {
    setActiveFilter(filterKey);
    if (filterKey === "ALL") {
      setFilteredRoutes(routes.slice(0, 6));
    } else {
      const filtered = routes.filter(r => 
        (r.longName && r.longName.toUpperCase().includes(filterKey)) ||
        (r.shortName && r.shortName.toUpperCase().includes(filterKey))
      ).slice(0, 6);
      setFilteredRoutes(filtered.length > 0 ? filtered : routes.slice(0, 6));
    }
  };

  // Hero destination submit
  const handleHeroSearch = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/journey-planner?to=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate("/journey-planner");
    }
  };

  // Journey planner form submit
  const handleJourneySubmit = (e) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (fromQuery.trim() && fromQuery !== "📍 Your current location") {
      params.set("from", fromQuery.trim());
    }
    if (toQuery.trim()) {
      params.set("to", toQuery.trim());
    }
    navigate(`/journey-planner?${params.toString()}`);
  };

  // Swap origin and destination
  const handleSwap = () => {
    const temp = fromQuery;
    setFromQuery(toQuery);
    setToQuery(temp);
  };

  // Geolocation for Origin
  const requestCurrentLocationForOrigin = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocatingOrigin(true);
    setFromQuery("Locating you...");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setIsLocatingOrigin(false);
        setFromQuery("📍 Your current location");
      },
      (err) => {
        setIsLocatingOrigin(false);
        setFromQuery("");
        if (err.code === 1) {
          alert("Location permission denied. Please enter your departure stop manually.");
        } else {
          alert("Could not retrieve current location. Please enter your departure stop.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Find nearby stops via browser Geolocation
  const handleFindNearbyStops = () => {
    if (!navigator.geolocation) {
      setGeoStatus("denied");
      return;
    }
    setGeoStatus("locating");
    setStopsLoading(true);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { latitude, longitude } = pos.coords;
          const res = await fetch(`${API_BASE}/api/stops/nearby?lat=${latitude}&lng=${longitude}&radius=5`);
          if (res.ok) {
            const data = await res.json();
            setStops(data && data.length > 0 ? data.slice(0, 6) : []);
            setGeoStatus("found");
          } else {
            fetchInitialStops();
            setGeoStatus("denied");
          }
        } catch {
          fetchInitialStops();
          setGeoStatus("denied");
        } finally {
          setStopsLoading(false);
        }
      },
      () => {
        setGeoStatus("denied");
        fetchInitialStops();
        setStopsLoading(false);
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="bm-homepage-root">
      
      {/* ========================================================
          A. HEADER (Clean, Compact, Responsive, Brand Colors)
      ======================================================== */}
      <header className="bm-nav-header">
        <div className="bm-header-container">
          {/* Brand Logo & Name */}
          <Link to="/" className="bm-brand-link" aria-label="BusMitra Goa Public Transport">
            <div className="bm-logo-box" aria-hidden="true">
              <Bus size={20} color="#FFFFFF" strokeWidth={2.4} />
            </div>
            <div className="bm-brand-text">
              <span className="bm-brand-title">Bus<span className="bm-brand-accent">Mitra</span></span>
              <span className="bm-brand-sub">Goa Transit</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="bm-desktop-nav" aria-label="Main Navigation">
            <Link to="/routes" className="bm-nav-link">Live Buses</Link>
            <Link to="/journey-planner" className="bm-nav-link">Plan Journey</Link>
            <Link to="/fare-calculator" className="bm-nav-link">Fare Calculator</Link>
            <Link to="/stops" className="bm-nav-link">Stops</Link>
          </nav>

          {/* Account / Login Action */}
          <div className="bm-header-actions">
            <Link to="/login" className="bm-login-action-btn" aria-label="Sign In or Staff Login">
              <User size={16} />
              <span>Log In</span>
            </Link>
          </div>
        </div>
      </header>

      {/* ========================================================
          B. HERO SECTION (Balanced Headline, Search & Goa Bus)
      ======================================================== */}
      <section className="bm-hero-section">
        <div className="bm-hero-container">
          
          {/* Left / Top: Hero Content */}
          <div className="bm-hero-content">
            <div className="bm-hero-pill">
              <Sparkles size={14} className="bm-sparkle-icon" />
              <span>Kadamba Transport Corporation Ltd • Goa</span>
            </div>

            <h1 className="bm-hero-title">
              Your journey. <br />
              <span className="bm-title-gradient">Your bus. Your time.</span>
            </h1>

            <p className="bm-hero-subtitle">
              Explore Goa with smarter public transport. Instant schedules, reliable route planning, and verified KTCL stops.
            </p>

            {/* Destination Search Form */}
            <form onSubmit={handleHeroSearch} className="bm-hero-search-box">
              <div className="bm-search-icon">
                <Search size={20} color="#0284C7" />
              </div>
              <input
                type="text"
                className="bm-hero-search-input"
                placeholder="Where are you going in Goa? (e.g. Panaji, Margao, Calangute)"
                value={heroSearch}
                onChange={(e) => setHeroSearch(e.target.value)}
                aria-label="Destination search"
              />
              <button type="submit" className="bm-search-submit-btn" aria-label="Search destination">
                <span>Search</span>
                <ArrowRight size={18} />
              </button>
            </form>

            {/* Action Buttons */}
            <div className="bm-hero-buttons">
              <Link to="/journey-planner" className="bm-hero-btn-primary">
                <Compass size={18} />
                <span>Plan Your Journey</span>
              </Link>
              <Link to="/routes" className="bm-hero-btn-secondary">
                <Radio size={18} color="#0284C7" />
                <span>Track Live Buses</span>
              </Link>
            </div>
          </div>

          {/* Right / Visual: Goa Public Bus & Route Preview */}
          <div className="bm-hero-visual-card" aria-hidden="true">
            <div className="bm-visual-badge">
              <span className="bm-live-pulse-dot" />
              <span>KTCL Fleet Network</span>
            </div>

            {/* Illustrated Bus Scene */}
            <svg 
              className="bm-hero-svg" 
              viewBox="0 0 380 180" 
              fill="none" 
              xmlns="http://www.w3.org/2000/svg"
            >
              <defs>
                <linearGradient id="heroSky" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#E0F2FE" />
                  <stop offset="100%" stopColor="#FFFFFF" />
                </linearGradient>
                <linearGradient id="heroBusTeal" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%" stopColor="#0F766E" />
                  <stop offset="60%" stopColor="#0D9488" />
                  <stop offset="100%" stopColor="#14B8A6" />
                </linearGradient>
                <linearGradient id="heroRoad" x1="0%" y1="0%" x2="0%" y2="100%">
                  <stop offset="0%" stopColor="#334155" />
                  <stop offset="100%" stopColor="#1E293B" />
                </linearGradient>
              </defs>

              {/* Sky Background */}
              <rect width="380" height="180" rx="16" fill="url(#heroSky)" />

              {/* Goa Palm Trees */}
              <g opacity="0.4" fill="#0D9488">
                <path d="M35 145 Q40 100 45 70 Q47 66 49 70 Q53 105 57 145 Z" fill="#0F766E" />
                <path d="M46 70 Q24 64 16 76 Q30 72 46 70 Z" />
                <path d="M46 70 Q34 50 26 44 Q38 56 46 70 Z" />
                <path d="M46 70 Q51 46 62 42 Q54 60 46 70 Z" />
                <path d="M46 70 Q64 58 74 68 Q58 70 46 70 Z" />

                <path d="M340 145 Q336 105 330 75 Q328 70 332 75 Q338 108 344 145 Z" fill="#0F766E" />
                <path d="M330 75 Q310 66 298 76 Q315 73 330 75 Z" />
                <path d="M330 75 Q320 52 310 46 Q322 60 330 75 Z" />
                <path d="M330 75 Q340 48 352 46 Q342 62 330 75 Z" />
                <path d="M330 75 Q350 64 362 74 Q344 74 330 75 Z" />
              </g>

              {/* Road */}
              <rect x="0" y="145" width="380" height="35" fill="url(#heroRoad)" />
              <line x1="0" y1="145" x2="380" y2="145" stroke="#64748B" strokeWidth="2" />
              <line x1="0" y1="162" x2="380" y2="162" stroke="#F59E0B" strokeWidth="3" strokeDasharray="12 12" />

              {/* Goa Bus Vector */}
              <g transform="translate(68, 25)">
                {/* Shadow */}
                <ellipse cx="120" cy="126" rx="90" ry="6" fill="#0F172A" opacity="0.3" />

                {/* Bus Body */}
                <path
                  d="M35 112
                     L35 70
                     Q37 52 54 51
                     L188 51
                     Q208 52 215 68
                     L218 102
                     Q218 114 205 116
                     L45 116
                     Q35 116 35 112 Z"
                  fill="url(#heroBusTeal)"
                />

                {/* White Stripe */}
                <path
                  d="M35 98
                     L216 98
                     Q218 108 210 113
                     L44 113
                     Q35 113 35 106 Z"
                  fill="#FFFFFF"
                />

                {/* Amber Band */}
                <rect x="35" y="95" width="181" height="3" fill="#F59E0B" rx="1" />

                {/* Windshield */}
                <path
                  d="M178 56
                     L205 58
                     Q212 62 213 76
                     L213 92
                     L178 92 Z"
                  fill="#0284C7"
                  stroke="#0F172A"
                  strokeWidth="1.2"
                />

                {/* Passenger Windows */}
                <rect x="138" y="58" width="34" height="30" rx="3" fill="#0284C7" stroke="#0F172A" strokeWidth="1" />
                <rect x="98" y="58" width="34" height="30" rx="3" fill="#0284C7" stroke="#0F172A" strokeWidth="1" />
                <rect x="58" y="58" width="34" height="30" rx="3" fill="#0284C7" stroke="#0F172A" strokeWidth="1" />

                {/* LED Board */}
                <rect x="130" y="53" width="76" height="5" rx="1.5" fill="#0B132B" />
                <text x="168" y="57" fill="#F59E0B" fontSize="3.6" fontWeight="bold" letterSpacing="0.2" textAnchor="middle">
                  PANAJI ⇄ MARGAO EXP
                </text>

                {/* Logo Text */}
                <text x="92" y="108" fill="#0F766E" fontSize="7" fontWeight="800">
                  Bus<tspan fill="#0284C7">Mitra</tspan>
                </text>
                <text x="138" y="108" fill="#64748B" fontSize="5" fontWeight="700">
                  KTCL
                </text>

                {/* Headlight */}
                <rect x="215" y="104" width="4" height="7" rx="1.5" fill="#FEF08A" stroke="#CA8A04" strokeWidth="0.8" />

                {/* Wheels */}
                <g transform="translate(186, 116)">
                  <circle cx="0" cy="0" r="11" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
                  <circle cx="0" cy="0" r="7" fill="#CBD5E1" stroke="#64748B" strokeWidth="0.8" />
                  <circle cx="0" cy="0" r="3" fill="#0D9488" />
                </g>
                <g transform="translate(74, 116)">
                  <circle cx="0" cy="0" r="11" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
                  <circle cx="0" cy="0" r="7" fill="#CBD5E1" stroke="#64748B" strokeWidth="0.8" />
                  <circle cx="0" cy="0" r="3" fill="#0D9488" />
                </g>
              </g>
            </svg>

            {/* Quick Live Route Tag */}
            <div className="bm-visual-footer">
              <div className="bm-vf-item">
                <span className="bm-vf-label">Kadamba Fleet</span>
                <span className="bm-vf-value">500+ Goa Routes</span>
              </div>
              <div className="bm-vf-divider" />
              <div className="bm-vf-item">
                <span className="bm-vf-label">GTFS Timetable</span>
                <span className="bm-vf-value">Verified Official</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ========================================================
          C. QUICK ACTION CARDS (Four Responsive Cards)
      ======================================================== */}
      <section className="bm-quick-actions-section" aria-label="Transit Services">
        <div className="bm-section-container">
          <div className="bm-quick-cards-grid">
            
            {/* 1. Live Buses */}
            <Link to="/routes" className="bm-action-card">
              <div className="bm-card-icon-wrap" style={{ background: "#E0F2FE", color: "#0284C7" }}>
                <Bus size={24} />
              </div>
              <div className="bm-card-text">
                <h3 className="bm-card-title">Live Buses</h3>
                <p className="bm-card-desc">Track active KTCL buses and view real-time fleet broadcast status.</p>
              </div>
              <div className="bm-card-arrow">
                <ChevronRight size={18} />
              </div>
            </Link>

            {/* 2. Plan Journey */}
            <Link to="/journey-planner" className="bm-action-card">
              <div className="bm-card-icon-wrap" style={{ background: "#F0FDF4", color: "#16A34A" }}>
                <Navigation size={24} />
              </div>
              <div className="bm-card-text">
                <h3 className="bm-card-title">Plan Journey</h3>
                <p className="bm-card-desc">Point-to-point transit directions with interchange route options.</p>
              </div>
              <div className="bm-card-arrow">
                <ChevronRight size={18} />
              </div>
            </Link>

            {/* 3. Fare Calculator */}
            <Link to="/fare-calculator" className="bm-action-card">
              <div className="bm-card-icon-wrap" style={{ background: "#FEF3C7", color: "#D97706" }}>
                <Calculator size={24} />
              </div>
              <div className="bm-card-text">
                <h3 className="bm-card-title">Fare Calculator</h3>
                <p className="bm-card-desc">Calculate official KTCL ticket fares and distance stages across Goa.</p>
              </div>
              <div className="bm-card-arrow">
                <ChevronRight size={18} />
              </div>
            </Link>

            {/* 4. Nearby Stops */}
            <a href="#nearby-stops" className="bm-action-card" onClick={(e) => {
              e.preventDefault();
              const el = document.getElementById("nearby-stops");
              if (el) el.scrollIntoView({ behavior: "smooth" });
              else navigate("/stops");
            }}>
              <div className="bm-card-icon-wrap" style={{ background: "#F3E8FF", color: "#9333EA" }}>
                <MapPin size={24} />
              </div>
              <div className="bm-card-text">
                <h3 className="bm-card-title">Nearby Stops</h3>
                <p className="bm-card-desc">Find bus stops near your current location with serving route counts.</p>
              </div>
              <div className="bm-card-arrow">
                <ChevronRight size={18} />
              </div>
            </a>

          </div>
        </div>
      </section>

      {/* ========================================================
          E. JOURNEY PLANNER CARD (Origin, Destination, Swap)
      ======================================================== */}
      <section className="bm-planner-section">
        <div className="bm-section-container">
          <div className="bm-planner-card">
            
            <div className="bm-card-header-row">
              <div>
                <span className="bm-pill-label">Fast Trip Finder</span>
                <h2 className="bm-section-title">Where do you want to travel?</h2>
              </div>
              <Link to="/journey-planner" className="bm-view-all-link">
                Advanced Planner <ChevronRight size={16} />
              </Link>
            </div>

            <form onSubmit={handleJourneySubmit} className="bm-planner-form">
              <div className="bm-inputs-cluster">
                
                {/* Starting Location */}
                <div className="bm-input-group">
                  <label className="bm-input-label" htmlFor="bm-origin-input">Starting From</label>
                  <div className="bm-input-field-wrap">
                    <div className="bm-field-icon start-icon">
                      <MapPin size={18} color="#16A34A" />
                    </div>
                    <input
                      id="bm-origin-input"
                      type="text"
                      className="bm-route-input"
                      placeholder="Origin stop (e.g. Panaji KTC Bus Stand)"
                      value={fromQuery}
                      onChange={(e) => setFromQuery(e.target.value)}
                    />
                    <button
                      type="button"
                      className="bm-gps-btn"
                      onClick={requestCurrentLocationForOrigin}
                      title="Use current location"
                      aria-label="Use current location"
                      disabled={isLocatingOrigin}
                    >
                      {isLocatingOrigin ? (
                        <Loader2 size={16} className="spin-icon" />
                      ) : (
                        <Crosshair size={16} />
                      )}
                    </button>
                  </div>
                </div>

                {/* Swap Button */}
                <button
                  type="button"
                  className="bm-swap-btn"
                  onClick={handleSwap}
                  title="Swap origin and destination"
                  aria-label="Swap origin and destination"
                >
                  <ArrowUpDown size={18} />
                </button>

                {/* Destination */}
                <div className="bm-input-group">
                  <label className="bm-input-label" htmlFor="bm-dest-input">Destination</label>
                  <div className="bm-input-field-wrap">
                    <div className="bm-field-icon end-icon">
                      <MapPin size={18} color="#DC2626" />
                    </div>
                    <input
                      id="bm-dest-input"
                      type="text"
                      className="bm-route-input"
                      placeholder="Destination (e.g. Margao KTC Bus Stand)"
                      value={toQuery}
                      onChange={(e) => setToQuery(e.target.value)}
                    />
                  </div>
                </div>

              </div>

              {/* Popular Hub Quick Pills */}
              <div className="bm-quick-pills-row">
                <span className="bm-qp-label">Popular Hubs:</span>
                {["Panaji", "Margao", "Mapusa", "Vasco", "Ponda", "Calangute"].map((hub) => (
                  <button
                    key={hub}
                    type="button"
                    className="bm-qp-pill"
                    onClick={() => {
                      if (!fromQuery) setFromQuery(`${hub} KTC Bus Stand`);
                      else setToQuery(`${hub} KTC Bus Stand`);
                    }}
                  >
                    {hub}
                  </button>
                ))}
              </div>

              {/* Submit Action */}
              <button type="submit" className="bm-find-buses-btn">
                <Bus size={18} />
                <span>Find Buses</span>
                <ArrowRight size={18} />
              </button>
            </form>

          </div>
        </div>
      </section>

      {/* ========================================================
          D. TRANSPORT INFORMATION (Actual API Data & Clear Status)
      ======================================================== */}
      <section className="bm-transit-info-section">
        <div className="bm-section-container">
          
          <div className="bm-section-heading-wrap">
            <div>
              <span className="bm-pill-label">KTCL Bus Routes</span>
              <h2 className="bm-section-title">Verified Goa Transit Network</h2>
              <p className="bm-section-subtitle">
                Official scheduled services by Kadamba Transport Corporation.
              </p>
            </div>
            
            {/* Live Broadcast Status Banner */}
            <div className="bm-live-status-pill">
              <span className={`bm-status-indicator ${liveBusesCount > 0 ? "live" : "stale"}`} />
              <span>
                {liveBusesCount > 0 
                  ? `${liveBusesCount} Bus${liveBusesCount > 1 ? "es" : ""} Broadcasting Live GPS`
                  : "0 Live GPS Broadcasts (Timetable in Effect)"}
              </span>
            </div>
          </div>

          {/* Transparent Status Disclaimer */}
          <div className="bm-info-disclaimer-box" role="note">
            <Info size={18} color="#0284C7" style={{ flexShrink: 0, marginTop: 1 }} />
            <div className="bm-disclaimer-text">
              <strong>Operational Status Notice:</strong> Real-time vehicle positions are broadcast directly when drivers start an active trip on the BusMitra driver portal. When drivers are off-duty or offline, official KTCL scheduled timetables and route stops remain active.
            </div>
          </div>

          {/* Major Hub Filter Chips */}
          <div className="bm-filter-chips-row">
            {["ALL", "PANAJI", "MARGAO", "MAPUSA", "VASCO", "PONDA"].map((filter) => (
              <button
                key={filter}
                type="button"
                className={`bm-filter-chip ${activeFilter === filter ? "active" : ""}`}
                onClick={() => handleFilterChange(filter)}
              >
                {filter === "ALL" ? "All Major Routes" : filter}
              </button>
            ))}
          </div>

          {/* Routes Cards Grid */}
          {routesLoading ? (
            <div className="bm-loading-box">
              <Loader2 size={24} className="spin-icon" color="#0284C7" />
              <span>Loading verified KTCL routes...</span>
            </div>
          ) : (
            <div className="bm-routes-grid">
              {filteredRoutes.map((route, idx) => (
                <div key={route.routeId || route._id || idx} className="bm-route-card">
                  <div className="bm-rc-header">
                    <span className="bm-route-number-badge">
                      {route.shortName || route.routeId || `R-${idx + 1}`}
                    </span>
                    <span className="bm-route-status-tag scheduled">
                      Scheduled KTCL
                    </span>
                  </div>

                  <h3 className="bm-rc-title">
                    {route.longName || route.name || "Kadamba Transit Service"}
                  </h3>

                  <div className="bm-rc-meta">
                    <span className="bm-rc-agency">
                      Operator: {route.operator || "Kadamba Transport Corp."}
                    </span>
                    <span className="bm-rc-type">
                      {route.source === "KTCL_GTFS" ? "Official GTFS Feed" : "Goa State Transport"}
                    </span>
                  </div>

                  <div className="bm-rc-footer">
                    <Link 
                      to={`/routes`}
                      className="bm-rc-link"
                    >
                      <span>View Route Details</span>
                      <ChevronRight size={16} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}

          <div className="bm-routes-more-row">
            <Link to="/routes" className="bm-all-routes-btn">
              Explore All 500+ KTCL Routes <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </section>

      {/* ========================================================
          F. NEARBY STOPS (Using Geolocation & Fallback)
      ======================================================== */}
      <section id="nearby-stops" className="bm-nearby-stops-section">
        <div className="bm-section-container">
          
          <div className="bm-card-header-row">
            <div>
              <span className="bm-pill-label">Transit Terminals</span>
              <h2 className="bm-section-title">
                {geoStatus === "found" ? "Stops Near Your Location" : "Popular Goa Bus Stands"}
              </h2>
              <p className="bm-section-subtitle">
                {geoStatus === "found" 
                  ? "Kadamba bus stops located within your radius."
                  : "Major interchange terminals serving routes across Goa."}
              </p>
            </div>

            <button 
              type="button" 
              className="bm-locate-stops-btn"
              onClick={handleFindNearbyStops}
              disabled={geoStatus === "locating"}
            >
              {geoStatus === "locating" ? (
                <>
                  <Loader2 size={16} className="spin-icon" />
                  <span>Locating...</span>
                </>
              ) : (
                <>
                  <Navigation size={16} />
                  <span>Find Stops Near Me</span>
                </>
              )}
            </button>
          </div>

          {/* Graceful notification if geolocation was denied */}
          {geoStatus === "denied" && (
            <div className="bm-geo-notice-bar">
              <AlertCircle size={16} color="#0369A1" />
              <span>Location permission unavailable. Displaying top Kadamba bus stands below:</span>
            </div>
          )}

          {/* Stops List Grid */}
          {stopsLoading ? (
            <div className="bm-loading-box">
              <Loader2 size={24} className="spin-icon" color="#0284C7" />
              <span>Loading bus stops...</span>
            </div>
          ) : (
            <div className="bm-stops-grid">
              {stops.map((stop) => (
                <Link
                  key={stop.stopId || stop._id}
                  to={`/stop/${stop.stopId || stop._id}`}
                  className="bm-stop-card"
                >
                  <div className="bm-sc-icon-box">
                    <MapPin size={22} color="#0284C7" />
                  </div>
                  <div className="bm-sc-details">
                    <h3 className="bm-sc-name">{stop.name}</h3>
                    <div className="bm-sc-meta-row">
                      {stop.distance_km ? (
                        <span className="bm-sc-dist">{stop.distance_km} km away</span>
                      ) : (
                        <span className="bm-sc-hub-tag">KTCL Terminal</span>
                      )}
                      {stop.route_count !== undefined && (
                        <span className="bm-sc-routes-count">
                          {stop.route_count} {stop.route_count === 1 ? "route" : "routes"}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="bm-sc-chevron">
                    <ChevronRight size={18} />
                  </div>
                </Link>
              ))}
            </div>
          )}

          <div className="bm-routes-more-row">
            <Link to="/stops" className="bm-all-routes-btn">
              Browse All Goa Bus Stands <ArrowRight size={16} />
            </Link>
          </div>

        </div>
      </section>

      {/* ========================================================
          G. HOW BUSMITRA WORKS (Three Compact, Balanced Steps)
      ======================================================== */}
      <section className="bm-how-works-section">
        <div className="bm-section-container">
          
          <div className="bm-works-header">
            <span className="bm-pill-label">Simple & Smart Transit</span>
            <h2 className="bm-section-title">How BusMitra Works</h2>
            <p className="bm-section-subtitle">
              Designed for passengers, drivers, and daily commuters across Goa.
            </p>
          </div>

          <div className="bm-works-steps-grid">
            
            {/* Step 1 */}
            <div className="bm-step-card">
              <div className="bm-step-num">01</div>
              <div className="bm-step-icon-wrap">
                <Search size={24} color="#0284C7" />
              </div>
              <h3 className="bm-step-title">Find your route</h3>
              <p className="bm-step-desc">
                Search by destination, locate nearby bus stops, or browse verified KTCL routes across North and South Goa.
              </p>
            </div>

            {/* Step 2 */}
            <div className="bm-step-card">
              <div className="bm-step-num">02</div>
              <div className="bm-step-icon-wrap">
                <Clock size={24} color="#16A34A" />
              </div>
              <h3 className="bm-step-title">Check your journey</h3>
              <p className="bm-step-desc">
                View verified Kadamba timetables, calculate exact stage fares, and preview stop-by-stop transit sequences.
              </p>
            </div>

            {/* Step 3 */}
            <div className="bm-step-card">
              <div className="bm-step-num">03</div>
              <div className="bm-step-icon-wrap">
                <ShieldCheck size={24} color="#D97706" />
              </div>
              <h3 className="bm-step-title">Travel with confidence</h3>
              <p className="bm-step-desc">
                Track live broadcast bus signals on the map and catch your bus without waiting blindly at the stand.
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* ========================================================
          FOOTER (Clean, Professional, Informative)
      ======================================================== */}
      <footer className="bm-footer">
        <div className="bm-section-container">
          <div className="bm-footer-main">
            
            {/* Brand Col */}
            <div className="bm-footer-col brand-col">
              <div className="bm-footer-logo">
                <div className="bm-logo-box" aria-hidden="true">
                  <Bus size={18} color="#FFFFFF" />
                </div>
                <span className="bm-footer-brand-name">BusMitra Goa</span>
              </div>
              <p className="bm-footer-tagline">
                Kadamba Public Transport Tracking Platform. Empowering daily riders and visitors across Goa.
              </p>
            </div>

            {/* Links Col 1: Passenger */}
            <div className="bm-footer-col">
              <h4 className="bm-footer-heading">Passenger</h4>
              <ul className="bm-footer-links">
                <li><Link to="/journey-planner">Journey Planner</Link></li>
                <li><Link to="/routes">Live Bus Routes</Link></li>
                <li><Link to="/stops">Bus Stands & Stops</Link></li>
                <li><Link to="/fare-calculator">Fare Calculator</Link></li>
              </ul>
            </div>

            {/* Links Col 2: Transport Staff */}
            <div className="bm-footer-col">
              <h4 className="bm-footer-heading">Staff & Portals</h4>
              <ul className="bm-footer-links">
                <li><Link to="/login">Driver & Admin Login</Link></li>
                <li><Link to="/driver">Driver GPS Broadcast</Link></li>
                <li><Link to="/admin">Fleet Administration</Link></li>
                <li><Link to="/offline">Offline Schedules</Link></li>
              </ul>
            </div>

          </div>

          <div className="bm-footer-bottom">
            <p>© {new Date().getFullYear()} BusMitra Goa. Powered by Kadamba Transport Corporation GTFS data.</p>
          </div>
        </div>
      </footer>

      {/* ========================================================
          H. MOBILE BOTTOM NAVIGATION (Fixed, Clean, Non-overlapping)
      ======================================================== */}
      <nav className="bm-mobile-bottom-nav" aria-label="Mobile Navigation">
        <Link to="/" className="bm-mb-nav-item active">
          <Bus size={20} />
          <span>Home</span>
        </Link>
        <Link to="/routes" className="bm-mb-nav-item">
          <Radio size={20} />
          <span>Explore</span>
        </Link>
        <Link to="/journey-planner" className="bm-mb-nav-item">
          <Navigation size={20} />
          <span>Journey</span>
        </Link>
        <Link to="/saved" className="bm-mb-nav-item">
          <Bookmark size={20} />
          <span>Saved</span>
        </Link>
        <Link to="/login" className="bm-mb-nav-item">
          <User size={20} />
          <span>Account</span>
        </Link>
      </nav>

    </div>
  );
}
