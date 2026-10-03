import { useState, useEffect, useRef } from "react";
import { useSearchParams } from "react-router-dom";
import { Search, ArrowUpDown, ChevronRight, Calculator, IndianRupee, MapPin } from "lucide-react";
import ktcStops from "../data/stops.json";
import "./FareCalculator.css";

const API_BASE = import.meta.env.VITE_API_BASE || "https://busmitra-goa.onrender.com";

const normalizeStop = (apiStop) => ({
  ...apiStop,
  stopId: apiStop.stopId || apiStop.stop_id || apiStop._id,
  name: apiStop.name || apiStop.stop_name || "Unknown Stop",
  latitude: apiStop.latitude || apiStop.lat,
  longitude: apiStop.longitude || apiStop.lng,
  route_count: apiStop.route_count || 0
});

const deduplicateStops = (stops) => {
  const seen = new Set();
  return (stops || []).map(normalizeStop).filter(stop => {
    if (!stop.stopId) return false;
    if (seen.has(stop.stopId)) return false;
    seen.add(stop.stopId);
    return true;
  });
};

// Precompute indexed ktcStops outside component to avoid repeated normalization
const indexedKtcStops = deduplicateStops(ktcStops).map(s => ({
  ...s,
  normalizedName: (s.name).toLowerCase()
}));

const autocompleteCache = new Map();

