import { Link } from "react-router-dom";
import { Map, Smartphone, Clock, Bus, ArrowRight, ShieldCheck, Zap } from "lucide-react";
import "./Landing.css"; // We'll create this

export default function Landing() {
  return (
    <div className="landing-wrapper">
      <header className="landing-header">
        <div className="lh-container">
          <div className="lh-brand">
            <div className="lh-logo">
              <Bus size={24} color="white" />
            </div>
            <h2>BusMitra</h2>
          </div>
          <nav className="lh-nav">
            <Link to="/passenger" className="lh-link">Passenger Tracking</Link>
            <Link to="/login" className="lh-btn">Sign In / Login</Link>
          </nav>
        </div>
      </header>

      <main className="landing-main-content">
        {/* Hero Section */}
        <section className="hero-section">
          <div className="hero-container">
            <div className="hero-text">
              <div className="hero-badge">Goa's Premier Bus Tracking</div>
              <h1 className="hero-title">Know your bus.<br/>Know your time.</h1>
              <p className="hero-subtitle">
                Real-time GPS tracking for KTCL buses. Stop waiting blindly. Get accurate ETAs, live maps, and route details instantly on your phone.
              </p>
              <div className="hero-actions">
                <Link to="/passenger" className="hero-btn-primary">
                  Start Tracking <ArrowRight size={20} />
                </Link>
                <Link to="/login" className="hero-btn-secondary">
                  Login / Staff Portal
                </Link>
              </div>
            </div>
            <div className="hero-image-placeholder">
              {/* Abstract decorative element for the hero */}
              <div className="hero-graphic">
                <div className="hg-bus"><Bus size={64} color="var(--teal-600)" /></div>
                <div className="hg-pulse"></div>
              </div>
            </div>
          </div>
        </section>

        {/* How it Works Section */}
        <section className="features-section">
          <div className="features-container">
            <div className="section-header">
              <h2>How BusMitra Works</h2>
              <p>An integrated ecosystem designed for passengers, drivers, and administrators.</p>
            </div>
            
            <div className="features-grid">
              <div className="feature-card">
                <div className="fc-icon"><Smartphone size={28} /></div>
                <h3>1. Driver Broadcasts</h3>
                <p>Drivers use their smartphones to transmit a live GPS signal seamlessly. No expensive custom hardware required on buses.</p>
              </div>
              <div className="feature-card">
                <div className="fc-icon"><Map size={28} /></div>
                <h3>2. Intelligent Map Matching</h3>
                <p>Our backend snaps raw GPS coordinates accurately to road networks and established KTCL bus routes in real-time.</p>
              </div>
              <div className="feature-card">
                <div className="fc-icon"><Clock size={28} /></div>
                <h3>3. Accurate Predictions</h3>
                <p>Passengers see exactly where the bus is and when it will reach their specific stop, right down to the minute.</p>
              </div>
            </div>
          </div>
        </section>

        {/* Benefits Section */}
        <section className="benefits-section">
          <div className="benefits-container">
            <div className="benefit-item">
              <Zap size={32} color="var(--amber-500)" />
              <div>
                <h4>Lightning Fast</h4>
                <p>Updates location every 5 seconds for pinpoint accuracy.</p>
              </div>
            </div>
            <div className="benefit-item">
              <ShieldCheck size={32} color="var(--teal-500)" />
              <div>
                <h4>Official KTCL Data</h4>
                <p>Synced with official Kadamba routes and schedules.</p>
              </div>
            </div>
          </div>
        </section>
      </main>

      <footer className="landing-footer">
        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-logo">
              <Bus size={20} color="white" />
              <span>BusMitra</span>
            </div>
            <p>Smart Public Transport for Goa.</p>
          </div>
          <div className="footer-links">
            <div className="fl-col">
              <h4>Portals</h4>
              <Link to="/passenger">Passenger App</Link>
              <Link to="/login">Staff Login</Link>
            </div>
            <div className="fl-col">
              <h4>Legal</h4>
              <a href="#">Privacy Policy</a>
              <a href="#">Terms of Service</a>
            </div>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} BusMitra (Demo). All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
}
