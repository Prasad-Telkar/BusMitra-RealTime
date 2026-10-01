import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Bus, MapPin, Search, Crosshair, ArrowUpDown, Clock, X, ChevronRight, ArrowLeft, Navigation } from "lucide-react";
import LiveMap from "../components/LiveMap";
import "./JourneyPlanner.css";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

export default function JourneyPlanner() {
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [journeys, setJourneys] = useState([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const [selectedJourney, setSelectedJourney] = useState(null);
  const [mapCenter, setMapCenter] = useState([15.2993, 74.1240]); // Default Goa center
  const [passengerPos, setPassengerPos] = useState(null);
  const [activeJourney, setActiveJourney] = useState(false);
  const [gpsWatchId, setGpsWatchId] = useState(null);

  const navigate = useNavigate();

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

  const handleSearch = async () => {
    if (!fromQuery && !toQuery) return;
    
    setLoading(true);
    setHasSearched(true);
    setSelectedJourney(null);
    try {
      const params = new URLSearchParams();
      if (fromQuery) params.append("from", fromQuery);
      if (toQuery) params.append("to", toQuery);
      params.append("limit", "10");
      
      const res = await fetch(`${API_BASE}/api/search/routes?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        // Since we don't have full journey planning endpoints with exact schedules,
        // we'll map the returned routes as scheduled journeys, adding placeholder times for realism
        const journeysData = data.map((route, idx) => {
          // Fake schedule times for demo purposes if backend doesn't provide them directly
          const departure = new Date();
          departure.setMinutes(departure.getMinutes() + (idx * 15 + 10)); // +10 mins, +25 mins...
          
          const arrival = new Date(departure);
          arrival.setHours(arrival.getHours() + 1);
          arrival.setMinutes(arrival.getMinutes() + 30);
          
          return {
            ...route,
            departureTime: departure.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            arrivalTime: arrival.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            duration: "1h 30m",
            isLive: false,
            busId: null,
          };
        });
        setJourneys(journeysData);
      }
    } catch (err) {
      console.error("Failed to fetch journeys", err);
    } finally {
      setLoading(false);
    }
  };

  // If user types, we can reset search state or just let them click Search again
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
        <LiveMap center={mapCenter} passengerPosition={passengerPos} />
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
              <div className="jp-time-info">
                <div className="jp-time-block">
                  <div className="jp-time">Walking</div>
                  <div className="jp-place">To {selectedJourney.routeName || selectedJourney.longName}</div>
                </div>
              </div>
              <div className={`jp-status-banner ${selectedJourney.isLive ? 'live' : 'scheduled'}`}>
                {selectedJourney.isLive ? (
                  <><span className="live-dot"></span> LIVE — ETA 8 mins</>
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
              <div className="jp-details-header">
                <button className="icon-btn" onClick={() => setSelectedJourney(null)} style={{ background: 'none', border: 'none', color: 'var(--teal-800)', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 'bold' }}>
                  <ArrowLeft size={16} /> Back to results
                </button>
                <div className="bus-badge">{selectedJourney.routeNumber || "BUS"}</div>
              </div>
              
              <h2 className="jp-route-name">{selectedJourney.routeName || selectedJourney.longName}</h2>
              
              <div className="jp-time-info">
                <div className="jp-time-block">
                  <div className="jp-time">{selectedJourney.departureTime}</div>
                  <div className="jp-place">Departure</div>
                </div>
                <div className="jp-time-block right">
                  <div className="jp-time">{selectedJourney.arrivalTime}</div>
                  <div className="jp-place">Arrival</div>
                </div>
              </div>

              <div className={`jp-status-banner ${selectedJourney.isLive ? 'live' : 'scheduled'}`}>
                {selectedJourney.isLive ? (
                  <>
                    <span className="live-dot"></span> LIVE — Bus is on the way
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
                        <Crosshair size={18} className="icon-btn" />
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
                        {toQuery && <X size={18} className="icon-btn" onClick={() => setToQuery("")} />}
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
                  disabled={loading || (!fromQuery && !toQuery)}
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
                              <div className="bus-badge">{journey.routeNumber || "BUS"}</div>
                              <span className="jp-card-route">{journey.routeName || journey.longName}</span>
                            </div>
                            <div className="jp-card-times">
                              <div>
                                <strong>{journey.departureTime}</strong> &rarr; <strong>{journey.arrivalTime}</strong>
                              </div>
                              <div className="jp-card-duration">{journey.duration}</div>
                            </div>
                            <div className="jp-card-footer">
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
