import { useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Bus, MapPin, Search, Crosshair, ArrowUpDown, Clock, X, ChevronRight, ArrowLeft, Navigation } from "lucide-react";
import LiveMap from "../components/LiveMap";
import { getTransitJourney } from "../services/routingService";
import "./JourneyPlanner.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

export default function JourneyPlanner() {
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [toId, setToId] = useState(null);
  
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [mapCenter, setMapCenter] = useState([15.2993, 74.1240]);
  const [passengerPos, setPassengerPos] = useState(null);
  const [activeJourney, setActiveJourney] = useState(false);
  const [gpsWatchId, setGpsWatchId] = useState(null);

  const navigate = useNavigate();
  const location = useLocation();

  // Parse query parameters
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const toParam = params.get("to");
    const toIdParam = params.get("toId");
    
    if (toParam) {
      setToQuery(decodeURIComponent(toParam));
      if (toIdParam) setToId(toIdParam);
      
      // Auto-set origin to current location and plan journey if permission granted
      if ("geolocation" in navigator) {
        setFromQuery("My Current Location");
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const { latitude, longitude } = pos.coords;
            setPassengerPos([latitude, longitude]);
            setMapCenter([latitude, longitude]);
            
            // Auto search
            executeSearch([latitude, longitude], toParam);
          },
          (err) => {
            console.warn("Location error:", err);
            // Default to panaji if location fails
            setFromQuery("");
          },
          { enableHighAccuracy: true }
        );
      }
    }
  }, [location.search]);

  useEffect(() => {
    return () => {
      if (gpsWatchId) navigator.geolocation.clearWatch(gpsWatchId);
    };
  }, [gpsWatchId]);

  const requestLocation = () => {
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPassengerPos([latitude, longitude]);
          setMapCenter([latitude, longitude]);
          setFromQuery("My Current Location");
        },
        (err) => {
          console.warn("Location error:", err);
          alert("Could not get your location. Please check permissions.");
        },
        { enableHighAccuracy: true }
      );
    } else {
      alert("Geolocation is not supported by your browser.");
    }
  };

  const startJourney = () => {
    setActiveJourney(true);
    if ("geolocation" in navigator) {
      const id = navigator.geolocation.watchPosition(
        (pos) => {
          const { latitude, longitude } = pos.coords;
          setPassengerPos([latitude, longitude]);
        },
        (err) => console.warn(err),
        { enableHighAccuracy: true }
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
  };

  const executeSearch = async (origin, dest) => {
    if (!origin || !dest) return;
    
    setLoading(true);
    setHasSearched(true);
    setSelectedJourney(null);
    try {
      // Use routingService for multi-modal path
      // Handle the origin parameter gracefully
      let originCoord = passengerPos || [15.2993, 74.1240];
      if (Array.isArray(origin)) originCoord = origin;
      
      const results = await getTransitJourney({ lat: originCoord[0], lng: originCoord[1] }, dest);
      setJourneys(results);
    } catch (err) {
      console.error("Failed to fetch journeys", err);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    if (!fromQuery || !toQuery) return;
    executeSearch(fromQuery === "My Current Location" ? passengerPos : fromQuery, toQuery);
  };

  // Reset if manually cleared
  useEffect(() => {
    if (fromQuery === "" && toQuery === "") {
      setHasSearched(false);
      setJourneys([]);
      setSelectedJourney(null);
    }
  }, [fromQuery, toQuery]);

  return (
    <div className="journey-planner-mobile-container">
      {/* HEADER (Floating over map) */}
      <div className="jp-mobile-header">
        <button className="jp-back-button" onClick={() => navigate(-1)}>
          <ArrowLeft size={20} />
        </button>
        <h1 className="jp-mobile-title">Journey Planner</h1>
      </div>

      {/* MAP AREA (Full Background) */}
      <div className="jp-map-container">
        <LiveMap 
          center={mapCenter} 
          passengerPosition={passengerPos} 
          journeySegments={selectedJourney ? selectedJourney.segments : null}
        />
        {/* Recenter Button */}
        {passengerPos && (
          <button 
            onClick={() => setMapCenter([...passengerPos])}
            style={{
              position: 'absolute', top: '80px', right: '16px', zIndex: 1000,
              background: 'white', border: 'none', borderRadius: '50%', width: '44px', height: '44px',
              boxShadow: '0 2px 8px rgba(0,0,0,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--teal-800)', cursor: 'pointer'
            }}
          >
            <Navigation size={20} />
          </button>
        )}
      </div>

      {/* BOTTOM SHEET */}
      <div className="jp-bottom-sheet">
        <div className="jp-sheet-handle-wrap">
          <div className="jp-sheet-handle"></div>
        </div>
        
        <div className="jp-sheet-content">
          {/* VIEW JOURNEY DETAILS */}
          {activeJourney ? (
            <div className="jp-details">
              <h2 className="jp-sheet-title">Journey in Progress</h2>
              
              <div className="jp-segments-list" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '16px' }}>
                {selectedJourney.segments.map((seg, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ fontSize: '20px' }}>{seg.icon}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: '14px', fontWeight: 'bold' }}>{seg.type === 'WALK' ? `Walk ${seg.duration} min` : `Route ${seg.routeNumber}`}</div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>To {seg.to}</div>
                    </div>
                  </div>
                ))}
              </div>

              <div className={`jp-status-banner ${selectedJourney.isLive ? 'live' : 'scheduled'}`}>
                {selectedJourney.isLive ? (
                  <><span className="live-dot"></span> LIVE — Follow journey progress</>
                ) : (
                  "SCHEDULED — Live tracking unavailable"
                )}
              </div>
              <button className="jp-plan-btn" onClick={() => setMapCenter([...passengerPos])} style={{ marginBottom: '12px', background: '#f1f5f9', color: '#333' }}>
                ◎ Recenter
              </button>
              <button className="jp-track-btn" onClick={endJourney} style={{ background: '#be185d' }}>
                End Journey
              </button>
            </div>
          ) : selectedJourney ? (
            <div className="jp-details">
              <div className="jp-details-header" style={{ marginBottom: '16px' }}>
                <button className="icon-btn" onClick={() => setSelectedJourney(null)} style={{ background: 'none', border: 'none', color: 'var(--teal-800)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                  <ArrowLeft size={16} /> Back to results
                </button>
              </div>
              
              <div style={{ marginBottom: '16px' }}>
                <h3 style={{ margin: '0 0 8px 0' }}>Journey Details</h3>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {selectedJourney.segments.map((seg, idx) => (
                    <div key={idx} style={{ display: 'flex', gap: '12px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '24px' }}>
                        <div style={{ fontSize: '18px' }}>{seg.icon}</div>
                        {idx !== selectedJourney.segments.length - 1 && (
                          <div style={{ width: '2px', flex: 1, background: '#e2e8f0', margin: '4px 0' }}></div>
                        )}
                      </div>
                      <div style={{ flex: 1, paddingBottom: idx !== selectedJourney.segments.length - 1 ? '16px' : '0' }}>
                        <div style={{ fontWeight: '600', fontSize: '15px' }}>
                          {seg.type === 'WALK' ? `Walk ${seg.duration} min (${Math.round(seg.distance)}m)` : `Board Route ${seg.routeNumber}`}
                        </div>
                        {seg.type === 'BUS' && (
                          <div style={{ fontSize: '13px', color: 'var(--text-main)', marginTop: '4px' }}>{seg.routeName}</div>
                        )}
                        <div style={{ fontSize: '13px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          {seg.type === 'WALK' ? `To ${seg.to}` : `Get off at ${seg.to}`}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className={`jp-status-banner ${selectedJourney.isLive ? 'live' : 'scheduled'}`}>
                {selectedJourney.isLive ? (
                  <>
                    <span className="live-dot"></span> LIVE — ETA {selectedJourney.arrivalTime}
                  </>
                ) : (
                  "SCHEDULED — Live tracking unavailable"
                )}
              </div>

              <button className="jp-track-btn" onClick={startJourney}>
                Start Journey
              </button>
            </div>
          ) : (
            <>
              {/* SEARCH BOX */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 className="jp-sheet-title" style={{ margin: 0 }}>Where are you going?</h2>
                <button 
                  onClick={requestLocation}
                  style={{ background: 'none', border: 'none', color: 'var(--teal-800)', fontSize: '12px', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}
                >
                  <Navigation size={14} /> My Location
                </button>
              </div>
              <div className="jp-search-card">
                <div className="jp-search-inputs">
                  <div className="jp-search-icons">
                    <div className="jp-dot origin"></div>
                    <div className="jp-line"></div>
                    <div className="jp-dot destination"></div>
                  </div>
                  <div className="jp-search-fields">
                    <div className="jp-field">
                      <label>FROM</label>
                      <div className="jp-input-row">
                        <input 
                          type="text" 
                          placeholder="Choose Origin" 
                          value={fromQuery}
                          onChange={(e) => setFromQuery(e.target.value)}
                        />
                        <Crosshair size={18} className="icon-btn" onClick={requestLocation} style={{ cursor: 'pointer' }} />
                      </div>
                    </div>
                    <div className="jp-divider"></div>
                    <div className="jp-field">
                      <label>TO</label>
                      <div className="jp-input-row">
                        <input 
                          type="text" 
                          placeholder="Choose Destination" 
                          value={toQuery}
                          onChange={(e) => setToQuery(e.target.value)}
                        />
                        {toQuery && <X size={18} className="icon-btn" onClick={() => setToQuery("")} style={{ cursor: 'pointer' }} />}
                      </div>
                    </div>
                  </div>
                  <div className="jp-swap-btn" onClick={handleSwap}>
                    <ArrowUpDown size={20} />
                  </div>
                </div>
                
                <button 
                  className="jp-plan-btn"
                  onClick={handleSearch}
                  disabled={loading || (!fromQuery || !toQuery)}
                >
                  {loading ? "Searching..." : "Plan Journey"}
                </button>
              </div>

              {/* JOURNEY RESULTS */}
              <div className="jp-results-area">
                {!hasSearched ? (
                  <div className="jp-recent">
                    <div className="jp-recent-list">
                      {/* Optional recent searches can go here */}
                    </div>
                  </div>
                ) : (
                  <div className="jp-results">
                    {journeys.length === 0 ? (
                      <p className="jp-no-results">No routes found matching your search.</p>
                    ) : (
                      <div className="jp-journey-list">
                        {journeys.map((journey, i) => (
                          <div key={i} className="jp-journey-card" onClick={() => setSelectedJourney(journey)}>
                            <div className="jp-card-header">
                              {/* Display multiple segments graphically */}
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                {journey.segments.map((seg, idx) => (
                                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                    {seg.type === 'WALK' ? (
                                      <span style={{ fontSize: '14px', color: 'var(--text-muted)' }}>🚶 {seg.duration}m</span>
                                    ) : (
                                      <div className="bus-badge">{seg.routeNumber || "BUS"}</div>
                                    )}
                                    {idx !== journey.segments.length - 1 && <ChevronRight size={14} color="#cbd5e1" />}
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="jp-card-times" style={{ marginTop: '12px' }}>
                              <div>
                                <strong>{journey.departureTime}</strong> &rarr; <strong>{journey.arrivalTime}</strong>
                              </div>
                              <div className="jp-card-duration">{journey.totalDuration} min</div>
                            </div>
                            <div className="jp-card-footer" style={{ marginTop: '8px' }}>
                              <span className={`jp-card-status ${journey.isLive ? 'live' : 'scheduled'}`}>
                                {journey.isLive ? "LIVE" : "SCHEDULED"}
                              </span>
                              <span className="jp-view-action">View Journey <ChevronRight size={16} /></span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
