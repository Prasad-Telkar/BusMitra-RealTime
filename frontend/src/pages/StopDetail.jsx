import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Bookmark, Bus, Navigation, Loader2 } from "lucide-react";
import io from "socket.io-client";
import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

// Fix Leaflet default marker icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png",
  iconUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png",
  shadowUrl: "https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png",
});

const API_BASE = import.meta.env.VITE_API_BASE || "https://busmitra-goa.onrender.com";

export default function StopDetail() {
  const { stopId } = useParams();
  const navigate = useNavigate();
  const [stopDetails, setStopDetails] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [routes, setRoutes] = useState([]);
  const [liveBuses, setLiveBuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    fetchStopDetails();
    fetchSchedules();
    fetchRoutes();
    fetchLiveBuses();

    const socket = io(API_BASE);
    const interval = setInterval(fetchLiveBuses, 5000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [stopId]);

  useEffect(() => {
    if (stopDetails) {
      const saved = JSON.parse(localStorage.getItem('busmitra_saved_stops') || '[]');
      setIsSaved(saved.some(s => (s.stopId || s._id) === (stopDetails.stopId || stopDetails._id)));
    }
  }, [stopDetails]);

  const toggleSave = () => {
    if (!stopDetails) return;
    const saved = JSON.parse(localStorage.getItem('busmitra_saved_stops') || '[]');
    const id = stopDetails.stopId || stopDetails._id;
    if (isSaved) {
      const newSaved = saved.filter(s => (s.stopId || s._id) !== id);
      localStorage.setItem('busmitra_saved_stops', JSON.stringify(newSaved));
      setIsSaved(false);
    } else {
      saved.push(stopDetails);
      localStorage.setItem('busmitra_saved_stops', JSON.stringify(saved));
      setIsSaved(true);
    }
  };

  const fetchStopDetails = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/search/stops?q=`);
      if (res.ok) {
        const data = await res.json();
        const stop = data.find(s => s.stopId === stopId || s._id === stopId);
        if (stop) setStopDetails(stop);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchSchedules = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stops/${stopId}/schedules`);
      if (res.ok) {
        const data = await res.json();
        setSchedules(data.services || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoutes = async () => {
    try {
      const res = await fetch(`${API_BASE}/api/stops/${stopId}/routes`);
      if (res.ok) {
        const data = await res.json();
        setRoutes(data);
      }
    } catch (err) {
      console.error(err);
    }
  };

  const fetchLiveBuses = async () => {
    // For now no live buses mock
    setLiveBuses([]);
  };

  return (
    <div className="home-screen" style={{ backgroundColor: '#F8FAFC', paddingBottom: '80px' }}>
      <header className="track-header" style={{ background: 'var(--teal-800)', color: 'white', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="icon-btn" onClick={() => navigate(-1)} style={{ color: 'white', background: 'transparent', padding: 0 }}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{stopDetails ? stopDetails.name : "Loading Stop..."}</h1>
        </div>
        {stopDetails && (
          <button 
            onClick={toggleSave}
            style={{ 
              background: isSaved ? 'white' : 'transparent', 
              color: isSaved ? 'var(--teal-800)' : 'white',
              border: '1px solid white',
              padding: '6px 12px',
              borderRadius: '20px',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              cursor: 'pointer'
            }}
          >
            <Bookmark size={14} fill={isSaved ? "currentColor" : "none"} />
            {isSaved ? "Saved" : "Save Stop"}
          </button>
        )}
      </header>

      <div className="home-content" style={{ padding: '20px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 className="spinner" size={32} color="var(--teal-600)" />
          </div>
        ) : (
          <>
            {/* MAP SECTION */}
            {stopDetails && stopDetails.latitude && stopDetails.longitude && (
              <div style={{ marginBottom: '24px', borderRadius: '12px', overflow: 'hidden', height: '200px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <MapContainer 
                  center={[stopDetails.latitude, stopDetails.longitude]} 
                  zoom={15} 
                  style={{ height: '100%', width: '100%', zIndex: 0 }}
                  zoomControl={false}
                >
                  <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />
                  <Marker position={[stopDetails.latitude, stopDetails.longitude]}>
                    <Popup>{stopDetails.name}</Popup>
                  </Marker>
                </MapContainer>
              </div>
            )}

            {/* LIVE ARRIVALS SECTION */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--red-500)' }}></div>
                <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)' }}>Live Arrivals</h3>
              </div>
              
              {liveBuses.length === 0 ? (
                <div style={{ background: 'white', padding: '16px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>Live tracking unavailable</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {liveBuses.map((bus, idx) => (
                    <div key={idx} style={{ background: 'white', borderRadius: '12px', padding: '16px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                        <div>
                          <div style={{ fontSize: '12px', color: 'var(--red-600)', fontWeight: 'bold', marginBottom: '4px' }}>LIVE • ETA {bus.eta} min</div>
                          <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>Route {bus.routeName}</h4>
                          <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>To: {bus.destination}</p>
                          <p style={{ margin: '4px 0 0 0', fontSize: '12px', color: 'var(--text-muted)' }}>Bus: {bus.busNumber}</p>
                        </div>
                      </div>
                      <button 
                        onClick={() => navigate(`/track/${bus.busId}`)}
                        style={{ width: '100%', padding: '10px', background: 'var(--teal-50)', color: 'var(--teal-700)', border: 'none', borderRadius: '8px', fontWeight: '600', cursor: 'pointer' }}
                      >
                        Track Bus
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* SCHEDULED SERVICES SECTION */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Clock size={18} color="var(--text-muted)" />
                <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)' }}>Scheduled Services</h3>
              </div>
              
              {schedules.length === 0 ? (
                <div style={{ background: 'white', padding: '16px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>No scheduled services found</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {schedules.map((trip, idx) => (
                    <div key={idx} style={{ background: 'white', borderRadius: '12px', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                      <div>
                        <h4 style={{ margin: '0 0 4px 0', fontSize: '15px' }}>Route {trip.routeName}</h4>
                        <p style={{ margin: 0, fontSize: '14px', color: 'var(--text-muted)' }}>To: {trip.headsign}</p>
                      </div>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontSize: '15px', fontWeight: '600', color: 'var(--text-main)', marginBottom: '4px' }}>{trip.arrivalTime || "Scheduled"}</div>
                        <div style={{ fontSize: '10px', background: '#F1F5F9', color: 'var(--text-muted)', padding: '2px 6px', borderRadius: '4px', display: 'inline-block', fontWeight: 'bold' }}>SCHEDULED</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ROUTES SERVING THIS STOP SECTION */}
            <div style={{ marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px' }}>
                <Bus size={18} color="var(--text-muted)" />
                <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)' }}>Routes Serving This Stop</h3>
              </div>
              
              {routes.length === 0 ? (
                <div style={{ background: 'white', padding: '16px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '14px' }}>No routes found</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {routes.map((route, idx) => (
                    <div key={idx} style={{ background: 'white', borderRadius: '8px', padding: '12px', display: 'flex', gap: '12px', alignItems: 'center', border: '1px solid #F1F5F9' }}>
                      <div style={{ background: 'var(--teal-100)', color: 'var(--teal-800)', padding: '4px 8px', borderRadius: '4px', fontSize: '13px', fontWeight: 'bold' }}>
                        {route.shortName || route.routeName || "Route"}
                      </div>
                      <div style={{ flex: 1, fontSize: '14px', color: 'var(--text-main)' }}>
                        {route.longName || route.routeName || "Unknown Route"}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* NAVIGATE HERE BUTTON */}
            {stopDetails && (
              <div style={{ marginTop: '32px' }}>
                <button
                  onClick={() => navigate(`/journey-planner?to=${encodeURIComponent(stopDetails.name)}&toId=${stopDetails.stopId || stopDetails._id}`)}
                  style={{
                    width: '100%',
                    padding: '16px',
                    background: 'var(--teal-600)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '12px',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center',
                    gap: '8px',
                    fontSize: '16px',
                    fontWeight: '600',
                    cursor: 'pointer',
                    boxShadow: '0 4px 12px rgba(13, 148, 136, 0.2)'
                  }}
                >
                  <Navigation size={20} /> Navigate Here
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
