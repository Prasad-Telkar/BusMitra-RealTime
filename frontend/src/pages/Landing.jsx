import { Link } from "react-router-dom";
import { Navigation, Map, Smartphone, Clock } from "lucide-react";

export default function Landing() {
  return (
    <div className="landing-screen">
      <header className="landing-topbar">
        <h1 className="brand-text">
          <Navigation size={24} color="var(--teal-800)" />
          BusMitra
        </h1>
      </header>
      
      <main className="landing-main">
        <h2 className="hero-title">Know your bus.<br/>Know your time.</h2>
        <p className="hero-subtitle">
          Real-time GPS tracking for Goa's KTC buses. No more waiting blindly at the bus stop.
        </p>
        
        <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link to="/passenger" className="cta-btn">
            Track a Bus <Map size={20} />
          </Link>
          <Link to="/driver" className="cta-btn" style={{ background: 'var(--surface-color)', color: 'var(--teal-800)' }}>
            Driver Login
          </Link>
          <Link to="/admin" className="cta-btn" style={{ background: 'var(--surface-color)', color: 'var(--teal-800)' }}>
            Admin Dashboard
          </Link>
        </div>

        <section className="how-it-works">
          <h2>How it works</h2>
          <div className="steps">
            <div className="step">
              <div className="step-number"><Smartphone size={24} /></div>
              <h3>1. Driver Starts Trip</h3>
              <p>The driver uses their own smartphone to broadcast a live GPS signal. No special hardware required.</p>
            </div>
            <div className="step">
              <div className="step-number"><Map size={24} /></div>
              <h3>2. Live Map Matching</h3>
              <p>Our server maps the raw GPS coordinates to the actual bus route and calculates distance.</p>
            </div>
            <div className="step">
              <div className="step-number"><Clock size={24} /></div>
              <h3>3. Accurate ETA</h3>
              <p>You see exactly where the bus is on the map and when it will reach your stop in minutes.</p>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
