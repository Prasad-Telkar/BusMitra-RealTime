import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { 
  Bus, 
  Navigation, 
  MapPin, 
  Calculator, 
  Search, 
  ArrowUpDown, 
  Radio, 
  ArrowRight, 
  Clock, 
  ShieldCheck, 
  Crosshair, 
  ChevronRight, 
  Info, 
  Bookmark, 
  User, 
  Home, 
  Menu, 
  X, 
  Loader2,
  CheckCircle2,
  Compass
} from "lucide-react";
import "./Landing.css";

const API_BASE = import.meta.env.VITE_API_BASE || "https://busmitra-goa.onrender.com";

// Default major transit hubs in Goa (fallback & instant display before geolocation)
const MAJOR_GOA_HUBS = [
  { id: "1", name: "Panaji KTC Bus Stand", role: "Central Capital Terminal", routeCount: 218, zone: "North Goa" },
  { id: "135", name: "Margao KTC Bus Stand", role: "South Goa Main Hub", routeCount: 164, zone: "South Goa" },
  { id: "44", name: "Mapusa KTC Bus Stand", role: "North Coastal Gateway", routeCount: 112, zone: "North Goa" },
  { id: "52", name: "Vasco Da Gama Bus Stand", role: "Port City Terminal", routeCount: 78, zone: "South Goa" },
  { id: "30", name: "Ponda KTC Bus Stand", role: "Central Connector Hub", routeCount: 86, zone: "Central Goa" },
  { id: "201", name: "Dabolim Airport Terminal", role: "Direct A/C Airport Shuttle", routeCount: 18, zone: "Airport Link" },
];

const POPULAR_COMMUTES = [
  { from: "Panaji", to: "Margao", label: "Panaji ⇄ Margao" },
  { from: "Panaji", to: "Calangute", label: "Panaji ⇄ Calangute" },
  { from: "Mapusa", to: "Panaji", label: "Mapusa ⇄ Panaji" },
  { from: "Margao", to: "Vasco", label: "Margao ⇄ Vasco" },
  { from: "Dabolim", to: "Panaji", label: "Airport ⇄ Panaji" },
];

