import { useState, useEffect, useRef } from "react";
import { Search, ArrowUpDown, ChevronRight, Calculator, IndianRupee, MapPin } from "lucide-react";
import "./FareCalculator.css";

const API_BASE = import.meta.env.VITE_API_BASE || "https://busmitra-backend-uskr.onrender.com";

export default function FareCalculator() {
  const [fromQuery, setFromQuery] = useState("");
  const [toQuery, setToQuery] = useState("");
  const [fromStop, setFromStop] = useState(null);
  const [toStop, setToStop] = useState(null);
  const [fromResults, setFromResults] = useState([]);
  const [toResults, setToResults] = useState([]);
  const [activeSearch, setActiveSearch] = useState(null); // 'from' or 'to'
  
  const [passengerType, setPassengerType] = useState("GENERAL");
  const [isLoading, setIsLoading] = useState(false);
  const [fareResult, setFareResult] = useState(null);
  const [error, setError] = useState("");

  const searchTimeout = useRef(null);

  const fetchStops = (query, type) => {
    if (!query) {
      if (type === 'from') setFromResults([]);
      if (type === 'to') setToResults([]);
      return;
    }

    if (searchTimeout.current) clearTimeout(searchTimeout.current);

    searchTimeout.current = setTimeout(async () => {
      try {
        const res = await fetch(`${API_BASE}/api/search/stops?q=${encodeURIComponent(query)}&limit=10`);
        const data = await res.json();
        if (type === 'from') setFromResults(data);
        if (type === 'to') setToResults(data);
      } catch (err) {
        console.error("Stop search error:", err);
      }
    }, 300);
  };

  const handleSwap = () => {
    const tempQ = fromQuery;
    setFromQuery(toQuery);
    setToQuery(tempQ);
    
    const tempS = fromStop;
    setFromStop(toStop);
    setToStop(tempS);
  };

  const calculateFare = async () => {
    if (!fromStop || !toStop) {
      setError("Please select both stops.");
      return;
    }
    if (fromStop.stopId === toStop.stopId) {
      setError("Starting point and destination are the same.");
      return;
    }

    setError("");
    setIsLoading(true);
    setFareResult(null);

    try {
      const url = `${API_BASE}/api/fare/calculate?originStopId=${fromStop.stopId}&destinationStopId=${toStop.stopId}&passengerCategory=${passengerType}`;
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
                setFromStop(null);
                setFromQuery(e.target.value);
                setActiveSearch('from');
                fetchStops(e.target.value, 'from');
              }}
              onFocus={() => {
                setActiveSearch('from');
                if (!fromStop && fromQuery) fetchStops(fromQuery, 'from');
              }}
            />
          </div>
          {activeSearch === 'from' && fromResults.length > 0 && (
            <div className="fc-autocomplete">
              {fromResults.map(stop => (
                <div 
                  key={stop.stopId} 
                  className="fc-autocomplete-item"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setFromStop(stop);
                    setFromQuery(stop.name);
                    setFromResults([]);
                    setActiveSearch(null);
                  }}
                >
                  <MapPin size={16} /> {stop.name}
                </div>
              ))}
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
                setToStop(null);
                setToQuery(e.target.value);
                setActiveSearch('to');
                fetchStops(e.target.value, 'to');
              }}
              onFocus={() => {
                setActiveSearch('to');
                if (!toStop && toQuery) fetchStops(toQuery, 'to');
              }}
            />
          </div>
          {activeSearch === 'to' && toResults.length > 0 && (
            <div className="fc-autocomplete">
              {toResults.map(stop => (
                <div 
                  key={stop.stopId} 
                  className="fc-autocomplete-item"
                  onMouseDown={(e) => {
                    e.preventDefault();
                    setToStop(stop);
                    setToQuery(stop.name);
                    setToResults([]);
                    setActiveSearch(null);
                  }}
                >
                  <MapPin size={16} /> {stop.name}
                </div>
              ))}
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
