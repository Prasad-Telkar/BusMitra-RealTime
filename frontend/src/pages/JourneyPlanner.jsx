import { useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { 
  Bus, MapPin, Search, Crosshair, ArrowUpDown, Clock, X, 
  ChevronRight, ArrowLeft, Navigation, AlertTriangle, CheckCircle2,
  Footprints, ShieldCheck, CornerDownRight, RotateCcw
} from "lucide-react";
import LiveMap from "../components/LiveMap";
import { getTransitJourney } from "../services/routingService";
import { formatTime } from "../utils/timeFormat";
import ktcStops from "../data/stops.json";
import "./JourneyPlanner.css";

const API_BASE = import.meta.env.VITE_API_BASE || "https://busmitra-goa.onrender.com";

export default function JourneyPlanner() {
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [toId, setToId] = useState(null);
  
  const [fromSuggestions, setFromSuggestions] = useState([]);
  const [toSuggestions, setToSuggestions] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null); // 'from' | 'to' | null

  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [searchError, setSearchError] = useState(null);
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [mapCenter, setMapCenter] = useState([15.2993, 74.1240]);
  const [passengerPos, setPassengerPos] = useState(null);
  const [activeJourney, setActiveJourney] = useState(false);
  const [gpsWatchId, setGpsWatchId] = useState(null);
  const [locating, setLocating] = useState(false);

  const navigate = useNavigate();
  const location = useLocation();
  const dropdownRef = useRef(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setActiveDropdown(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Parse query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const toParam = params.get("to");
    const toIdParam = params.get("toId");
    
    if (toParam) {
      const decodedTo = decodeURIComponent(toParam);
      setToQuery(decodedTo);
      if (toIdParam) setToId(toIdParam);
      
      // Auto-set origin to current location and plan journey if permission granted
      if ("geolocation" in navigator) {
        setLocating(true);
        setFromQuery("Locating current position...");
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            setLocating(false);
            const { latitude, longitude, accuracy, speed, heading } = pos.coords;
            setPassengerPos({ lat: latitude, lng: longitude, accuracy, timestamp: pos.timestamp, speed, heading });
            setMapCenter([latitude, longitude]);
            setFromQuery("📍 Current Location");
            
            // Auto search
            executeSearch({ lat: latitude, lng: longitude }, decodedTo);
          },
          (err) => {
            setLocating(false);
            console.warn("Location error:", err);
            setFromQuery("");
          },
          { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
        );
      }
    }
  }, [location.search]);

  useEffect(() => {
    return () => {
      if (gpsWatchId) navigator.geolocation.clearWatch(gpsWatchId);
    };
  }, [gpsWatchId]);

  // Suggestions filter
  const filterStops = (text) => {
    if (!text || text.length < 2) return [];
    const lower = text.toLowerCase();
    return ktcStops
      .filter(s => s.name.toLowerCase().includes(lower))
      .slice(0, 5);
  };

  const handleFromChange = (e) => {
    const val = e.target.value;
    setFromQuery(val);
    if (val.trim().length >= 2 && !val.startsWith("📍")) {
      setFromSuggestions(filterStops(val));
      setActiveDropdown("from");
    } else {
      setFromSuggestions([]);
      setActiveDropdown(null);
    }
  };

  const handleToChange = (e) => {
    const val = e.target.value;
    setToQuery(val);
    if (val.trim().length >= 2) {
      setToSuggestions(filterStops(val));
      setActiveDropdown("to");
    } else {
      setToSuggestions([]);
      setActiveDropdown(null);
    }
  };

  const selectStop = (field, stop) => {
    if (field === "from") {
      setFromQuery(stop.name);
      setFromSuggestions([]);
    } else {
      setToQuery(stop.name);
      setToSuggestions([]);
    }
    setActiveDropdown(null);
  };

  const requestLocation = () => {
    setLocating(true);
    setFromQuery("Locating...");
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocating(false);
          const { latitude, longitude, accuracy, speed, heading } = pos.coords;
          setPassengerPos({ lat: latitude, lng: longitude, accuracy, timestamp: pos.timestamp, speed, heading });
          setMapCenter([latitude, longitude]);
          setFromQuery("📍 Current Location");
          setActiveDropdown(null);
        },
        (err) => {
          setLocating(false);
          console.warn("Location error:", err);
          if (err.code === 1) {
             alert("Location access is turned off. Please allow location access to use your current location.");
          } else if (err.code === 2) {
             alert("GPS signal is temporarily unavailable. Please try again.");
          } else {
             alert("Could not get your location. Please check your network and try again.");
          }
          setFromQuery("");
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    } else {
      setLocating(false);
      alert("Geolocation is not supported by your browser.");
      setFromQuery("");
    }
  };

  const startJourney = () => {
    setActiveJourney(true);
    if ("geolocation" in navigator) {
      if (gpsWatchId) navigator.geolocation.clearWatch(gpsWatchId);
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude, accuracy, speed, heading } = pos.coords;
          setPassengerPos({ lat: latitude, lng: longitude, accuracy, timestamp: pos.timestamp, speed, heading });
        },
        (err) => console.warn(err),
        { enableHighAccuracy: true, maximumAge: 5000, timeout: 10000 }
      );
      setGpsWatchId(id);
    }
  };

  const endJourney = () => {
    setActiveJourney(false);
    setSelectedJourney(null);
    setHasSearched(false);
    setFromQuery("");
    setToQuery("");
    navigate("/journey-planner", { replace: true });
    if (gpsWatchId) {
      navigator.geolocation.clearWatch(gpsWatchId);
      setGpsWatchId(null);
    }
  };

  const handleSwap = () => {
    const temp = fromQuery;
    setFromQuery(toQuery);
    setToQuery(temp);
    setActiveDropdown(null);
  };

  const executeSearch = async (origin, dest) => {
    if (!origin || !dest) return;
    
    setLoading(true);
    setHasSearched(true);
    setSelectedJourney(null);
    setActiveDropdown(null);
    try {
      const results = await getTransitJourney(origin, dest);
      if (results && results.error) {
        setJourneys([]);
        setSearchError(results.error);
      } else {
        const found = results.journeys || [];
        setJourneys(found);
        if (found.length > 0 && !selectedJourney) {
          setSelectedJourney(found[0]);
        }
        if (results.isScheduleExpired) {
          setSearchError("SCHEDULE_EXPIRED_WARNING");
        } else {
          setSearchError(null);
        }
      }
    } catch (err) {
      console.error("Failed to fetch journeys", err);
      setSearchError("Unable to reach journey planner service");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    if (e) e.preventDefault();
    if (!fromQuery || !toQuery) return;
    const isCurrentLocation = fromQuery.includes("Current Location") || fromQuery === "📍 Your current location";
    executeSearch(isCurrentLocation ? passengerPos : fromQuery, toQuery);
  };

  return (
    <div className="jp-layout">
      {/* SIDEBAR PANEL (Desktop Left Sidebar / Mobile Overlay Bottom Sheet) */}
      <div className="jp-panel" ref={dropdownRef}>
        <div className="jp-panel-header">
          <div className="jp-panel-title-row">
            <h1 className="jp-panel-title">Transit Journey Planner</h1>
            <span className="jp-brand-badge">KTCL Official Network</span>
          </div>
          <p className="jp-panel-sub">
            Fast, multi-modal bus connections across North &amp; South Goa.
          </p>
        </div>

        {/* SEARCH FORM */}
        <form className="jp-form-card" onSubmit={handleSearch}>
          <div className="jp-form-inputs">
            {/* Visual Route Connector */}
            <div className="jp-route-indicator">
              <span className="jp-indicator-dot origin"></span>
              <span className="jp-indicator-line"></span>
              <span className="jp-indicator-dot dest"></span>
            </div>

            <div className="jp-fields-col">
              {/* Origin */}
              <div className="jp-field-wrapper">
                <label className="jp-field-label">ORIGIN (START)</label>
                <div className="jp-input-row">
                  <input
                    type="text"
                    className="jp-input"
                    placeholder="Enter bus stop or location"
                    value={fromQuery}
                    onChange={handleFromChange}
                    onFocus={() => fromSuggestions.length > 0 && setActiveDropdown("from")}
                  />
                  {fromQuery ? (
                    <button type="button" className="jp-icon-btn" onClick={() => setFromQuery("")} title="Clear">
                      <X size={16} />
                    </button>
                  ) : (
                    <button 
                      type="button" 
                      className={`jp-icon-btn ${locating ? 'spinning' : ''}`} 
                      onClick={requestLocation} 
                      title="Use Current Location"
                    >
                      <Crosshair size={16} />
                    </button>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {activeDropdown === "from" && fromSuggestions.length > 0 && (
                  <div className="jp-suggestions-box">
                    {fromSuggestions.map(stop => (
                      <button
                        key={stop.id}
                        type="button"
                        className="jp-suggestion-item"
                        onClick={() => selectStop("from", stop)}
                      >
                        <MapPin size={14} className="jp-sugg-icon" />
                        <div>
                          <div className="jp-sugg-name">{stop.name}</div>
                          <div className="jp-sugg-meta">{stop.id}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Destination */}
              <div className="jp-field-wrapper">
                <label className="jp-field-label">DESTINATION</label>
                <div className="jp-input-row">
                  <input
                    type="text"
                    className="jp-input"
                    placeholder="Where are you going?"
                    value={toQuery}
                    onChange={handleToChange}
                    onFocus={() => toSuggestions.length > 0 && setActiveDropdown("to")}
                  />
                  {toQuery && (
                    <button type="button" className="jp-icon-btn" onClick={() => setToQuery("")} title="Clear">
                      <X size={16} />
                    </button>
                  )}
                </div>

                {/* Suggestions Dropdown */}
                {activeDropdown === "to" && toSuggestions.length > 0 && (
                  <div className="jp-suggestions-box">
                    {toSuggestions.map(stop => (
                      <button
                        key={stop.id}
                        type="button"
                        className="jp-suggestion-item"
                        onClick={() => selectStop("to", stop)}
                      >
                        <MapPin size={14} className="jp-sugg-icon" />
                        <div>
                          <div className="jp-sugg-name">{stop.name}</div>
                          <div className="jp-sugg-meta">{stop.id}</div>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Swap Button */}
            <button 
              type="button" 
              className="jp-swap-action" 
              onClick={handleSwap} 
              title="Swap Origin and Destination"
            >
              <ArrowUpDown size={18} />
            </button>
          </div>

          {/* Action Row */}
          <div className="jp-form-bottom">
            <button 
              type="button" 
              className="jp-curr-loc-btn" 
              onClick={requestLocation}
            >
              <Navigation size={13} />
              <span>Use My Location</span>
            </button>

            <button
              type="submit"
              className="jp-submit-btn"
              disabled={loading || !fromQuery || !toQuery}
            >
              {loading ? (
                <>Searching Connections...</>
              ) : (
                <>
                  <Search size={16} />
                  <span>Find Routes</span>
                </>
              )}
            </button>
          </div>
        </form>

        {/* RESULTS & ITINERARY CONTENT */}
        <div className="jp-results-scroll">
          {activeJourney && selectedJourney ? (
            /* ACTIVE IN-TRANSIT NAVIGATION */
            <div className="jp-active-box">
              <div className="jp-active-badge">
                <span className="live-dot pulse"></span>
                <span>JOURNEY IN PROGRESS</span>
              </div>
              
              <h2 className="jp-active-title">Heading to {toQuery}</h2>
              <p className="jp-active-meta">
                Estimated duration: ~{selectedJourney.totalDuration} min
              </p>

              <div className="jp-timeline-steps">
                {selectedJourney.segments?.map((seg, idx) => (
                  <div key={idx} className="jp-step-row">
                    <div className="jp-step-icon">
                      {seg.type === 'WALK' ? <Footprints size={18} /> : <Bus size={18} />}
                    </div>
                    <div className="jp-step-info">
                      <div className="jp-step-title">
                        {seg.type === 'WALK' 
                          ? `Walk ${seg.duration} min (~${Math.round(seg.distance || 0)}m)` 
                          : `Board Route ${seg.routeNumber || 'Bus'}`}
                      </div>
                      <div className="jp-step-desc">
                        {seg.type === 'WALK' ? `To ${seg.to}` : `${seg.routeName || ''} → Get off at ${seg.to}`}
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              <div className="jp-active-actions">
                {passengerPos && (
                  <button 
                    type="button" 
                    className="jp-recenter-btn" 
                    onClick={() => setMapCenter([passengerPos.lat, passengerPos.lng])}
                  >
                    <Crosshair size={16} />
                    <span>Center On Me</span>
                  </button>
                )}
                <button type="button" className="jp-end-btn" onClick={endJourney}>
                  End Journey
                </button>
              </div>
            </div>
          ) : selectedJourney && hasSearched ? (
            /* SELECTED JOURNEY DETAILS (EXPANDED ITINERARY) */
            <div className="jp-itinerary-box">
              <button 
                type="button" 
                className="jp-back-list-btn" 
                onClick={() => setSelectedJourney(null)}
              >
                <ArrowLeft size={16} />
                <span>All Route Options ({journeys.length})</span>
              </button>

              <div className="jp-itin-header">
                <div>
                  <div className="jp-itin-times">
                    {formatTime(selectedJourney.departureTime)} &rarr; {formatTime(selectedJourney.arrivalTime)}
                  </div>
                  <div className="jp-itin-sub">
                    Total Duration: <strong>{selectedJourney.totalDuration} minutes</strong>
                  </div>
                </div>

                <span className={`jp-status-pill ${selectedJourney.isLive ? 'live' : 'scheduled'}`}>
                  {selectedJourney.isLive ? "LIVE TRACKING" : "SCHEDULED"}
                </span>
              </div>

              {/* Step By Step Timeline */}
              <div className="jp-timeline">
                {selectedJourney.segments?.map((seg, idx) => {
                  const isLast = idx === selectedJourney.segments.length - 1;
                  return (
                    <div key={idx} className="jp-timeline-item">
                      <div className="jp-timeline-left">
                        <div className={`jp-timeline-icon ${seg.type === 'WALK' ? 'walk' : 'bus'}`}>
                          {seg.type === 'WALK' ? <Footprints size={16} /> : <Bus size={16} />}
                        </div>
                        {!isLast && <div className="jp-timeline-connector"></div>}
                      </div>

                      <div className="jp-timeline-right">
                        <div className="jp-timeline-segment-head">
                          {seg.type === 'WALK' ? (
                            <span className="jp-segment-badge walk">WALKING</span>
                          ) : (
                            <span className="jp-segment-badge bus">BUS {seg.routeNumber}</span>
                          )}
                          <span className="jp-segment-duration">{seg.duration} min</span>
                        </div>

                        <div className="jp-timeline-instruction">
                          {seg.type === 'WALK' ? (
                            <>Walk to <strong>{seg.to}</strong> (~{Math.round(seg.distance || 0)}m)</>
                          ) : (
                            <>
                              Board <strong>{seg.routeName || `Route ${seg.routeNumber}`}</strong>
                              <div className="jp-timeline-subtext">Alight at {seg.to}</div>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="jp-itin-actions">
                <button type="button" className="jp-start-btn" onClick={startJourney}>
                  <CheckCircle2 size={18} />
                  <span>Start Live Journey</span>
                </button>
              </div>
            </div>
          ) : hasSearched ? (
            /* SEARCH RESULTS LIST */
            <div className="jp-results-list">
              {searchError === "SCHEDULE_EXPIRED_WARNING" && !loading && (
                <div className="jp-alert-warning">
                  <AlertTriangle size={18} className="jp-alert-icon" />
                  <div>
                    <strong>Timetable Advisory</strong>
                    <p>Timetable grounded in official KTCL transit schedule. Verify with local bus terminal for holiday adjustments.</p>
                  </div>
                </div>
              )}

              {loading ? (
                <div className="jp-skeletons">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="jp-card-skeleton"></div>
                  ))}
                </div>
              ) : searchError && searchError !== "SCHEDULE_EXPIRED_WARNING" ? (
                <div className="jp-error-state">
                  <AlertTriangle size={32} color="#DC2626" />
                  <h3>No Direct Route Found</h3>
                  <p>We could not find scheduled buses matching "{fromQuery}" to "{toQuery}". Try searching major stands like Panaji KTC or Margao KTC.</p>
                </div>
              ) : journeys.length === 0 ? (
                <div className="jp-empty-state">
                  <Bus size={36} color="#94A3B8" />
                  <h3>No Trips Found</h3>
                  <p>No bus trips currently scheduled for this route combination. Try adjusting your start or end stop.</p>
                </div>
              ) : (
                <div className="jp-cards-container">
                  <div className="jp-results-count">
                    <span>{journeys.length} ROUTE OPTION{journeys.length > 1 ? 'S' : ''} FOUND</span>
                  </div>

                  {journeys.map((journey, i) => {
                    const isDirect = (journey.segments || []).filter(s => s.type === 'BUS').length <= 1;
                    return (
                      <div 
                        key={i} 
                        className={`jp-card ${selectedJourney === journey ? 'active' : ''}`}
                        onClick={() => setSelectedJourney(journey)}
                      >
                        <div className="jp-card-header">
                          <div className="jp-card-segments">
                            {journey.segments?.map((seg, idx) => (
                              <div key={idx} className="jp-seg-pill">
                                {seg.type === 'WALK' ? (
                                  <span className="jp-seg-walk">🚶 {seg.duration}m</span>
                                ) : (
                                  <span className="jp-seg-bus">🚌 {seg.routeNumber || "BUS"}</span>
                                )}
                                {idx < (journey.segments.length - 1) && (
                                  <span className="jp-seg-arrow">&rarr;</span>
                                )}
                              </div>
                            ))}
                          </div>

                          <span className={`jp-transfer-badge ${isDirect ? 'direct' : 'transfer'}`}>
                            {isDirect ? "Direct Route" : "1 Transfer"}
                          </span>
                        </div>

                        <div className="jp-card-body">
                          <div className="jp-card-times">
                            <strong>{formatTime(journey.departureTime)}</strong>
                            <span className="jp-time-divider">&rarr;</span>
                            <strong>{formatTime(journey.arrivalTime)}</strong>
                          </div>
                          <div className="jp-card-duration">
                            <Clock size={13} />
                            <span>{journey.totalDuration} min</span>
                          </div>
                        </div>

                        <div className="jp-card-footer">
                          <span className={`jp-status-chip ${journey.isLive ? 'live' : 'scheduled'}`}>
                            {journey.isLive ? "● LIVE" : "SCHEDULED"}
                          </span>
                          <span className="jp-view-btn">
                            <span>View Itinerary</span>
                            <ChevronRight size={15} />
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            /* PRE-SEARCH STATE */
            <div className="jp-idle-box">
              <div className="jp-idle-icon">
                <Bus size={32} />
              </div>
              <h3>Explore Goa Transit</h3>
              <p>
                Enter your departure point and destination above to see direct and transfer routes with estimated travel times.
              </p>

              <div className="jp-quick-pairs">
                <div className="jp-quick-label">POPULAR TRIPS</div>
                <button 
                  type="button" 
                  className="jp-quick-pair-btn"
                  onClick={() => {
                    setFromQuery("Panaji KTC Bus Stand");
                    setToQuery("Margao KTC Bus Stand");
                    executeSearch("Panaji KTC Bus Stand", "Margao KTC Bus Stand");
                  }}
                >
                  <span>Panaji KTC</span>
                  <span className="arrow">&rarr;</span>
                  <span>Margao KTC</span>
                </button>

                <button 
                  type="button" 
                  className="jp-quick-pair-btn"
                  onClick={() => {
                    setFromQuery("Panaji KTC Bus Stand");
                    setToQuery("Mapusa KTC Bus Stand");
                    executeSearch("Panaji KTC Bus Stand", "Mapusa KTC Bus Stand");
                  }}
                >
                  <span>Panaji KTC</span>
                  <span className="arrow">&rarr;</span>
                  <span>Mapusa KTC</span>
                </button>

                <button 
                  type="button" 
                  className="jp-quick-pair-btn"
                  onClick={() => {
                    setFromQuery("Margao KTC Bus Stand");
                    setToQuery("Vasco KTC Bus Stand");
                    executeSearch("Margao KTC Bus Stand", "Vasco KTC Bus Stand");
                  }}
                >
                  <span>Margao KTC</span>
                  <span className="arrow">&rarr;</span>
                  <span>Vasco KTC</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* MAP AREA (Desktop Right Side / Mobile Base) */}
      <div className="jp-map-section">
        <LiveMap 
          center={mapCenter} 
          passengerPosition={passengerPos} 
          journeySegments={selectedJourney ? selectedJourney.segments : null}
        />

        {passengerPos && (
          <button 
            type="button"
            className="jp-map-recenter-btn"
            onClick={() => setMapCenter([passengerPos.lat, passengerPos.lng])}
            title="Recenter Map"
          >
            <Navigation size={20} />
          </button>
        )}
      </div>
    </div>
  );
}