export default function Landing() {
  const navigate = useNavigate();

  // Mobile navigation state
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Hero search
  const [heroSearch, setHeroSearch] = useState("");

  // Journey planner card state
  const [originQuery, setOriginQuery] = useState("");
  const [destQuery, setDestQuery] = useState("");
  const [originSuggestions, setOriginSuggestions] = useState([]);
  const [destSuggestions, setDestSuggestions] = useState([]);
  const [isOriginOpen, setIsOriginOpen] = useState(false);
  const [isDestOpen, setIsDestOpen] = useState(false);
  const [isLocatingOrigin, setIsLocatingOrigin] = useState(false);
  const [plannerError, setPlannerError] = useState("");

  // Transport information state (API Grounded)
  const [activeFleet, setActiveFleet] = useState([]);
  const [fleetLoading, setFleetLoading] = useState(true);
  const [scheduledRoutes, setScheduledRoutes] = useState([]);
  const [routesLoading, setRoutesLoading] = useState(true);
  const [systemStats, setSystemStats] = useState(null);

  // Nearby stops section state
  const [nearbyStops, setNearbyStops] = useState([]);
  const [locationStatus, setLocationStatus] = useState("idle"); // idle | locating | found | error | denied
  const [locationErrorMsg, setLocationErrorMsg] = useState("");

  const originRef = useRef(null);
  const destRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (originRef.current && !originRef.current.contains(e.target)) {
        setIsOriginOpen(false);
      }
      if (destRef.current && !destRef.current.contains(e.target)) {
        setIsDestOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Fetch real transport data from backend
  useEffect(() => {
    fetchActiveFleet();
    fetchScheduledRoutes();
    fetchSystemStats();
  }, []);

  const fetchActiveFleet = async () => {
    setFleetLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/admin/fleet`);
      if (res.ok) {
        const data = await res.json();
        setActiveFleet(data.fleet || []);
      } else {
        setActiveFleet([]);
      }
    } catch {
      setActiveFleet([]);
    } finally {
      setFleetLoading(false);
    }
  };

  const fetchScheduledRoutes = async () => {
    setRoutesLoading(true);
    try {
      const res = await fetch(`${API_BASE}/api/routes?limit=6`);
      if (res.ok) {
        const data = await res.json();
        // Deduplicate routes by name
        const unique = [];
        const seen = new Set();
        for (const item of data) {
          const name = item.routeName || item.longName || item.shortName;
          if (name && !seen.has(name)) {
            seen.add(name);
            unique.push(item);
          }
        }
        setScheduledRoutes(unique.slice(0, 6));
      }
    } catch {
      setScheduledRoutes([]);
    } finally {
      setRoutesLoading(false);
    }
  };

  const fetchSystemStats = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/admin/stats`);
      if (res.ok) {
        const data = await res.json();
        setSystemStats(data);
      }
    } catch {
      // Non-critical
    }
  };

  // Stop suggestions autocomplete for origin
  useEffect(() => {
    if (!originQuery || originQuery.length < 2) {
      setOriginSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/search/stops?q=${encodeURIComponent(originQuery)}&limit=6`);
        if (res.ok) {
          const data = await res.json();
          setOriginSuggestions(data);
          setIsOriginOpen(true);
        }
      } catch {
        setOriginSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [originQuery]);

  // Stop suggestions autocomplete for destination
  useEffect(() => {
    if (!destQuery || destQuery.length < 2) {
      setDestSuggestions([]);
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/search/stops?q=${encodeURIComponent(destQuery)}&limit=6`);
        if (res.ok) {
          const data = await res.json();
          setDestSuggestions(data);
          setIsDestOpen(true);
        }
      } catch {
        setDestSuggestions([]);
      }
    }, 250);
    return () => clearTimeout(timer);
  }, [destQuery]);

  // Handle hero quick search submission
  const handleHeroSearchSubmit = (e) => {
    e.preventDefault();
    if (heroSearch.trim()) {
      navigate(`/journey-planner?to=${encodeURIComponent(heroSearch.trim())}`);
    } else {
      navigate("/journey-planner");
    }
  };

  // Handle Journey Planner card submission
  const handlePlanJourneySubmit = (e) => {
    e.preventDefault();
    setPlannerError("");
    if (originQuery && destQuery) {
      navigate(`/journey-planner?from=${encodeURIComponent(originQuery.trim())}&to=${encodeURIComponent(destQuery.trim())}`);
    } else if (destQuery) {
      navigate(`/journey-planner?to=${encodeURIComponent(destQuery.trim())}`);
    } else if (originQuery) {
      navigate(`/journey-planner?from=${encodeURIComponent(originQuery.trim())}`);
    } else {
      setPlannerError("Please enter a destination or starting stop to plan your trip.");
      navigate("/journey-planner");
    }
  };

  // Swap origin and destination
  const handleSwapStops = () => {
    const temp = originQuery;
    setOriginQuery(destQuery);
    setDestQuery(temp);
    setIsOriginOpen(false);
    setIsDestOpen(false);
  };

  // Use current geolocation for origin
  const handleUseCurrentLocationForOrigin = () => {
    if (!navigator.geolocation) {
      setPlannerError("Geolocation is not supported by your browser.");
      return;
    }
    setIsLocatingOrigin(true);
    setPlannerError("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        setIsLocatingOrigin(false);
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`${API_BASE}/api/stops/nearby?lat=${latitude}&lng=${longitude}&radius=5&limit=1`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              setOriginQuery(data[0].name);
              return;
            }
          }
        } catch {
          // fallback to generic string
        }
        setOriginQuery("📍 Current Location");
      },
      (err) => {
        setIsLocatingOrigin(false);
        if (err.code === 1) {
          setPlannerError("Location access was denied. Please select a starting stop from the list.");
        } else {
          setPlannerError("Could not retrieve current location. Please choose a stop manually.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  // Handle Nearby Stops geolocation trigger
  const handleFindNearbyStops = () => {
    if (!navigator.geolocation) {
      setLocationStatus("error");
      setLocationErrorMsg("Geolocation is not supported by this browser.");
      return;
    }

    setLocationStatus("locating");
    setLocationErrorMsg("");

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude, longitude } = pos.coords;
        try {
          const res = await fetch(`${API_BASE}/api/stops/nearby?lat=${latitude}&lng=${longitude}&radius=5&limit=4`);
          if (res.ok) {
            const data = await res.json();
            if (data && data.length > 0) {
              setNearbyStops(data);
              setLocationStatus("found");
            } else {
              setLocationStatus("error");
              setLocationErrorMsg("No bus stops found within 5 km of your location.");
            }
          } else {
            setLocationStatus("error");
            setLocationErrorMsg("Failed to load nearby stops from server.");
          }
        } catch {
          setLocationStatus("error");
          setLocationErrorMsg("Network error checking nearby stops.");
        }
      },
      (err) => {
        setLocationStatus("denied");
        if (err.code === 1) {
          setLocationErrorMsg("Location permission was disabled. Showing major transit hubs across Goa instead.");
        } else {
          setLocationErrorMsg("GPS signal temporarily unavailable. Showing primary Goa bus terminals below.");
        }
      },
      { timeout: 10000, enableHighAccuracy: true }
    );
  };

  return (
    <div className="bm-home-wrapper">
      {/* ============================================================== */}
      {/* A. HEADER                                                      */}
      {/* ============================================================== */}
      <header className="bm-header">
        <div className="bm-header-inner">
          <Link to="/" className="bm-brand" aria-label="BusMitra Home">
            <div className="bm-brand-icon">
              <Bus size={22} color="#FFFFFF" strokeWidth={2.4} />
            </div>
            <div className="bm-brand-text">
              <span className="bm-brand-title">BusMitra</span>
              <span className="bm-brand-badge">Goa Transit</span>
            </div>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="bm-desktop-nav" aria-label="Main navigation">
            <Link to="/routes" className="bm-nav-link">
              <Radio size={16} /> Live Tracking
            </Link>
            <Link to="/journey-planner" className="bm-nav-link">
              <Navigation size={16} /> Plan Journey
            </Link>
            <Link to="/stops" className="bm-nav-link">
              <MapPin size={16} /> Stops & Hubs
            </Link>
            <Link to="/fare-calculator" className="bm-nav-link">
              <Calculator size={16} /> Fare Calculator
            </Link>
          </nav>

          {/* Header Action / Auth */}
          <div className="bm-header-actions">
            <Link to="/login" className="bm-btn-login">
              <User size={16} />
              <span>Staff / Login</span>
            </Link>
            {/* Mobile menu hamburger */}
            <button 
              className="bm-mobile-menu-btn" 
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="bm-mobile-dropdown">
            <Link to="/routes" className="bm-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <Radio size={18} /> Live Buses & Routes
            </Link>
            <Link to="/journey-planner" className="bm-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <Navigation size={18} /> Plan Journey
            </Link>
            <Link to="/stops" className="bm-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <MapPin size={18} /> Stops & Bus Stands
            </Link>
            <Link to="/fare-calculator" className="bm-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <Calculator size={18} /> Fare Calculator
            </Link>
            <Link to="/saved" className="bm-mobile-nav-link" onClick={() => setMobileMenuOpen(false)}>
              <Bookmark size={18} /> Saved Commutes
            </Link>
            <div className="bm-mobile-dropdown-divider" />
            <Link to="/login" className="bm-mobile-nav-link bm-mobile-login" onClick={() => setMobileMenuOpen(false)}>
              <User size={18} /> Transport Staff Portal / Sign In
            </Link>
          </div>
        )}
      </header>

      <main className="bm-main-content">
        {/* ============================================================== */}
        {/* B. HERO SECTION                                                */}
        {/* ============================================================== */}
        <section className="bm-hero-section">
          <div className="bm-hero-container">
            {/* Left Column: Headlines, Search & Action Buttons */}
            <div className="bm-hero-content">
              <div className="bm-hero-pill">
                <span className="bm-live-indicator-dot" />
                <span>Official Kadamba KTCL Network</span>
              </div>

              <h1 className="bm-hero-headline">
                Your journey.<br />
                Your bus.<br />
                <span className="bm-text-gradient">Your time.</span>
              </h1>

              <p className="bm-hero-subtitle">
                Explore Goa with smarter public transport. Instant timetable lookup, direct journey routing, verified fares, and live bus telemetry.
              </p>

              {/* Destination Search Box */}
              <form className="bm-hero-search-box" onSubmit={handleHeroSearchSubmit}>
                <div className="bm-search-icon-wrap">
                  <Search size={18} color="var(--teal-700)" />
                </div>
                <input
                  type="text"
                  className="bm-hero-search-input"
                  placeholder="Where are you going in Goa? (e.g. Calangute, Margao)"
                  value={heroSearch}
                  onChange={(e) => setHeroSearch(e.target.value)}
                  aria-label="Search destination"
                />
                <button type="submit" className="bm-hero-search-submit">
                  <span>Go</span>
                  <ArrowRight size={16} />
                </button>
              </form>

              {/* Quick Destination Pills */}
              <div className="bm-hero-quick-destinations">
                <span className="bm-quick-label">Popular:</span>
                {["Panaji", "Margao", "Mapusa", "Calangute", "Vasco", "Ponda"].map((dest) => (
                  <button
                    key={dest}
                    type="button"
                    className="bm-quick-tag"
                    onClick={() => {
                      setHeroSearch(dest);
                      navigate(`/journey-planner?to=${encodeURIComponent(dest)}`);
                    }}
                  >
                    {dest}
                  </button>
                ))}
              </div>

              {/* Primary Action Buttons */}
              <div className="bm-hero-actions">
                <Link to="/journey-planner" className="bm-btn-primary">
                  <Navigation size={18} />
                  <span>Plan Your Journey</span>
                </Link>
                <Link to="/routes" className="bm-btn-secondary">
                  <Radio size={18} />
                  <span>Track Live Buses</span>
                </Link>
              </div>
            </div>

            {/* Right Column: Balanced Goa Transit Bus Illustration */}
            <div className="bm-hero-visual-card">
              <div className="bm-hero-visual-inner">
                {/* SVG Illustration: Goa Coastal Road & Kadamba Public Bus */}
                <svg
                  className="bm-hero-bus-svg"
                  viewBox="0 0 460 250"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  role="img"
                  aria-label="Illustration of Goa Kadamba public transit bus"
                >
                  <defs>
                    <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#E0F2FE" />
                      <stop offset="100%" stopColor="#F0F9FF" />
                    </linearGradient>
                    <linearGradient id="heroBusBody" x1="0%" y1="0%" x2="100%" y2="0%">
                      <stop offset="0%" stopColor="#0369A1" />
                      <stop offset="60%" stopColor="#0284C7" />
                      <stop offset="100%" stopColor="#0EA5E9" />
                    </linearGradient>
                    <linearGradient id="heroRoadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#334155" />
                      <stop offset="100%" stopColor="#1E293B" />
                    </linearGradient>
                    <linearGradient id="heroGlassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                      <stop offset="0%" stopColor="#BAE6FD" />
                      <stop offset="100%" stopColor="#38BDF8" />
                    </linearGradient>
                    <filter id="heroBusDrop" x="-10%" y="-10%" width="120%" height="130%">
                      <feDropShadow dx="0" dy="6" stdDeviation="5" floodColor="#0F172A" floodOpacity="0.18" />
                    </filter>
                  </defs>

                  {/* Sky & Coastal Background */}
                  <rect width="460" height="200" rx="16" fill="url(#skyGrad)" />

                  {/* Distant Hills / Western Ghats Outline */}
                  <path d="M0 155 Q80 125 180 148 T360 140 T460 152 L460 200 L0 200 Z" fill="#93C5FD" opacity="0.35" />

                  {/* Coastal Coconut Trees Backdrop */}
                  <g opacity="0.6">
                    {/* Left Palm */}
                    <path d="M48 185 Q52 140 56 100 Q58 95 60 100 Q65 145 68 185 Z" fill="#047857" />
                    <path d="M58 100 Q35 90 20 105 Q35 100 58 102 Z" fill="#059669" />
                    <path d="M58 100 Q42 75 30 65 Q46 80 58 100 Z" fill="#059669" />
                    <path d="M58 100 Q64 70 80 62 Q70 82 58 100 Z" fill="#059669" />
                    <path d="M58 100 Q82 85 96 98 Q78 100 58 102 Z" fill="#059669" />

                    {/* Right Palm */}
                    <path d="M400 185 Q396 142 392 105 Q390 100 394 105 Q404 145 408 185 Z" fill="#047857" />
                    <path d="M392 105 Q370 92 355 104 Q372 100 392 106 Z" fill="#059669" />
                    <path d="M392 105 Q380 78 368 70 Q384 84 392 105 Z" fill="#059669" />
                    <path d="M392 105 Q404 74 420 70 Q410 88 392 105 Z" fill="#059669" />
                    <path d="M392 105 Q418 94 430 108 Q410 108 392 106 Z" fill="#059669" />
                  </g>

                  {/* Road Base */}
                  <rect x="0" y="185" width="460" height="65" fill="url(#heroRoadGrad)" />
                  <line x1="0" y1="185" x2="460" y2="185" stroke="#94A3B8" strokeWidth="2.5" />
                  {/* Road Dashes */}
                  <line x1="20" y1="216" x2="70" y2="216" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" />
                  <line x1="110" y1="216" x2="160" y2="216" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" />
                  <line x1="200" y1="216" x2="250" y2="216" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" />
                  <line x1="290" y1="216" x2="340" y2="216" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" />
                  <line x1="380" y1="216" x2="430" y2="216" stroke="#FBBF24" strokeWidth="4" strokeLinecap="round" />

                  {/* Milestone Marker: GOA KTC */}
                  <g transform="translate(415, 160)">
                    <rect x="0" y="4" width="22" height="22" rx="3" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
                    <path d="M0 4 Q11 -3 22 4 Z" fill="#0284C7" />
                    <text x="11" y="13" fill="#0F172A" fontSize="6.5" fontWeight="bold" textAnchor="middle">GOA</text>
                    <text x="11" y="21" fill="#0369A1" fontSize="5.5" fontWeight="bold" textAnchor="middle">KTC</text>
                  </g>

                  {/* KADAMBA BUS CHASSIS */}
                  <g filter="url(#heroBusDrop)">
                    {/* Shadow underneath */}
                    <ellipse cx="230" cy="188" rx="125" ry="7" fill="#0F172A" opacity="0.35" />

                    {/* Main Bus Shell */}
                    <path
                      d="M125 168 L125 110 Q127 90 148 89 L320 89 Q345 90 352 110 L356 155 Q356 172 340 174 L138 174 Q125 174 125 168 Z"
                      fill="url(#heroBusBody)"
                    />

                    {/* Lower White Accent Band */}
                    <path
                      d="M125 146 L354 146 L355 158 Q355 173 338 174 L138 174 Q125 174 125 168 Z"
                      fill="#F8FAFC"
                    />

                    {/* Kadamba Golden Stripes */}
                    <rect x="125" y="142" width="229" height="4" fill="#F59E0B" />
                    <rect x="125" y="149" width="229" height="2.5" fill="#0369A1" />

                    {/* Roof A/C Unit */}
                    <rect x="195" y="80" width="75" height="9" rx="3" fill="#E2E8F0" stroke="#0284C7" strokeWidth="1" />
                    <line x1="208" y1="84" x2="258" y2="84" stroke="#64748B" strokeWidth="1" strokeLinecap="round" />

                    {/* Electronic Destination LED Board */}
                    <rect x="290" y="93" width="56" height="11" rx="2" fill="#0F172A" />
                    <text x="318" y="101" fill="#38BDF8" fontSize="6.5" fontWeight="bold" textAnchor="middle">PANAJI EXP</text>

                    {/* Front Windshield */}
                    <path
                      d="M312 94 L344 94 Q350 95 352 108 L353 136 L312 136 Z"
                      fill="url(#heroGlassGrad)"
                      opacity="0.95"
                    />

                    {/* Passenger Windows */}
                    <rect x="135" y="98" width="24" height="36" rx="4" fill="url(#heroGlassGrad)" />
                    <rect x="165" y="98" width="26" height="36" rx="4" fill="url(#heroGlassGrad)" />
                    <rect x="197" y="98" width="26" height="36" rx="4" fill="url(#heroGlassGrad)" />
                    <rect x="229" y="98" width="26" height="36" rx="4" fill="url(#heroGlassGrad)" />
                    <rect x="261" y="98" width="26" height="36" rx="4" fill="url(#heroGlassGrad)" />

                    {/* Passenger Silhouette in Window 1 */}
                    <circle cx="178" cy="110" r="4.5" fill="#0F172A" opacity="0.6" />
                    <path d="M172 124 Q178 116 184 124 Z" fill="#0F172A" opacity="0.6" />

                    {/* Passenger Silhouette in Window 3 */}
                    <circle cx="242" cy="110" r="4.5" fill="#0F172A" opacity="0.6" />
                    <path d="M236 124 Q242 116 248 124 Z" fill="#0F172A" opacity="0.6" />

                    {/* Driver Silhouette */}
                    <circle cx="332" cy="111" r="5" fill="#0F172A" opacity="0.8" />
                    <path d="M324 128 Q332 118 340 128 Z" fill="#0F172A" opacity="0.8" />

                    {/* KTCL Official Emblem on bus side */}
                    <circle cx="147" cy="158" r="6" fill="#0284C7" />
                    <text x="147" y="160.5" fill="#FFFFFF" fontSize="4.5" fontWeight="900" textAnchor="middle">KTC</text>

                    {/* Headlights */}
                    <rect x="353" y="152" width="4" height="8" rx="2" fill="#FEF08A" />
                    {/* Tail lights */}
                    <rect x="124" y="148" width="3" height="10" rx="1.5" fill="#EF4444" />

                    {/* Wheel Arches & Tires */}
                    {/* Front Wheel */}
                    <circle cx="316" cy="174" r="16" fill="#1E293B" />
                    <circle cx="316" cy="174" r="9" fill="#94A3B8" />
                    <circle cx="316" cy="174" r="4" fill="#0F172A" />

                    {/* Rear Wheels */}
                    <circle cx="164" cy="174" r="16" fill="#1E293B" />
                    <circle cx="164" cy="174" r="9" fill="#94A3B8" />
                    <circle cx="164" cy="174" r="4" fill="#0F172A" />
                  </g>
                </svg>

                {/* Floating Metric Card Overlay */}
                <div className="bm-hero-floating-stat">
                  <div className="bm-stat-icon-box">
                    <ShieldCheck size={20} color="#0284C7" />
                  </div>
                  <div className="bm-stat-text-box">
                    <span className="bm-stat-value">500+ Routes • 3,800+ Stops</span>
                    <span className="bm-stat-label">Verified GTFS Transit Database</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* C. QUICK ACTION CARDS                                          */}
        {/* ============================================================== */}
        <section className="bm-quick-cards-section" aria-label="Quick Actions">
          <div className="bm-section-container">
            <div className="bm-quick-cards-grid">
              {/* Card 1: Live Buses */}
              <Link to="/routes" className="bm-quick-card">
                <div className="bm-qc-icon-wrap bm-qc-blue">
                  <Radio size={24} />
                </div>
                <div className="bm-qc-content">
                  <h3 className="bm-qc-title">Live Buses</h3>
                  <p className="bm-qc-desc">Track real-time KTCL routes & GPS status across Goa.</p>
                </div>
                <div className="bm-qc-arrow">
                  <ChevronRight size={18} />
                </div>
              </Link>

              {/* Card 2: Plan Journey */}
              <Link to="/journey-planner" className="bm-quick-card">
                <div className="bm-qc-icon-wrap bm-qc-teal">
                  <Navigation size={24} />
                </div>
                <div className="bm-qc-content">
                  <h3 className="bm-qc-title">Plan Journey</h3>
                  <p className="bm-qc-desc">A-to-B transit route planner with transfers & walks.</p>
                </div>
                <div className="bm-qc-arrow">
                  <ChevronRight size={18} />
                </div>
              </Link>

              {/* Card 3: Fare Calculator */}
              <Link to="/fare-calculator" className="bm-quick-card">
                <div className="bm-qc-icon-wrap bm-qc-amber">
                  <Calculator size={24} />
                </div>
                <div className="bm-qc-content">
                  <h3 className="bm-qc-title">Fare Calculator</h3>
                  <p className="bm-qc-desc">Official stage carriage rates, student & senior fares.</p>
                </div>
                <div className="bm-qc-arrow">
                  <ChevronRight size={18} />
                </div>
              </Link>

              {/* Card 4: Nearby Stops */}
              <a 
                href="#nearby-stops" 
                className="bm-quick-card"
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById("nearby-stops")?.scrollIntoView({ behavior: "smooth" });
                }}
              >
                <div className="bm-qc-icon-wrap bm-qc-emerald">
                  <MapPin size={24} />
                </div>
                <div className="bm-qc-content">
                  <h3 className="bm-qc-title">Nearby Stops</h3>
                  <p className="bm-qc-desc">Find closest bus stands with active service routes.</p>
                </div>
                <div className="bm-qc-arrow">
                  <ChevronRight size={18} />
                </div>
              </a>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* E. JOURNEY PLANNER CARD                                        */}
        {/* ============================================================== */}
        <section className="bm-planner-section" aria-label="Journey Planner Tool">
          <div className="bm-section-container">
            <div className="bm-planner-card">
              <div className="bm-planner-header">
                <div>
                  <h2 className="bm-planner-title">Plan Your Transit Journey</h2>
                  <p className="bm-planner-subtitle">Direct Kadamba buses, connecting services, and timetables</p>
                </div>
                <span className="bm-badge-online">Verified Routes</span>
              </div>

              {plannerError && (
                <div className="bm-planner-error-banner" role="alert">
                  <Info size={16} />
                  <span>{plannerError}</span>
                </div>
              )}

              <form className="bm-planner-form" onSubmit={handlePlanJourneySubmit}>
                <div className="bm-planner-inputs-row">
                  {/* Origin Input with Autocomplete */}
                  <div className="bm-input-group" ref={originRef}>
                    <label className="bm-input-label" htmlFor="origin-stop-input">
                      <span className="bm-dot-origin" /> Starting Location
                    </label>
                    <div className="bm-input-wrapper">
                      <input
                        id="origin-stop-input"
                        type="text"
                        className="bm-transit-input"
                        placeholder="Enter stop or current location..."
                        value={originQuery}
                        onChange={(e) => {
                          setOriginQuery(e.target.value);
                          setPlannerError("");
                        }}
                        onFocus={() => {
                          if (originSuggestions.length > 0) setIsOriginOpen(true);
                        }}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        className="bm-locate-btn"
                        onClick={handleUseCurrentLocationForOrigin}
                        title="Use my current GPS location"
                        disabled={isLocatingOrigin}
                      >
                        {isLocatingOrigin ? (
                          <Loader2 size={16} className="bm-spin" />
                        ) : (
                          <Crosshair size={16} />
                        )}
                      </button>
                    </div>

                    {/* Origin Suggestions Dropdown */}
                    {isOriginOpen && originSuggestions.length > 0 && (
                      <div className="bm-suggestions-box" role="listbox">
                        {originSuggestions.map((stop) => (
                          <div
                            key={stop.stopId || stop._id}
                            className="bm-suggestion-row"
                            onClick={() => {
                              setOriginQuery(stop.name);
                              setIsOriginOpen(false);
                            }}
                            role="option"
                            aria-selected="false"
                          >
                            <MapPin size={16} color="var(--teal-600)" />
                            <div className="bm-sugg-text">
                              <span className="bm-sugg-name">{stop.name}</span>
                              <span className="bm-sugg-meta">
                                {stop.route_count !== undefined ? `${stop.route_count} routes` : "KTCL Stop"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Swap Button */}
                  <button
                    type="button"
                    className="bm-swap-btn"
                    onClick={handleSwapStops}
                    aria-label="Swap starting location and destination"
                    title="Swap locations"
                  >
                    <ArrowUpDown size={18} />
                  </button>

                  {/* Destination Input with Autocomplete */}
                  <div className="bm-input-group" ref={destRef}>
                    <label className="bm-input-label" htmlFor="dest-stop-input">
                      <span className="bm-dot-dest" /> Destination
                    </label>
                    <div className="bm-input-wrapper">
                      <input
                        id="dest-stop-input"
                        type="text"
                        className="bm-transit-input"
                        placeholder="Where do you want to reach?"
                        value={destQuery}
                        onChange={(e) => {
                          setDestQuery(e.target.value);
                          setPlannerError("");
                        }}
                        onFocus={() => {
                          if (destSuggestions.length > 0) setIsDestOpen(true);
                        }}
                        autoComplete="off"
                      />
                    </div>

                    {/* Destination Suggestions Dropdown */}
                    {isDestOpen && destSuggestions.length > 0 && (
                      <div className="bm-suggestions-box" role="listbox">
                        {destSuggestions.map((stop) => (
                          <div
                            key={stop.stopId || stop._id}
                            className="bm-suggestion-row"
                            onClick={() => {
                              setDestQuery(stop.name);
                              setIsDestOpen(false);
                            }}
                            role="option"
                            aria-selected="false"
                          >
                            <MapPin size={16} color="var(--teal-600)" />
                            <div className="bm-sugg-text">
                              <span className="bm-sugg-name">{stop.name}</span>
                              <span className="bm-sugg-meta">
                                {stop.route_count !== undefined ? `${stop.route_count} routes` : "KTCL Stop"}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>

                {/* Submit Row & Quick Commute Shortcuts */}
                <div className="bm-planner-actions-bar">
                  <div className="bm-commute-shortcuts">
                    <span className="bm-commute-tag-label">Frequent:</span>
                    {POPULAR_COMMUTES.map((c) => (
                      <button
                        key={c.label}
                        type="button"
                        className="bm-commute-chip"
                        onClick={() => {
                          setOriginQuery(c.from);
                          setDestQuery(c.to);
                        }}
                      >
                        {c.label}
                      </button>
                    ))}
                  </div>

                  <button type="submit" className="bm-btn-find-buses">
                    <Search size={18} />
                    <span>Find Buses</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* D. TRANSPORT INFORMATION SECTION (API Grounded)               */}
        {/* ============================================================== */}
        <section className="bm-transport-section" aria-label="Transport Information">
          <div className="bm-section-container">
            <div className="bm-section-header-wrap">
              <div>
                <h2 className="bm-section-title">Goa Transit Network Information</h2>
                <p className="bm-section-subtitle">Real-time telemetry and verified Kadamba timetable routes</p>
              </div>
              <Link to="/routes" className="bm-section-view-all">
                <span>View all routes</span>
                <ChevronRight size={16} />
              </Link>
            </div>

            {/* Part 1: Live GPS Status Telemetry */}
            <div className="bm-telemetry-banner">
              <div className="bm-telemetry-status-header">
                <div className="bm-telemetry-title-group">
                  <span className={`bm-status-beacon ${activeFleet.length > 0 ? "active" : "standby"}`} />
                  <div>
                    <h3 className="bm-telemetry-heading">
                      {activeFleet.length > 0 ? "Live GPS Broadcaster Active" : "Real-Time Telemetry Status"}
                    </h3>
                    <p className="bm-telemetry-subtext">
                      {activeFleet.length > 0
                        ? `${activeFleet.length} driver${activeFleet.length > 1 ? "s are" : " is"} transmitting live bus locations.`
                        : "No drivers are currently broadcasting live GPS coordinates. Scheduled timetable services are actively operating below."}
                    </p>
                  </div>
                </div>

                <div className="bm-telemetry-badge-wrap">
                  {activeFleet.length > 0 ? (
                    <span className="bm-badge-live">● LIVE GPS ACTIVE</span>
                  ) : (
                    <span className="bm-badge-standby">TIMETABLE MODE</span>
                  )}
                </div>
              </div>

              {/* If active fleet buses exist, render their live cards */}
              {activeFleet.length > 0 && (
                <div className="bm-live-fleet-grid">
                  {activeFleet.map((bus) => (
                    <div key={bus.activeTripId} className="bm-live-fleet-card">
                      <div className="bm-lfc-top">
                        <span className="bm-lfc-bus-id">Bus {bus.busId || bus.activeTripId.slice(-4)}</span>
                        <span className="bm-lfc-speed">
                          {Math.round(bus.speed * 3.6)} km/h
                        </span>
                      </div>
                      <div className="bm-lfc-route">
                        {bus.routeId || "Active Kadamba Route"}
                      </div>
                      <div className="bm-lfc-meta">
                        <span>Driver: {bus.driverId || "KTCL Staff"}</span>
                        <span>{bus.stalenessSeconds < 30 ? "Updated just now" : `${bus.stalenessSeconds}s ago`}</span>
                      </div>
                      <Link to={`/track/${bus.busId || bus.activeTripId}`} className="bm-lfc-track-btn">
                        <span>Track on Live Map</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Part 2: Verified Scheduled Transit Routes Grid */}
            <div className="bm-routes-catalog-header">
              <h3 className="bm-routes-subheading">Scheduled Kadamba KTCL Routes</h3>
              <span className="bm-routes-subtag">Official Schedule</span>
            </div>

            {routesLoading ? (
              <div className="bm-routes-loading">
                <Loader2 size={24} className="bm-spin" />
                <span>Loading active routes...</span>
              </div>
            ) : scheduledRoutes.length === 0 ? (
              <div className="bm-routes-empty">
                <Info size={20} />
                <span>Scheduled route catalog temporarily unavailable. Please check back shortly.</span>
              </div>
            ) : (
              <div className="bm-scheduled-routes-grid">
                {scheduledRoutes.map((route) => (
                  <div key={route.routeId || route._id} className="bm-route-card">
                    <div className="bm-route-card-top">
                      <span className="bm-route-code">{route.shortName || route.routeId}</span>
                      <span className="bm-route-operator">{route.operator || "Kadamba"}</span>
                    </div>
                    <h4 className="bm-route-name">
                      {route.routeName || route.longName}
                    </h4>
                    <div className="bm-route-card-footer">
                      <span className="bm-route-type">
                        <Clock size={14} />
                        <span>Daily Timetable</span>
                      </span>
                      <Link 
                        to={`/route-detail/${route.routeId}`} 
                        className="bm-route-link"
                        aria-label={`View schedule and stops for ${route.shortName || route.routeId}`}
                      >
                        <span>View Stops</span>
                        <ArrowRight size={14} />
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* ============================================================== */}
        {/* F. NEARBY STOPS SECTION                                        */}
        {/* ============================================================== */}
        <section id="nearby-stops" className="bm-nearby-section" aria-label="Nearby Bus Stops">
          <div className="bm-section-container">
            <div className="bm-nearby-header-row">
              <div>
                <h2 className="bm-section-title">Bus Stands & Transit Hubs</h2>
                <p className="bm-section-subtitle">
                  {locationStatus === "found"
                    ? "Verified bus stops nearest to your current location"
                    : "Key transit junctions and terminals across North & South Goa"}
                </p>
              </div>

              <button
                type="button"
                className="bm-detect-btn"
                onClick={handleFindNearbyStops}
                disabled={locationStatus === "locating"}
              >
                {locationStatus === "locating" ? (
                  <>
                    <Loader2 size={16} className="bm-spin" />
                    <span>Detecting GPS...</span>
                  </>
                ) : (
                  <>
                    <Crosshair size={16} />
                    <span>Find Stops Near Me</span>
                  </>
                )}
              </button>
            </div>

            {/* Notification if permission denied or error */}
            {locationErrorMsg && (
              <div className="bm-nearby-feedback-banner">
                <Info size={16} />
                <span>{locationErrorMsg}</span>
              </div>
            )}

            {/* Grid of Stops: Render either Geolocation results or Major Hubs */}
            <div className="bm-stops-grid">
              {locationStatus === "found" && nearbyStops.length > 0 ? (
                nearbyStops.map((stop) => (
                  <Link
                    key={stop.stopId || stop._id}
                    to={`/stop/${stop.stopId || stop._id}`}
                    className="bm-stop-card"
                  >
                    <div className="bm-stop-icon-box">
                      <MapPin size={22} color="var(--teal-700)" />
                    </div>
                    <div className="bm-stop-info">
                      <h3 className="bm-stop-title">{stop.name}</h3>
                      <div className="bm-stop-meta-line">
                        <span className="bm-stop-distance">
                          {stop.distance_km ? `${stop.distance_km} km away` : "Nearby Stop"}
                        </span>
                        <span className="bm-stop-routes-count">
                          {stop.route_count !== undefined 
                            ? `${stop.route_count} route${stop.route_count === 1 ? "" : "s"}` 
                            : "KTCL Network"}
                        </span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="bm-stop-arrow" />
                  </Link>
                ))
              ) : (
                MAJOR_GOA_HUBS.map((hub) => (
                  <Link
                    key={hub.id}
                    to={`/stop/${hub.id}`}
                    className="bm-stop-card"
                  >
                    <div className="bm-stop-icon-box">
                      <MapPin size={22} color="var(--teal-700)" />
                    </div>
                    <div className="bm-stop-info">
                      <h3 className="bm-stop-title">{hub.name}</h3>
                      <div className="bm-stop-meta-line">
                        <span className="bm-stop-role">{hub.role}</span>
                        <span className="bm-stop-routes-count">{hub.routeCount} routes</span>
                      </div>
                    </div>
                    <ChevronRight size={18} className="bm-stop-arrow" />
                  </Link>
                ))
              )}
            </div>

            <div className="bm-stops-footer-action">
              <Link to="/stops" className="bm-btn-view-all-stops">
                <span>Browse all 3,800+ Goa Bus Stops</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </section>

        {/* ============================================================== */}
        {/* G. HOW BUSMITRA WORKS (Redesigned Compact Cards)               */}
        {/* ============================================================== */}
        <section className="bm-how-section" aria-label="How BusMitra Works">
          <div className="bm-section-container">
            <div className="bm-how-header">
              <h2 className="bm-section-title">How BusMitra Works</h2>
              <p className="bm-section-subtitle">A seamless transit companion built specifically for Goa</p>
            </div>

            <div className="bm-how-grid">
              {/* Step 1 */}
              <div className="bm-how-card">
                <div className="bm-how-step-num">01</div>
                <div className="bm-how-icon-box bm-how-blue">
                  <Search size={24} />
                </div>
                <h3 className="bm-how-title">Find your route</h3>
                <p className="bm-how-desc">
                  Search any Goa village, town, or transit stand to discover direct Kadamba buses, connecting services, and intermediate stops.
                </p>
              </div>

              {/* Step 2 */}
              <div className="bm-how-card">
                <div className="bm-how-step-num">02</div>
                <div className="bm-how-icon-box bm-how-teal">
                  <Clock size={24} />
                </div>
                <h3 className="bm-how-title">Check your journey</h3>
                <p className="bm-how-desc">
                  Access official KTCL timetables, compute exact stage carriage fares, or track live GPS locations when drivers are on active trips.
                </p>
              </div>

              {/* Step 3 */}
              <div className="bm-how-card">
                <div className="bm-how-step-num">03</div>
                <div className="bm-how-icon-box bm-how-emerald">
                  <CheckCircle2 size={24} />
                </div>
                <h3 className="bm-how-title">Travel with confidence</h3>
                <p className="bm-how-desc">
                  Never wait blindly at bus stops. Save frequent daily commutes, verify platform departures, and navigate Goa with peace of mind.
                </p>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* ============================================================== */}
      {/* FOOTER                                                         */}
      {/* ============================================================== */}
      <footer className="bm-footer">
        <div className="bm-section-container">
          <div className="bm-footer-inner">
            <div className="bm-footer-brand-col">
              <div className="bm-brand">
                <div className="bm-brand-icon">
                  <Bus size={20} color="#FFFFFF" />
                </div>
                <span className="bm-brand-title">BusMitra</span>
              </div>
              <p className="bm-footer-mission">
                Goa's public transit navigation platform, providing real-time bus tracking and verified timetable connectivity for Kadamba Transport Corporation.
              </p>
            </div>

            <div className="bm-footer-links-grid">
              <div className="bm-footer-col">
                <h4 className="bm-footer-col-title">Passenger Services</h4>
                <Link to="/journey-planner">Journey Planner</Link>
                <Link to="/routes">Routes Catalog</Link>
                <Link to="/stops">Bus Stands & Stops</Link>
                <Link to="/fare-calculator">Fare Calculator</Link>
              </div>

              <div className="bm-footer-col">
                <h4 className="bm-footer-col-title">Transport Staff</h4>
                <Link to="/login">Driver & Staff Login</Link>
                <Link to="/login">Depot Administration</Link>
                <Link to="/offline">Offline Schedules</Link>
              </div>

              <div className="bm-footer-col">
                <h4 className="bm-footer-col-title">Network Info</h4>
                <span>Kadamba Transport Corp (KTCL)</span>
                <span>Government of Goa</span>
                <span>GTFS Transit Open Data</span>
              </div>
            </div>
          </div>

          <div className="bm-footer-bottom">
            <p>&copy; {new Date().getFullYear()} BusMitra Goa • Public Transport Navigation Platform</p>
          </div>
        </div>
      </footer>

      {/* ============================================================== */}
      {/* H. FIXED MOBILE BOTTOM NAVIGATION                              */}
      {/* ============================================================== */}
      <nav className="bm-mobile-bottom-nav" aria-label="Mobile Navigation Bar">
        <Link to="/" className="bm-mb-nav-item active">
          <Home size={22} />
          <span>Home</span>
        </Link>
        <Link to="/routes" className="bm-mb-nav-item">
          <Radio size={22} />
          <span>Explore</span>
        </Link>
        <Link to="/journey-planner" className="bm-mb-nav-item">
          <Navigation size={22} />
          <span>Journey</span>
        </Link>
        <Link to="/saved" className="bm-mb-nav-item">
          <Bookmark size={22} />
          <span>Saved</span>
        </Link>
        <Link to="/login" className="bm-mb-nav-item">
          <User size={22} />
          <span>Account</span>
        </Link>
      </nav>
    </div>
  );
}
