import { useState, useEffect, useRef } from "react";
import io from "socket.io-client";
import { HelpCircle, Radio, MapPin, ShieldAlert, Square, Play, ChevronDown, Wifi, Key, AlertTriangle } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

const AVAILABLE_ROUTES = [
  { id: "route4_bus1", number: "K01", from: "Panaji", to: "Margao", next: "Porvorim" },
  { id: "route4_bus2", number: "K02", from: "Margao", to: "Panaji", next: "Porvorim" },
  { id: "route5_bus1", number: "K05", from: "Mapusa", to: "Panaji", next: "Porvorim" },
  { id: "route6_bus1", number: "K09", from: "Vasco", to: "Ponda", next: "Verna" },
];

export default function Driver() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [driverId, setDriverId] = useState("");
  const [pin, setPin] = useState("");

  const [socket, setSocket] = useState(null);
  const [isTracking, setIsTracking] = useState(false);
  const [lastSent, setLastSent] = useState(0);
  const [isConnected, setIsConnected] = useState(false);
  const [queuedPoints, setQueuedPoints] = useState(0);
  const [selectedBusId, setSelectedBusId] = useState(AVAILABLE_ROUTES[0].id);
  const watchId = useRef(null);
  const offlineQueue = useRef([]);

  const activeRoute = AVAILABLE_ROUTES.find(r => r.id === selectedBusId);

  useEffect(() => {
    if (!isLoggedIn) return;
    
    const s = io(API_BASE);
    setSocket(s);

    s.on("connect", () => {
      console.log("Driver connected to server");
      setIsConnected(true);
      
      // Flush offline queue on reconnect
      if (offlineQueue.current.length > 0) {
        console.log(`Syncing ${offlineQueue.current.length} queued points...`);
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

  const handleLogin = (e) => {
    e.preventDefault();
    if (driverId.length > 3 && pin.length > 3) {
      setIsLoggedIn(true);
    } else {
      alert("Please enter a valid Driver ID and PIN (e.g., KTC-DRV-1042 / 1234)");
    }
  };

  const startTracking = () => {
    if (navigator.geolocation && socket) {
      setIsTracking(true);
      setLastSent(0);
      watchId.current = navigator.geolocation.watchPosition(
        (pos) => {
          const payload = {
            lat: pos.coords.latitude,
            lng: pos.coords.longitude,
            speed: pos.coords.speed || 0,
            accuracy: Math.min(pos.coords.accuracy || 10, 40),
            timestamp: Date.now() / 1000,
            bus_id: selectedBusId,
          };
          
          if (socket.connected) {
            socket.emit("driver_location", payload);
            setLastSent(0); // reset counter when sent
          } else {
            // Queue offline
            offlineQueue.current.push(payload);
            setQueuedPoints(offlineQueue.current.length);
          }
        },
        (err) => console.error(err),
        { enableHighAccuracy: true, maximumAge: 0 }
      );
    } else {
      // For demo if no geolocation available
      setIsTracking(true);
    }
  };

  const endTrip = () => {
    setIsTracking(false);
    if (watchId.current && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId.current);
    }
    offlineQueue.current = [];
    setQueuedPoints(0);
    if (socket && socket.connected) {
      socket.emit("driver_end_trip", { bus_id: selectedBusId });
    }
  };

  if (!isLoggedIn) {
    return (
      <div className="home-screen bg-light" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '20px' }}>
        <div style={{ width: '100%', maxWidth: '400px', background: 'white', borderRadius: '12px', padding: '24px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <Key size={40} color="var(--teal-700)" style={{ marginBottom: '12px' }} />
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-main)' }}>Driver Login</h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '14px', marginTop: '8px' }}>Official Kadamba Transport Corporation access</p>
          </div>
          
          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>DRIVER ID</label>
              <input 
                type="text" 
                placeholder="e.g. KTC-DRV-1042"
                value={driverId}
                onChange={(e) => setDriverId(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '16px' }}
                required
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '12px', fontWeight: 'bold', color: 'var(--text-main)', marginBottom: '8px' }}>PIN / PASSWORD</label>
              <input 
                type="password" 
                placeholder="****"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                style={{ width: '100%', padding: '12px', borderRadius: '8px', border: '1px solid var(--border-color)', fontSize: '16px' }}
                required
              />
            </div>
            <button type="submit" className="btn-primary" style={{ marginTop: '8px', width: '100%' }}>Login</button>
          </form>
          
          <div style={{ marginTop: '24px', fontSize: '12px', color: 'var(--text-muted)', textAlign: 'center' }}>
            Internal management interface.<br/>For public transit tracking, please return to the passenger app.
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="home-screen bg-light">
      <div className="driver-content">
        
        <header className="driver-header">
          <div className="dh-left">
            <h1>Driver {driverId}</h1>
            <p>Goa Kadamba &middot; GPS tracking</p>
          </div>
          <HelpCircle size={24} color="var(--teal-700)" />
        </header>

        {!isTracking ? (
          <>
            {/* Ready to start Banner */}
            <div className="trip-inactive-banner">
              <div className="tib-top">
                <span className="tib-title">Ready to start</span>
                <span className="tib-status">NOT STARTED</span>
              </div>
              
              <div className="tib-middle">
                <div className="bus-badge">{activeRoute?.number}</div>
                <div className="tib-route">
                  <span className="tr-from">KADAMBA &middot; DEMO ROUTE</span>
                  <span className="tr-to">{activeRoute?.from} &rarr; {activeRoute?.to}</span>
                </div>
                <div style={{ position: 'relative' }}>
                  <select 
                    value={selectedBusId} 
                    onChange={(e) => setSelectedBusId(e.target.value)}
                    style={{ position: 'absolute', top: 0, left: '-100px', opacity: 0, width: '120px', height: '100%', cursor: 'pointer' }}
                  >
                    {AVAILABLE_ROUTES.map(r => (
                      <option key={r.id} value={r.id}>{r.number} - {r.from} to {r.to}</option>
                    ))}
                  </select>
                  <ChevronDown size={20} color="var(--text-light)" style={{ pointerEvents: 'none' }} />
                </div>
              </div>

              <div className="tib-bottom">
                <span className="teal-text fw-bold">Select or change route (Tap chevron)</span>
                <span className="gray-text">Next: {activeRoute?.next}</span>
              </div>
            </div>

            {/* Location Sharing Box (Inactive) */}
            <div className="loc-share-box inactive">
              <div className="lsb-header">
                <div className="lsb-h-icon">
                  <Radio size={24} color="var(--text-light)" />
                </div>
                <div className="lsb-h-text">
                  <h3>Location sharing is off</h3>
                  <p>No location is being sent</p>
                </div>
                <div className="off-pill">OFF</div>
              </div>

              <p className="lsb-desc">
                This phone is the bus GPS. Sharing begins when you start the trip and stops when you end it.
              </p>

              <div className="lsb-divider"></div>

              <div className="lsb-rows">
                <div className="lsb-row">
                  <div className="lsb-row-left">
                    <MapPin size={18} color="var(--text-light)" />
                    <span>GPS</span>
                  </div>
                  <div className="lsb-row-right teal">
                    <span className="dot teal"></span> Good &middot; &plusmn;8 m
                  </div>
                </div>
                <div className="lsb-row">
                  <div className="lsb-row-left">
                    <Wifi size={18} color="var(--text-light)" />
                    <span>Network</span>
                  </div>
                  <div className="lsb-row-right teal">
                    <span className="dot teal"></span> Connected
                  </div>
                </div>
              </div>

              <div className="lsb-divider"></div>

              <div className="lsb-footer">
                <span className="gray-text">Driver's smartphone GPS</span>
                <span className="gray-text">Battery 78%</span>
              </div>
            </div>

            {/* Warning Box */}
            <div className="driver-warning">
              <ShieldAlert size={20} color="var(--amber-700)" className="dw-icon" />
              <div className="dw-text">
                <strong>Start only when safely parked</strong>
                <p>Check your route before starting. Keep GPS, mobile data and your phone charged.</p>
              </div>
            </div>

            {/* Start Trip */}
            <button className="btn-primary w-full start-trip-btn" onClick={startTracking}>
              <Play size={18} /> START TRIP
            </button>
            
            <div className="driver-footer-note left-align">
              <p>Route locks after starting. Use controls only when safely parked.</p>
              <p>Demo data &middot; No official KTC integration</p>
            </div>
          </>
        ) : (
          <>
            {/* Active Trip Banner */}
            <div className="trip-active-banner">
              <div className="tab-top">
                <span className="tab-title">Trip in progress</span>
                <span className="tab-status"><span className="dot amber"></span> ACTIVE</span>
              </div>
              
              <div className="tab-middle">
                <div className="bus-badge dark-text">{activeRoute?.number}</div>
                <div className="tab-route">
                  <span className="tr-from">{activeRoute?.from}</span>
                  <span className="tr-to">&rarr; {activeRoute?.to}</span>
                </div>
              </div>

              <div className="tab-bottom">
                <span>Driver's phone is GPS</span>
                <span>Started tracking</span>
              </div>
            </div>

            {/* Location Sharing Box */}
            <div className="loc-share-box">
              <div className="lsb-header">
                <Radio size={24} color="var(--teal-700)" />
                <div className="lsb-h-text">
                  <h3>Location sharing is on</h3>
                  <p>Passengers can track this bus</p>
                </div>
              </div>

              <p className="lsb-desc">
                This phone is the bus GPS. Location is shared only while this trip is active.
              </p>

              <div className="lsb-divider"></div>

              <div className="lsb-stats">
                <div className="lsb-stat-col">
                  <span className="stat-label">LAST SENT</span>
                  <span className="stat-value">{lastSent} sec ago</span>
                </div>
                <div className="lsb-stat-col text-right">
                  <span className="stat-label">GPS ACCURACY</span>
                  <span className="stat-value teal">Good &middot; &plusmn;{Math.round(Math.min(activeRoute?.accuracy || 8, 40))} m</span>
                </div>
              </div>

              <div className="lsb-divider"></div>

              <div className="lsb-footer">
                <span className="teal-text">Network &middot; Connected</span>
                <span className="gray-text">Battery 78%</span>
              </div>
            </div>

            {/* Timeline */}
            <div className="driver-timeline">
              <div className="dt-row past">
                <div className="dt-icon"><span className="dot gray"></span></div>
                <div className="dt-text">Left {activeRoute?.from}</div>
              </div>
              
              <div className="dt-connector"></div>

              <div className="dt-row current">
                <div className="dt-icon"><MapPin size={20} color="var(--teal-700)" /></div>
                <div className="dt-info">
                  <span className="dt-label">NEXT STOP</span>
                  <h4>{activeRoute?.next}</h4>
                </div>
              </div>
            </div>

            {/* Warning Box */}
            <div className="driver-warning">
              <ShieldAlert size={20} color="var(--amber-700)" className="dw-icon" />
              <div className="dw-text">
                <strong>Keep GPS and mobile data on</strong>
                <p>Keep your phone charged. Use controls only when safely parked.</p>
              </div>
            </div>

            {/* End Trip */}
            <button className="end-trip-btn" onClick={endTrip}>
              <Square size={16} /> END TRIP
            </button>
            
            <p className="driver-footer-note">Route locked during trip &middot; Demo data</p>
          </>
        )}
      </div>
    </div>
  );
}