export default function FareCalculator() {
  const [searchParams] = useSearchParams();
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [fromStop, setFromStop] = useState(null);
  const [toStop, setToStop] = useState(null);
  const [fromResults, setFromResults] = useState([]);
  const [toResults, setToResults] = useState([]);
  const [isFromOpen, setIsFromOpen] = useState(false);
  const [isToOpen, setIsToOpen] = useState(false);
  
  const [passengerType, setPassengerType] = useState("GENERAL");
  const [isLoading, setIsLoading] = useState(false);
  const [fareResult, setFareResult] = useState(null);
  const [error, setError] = useState("");
  const [isSearchingFrom, setIsSearchingFrom] = useState(false);
  const [isSearchingTo, setIsSearchingTo] = useState(false);
  const [fromSearchError, setFromSearchError] = useState(false);
  const [toSearchError, setToSearchError] = useState(false);

  const fromSearchTimeout = useRef(null);
  const toSearchTimeout = useRef(null);
  const fromAbortController = useRef(null);
  const toAbortController = useRef(null);

  const fromStopRef = useRef(fromStop);
  const toStopRef = useRef(toStop);

  useEffect(() => {
    fromStopRef.current = fromStop;
  }, [fromStop]);

  useEffect(() => {
    toStopRef.current = toStop;
  }, [toStop]);

  // Reconstruct from URL parameters or previous navigation state
  useEffect(() => {
    const fromParam = searchParams.get('from');
    const toParam = searchParams.get('to');

    const resolveStop = async (query, setStop, setQueryVal) => {
      try {
        const res = await fetch(`${API_BASE}/api/search/stops?q=${encodeURIComponent(query)}&limit=1`);
        const data = await res.json();
        if (data && data.length > 0) {
          const norm = normalizeStop(data[0]);
          setStop(norm);
          setQueryVal(norm.name);
        } else {
          setQueryVal(""); // Clear if unable to resolve
        }
      } catch (err) {
        console.error(err);
        setQueryVal("");
      }
    };

    if (fromParam && !fromStop) {
      setFromQuery(fromParam);
      resolveStop(fromParam, setFromStop, setFromQuery);
    }
    if (toParam && !toStop) {
      setToQuery(toParam);
      resolveStop(toParam, setToStop, setToQuery);
    }
  }, [searchParams]);

  const fetchStops = (query, type) => {
    if (!query || query.length < 2) {
      if (type === 'from') {
        setFromResults([]);
        setIsSearchingFrom(false);
        setFromSearchError(false);
      }
      if (type === 'to') {
        setToResults([]);
        setIsSearchingTo(false);
        setToSearchError(false);
      }
      return;
    }

    const normQuery = query.trim().toLowerCase();

    // 1. Instant Local Filter (with priority)
    const exactPrefixMatches = [];
    const wordPrefixMatches = [];
    const includesMatches = [];

    for (const s of indexedKtcStops) {
      if (!s.normalizedName) continue;
      if (s.normalizedName.startsWith(normQuery)) {
        exactPrefixMatches.push(s);
      } else if (s.normalizedName.includes(` ${normQuery}`)) {
        wordPrefixMatches.push(s);
      } else if (s.normalizedName.includes(normQuery)) {
        includesMatches.push(s);
      }
    }

    const normalizedLocal = [...exactPrefixMatches, ...wordPrefixMatches, ...includesMatches].slice(0, 15);
    
    if (type === 'from') {
      if (fromSearchTimeout.current) clearTimeout(fromSearchTimeout.current);
      if (fromAbortController.current) fromAbortController.current.abort();
      
      // Immediately display local results
      setFromResults(normalizedLocal);
      
      if (autocompleteCache.has(normQuery)) {
        setIsSearchingFrom(false);
        setFromSearchError(false);
        setFromResults(deduplicateStops([...normalizedLocal, ...autocompleteCache.get(normQuery)]).slice(0, 15));
        return;
      }
      
      setIsSearchingFrom(true);
      setFromSearchError(false);
      const controller = new AbortController();
      fromAbortController.current = controller;

      fromSearchTimeout.current = setTimeout(async () => {
        try {
          const res = await fetch(`${API_BASE}/api/search/stops?q=${encodeURIComponent(query)}&limit=15`, {
            signal: controller.signal
          });
          if (!res.ok) throw new Error("API failed");
          const data = await res.json();
          if (!controller.signal.aborted) {
            autocompleteCache.set(normQuery, data);
            
            // Merge backend results with local results safely without removing existing ones immediately
            setFromResults(prev => {
              const combined = [...prev, ...data];
              return deduplicateStops(combined).slice(0, 15);
            });
          }
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error("Stop search error:", err);
            if (!controller.signal.aborted && normalizedLocal.length === 0) setFromSearchError(true);
          }
        } finally {
          if (!controller.signal.aborted) {
            setIsSearchingFrom(false);
          }
        }
      }, 150);
    } else if (type === 'to') {
      if (toSearchTimeout.current) clearTimeout(toSearchTimeout.current);
      if (toAbortController.current) toAbortController.current.abort();

      // Immediately display local results
      setToResults(normalizedLocal);

      if (autocompleteCache.has(normQuery)) {
        setIsSearchingTo(false);
        setToSearchError(false);
        setToResults(deduplicateStops([...normalizedLocal, ...autocompleteCache.get(normQuery)]).slice(0, 15));
        return;
      }

      setIsSearchingTo(true);
      setToSearchError(false);
      const controller = new AbortController();
      toAbortController.current = controller;

      toSearchTimeout.current = setTimeout(async () => {
        try {
          const res = await fetch(`${API_BASE}/api/search/stops?q=${encodeURIComponent(query)}&limit=15`, {
            signal: controller.signal
          });
          if (!res.ok) throw new Error("API failed");
          const data = await res.json();
          if (!controller.signal.aborted) {
            autocompleteCache.set(normQuery, data);
            
            // Merge backend results with local results safely
            setToResults(prev => {
              const combined = [...prev, ...data];
              return deduplicateStops(combined).slice(0, 15);
            });
          }
        } catch (err) {
          if (err.name !== 'AbortError') {
            console.error("Stop search error:", err);
            if (!controller.signal.aborted && normalizedLocal.length === 0) setToSearchError(true);
          }
        } finally {
          if (!controller.signal.aborted) {
            setIsSearchingTo(false);
          }
        }
      }, 150);
    }
  };

  const handleSwap = () => {
    // Swap BOTH text and full stop objects
    const tempQ = fromQuery;
    setFromQuery(toQuery);
    setToQuery(tempQ);
    
    const tempS = fromStop;
    setFromStop(toStop);
    setToStop(tempS);
    setFareResult(null);
  };

  const calculateFare = async () => {
    const originId = fromStop?.stopId;
    const destId = toStop?.stopId;

    if (!originId || !destId) {
      setError("Please select both stops from the search dropdown.");
      return;
    }
    if (originId === destId) {
      setError("Starting point and destination are the same.");
      return;
    }

    setError("");
    setIsLoading(true);
    setFareResult(null);

    try {
      const url = `${API_BASE}/api/fare/calculate?originStopId=${originId}&destinationStopId=${destId}&passengerCategory=${passengerType}`;
      console.log("FareCalc Request URL:", url);
      
      const res = await fetch(url);
      console.log("FareCalc Response Status:", res.status);
      
      const text = await res.text();
      let data;
      try {
        data = JSON.parse(text);
        console.log("FareCalc Response JSON:", data);
      } catch (parseErr) {
        console.error("FareCalc Failed to parse JSON. Raw response:", text);
        throw new Error(`Invalid server response (Status: ${res.status})`);
      }
      
      if (!res.ok) {
        setError(data.error || `Server error: ${res.status}`);
      } else if (data.success === false) {
        setError(data.message || "Unable to calculate fare.");
      } else if (data.directServiceAvailable === false) {
        setError("No direct scheduled bus found for these stops.");
      } else {
        setFareResult(data);
      }
    } catch (err) {
      console.error("Fare calculation failed:", err);
      setError(`Error: ${err.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fc-container">
      <div className="fc-header">
        <h1>Fare Calculator</h1>
        <p>Check your Goa bus fare</p>
      </div>

      <div className="fc-card">
        {/* FROM INPUT */}
        <div className="fc-input-group">
          <label>FROM</label>
          <div className="fc-search-wrapper">
            <Search size={18} className="fc-icon" />
            <input 
              type="text" 
              placeholder="Search starting stop" 
              value={fromStop ? fromStop.name : fromQuery}
              onChange={(e) => {
                setFromStop(null); // Clear selected object on manual edit
                setFromQuery(e.target.value);
                setFareResult(null); // Clear fare result
                setIsFromOpen(true);
                fetchStops(e.target.value, 'from');
              }}
              onFocus={() => {
                setIsFromOpen(true);
                if (!fromStop && fromQuery) fetchStops(fromQuery, 'from');
              }}
              onBlur={() => {
                setTimeout(() => {
                  setIsFromOpen(false);
                  if (!fromStopRef.current) setFromQuery("");
                }, 200);
              }}
            />
          </div>
          {isFromOpen && fromQuery && fromQuery.length >= 2 && (
            <div className="fc-autocomplete">
              {fromResults.length > 0 ? (
                <>
                  {fromResults.map(stop => (
                    <div 
                      key={stop.stopId} 
                      className="fc-autocomplete-item"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        setFromStop(stop);
                        setFromQuery(stop.name);
                        setFromResults([]);
                        setIsFromOpen(false);
                        setFareResult(null); // Clear fare result on selection
                      }}
                    >
                      <MapPin size={16} style={{ flexShrink: 0 }} /> 
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{stop.name}</span>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {stop.route_count > 0 ? `${stop.route_count} routes` : `Stop ID: ${stop.stopId}`}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isSearchingFrom && (
                    <div className="fc-autocomplete-item" style={{ color: '#9ca3af', fontSize: '12px', justifyContent: 'center' }}>Updating...</div>
                  )}
                </>
              ) : isSearchingFrom ? (
                <div className="fc-autocomplete-item" style={{ color: '#6b7280' }}>Searching...</div>
              ) : fromSearchError ? (
                <div className="fc-autocomplete-item" style={{ color: '#ef4444' }}>Unable to load stops. Try again.</div>
              ) : (
                <div className="fc-autocomplete-item" style={{ color: '#6b7280' }}>No matching stops found</div>
              )}
            </div>
          )}
        </div>

        {/* SWAP */}
        <div className="fc-swap">
          <button onClick={handleSwap}>
            <ArrowUpDown size={18} />
          </button>
        </div>

        {/* TO INPUT */}
        <div className="fc-input-group">
          <label>TO</label>
          <div className="fc-search-wrapper">
            <Search size={18} className="fc-icon" />
            <input 
              type="text" 
              placeholder="Search destination" 
              value={toStop ? toStop.name : toQuery}
              onChange={(e) => {
                setToStop(null); // Clear selected object on manual edit
                setToQuery(e.target.value);
                setFareResult(null); // Clear fare result
                setIsToOpen(true);
                fetchStops(e.target.value, 'to');
              }}
              onFocus={() => {
                setIsToOpen(true);
                if (!toStop && toQuery) fetchStops(toQuery, 'to');
              }}
              onBlur={() => {
                setTimeout(() => {
                  setIsToOpen(false);
                  if (!toStopRef.current) setToQuery("");
                }, 200);
              }}
            />
          </div>
          {isToOpen && toQuery && toQuery.length >= 2 && (
            <div className="fc-autocomplete">
              {toResults.length > 0 ? (
                <>
                  {toResults.map(stop => (
                    <div 
                      key={stop.stopId} 
                      className="fc-autocomplete-item"
                      onPointerDown={(e) => {
                        e.preventDefault();
                        setToStop(stop);
                        setToQuery(stop.name);
                        setToResults([]);
                        setIsToOpen(false);
                        setFareResult(null); // Clear fare result on selection
                      }}
                    >
                      <MapPin size={16} style={{ flexShrink: 0 }} /> 
                      <div style={{ display: 'flex', flexDirection: 'column' }}>
                        <span>{stop.name}</span>
                        <span style={{ fontSize: '12px', color: '#6b7280' }}>
                          {stop.route_count > 0 ? `${stop.route_count} routes` : `Stop ID: ${stop.stopId}`}
                        </span>
                      </div>
                    </div>
                  ))}
                  {isSearchingTo && (
                    <div className="fc-autocomplete-item" style={{ color: '#9ca3af', fontSize: '12px', justifyContent: 'center' }}>Updating...</div>
                  )}
                </>
              ) : isSearchingTo ? (
                 <div className="fc-autocomplete-item" style={{ color: '#6b7280' }}>Searching...</div>
              ) : toSearchError ? (
                <div className="fc-autocomplete-item" style={{ color: '#ef4444' }}>Unable to load stops. Try again.</div>
              ) : (
                <div className="fc-autocomplete-item" style={{ color: '#6b7280' }}>No matching stops found</div>
              )}
            </div>
          )}
        </div>

        {/* PASSENGER TYPE */}
        <div className="fc-input-group" style={{ marginTop: '24px' }}>
          <label>PASSENGER TYPE</label>
          <div className="fc-type-selector">
            {['GENERAL', 'STUDENT', 'SENIOR CITIZEN'].map(type => (
              <button
                key={type}
                className={`fc-type-btn ${passengerType === type ? 'active' : ''}`}
                onClick={() => setPassengerType(type)}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* CALCULATE BUTTON */}
        <button className="fc-calc-btn" onClick={calculateFare} disabled={isLoading}>
          {isLoading ? "Calculating your fare..." : "CALCULATE FARE"}
        </button>

        {/* MESSAGES */}
        {error && (
          <div className="fc-error-state">
            {error}
          </div>
        )}

        {!error && !fareResult && !isLoading && (
          <div className="fc-empty-state">
            <Calculator size={32} style={{ marginBottom: '12px', opacity: 0.5 }} />
            Select your starting stop and destination to calculate your fare.
          </div>
        )}

        {/* RESULT */}
        {fareResult && !error && (
          <div className="fc-result-card">
            <div className="fc-result-header">FARE ESTIMATE</div>
            
            <div className="fc-result-od">
              <div className="fc-res-stop">{fareResult.origin}</div>
              <div className="fc-res-arrow">↓</div>
              <div className="fc-res-stop">{fareResult.destination}</div>
            </div>

            {fareResult.distanceKm && (
              <div className="fc-res-dist">
                Estimated distance: {fareResult.distanceKm} km
              </div>
            )}

            <div className="fc-res-fare-box">
              <div className="fc-res-fare-label">YOUR FARE</div>
              <div className="fc-res-fare-val">
                <IndianRupee size={32} strokeWidth={3} />
                {fareResult.fare}
              </div>
            </div>

            <div className="fc-res-meta">
              <div><strong>Passenger:</strong> {fareResult.passengerCategory}</div>
              <div><strong>Fare type:</strong> {fareResult.fareType}</div>
            </div>

            {/* Other fares */}
            <div className="fc-res-others">
              <div className={`fc-other-fare ${passengerType === 'GENERAL' ? 'active' : ''}`}>
                <span>General</span>
                <strong>₹{fareResult.generalFare}</strong>
              </div>
              <div className={`fc-other-fare ${passengerType === 'STUDENT' ? 'active' : ''}`}>
                <span>Student</span>
                <strong>₹{fareResult.studentFare}</strong>
              </div>
              <div className={`fc-other-fare ${passengerType === 'SENIOR CITIZEN' ? 'active' : ''}`}>
                <span>Senior Citizen</span>
                <strong>₹{fareResult.seniorFare}</strong>
              </div>
            </div>

            {fareResult.isEstimatedDistance && (
              <div className="fc-disclaimer">
                <details>
                  <summary>About this fare</summary>
                  <p>Distance is estimated from available route data using geospatial coordinates. Actual road distance and physical stage configurations may vary.</p>
                </details>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
