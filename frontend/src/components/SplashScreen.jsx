import { useState, useEffect } from "react";
import { Bus, CheckCircle2 } from "lucide-react";
import { API_BASE } from "../lib/api";
import "./SplashScreen.css";

export default function SplashScreen({ onComplete }) {
  // Check if splash has already been shown this session, unless forced via URL (?splash=1)
  const isForced = typeof window !== "undefined" && (
    window.location.search.includes("splash=1") || 
    window.location.search.includes("splash=true")
  );

  const alreadySeen = typeof window !== "undefined" && 
    sessionStorage.getItem("busmitra_splash_seen") === "true";

  // If already seen and not forced, we don't render
  const [isVisible, setIsVisible] = useState(!alreadySeen || isForced);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [progress, setProgress] = useState(25);
  const [statusText, setStatusText] = useState("Initializing Goa Transit Network...");

  useEffect(() => {
    if (!isVisible) return;

    let isMounted = true;
    const startTime = Date.now();
    const MIN_SPLASH_TIME = 1900; // Natural duration so the user sees the bus animation without long lag

    // Perform genuine initial app readiness checks
    const initializeApp = async () => {
      try {
        // Step 1: Advance progress
        if (isMounted) {
          setProgress(45);
          setStatusText("Checking routes & live fleet status...");
        }

        // Step 2: Genuine network ping to API with a graceful fast timeout
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 2000);

        try {
          await fetch(`${API_BASE}/api/stops?limit=1`, { 
            signal: controller.signal 
          }).catch(() => null);
        } catch {
          // Fallback gracefully if offline
        } finally {
          clearTimeout(timeoutId);
        }

        if (isMounted) {
          setProgress(85);
          setStatusText("Connecting to Kadamba live GPS...");
        }

        // Step 3: Ensure minimum display time for smooth visual experience
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, MIN_SPLASH_TIME - elapsed);

        setTimeout(() => {
          if (!isMounted) return;
          setProgress(100);
          setStatusText("Ready! Welcome aboard BusMitra");

          // Start fade out transition
          setTimeout(() => {
            if (!isMounted) return;
            setIsFadingOut(true);

            setTimeout(() => {
              if (!isMounted) return;
              sessionStorage.setItem("busmitra_splash_seen", "true");
              setIsVisible(false);
              if (onComplete) onComplete();
            }, 450); // Matches CSS transition duration
          }, 250);
        }, remaining);

      } catch (err) {
        console.warn("Splash init error:", err);
        if (isMounted) {
          setIsFadingOut(true);
          setTimeout(() => {
            setIsVisible(false);
            if (onComplete) onComplete();
          }, 300);
        }
      }
    };

    initializeApp();

    return () => {
      isMounted = false;
    };
  }, [isVisible, onComplete]);

  // Accessibility & testing quick dismiss
  const handleSkip = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      sessionStorage.setItem("busmitra_splash_seen", "true");
      setIsVisible(false);
      if (onComplete) onComplete();
    }, 200);
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      className={`splash-overlay ${isFadingOut ? "fade-out" : ""}`}
      role="status"
      aria-label="BusMitra Loading Screen"
      aria-live="polite"
    >
      {/* Top Branding */}
      <div className="splash-brand-header">
        <div className="splash-brand-badge">
          <span className="splash-pulse-dot" aria-hidden="true" />
          <span className="splash-badge-text">Goa Public Transport Platform</span>
        </div>
        <div className="splash-title-wrap">
          <div className="splash-logo-box" aria-hidden="true">
            <Bus size={26} strokeWidth={2.4} />
          </div>
          <div>
            <h1 className="splash-app-title">
              Bus<span className="splash-title-highlight">Mitra</span>
            </h1>
            <div className="splash-title-sub">Kadamba Transport Tracking</div>
          </div>
        </div>
      </div>

      {/* Center Stage: Illustrated Goa Bus & Road Animation */}
      <div className="splash-stage-wrapper">
        <div className="splash-scene-container">
          <div className="splash-sun-glow" aria-hidden="true" />

          {/* Drifting Clouds */}
          <svg className="splash-cloud splash-cloud-1" viewBox="0 0 64 32" aria-hidden="true">
            <path d="M10 24 A10 10 0 0 1 24 14 A14 14 0 0 1 44 14 A10 10 0 0 1 54 24 Z" />
          </svg>
          <svg className="splash-cloud splash-cloud-2" viewBox="0 0 64 32" aria-hidden="true">
            <path d="M8 24 A8 8 0 0 1 20 16 A12 12 0 0 1 38 16 A8 8 0 0 1 48 24 Z" />
          </svg>

          {/* Main Vector Transit Scene */}
          <svg
            className="splash-svg-scene"
            viewBox="0 0 460 210"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            role="img"
            aria-label="Goa public bus traveling on coastal road"
          >
            <defs>
              {/* Gradients */}
              <linearGradient id="busBodyGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0F766E" />
                <stop offset="55%" stopColor="#0D9488" />
                <stop offset="100%" stopColor="#14B8A6" />
              </linearGradient>
              <linearGradient id="busWhitePanel" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#F8FAFC" />
                <stop offset="100%" stopColor="#FFFFFF" />
              </linearGradient>
              <linearGradient id="glassGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#38BDF8" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#0369A1" stopOpacity="0.9" />
              </linearGradient>
              <linearGradient id="roadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>
              <linearGradient id="headlightBeam" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#FEF08A" stopOpacity="0.45" />
                <stop offset="100%" stopColor="#FEF08A" stopOpacity="0" />
              </linearGradient>
              <filter id="busShadow" x="-10%" y="-10%" width="120%" height="140%">
                <feDropShadow dx="0" dy="8" stdDeviation="6" floodColor="#0F172A" floodOpacity="0.25" />
              </filter>
            </defs>

            {/* Goa Palm Trees Backdrop */}
            <g opacity="0.4" fill="#0D9488">
              {/* Palm Tree Left */}
              <path d="M42 165 Q48 115 54 80 Q56 75 58 80 Q64 120 66 165 Z" fill="#0F766E" />
              <path d="M56 80 Q30 75 18 90 Q34 85 56 82 Z" />
              <path d="M56 80 Q40 60 30 52 Q44 65 56 80 Z" />
              <path d="M56 80 Q62 55 76 50 Q66 68 56 80 Z" />
              <path d="M56 80 Q78 68 92 78 Q74 82 56 82 Z" />

              {/* Palm Tree Right */}
              <path d="M410 165 Q406 120 400 85 Q398 80 402 85 Q412 125 418 165 Z" fill="#0F766E" />
              <path d="M400 85 Q375 72 360 82 Q380 80 400 85 Z" />
              <path d="M400 85 Q388 62 375 55 Q392 68 400 85 Z" />
              <path d="M400 85 Q412 58 426 55 Q416 70 400 85 Z" />
              <path d="M400 85 Q425 76 438 88 Q418 88 400 87 Z" />
            </g>

            {/* Speed Wind Streaks */}
            <line x1="20" y1="112" x2="105" y2="112" stroke="#38BDF8" strokeWidth="2" strokeLinecap="round" className="speed-line" />
            <line x1="35" y1="126" x2="120" y2="126" stroke="#10B981" strokeWidth="1.5" strokeLinecap="round" className="speed-line" />
            <line x1="15" y1="140" x2="95" y2="140" stroke="#CBD5E1" strokeWidth="2" strokeLinecap="round" className="speed-line" />

            {/* Road Surface */}
            <rect x="0" y="165" width="460" height="45" fill="url(#roadGrad)" />
            {/* Road Curb Line */}
            <line x1="0" y1="165" x2="460" y2="165" stroke="#64748B" strokeWidth="3" />
            {/* Animated Road Dashed Center Divider */}
            <line 
              x1="-40" 
              y1="187" 
              x2="500" 
              y2="187" 
              stroke="#F59E0B" 
              strokeWidth="4" 
              strokeLinecap="round" 
              className="road-dashes" 
            />

            {/* Roadside Milestone Marker: GOA NH-66 */}
            <g transform="translate(424, 142)">
              <rect x="0" y="6" width="22" height="20" rx="3" fill="#FFFFFF" stroke="#94A3B8" strokeWidth="1" />
              <path d="M0 6 Q11 -3 22 6 Z" fill="#10B981" />
              <text x="11" y="14" fill="#0F172A" fontSize="6" fontWeight="bold" textAnchor="middle">GOA</text>
              <text x="11" y="21" fill="#0369A1" fontSize="5" fontWeight="bold" textAnchor="middle">NH66</text>
            </g>

            {/* Headlight Beam Cone illuminating forward */}
            <polygon points="345,138 455,145 455,178 345,152" fill="url(#headlightBeam)" />

            {/* THE GOA BUS (CHASSIS GROUP WITH SUSPENSION BOUNCE) */}
            <g className="bus-chassis-group" filter="url(#busShadow)">
              {/* Bus Ground Shadow */}
              <ellipse cx="230" cy="168" rx="125" ry="7" fill="#0F172A" opacity="0.4" />

              {/* Main Bus Shell */}
              <path
                d="M125 146
                   L125 94
                   Q127 75 148 74
                   L315 74
                   Q342 75 348 95
                   L352 135
                   Q352 150 338 152
                   L138 152
                   Q125 152 125 146 Z"
                fill="url(#busBodyGrad)"
              />

              {/* Pearl White Lower Body Accent Band */}
              <path
                d="M125 128
                   L350 128
                   Q352 142 342 148
                   L134 148
                   Q125 148 125 138 Z"
                fill="url(#busWhitePanel)"
              />

              {/* Kadamba Golden Orange Speed Stripe */}
              <rect x="125" y="125" width="225" height="4" fill="#F59E0B" rx="1" />

              {/* Front Aerodynamic Windshield */}
              <path
                d="M304 80
                   L336 82
                   Q346 87 347 106
                   L347 122
                   L304 122 Z"
                fill="url(#glassGrad)"
                stroke="#0F172A"
                strokeWidth="1.5"
              />

              {/* Driver Silhouette & Steering angle */}
              <circle cx="330" cy="100" r="5" fill="#0F172A" opacity="0.65" />
              <path d="M324 114 Q329 107 336 114" stroke="#0F172A" strokeWidth="2.5" fill="none" opacity="0.65" />
              <line x1="337" y1="112" x2="343" y2="108" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.7" />

              {/* Passenger Windows (Side) */}
              <rect x="256" y="82" width="42" height="38" rx="4" fill="url(#glassGrad)" stroke="#0F172A" strokeWidth="1.2" />
              <rect x="208" y="82" width="42" height="38" rx="4" fill="url(#glassGrad)" stroke="#0F172A" strokeWidth="1.2" />
              <rect x="160" y="82" width="42" height="38" rx="4" fill="url(#glassGrad)" stroke="#0F172A" strokeWidth="1.2" />

              {/* Passenger Window Silhouettes */}
              <circle cx="277" cy="98" r="4.5" fill="#0F172A" opacity="0.5" />
              <circle cx="229" cy="98" r="4.5" fill="#0F172A" opacity="0.5" />
              <circle cx="181" cy="98" r="4.5" fill="#0F172A" opacity="0.5" />

              {/* Glass Diagonal Reflections */}
              <line x1="164" y1="116" x2="194" y2="86" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
              <line x1="212" y1="116" x2="242" y2="86" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
              <line x1="260" y1="116" x2="290" y2="86" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.55" />
              <line x1="310" y1="118" x2="340" y2="88" stroke="#FFFFFF" strokeWidth="2.5" strokeLinecap="round" opacity="0.55" />

              {/* LED Electronic Route Destination Board */}
              <rect x="250" y="76" width="90" height="7" rx="2" fill="#090D16" />
              <text x="295" y="82" fill="#F59E0B" fontSize="4.5" fontWeight="bold" letterSpacing="0.4" textAnchor="middle">
                PANAJI ⇄ MARGAO • EXP
              </text>

              {/* Front Bus Door Line */}
              <line x1="302" y1="123" x2="302" y2="151" stroke="#0F766E" strokeWidth="1.5" />

              {/* Side Branding Typography: BusMitra KTCL */}
              <text x="195" y="141" fill="#0F766E" fontSize="9" fontWeight="800" letterSpacing="-0.2">
                Bus<tspan fill="#0284C7">Mitra</tspan>
              </text>
              <text x="250" y="141" fill="#64748B" fontSize="6.5" fontWeight="700">
                KTCL GOA
              </text>

              {/* Front Headlight (Bright Projector) */}
              <rect x="348" y="138" width="5" height="8" rx="2" fill="#FEF08A" stroke="#CA8A04" strokeWidth="1" />
              {/* Rear Tail Light */}
              <rect x="123" y="136" width="3" height="10" rx="1.5" fill="#EF4444" />

              {/* Front Bumper & Air Grill */}
              <rect x="346" y="147" width="7" height="4" rx="1.5" fill="#334155" />
              <rect x="330" y="148" width="14" height="2" rx="1" fill="#0F172A" />

              {/* Side Mirror */}
              <path d="M344 100 L355 98 L355 106 Z" fill="#0F172A" />

              {/* Wheel Arches (Fenders) */}
              <path d="M152 153 A17 17 0 0 1 188 153 Z" fill="#0F172A" />
              <path d="M292 153 A17 17 0 0 1 328 153 Z" fill="#0F172A" />

              {/* FRONT WHEEL */}
              <g className="bus-wheel-front" transform="translate(310, 153)">
                {/* Tire Outer Rubber */}
                <circle cx="0" cy="0" r="15" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
                {/* Silver Alloy Rim */}
                <circle cx="0" cy="0" r="9.5" fill="#CBD5E1" stroke="#64748B" strokeWidth="1" />
                {/* Hub & Spokes */}
                <circle cx="0" cy="0" r="4.5" fill="#0D9488" />
                <circle cx="0" cy="0" r="2" fill="#FFFFFF" />
                <line x1="-8" y1="0" x2="8" y2="0" stroke="#475569" strokeWidth="1.5" />
                <line x1="0" y1="-8" x2="0" y2="8" stroke="#475569" strokeWidth="1.5" />
              </g>

              {/* REAR WHEEL */}
              <g className="bus-wheel-rear" transform="translate(170, 153)">
                {/* Tire Outer Rubber */}
                <circle cx="0" cy="0" r="15" fill="#1E293B" stroke="#0F172A" strokeWidth="2" />
                {/* Silver Alloy Rim */}
                <circle cx="0" cy="0" r="9.5" fill="#CBD5E1" stroke="#64748B" strokeWidth="1" />
                {/* Hub & Spokes */}
                <circle cx="0" cy="0" r="4.5" fill="#0D9488" />
                <circle cx="0" cy="0" r="2" fill="#FFFFFF" />
                <line x1="-8" y1="0" x2="8" y2="0" stroke="#475569" strokeWidth="1.5" />
                <line x1="0" y1="-8" x2="0" y2="8" stroke="#475569" strokeWidth="1.5" />
              </g>
            </g>
          </svg>
        </div>
      </div>

      {/* Bottom Tagline & Progress Indicator */}
      <div className="splash-bottom-container">
        <h2 className="splash-tagline">
          Know your bus. <span className="splash-tagline-highlight">Know your time.</span>
        </h2>

        {/* Progress Bar */}
        <div 
          className="splash-progress-track"
          role="progressbar" 
          aria-valuenow={progress} 
          aria-valuemin="0" 
          aria-valuemax="100"
        >
          <div className="splash-progress-bar" style={{ width: `${progress}%` }} />
        </div>

        <div className="splash-status-text">
          {progress === 100 ? (
            <CheckCircle2 size={16} color="#10B981" />
          ) : (
            <span className="splash-pulse-dot" style={{ width: 6, height: 6 }} aria-hidden="true" />
          )}
          <span>{statusText}</span>
        </div>

        {/* Skip button for immediate navigation */}
        <button 
          type="button" 
          className="splash-skip-btn" 
          onClick={handleSkip}
          aria-label="Skip splash screen"
        >
          Skip Intro →
        </button>
      </div>
    </div>
  );
}
