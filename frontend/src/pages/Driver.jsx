import { useState, useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import io from "socket.io-client";
import { 
  HelpCircle, Radio, MapPin, ShieldAlert, Square, Play, 
  ChevronDown, Wifi, Key, AlertTriangle, LogOut, CheckCircle2,
  Navigation, RefreshCw, Smartphone
} from "lucide-react";
import "./Driver.css";

const API_BASE = import.meta.env.VITE_API_BASE || "https://busmitra-goa.onrender.com";

export default function Driver() {
  const location = useLocation();
  const [isLoggedIn, setIsLoggedIn] = useState(location.state?.isLoggedIn || false);
  const [driverId, setDriverId] = useState(location.state?.driverId || "KTC-DRV-1042");
  const [pin, setPin] = useState("");
  const [busNumber, setBusNumber] = useState("GA-03-X-0001");

  const [socket, setSocket] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastSent, setLastSent] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [queuedPoints, setQueuedPoints] = useState(0);
  const [gpsAccuracy, setGpsAccuracy] = useState(null);
  const [speedKmh, setSpeedKmh] = useState(0);
  
  const [upcomingTrips, setUpcomingTrips] = useState([]);
  const [selectedTripId, setSelectedTripId] = useState("");
  const [activeTripId, setActiveTripId] = useState(null);
  const [confirmEnd, setConfirmEnd] = useState(false);

  const watchId = useRef(null);
  const offlineQueue = useRef([]);

  const activeTrip = upcomingTrips.find(t => t.tripId === selectedTripId) || upcomingTrips[0];

  useEffect(() => {
    if (isLoggedIn) {
      fetch(`${API_BASE}/api/driver/upcoming-trips`)
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            setUpcomingTrips(data);
            if (data.length > 0) setSelectedTripId(data[0].tripId);
          }
        })
        .catch(console.error);
    }
  }, [isLoggedIn]);

  useEffect(() => {
    if (!isLoggedIn) return;
    
    const s = io(API_BASE);
    setSocket(s);

    s.on("connect", () => {
      console.log("Driver connected to server");
      setIsConnected(true);
      
      // Flush offline queue on reconnect
      if (offlineQueue.current.length > 0) {
        offlineQueue.current.forEach(point => {
          s.emit("driver_location", point);
        });
        offlineQueue.current = [];
        setQueuedPoints(0);
      }
    });

    s.on("disconnect", () => {
      console.log("Driver disconnected");
      setIsConnected(false);
    });

    return () => s.disconnect();
  }, [isLoggedIn]);

  // Update "last sent" counter every second
  useEffect(() => {
    let interval;
    if (isTracking) {
      interval = setInterval(() => {
        setLastSent(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isTracking]);

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: driverId, password: pin })
      });
      const data = await res.json();
      if (res.ok) {
        setIsLoggedIn(true);
      } else {
        alert("Login failed: " + (data.error || "Invalid credentials"));
      }
    } catch (err) {
      console.error(err);
      alert("Network error connecting to auth server");
    }
  };

  const startTracking = async () => {
    if (!activeTrip) return alert("Please select an assigned trip first");
    
    try {
      const res = await fetch(`${API_BASE}/api/driver/trip/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          driverId,
          tripId: activeTrip.tripId,
          routeId: activeTrip.routeId,
          busId: busNumber
        })
      });
      const data = await res.json();
      if (data.success) {
        setActiveTripId(data.activeTripId);
        setIsTracking(true);
        setLastSent(0);
        
        if (navigator.geolocation && socket) {
          watchId.current = navigator.geolocation.watchPosition(
            (pos) => {
              const acc = Math.round(pos.coords.accuracy || 10);
              const speed = Math.round((pos.coords.speed || 0) * 3.6); // m/s to km/h
              setGpsAccuracy(acc);
              setSpeedKmh(speed);

              const payload = {
                lat: pos.coords.latitude,
                lng: pos.coords.longitude,
                speed: pos.coords.speed || 0,
                accuracy: Math.min(acc, 40),
                timestamp: Date.now() / 1000,
                bus_id: data.activeTripId,
              };
              
              if (socket.connected) {
                socket.emit("driver_location", payload);
                setLastSent(0); // reset counter when sent
              } else {
                offlineQueue.current.push(payload);
                setQueuedPoints(offlineQueue.current.length);
              }
            },
            (err) => console.error("GPS Watch error:", err),
            { enableHighAccuracy: true, maximumAge: 0 }
          );
        }
      } else {
        alert(data.error || "Unable to start trip on server");
      }
    } catch (err) {
      console.error(err);
      alert("Failed to start trip");
    }
  };

  const endTrip = async () => {
    setIsTracking(false);
    setConfirmEnd(false);
    if (watchId.current && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
    }
    offlineQueue.current = [];
    setQueuedPoints(0);
    
    if (socket && socket.connected && activeTripId) {
      socket.emit("driver_end_trip", { bus_id: activeTripId });
    }
    
    try {
      await fetch(`${API_BASE}/api/driver/trip/end`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activeTripId })
      });
    } catch (err) {
      console.error(err);
    }
    setActiveTripId(null);
  };

  const handleLogout = () => {
    if (isTracking) {
      alert("Please end your active trip before logging out.");
      return;
    }
    setIsLoggedIn(false);
  };

  // LOGIN SCREEN
  if (!isLoggedIn) {
    return (
      <div className="driver-login-container">
        <div className="driver-login-card">
          <div className="driver-login-icon">
            <Smartphone size={32} />
          </div>
          <h1 className="driver-login-title">Driver Terminal</h1>
          <p className="driver-login-sub">
            Kadamba Transport Corporation &bull; Goa Fleet Telemetry
          </p>

          <form onSubmit={handleLogin}>
            <div className="driver-input-field">
              <label>Driver Identification Number</label>
              <input 
                type="text" 
                placeholder="e.g. KTC-DRV-1042"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                required
              />
            </div>

            <div className="driver-input-field">
              <label>PIN Code / Password</label>
              <input 
                type="password" 
                placeholder="Enter 4-digit PIN"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                required
              />
            </div>

            <div className="driver-input-field">
              <label>Assigned Vehicle Registration</label>
              <input 
                type="text" 
                placeholder="GA-03-X-0001"
                value={busNumber}
                onChange={(e) => setBusNumber(e.target.value)}
                required
              />
            </div>

            <button type="submit" className="driver-login-submit">
              Sign In to In-Cab Terminal
            </button>
          </form>
        </div>
      </div>
    );
  }

  // ACTIVE IN-CAB CONSOLE
  return (
    <div className="driver-portal-layout">
      {/* TOP STATUS BAR */}
      <div className="driver-top-bar">
        <div className="driver-id-badge">
          <div className="driver-avatar">KT</div>
          <div className="driver-id-text">
            <h2>{driverId}</h2>
            <p>Vehicle: {busNumber}</p>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div className={`driver-socket-pill ${isConnected ? 'connected' : 'disconnected'}`}>
            <span className="live-dot" style={{ width: '6px', height: '6px', borderRadius: '50%', background: isConnected ? '#10B981' : '#EF4444' }}></span>
            <span>{isConnected ? "Server Online" : "Reconnecting"}</span>
          </div>

          <button 
            type="button" 
            onClick={handleLogout}
            title="Log Out"
            style={{ background: 'none', border: 'none', color: '#94A3B8', cursor: 'pointer', padding: '6px' }}
          >
            <LogOut size={18} />
          </button>
        </div>
      </div>

      <div className="driver-main-screen">
        {/* TRIP CONTROL CARD */}
        <div className={`driver-trip-card ${isTracking ? 'active-run' : ''}`}>
          <div className="dt-card-head">
            <span className={`dt-status-pill ${isTracking ? 'broadcasting' : 'ready'}`}>
              {isTracking ? "● BROADCASTING GPS" : "READY FOR DISPATCH"}
            </span>
            <span className="dt-bus-num">{busNumber}</span>
          </div>

          {/* Route Info / Picker */}
          {!isTracking ? (
            <div className="dt-route-picker">
              <label style={{ fontSize: '11px', fontWeight: 800, color: '#94A3B8', textTransform: 'uppercase' }}>
                Assigned Route &amp; Timetable
              </label>
              <select 
                className="dt-route-select"
                value={selectedTripId} 
                onChange={(e) => setSelectedTripId(e.target.value)}
              >
                {upcomingTrips.length === 0 ? (
                  <option value="">Default Kadamba Corridor</option>
                ) : (
                  upcomingTrips.map(r => (
                    <option key={r.tripId} value={r.tripId}>
                      {r.routeId} &bull; {r.start_time} - {r.end_time}
                    </option>
                  ))
                )}
              </select>
            </div>
          ) : (
            <div>
              <div style={{ fontSize: '11px', fontWeight: 800, color: '#A7F3D0', textTransform: 'uppercase' }}>
                ACTIVE DISPATCH TRIP
              </div>
              <h2 style={{ fontSize: '20px', fontWeight: 800, margin: '4px 0', color: '#FFFFFF' }}>
                {activeTrip?.routeId || "Route Active"}
              </h2>
              <p style={{ fontSize: '13px', color: '#E2E8F0', margin: 0 }}>
                Trip ID: {activeTripId} &bull; Scheduled {activeTrip?.start_time || 'Now'}
              </p>
            </div>
          )}

          {/* TELEMETRY HUD */}
          <div className="driver-telemetry-hud">
            <div className="d-hud-stat">
              <span className="d-hud-label">GPS STATUS</span>
              <span className={`d-hud-val ${isTracking ? 'good' : ''}`}>
                {isTracking ? `${lastSent}s ago` : "Standby"}
              </span>
            </div>

            <div className="d-hud-stat">
              <span className="d-hud-label">ACCURACY</span>
              <span className="d-hud-val">
                {gpsAccuracy !== null ? `±${gpsAccuracy} m` : "Calibrating"}
              </span>
            </div>

            <div className="d-hud-stat">
              <span className="d-hud-label">SPEED</span>
              <span className="d-hud-val">
                {speedKmh} km/h
              </span>
            </div>

            <div className="d-hud-stat">
              <span className="d-hud-label">OFFLINE QUEUE</span>
              <span className={`d-hud-val ${queuedPoints > 0 ? 'stale' : 'good'}`}>
                {queuedPoints} pts
              </span>
            </div>
          </div>

          {/* SAFETY ADVISORY */}
          <div className="driver-safety-box">
            <ShieldAlert size={20} color="#F59E0B" style={{ flexShrink: 0 }} />
            <span>
              {isTracking 
                ? "Maintain safe driving. Telemetry broadcasts automatically in background." 
                : "Confirm assigned route before departure. Ensure device GPS is active."}
            </span>
          </div>

          {/* BIG ACTION BUTTONS */}
          {!isTracking ? (
            <button 
              type="button" 
              className="driver-start-btn" 
              onClick={startTracking}
            >
              <Play size={20} />
              <span>START DISPATCH TRIP</span>
            </button>
          ) : confirmEnd ? (
            <div style={{ display: 'flex', gap: '10px' }}>
              <button 
                type="button" 
                className="driver-end-btn" 
                onClick={endTrip}
                style={{ flex: 1 }}
              >
                CONFIRM END
              </button>
              <button 
                type="button" 
                onClick={() => setConfirmEnd(false)}
                style={{
                  background: '#334155',
                  color: '#FFFFFF',
                  border: 'none',
                  borderRadius: '16px',
                  padding: '20px 24px',
                  fontWeight: 700,
                  cursor: 'pointer'
                }}
              >
                CANCEL
              </button>
            </div>
          ) : (
            <button 
              type="button" 
              className="driver-end-btn" 
              onClick={() => setConfirmEnd(true)}
            >
              <Square size={18} />
              <span>END TRIP</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
