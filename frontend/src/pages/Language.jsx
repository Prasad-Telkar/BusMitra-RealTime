import { ArrowLeft, CheckCircle2, Circle } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";

export default function Language() {
  const navigate = useNavigate();

  return (
    <div className="home-screen">
      <header className="page-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          <ArrowLeft size={24} />
        </button>
        <div className="ph-title">
          <h1>Language</h1>
          <p>BusMitra &middot; Goa</p>
        </div>
      </header>

      <div className="content-pad">
        <h2 className="section-title" style={{ fontSize: '20px', marginBottom: '8px' }}>Choose your language</h2>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '24px', lineHeight: '1.5' }}>
          Select the language you prefer for bus information and travel updates.
        </p>

        <div className="language-options" style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px' }}>
          {/* Selected Option */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--teal-600)', borderRadius: '8px', backgroundColor: '#F0FDF4' }}>
            <span style={{ fontSize: '15px', fontWeight: '700', color: 'var(--text-main)' }}>English</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '12px', color: 'var(--teal-700)' }}>Selected</span>
              <CheckCircle2 size={20} color="var(--teal-700)" />
            </div>
          </div>

          {/* Unselected Options */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#fff' }}>
            <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-main)' }}>Hindi</span>
            <Circle size={20} color="var(--border-color)" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#fff' }}>
            <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-main)' }}>Marathi</span>
            <Circle size={20} color="var(--border-color)" />
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '16px', border: '1px solid var(--border-color)', borderRadius: '8px', backgroundColor: '#fff' }}>
            <span style={{ fontSize: '15px', fontWeight: '500', color: 'var(--text-main)' }}>Konkani</span>
            <Circle size={20} color="var(--border-color)" />
          </div>
        </div>

        <button className="btn-primary" style={{ width: '100%', marginBottom: '24px' }}>
          Apply language
        </button>

        <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: '1.5', marginBottom: '24px' }}>
          English is currently selected. This demo shows language choices; localization is not implemented.
        </p>

        <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
          Demo data - No official KTC integration
        </p>
      </div>

      <nav className="bottom-nav">
        <Link to="/" className="nav-item">
          <div className="nav-icon-placeholder"></div>
          Nearby
        </Link>
        <Link to="/routes" className="nav-item">
          <div className="nav-icon-placeholder"></div>
          Routes
        </Link>
        <Link to="/saved" className="nav-item">
          <div className="nav-icon-placeholder"></div>
          Saved
        </Link>
      </nav>
    </div>
  );
}
