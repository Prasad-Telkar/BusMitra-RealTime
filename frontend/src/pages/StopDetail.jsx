import { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { ArrowLeft, MapPin, Clock, Info, Bus, RefreshCw, AlertTriangle, Loader2 } from "lucide-react";
import io from "socket.io-client";

const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:5001";

export default function StopDetail() {
  const { stopId } = useParams();
  const navigate = useNavigate();
  const [stopDetails, setStopDetails] = useState(null);
  const [schedules, setSchedules] = useState([]);
  const [liveBuses, setLiveBuses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchStopDetails();
    fetchSchedules();
    fetchLiveBuses();

    const socket = io(API_BASE);
    
    // Polling is fine for a demo, a real app would use WS
    const interval = setInterval(fetchLiveBuses, 5000);

    return () => {
      socket.disconnect();
      clearInterval(interval);
    };
  }, [stopId]);

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

  const fetchLiveBuses = async () => {
    // For now we just mock or leave it
  };

  // Group schedules by route
  const groupedSchedules = schedules.reduce((acc, curr) => {
    if (!acc[curr.routeName]) {
      acc[curr.routeName] = [];
    }
    acc[curr.routeName].push(curr);
    return acc;
  }, {});

  return (
    <div className="home-screen" style={{ backgroundColor: '#F8FAFC' }}>
      <header className="track-header" style={{ background: 'var(--teal-800)', color: 'white', padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <button className="icon-btn" onClick={() => navigate(-1)} style={{ color: 'white', background: 'transparent', padding: 0 }}>
          <ArrowLeft size={24} />
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ margin: 0, fontSize: '18px', fontWeight: '600' }}>{stopDetails ? stopDetails.name : "Loading Stop..."}</h1>
          <p style={{ margin: '4px 0 0 0', fontSize: '13px', opacity: 0.9 }}>KTCL Bus Stop</p>
        </div>
      </header>

      <div className="home-content" style={{ padding: '20px' }}>
        {isLoading ? (
          <div style={{ display: 'flex', justifyContent: 'center', padding: '40px' }}>
            <Loader2 className="spinner" size={32} color="var(--teal-600)" />
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <h3 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)' }}>Upcoming Buses</h3>
            </div>

            {Object.keys(groupedSchedules).length === 0 ? (
              <div style={{ background: 'white', padding: '24px', borderRadius: '12px', textAlign: 'center', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                <Clock size={32} color="var(--text-muted)" style={{ margin: '0 auto 12px auto' }} />
                <h4 style={{ margin: '0 0 8px 0' }}>No schedules found</h4>
                <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '13px' }}>There are no bus schedules available for this stop at this time.</p>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {Object.entries(groupedSchedules).map(([routeName, trips]) => (
                  <div key={routeName} style={{ background: 'white', borderRadius: '12px', overflow: 'hidden', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }}>
                    <div style={{ padding: '16px', borderBottom: '1px solid #F1F5F9', display: 'flex', gap: '12px', alignItems: 'center' }}>
                      <div style={{ background: 'var(--teal-50)', color: 'var(--teal-800)', padding: '6px 12px', borderRadius: '6px', fontWeight: 'bold' }}>
                        {routeName}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: 0, fontSize: '15px' }}>{trips[0].headsign}</h4>
                      </div>
                    </div>
                    
                    <div style={{ padding: '0 16px' }}>
                      {trips.slice(0, 3).map((trip, idx) => (
                        <div key={idx} style={{ padding: '12px 0', borderBottom: idx !== trips.slice(0, 3).length - 1 ? '1px solid #F1F5F9' : 'none', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <Clock size={16} color="var(--text-muted)" />
                            <span style={{ fontSize: '14px', color: 'var(--text-main)', fontWeight: '500' }}>
                              {trip.arrivalTime || "Scheduled"}
                            </span>
                          </div>
                          <span style={{ fontSize: '12px', color: 'var(--text-muted)', background: '#F1F5F9', padding: '4px 8px', borderRadius: '4px' }}>
                            {trip.serviceId}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
