import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { 
  Bus, 
  UserCircle, 
  Shield, 
  Mail, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  Loader2, 
  AlertCircle, 
  X, 
  User, 
  Key, 
  Sparkles,
  Info
} from "lucide-react";
import { API_BASE } from "../lib/api";
import "./Login.css";

export default function Login() {
  const [activeTab, setActiveTab] = useState(() => {
    const remembered = typeof window !== "undefined" ? localStorage.getItem("busmitra_remembered_username") : null;
    if (remembered && (remembered.startsWith("KTC-DRV") || remembered.includes("ADMIN") || remembered.includes("@ktcl"))) {
      return "transport";
    }
    return "public";
  });

  const [role, setRole] = useState(() => {
    const remembered = typeof window !== "undefined" ? localStorage.getItem("busmitra_remembered_username") : null;
    if (remembered && (remembered.includes("ADMIN") || remembered.includes("@ktcl"))) {
      return "admin";
    }
    return "driver";
  });
  
  // Passenger Form State
  const [publicEmail, setPublicEmail] = useState(() => {
    const remembered = typeof window !== "undefined" ? localStorage.getItem("busmitra_remembered_username") : null;
    return (remembered && !remembered.startsWith("KTC-DRV") && !remembered.includes("ADMIN")) ? remembered : "";
  });
  const [publicPassword, setPublicPassword] = useState("");
  
  // Transport Staff Form State
  const [driverId, setDriverId] = useState(() => {
    const remembered = typeof window !== "undefined" ? localStorage.getItem("busmitra_remembered_username") : null;
    return (remembered && remembered.startsWith("KTC-DRV")) ? remembered : "";
  });
  const [driverPin, setDriverPin] = useState("");
  const [adminEmail, setAdminEmail] = useState(() => {
    const remembered = typeof window !== "undefined" ? localStorage.getItem("busmitra_remembered_username") : null;
    return (remembered && (remembered.includes("ADMIN") || remembered.includes("@ktcl"))) ? remembered : "";
  });
  const [adminPassword, setAdminPassword] = useState("");
  
  // UI & Interaction States
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  
  const navigate = useNavigate();

  // Autofill helpers for quick evaluator testing
  const handleAutofillDemo = (demoType) => {
    setError("");
    if (demoType === "driver") {
      setActiveTab("transport");
      setRole("driver");
      setDriverId("KTC-DRV-1042");
      setDriverPin("1234");
    } else if (demoType === "admin") {
      setActiveTab("transport");
      setRole("admin");
      setAdminEmail("ADMIN-KTC-001");
      setAdminPassword("ktc@2024");
    }
  };

  const handlePublicLogin = (e) => {
    e.preventDefault();
    setError("");

    if (!publicEmail.trim()) {
      setError("Please enter your email address.");
      return;
    }
    if (!publicPassword) {
      setError("Please enter your password.");
      return;
    }

    setIsLoading(true);
    setTimeout(() => {
      // Simulate passenger session login
      localStorage.setItem("isLoggedIn", "true");
      if (rememberMe) {
        localStorage.setItem("busmitra_remembered_username", publicEmail.trim());
      } else {
        localStorage.removeItem("busmitra_remembered_username");
      }
      setIsLoading(false);
      navigate("/passenger");
    }, 400);
  };

  const handleGuestLogin = () => {
    navigate("/passenger");
  };

  const handleTransportLogin = async (e) => {
    e.preventDefault();
    setError("");

    let username = "";
    let password = "";

    if (role === "driver") {
      if (!driverId.trim()) {
        setError("Please enter your Driver ID (e.g. KTC-DRV-1042).");
        return;
      }
      if (!driverPin.trim()) {
        setError("Please enter your 4-digit PIN code.");
        return;
      }
      username = driverId.trim();
      password = driverPin.trim();
    } else {
      if (!adminEmail.trim()) {
        setError("Please enter your Admin Email or ID.");
        return;
      }
      if (!adminPassword.trim()) {
        setError("Please enter your Password.");
        return;
      }
      username = adminEmail.trim();
      password = adminPassword.trim();
    }

    setIsLoading(true);

    try {
      const response = await fetch(`${API_BASE}/api/auth/login`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Invalid username or password");
      }

      // Success
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);

      if (rememberMe) {
        localStorage.setItem("busmitra_remembered_username", username);
      } else {
        localStorage.removeItem("busmitra_remembered_username");
      }
      
      if (data.role === "driver") {
        navigate("/driver", { state: { isLoggedIn: true, driverId: data.username } });
      } else if (data.role === "admin") {
        navigate("/admin");
      } else {
        throw new Error("Invalid staff role assigned");
      }
      
    } catch (err) {
      setError(err.message || "Failed to authenticate with server.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-page-root">
      <div className="login-backdrop-glow" aria-hidden="true" />

      <div className="login-card-container">
        
        {/* Large Illustrated Bus Header (Foodie-inspired) */}
        <div className="login-illustrated-header" role="img" aria-label="BusMitra scenic Goa transit illustration">
          <svg 
            className="login-header-svg" 
            viewBox="0 0 460 180" 
            fill="none" 
            xmlns="http://www.w3.org/2000/svg"
          >
            <defs>
              <linearGradient id="skyGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#BAE6FD" />
                <stop offset="50%" stopColor="#E0F2FE" />
                <stop offset="100%" stopColor="#F0FDF4" />
              </linearGradient>
              <linearGradient id="headerBusBody" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="#0F766E" />
                <stop offset="60%" stopColor="#0D9488" />
                <stop offset="100%" stopColor="#14B8A6" />
              </linearGradient>
              <linearGradient id="headerRoadGrad" x1="0%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#334155" />
                <stop offset="100%" stopColor="#1E293B" />
              </linearGradient>
              <linearGradient id="headerSunGlow" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#FDE047" stopOpacity="0.8" />
                <stop offset="100%" stopColor="#F59E0B" stopOpacity="0.1" />
              </linearGradient>
            </defs>

            {/* Sky Background */}
            <rect width="460" height="180" fill="url(#skyGrad)" />

            {/* Warm Goa Morning Sun */}
            <circle cx="380" cy="45" r="32" fill="url(#headerSunGlow)" />
            <circle cx="380" cy="45" r="18" fill="#FDE047" opacity="0.9" />

            {/* Drifting Clouds */}
            <path d="M45 42 A12 12 0 0 1 65 32 A16 16 0 0 1 95 35 A10 10 0 0 1 105 45 Z" fill="#FFFFFF" opacity="0.8" />
            <path d="M220 30 A10 10 0 0 1 235 22 A14 14 0 0 1 262 25 A8 8 0 0 1 270 32 Z" fill="#FFFFFF" opacity="0.75" />

            {/* Distant Goa Hills & Water Horizon */}
            <path d="M0 135 Q115 110 230 128 T460 125 L460 150 L0 150 Z" fill="#99F6E4" opacity="0.45" />

            {/* Palm Trees in Background */}
            <g fill="#0D9488" opacity="0.55">
              {/* Left Palm */}
              <path d="M30 148 Q35 105 38 75 Q40 70 42 75 Q46 110 48 148 Z" fill="#0F766E" />
              <path d="M40 75 Q15 68 8 82 Q24 78 40 75 Z" />
              <path d="M40 75 Q26 55 18 48 Q30 62 40 75 Z" />
              <path d="M40 75 Q45 50 56 46 Q48 64 40 75 Z" />
              <path d="M40 75 Q60 62 70 72 Q54 75 40 75 Z" />

              {/* Middle Distant Palm */}
              <path d="M90 148 Q94 115 96 90 Q98 86 100 90 Q104 118 106 148 Z" fill="#0F766E" />
              <path d="M98 90 Q78 84 72 96 Q85 92 98 90 Z" />
              <path d="M98 90 Q88 74 80 68 Q90 80 98 90 Z" />
              <path d="M98 90 Q102 70 112 66 Q106 80 98 90 Z" />
              <path d="M98 90 Q115 80 122 88 Q110 90 98 90 Z" />

              {/* Right Palm */}
              <path d="M420 148 Q416 110 412 78 Q410 74 414 78 Q422 112 426 148 Z" fill="#0F766E" />
              <path d="M412 78 Q390 68 378 78 Q395 76 412 78 Z" />
              <path d="M412 78 Q402 56 392 50 Q405 64 412 78 Z" />
              <path d="M412 78 Q422 52 434 50 Q425 66 412 78 Z" />
              <path d="M412 78 Q432 70 442 82 Q425 81 412 78 Z" />
            </g>

            {/* Asphalt Road */}
            <rect x="0" y="146" width="460" height="34" fill="url(#headerRoadGrad)" />
            <line x1="0" y1="146" x2="460" y2="146" stroke="#64748B" strokeWidth="2.5" />
            <line x1="0" y1="162" x2="460" y2="162" stroke="#F59E0B" strokeWidth="3" strokeDasharray="14 14" />

            {/* The Goa Transit Bus */}
            <g transform="translate(110, 20)">
              {/* Bus Shadow */}
              <ellipse cx="120" cy="130" rx="95" ry="6" fill="#0F172A" opacity="0.35" />

              {/* Main Bus Body */}
              <path
                d="M35 116
                   L35 72
                   Q37 54 55 53
                   L190 53
                   Q212 54 218 70
                   L222 105
                   Q222 118 208 120
                   L46 120
                   Q35 120 35 116 Z"
                fill="url(#headerBusBody)"
              />

              {/* Pearl White Band */}
              <path
                d="M35 102
                   L220 102
                   Q222 112 214 117
                   L44 117
                   Q35 117 35 110 Z"
                fill="#FFFFFF"
              />

              {/* Amber Speed Stripe */}
              <rect x="35" y="99" width="184" height="3" fill="#F59E0B" rx="1" />

              {/* Front Windshield */}
              <path
                d="M180 58
                   L208 60
                   Q216 64 217 78
                   L217 96
                   L180 96 Z"
                fill="#0284C7"
                stroke="#0F172A"
                strokeWidth="1.2"
              />
              <line x1="185" y1="92" x2="210" y2="66" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" opacity="0.6" />

              {/* Driver silhouette */}
              <circle cx="202" cy="78" r="4" fill="#0F172A" opacity="0.6" />

              {/* Passenger Windows */}
              <rect x="140" y="60" width="34" height="32" rx="3" fill="#0284C7" stroke="#0F172A" strokeWidth="1" />
              <rect x="100" y="60" width="34" height="32" rx="3" fill="#0284C7" stroke="#0F172A" strokeWidth="1" />
              <rect x="60" y="60" width="34" height="32" rx="3" fill="#0284C7" stroke="#0F172A" strokeWidth="1" />

              {/* Window reflections */}
              <line x1="64" y1="88" x2="88" y2="64" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
              <line x1="104" y1="88" x2="128" y2="64" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />
              <line x1="144" y1="88" x2="168" y2="64" stroke="#FFFFFF" strokeWidth="1.5" strokeLinecap="round" opacity="0.5" />

              {/* Destination Board LED */}
              <rect x="135" y="55" width="75" height="5.5" rx="1.5" fill="#0B132B" />
              <text x="172" y="59.5" fill="#F59E0B" fontSize="3.8" fontWeight="bold" letterSpacing="0.3" textAnchor="middle">
                KTCL • GOA EXPRESS
              </text>

              {/* Side Logo */}
              <text x="95" y="112" fill="#0F766E" fontSize="7.5" fontWeight="800">
                Bus<tspan fill="#0284C7">Mitra</tspan>
              </text>
              <text x="142" y="112" fill="#64748B" fontSize="5.5" fontWeight="700">
                KTCL
              </text>

              {/* Front Headlight */}
              <rect x="219" y="108" width="4" height="7" rx="1.5" fill="#FEF08A" stroke="#CA8A04" strokeWidth="0.8" />

              {/* Wheels */}
              {/* Front Wheel */}
              <g transform="translate(190, 120)">
                <circle cx="0" cy="0" r="12" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="7.5" fill="#CBD5E1" stroke="#64748B" strokeWidth="0.8" />
                <circle cx="0" cy="0" r="3.5" fill="#0D9488" />
                <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />
              </g>

              {/* Rear Wheel */}
              <g transform="translate(75, 120)">
                <circle cx="0" cy="0" r="12" fill="#1E293B" stroke="#0F172A" strokeWidth="1.5" />
                <circle cx="0" cy="0" r="7.5" fill="#CBD5E1" stroke="#64748B" strokeWidth="0.8" />
                <circle cx="0" cy="0" r="3.5" fill="#0D9488" />
                <circle cx="0" cy="0" r="1.5" fill="#FFFFFF" />
              </g>
            </g>
          </svg>
        </div>

        {/* Card Body */}
        <div className="login-card-body">
          
          {/* Headings */}
          <div className="login-title-group">
            <div className="login-brand-pill">
              <Sparkles size={12} color="#059669" />
              <span>Goa Public Transit</span>
            </div>
            <h1 className="login-main-heading">Welcome Back to BusMitra</h1>
            <p className="login-subtitle">Your journey across Goa starts here.</p>
          </div>

          {/* Segmented Tab Controls: Passenger vs Staff */}
          <div className="login-segment-tabs" role="tablist">
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "public"}
              className={`login-tab-btn ${activeTab === "public" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("public");
                setError("");
              }}
            >
              <UserCircle size={17} /> Passenger
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={activeTab === "transport"}
              className={`login-tab-btn ${activeTab === "transport" ? "active" : ""}`}
              onClick={() => {
                setActiveTab("transport");
                setError("");
              }}
            >
              <Shield size={17} /> Staff Portal
            </button>
          </div>

          {/* Error Message Box */}
          {error && (
            <div className="login-error-alert" role="alert">
              <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 1 }} />
              <div>{error}</div>
            </div>
          )}

          {/* PASSENGER (PUBLIC) LOGIN VIEW */}
          {activeTab === "public" && (
            <form onSubmit={handlePublicLogin} className="login-form">
              <div className="login-form-group">
                <label className="login-form-label" htmlFor="passenger-email">Email Address</label>
                <div className="login-input-wrapper">
                  <div className="login-input-icon">
                    <Mail size={18} />
                  </div>
                  <input
                    id="passenger-email"
                    type="email"
                    className="login-input"
                    placeholder="name@example.com"
                    value={publicEmail}
                    onChange={(e) => setPublicEmail(e.target.value)}
                    disabled={isLoading}
                    autoComplete="email"
                    required
                  />
                </div>
              </div>

              <div className="login-form-group">
                <label className="login-form-label" htmlFor="passenger-password">Password</label>
                <div className="login-input-wrapper">
                  <div className="login-input-icon">
                    <Lock size={18} />
                  </div>
                  <input
                    id="passenger-password"
                    type={showPassword ? "text" : "password"}
                    className="login-input"
                    placeholder="••••••••"
                    value={publicPassword}
                    onChange={(e) => setPublicPassword(e.target.value)}
                    disabled={isLoading}
                    autoComplete="current-password"
                    required
                  />
                  <button
                    type="button"
                    className="login-password-toggle"
                    onClick={() => setShowPassword(!showPassword)}
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {/* Options Row */}
              <div className="login-options-row">
                <label className="login-checkbox-label">
                  <input
                    type="checkbox"
                    className="login-checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                  />
                  <span>Remember me</span>
                </label>

                <button
                  type="button"
                  className="login-forgot-link"
                  onClick={() => setIsForgotModalOpen(true)}
                >
                  Forgot Password?
                </button>
              </div>

              {/* Green Primary Action Button (Foodie inspired) */}
              <button
                type="submit"
                className="login-submit-button"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 size={18} className="spin-icon" style={{ animation: "spin 1s linear infinite" }} />
                    Signing in...
                  </>
                ) : (
                  <>
                    Log In <ArrowRight size={18} />
                  </>
                )}
              </button>

              <div className="login-or-divider">
                <span>OR</span>
              </div>

              {/* Guest Access Option */}
              <button
                type="button"
                className="login-guest-button"
                onClick={handleGuestLogin}
                disabled={isLoading}
              >
                <Bus size={18} color="#0D9488" /> Continue as Guest
              </button>
            </form>
          )}

          {/* TRANSPORT STAFF (DRIVER / ADMIN) LOGIN VIEW */}
          {activeTab === "transport" && (
            <div>
              {/* Staff Role Switcher */}
              <div className="staff-role-switcher" role="radiogroup" aria-label="Staff role selection">
                <label className={`role-radio-label ${role === "driver" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="staffRole"
                    value="driver"
                    checked={role === "driver"}
                    onChange={() => {
                      setRole("driver");
                      setError("");
                    }}
                  />
                  <Bus size={15} /> Driver Portal
                </label>
                <label className={`role-radio-label ${role === "admin" ? "active" : ""}`}>
                  <input
                    type="radio"
                    name="staffRole"
                    value="admin"
                    checked={role === "admin"}
                    onChange={() => {
                      setRole("admin");
                      setError("");
                    }}
                  />
                  <Shield size={15} /> Administrator
                </label>
              </div>

              {/* Demo Credentials Quick-Fill Chip */}
              <div className="demo-credentials-badge">
                <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                  <Info size={14} />
                  <span>
                    {role === "driver" ? "Demo: KTC-DRV-1042 / 1234" : "Demo: ADMIN-KTC-001 / ktc@2024"}
                  </span>
                </div>
                <button
                  type="button"
                  className="demo-autofill-btn"
                  onClick={() => handleAutofillDemo(role)}
                >
                  Quick Fill
                </button>
              </div>

              <form onSubmit={handleTransportLogin} className="login-form">
                {role === "driver" ? (
                  <>
                    <div className="login-form-group">
                      <label className="login-form-label" htmlFor="driver-id">Driver ID</label>
                      <div className="login-input-wrapper">
                        <div className="login-input-icon">
                          <User size={18} />
                        </div>
                        <input
                          id="driver-id"
                          type="text"
                          className="login-input"
                          placeholder="e.g. KTC-DRV-1042"
                          value={driverId}
                          onChange={(e) => setDriverId(e.target.value)}
                          disabled={isLoading}
                          autoComplete="username"
                          required
                        />
                      </div>
                    </div>

                    <div className="login-form-group">
                      <label className="login-form-label" htmlFor="driver-pin">4-Digit PIN Code</label>
                      <div className="login-input-wrapper">
                        <div className="login-input-icon">
                          <Key size={18} />
                        </div>
                        <input
                          id="driver-pin"
                          type={showPassword ? "text" : "password"}
                          className="login-input"
                          placeholder="••••"
                          value={driverPin}
                          onChange={(e) => setDriverPin(e.target.value)}
                          disabled={isLoading}
                          autoComplete="current-password"
                          required
                        />
                        <button
                          type="button"
                          className="login-password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide PIN" : "Show PIN"}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="login-form-group">
                      <label className="login-form-label" htmlFor="admin-email">Admin ID or Email</label>
                      <div className="login-input-wrapper">
                        <div className="login-input-icon">
                          <Mail size={18} />
                        </div>
                        <input
                          id="admin-email"
                          type="text"
                          className="login-input"
                          placeholder="e.g. ADMIN-KTC-001"
                          value={adminEmail}
                          onChange={(e) => setAdminEmail(e.target.value)}
                          disabled={isLoading}
                          autoComplete="username"
                          required
                        />
                      </div>
                    </div>

                    <div className="login-form-group">
                      <label className="login-form-label" htmlFor="admin-password">Admin Password</label>
                      <div className="login-input-wrapper">
                        <div className="login-input-icon">
                          <Lock size={18} />
                        </div>
                        <input
                          id="admin-password"
                          type={showPassword ? "text" : "password"}
                          className="login-input"
                          placeholder="••••••••"
                          value={adminPassword}
                          onChange={(e) => setAdminPassword(e.target.value)}
                          disabled={isLoading}
                          autoComplete="current-password"
                          required
                        />
                        <button
                          type="button"
                          className="login-password-toggle"
                          onClick={() => setShowPassword(!showPassword)}
                          aria-label={showPassword ? "Hide password" : "Show password"}
                        >
                          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                        </button>
                      </div>
                    </div>
                  </>
                )}

                {/* Options Row */}
                <div className="login-options-row">
                  <label className="login-checkbox-label">
                    <input
                      type="checkbox"
                      className="login-checkbox"
                      checked={rememberMe}
                      onChange={(e) => setRememberMe(e.target.checked)}
                    />
                    <span>Remember {role === "driver" ? "Driver ID" : "Account"}</span>
                  </label>

                  <button
                    type="button"
                    className="login-forgot-link"
                    onClick={() => setIsForgotModalOpen(true)}
                  >
                    Forgot {role === "driver" ? "PIN?" : "Password?"}
                  </button>
                </div>

                {/* Green Primary Action Button (Foodie inspired) */}
                <button
                  type="submit"
                  className="login-submit-button"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <>
                      <Loader2 size={18} className="spin-icon" style={{ animation: "spin 1s linear infinite" }} />
                      Authenticating...
                    </>
                  ) : (
                    <>
                      {role === "driver" ? "Log In as Driver" : "Log In as Administrator"} <ArrowRight size={18} />
                    </>
                  )}
                </button>
              </form>
            </div>
          )}

          {/* Footer Back Link & Replay Intro */}
          <div className="login-card-footer">
            <Link to="/" className="login-back-home-link">
              ← Return to Main Page
            </Link>
            <button
              type="button"
              className="login-replay-splash-link"
              onClick={() => {
                sessionStorage.removeItem("busmitra_splash_seen");
                window.location.reload();
              }}
              title="View the animated Goa bus loading screen again"
            >
              Replay Animated Loading Screen
            </button>
          </div>

        </div>
      </div>

      {/* Forgot Password Recovery Modal */}
      {isForgotModalOpen && (
        <div className="login-modal-backdrop" onClick={() => setIsForgotModalOpen(false)}>
          <div className="login-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="login-modal-header">
              <h3 className="login-modal-title">Password & PIN Recovery</h3>
              <button 
                type="button" 
                className="login-modal-close-btn"
                onClick={() => setIsForgotModalOpen(false)}
                aria-label="Close dialog"
              >
                <X size={20} />
              </button>
            </div>

            <div className="login-modal-body">
              <div className="modal-notice-box">
                <strong style={{ display: "block", color: "#0F172A", marginBottom: 4 }}>
                  Transport Staff (Drivers & Admins):
                </strong>
                Driver IDs, PINs, and Administrator accounts are issued and maintained by the 
                <strong> KTCL Fleet Operations Center</strong> at Kadamba Central Depot, Porvorim. 
                Please contact your Duty Supervisor or the KTCL Transport IT Helpdesk (Phone: 0832-2438011).
              </div>

              <div className="modal-notice-box">
                <strong style={{ display: "block", color: "#0F172A", marginBottom: 4 }}>
                  Passengers:
                </strong>
                Passenger tracking does not require password recovery. You can instantly access all live bus routes, 
                ETA predictions, and fare calculations by clicking <strong>"Continue as Guest"</strong>.
              </div>
            </div>

            <button
              type="button"
              className="login-modal-action-btn"
              onClick={() => setIsForgotModalOpen(false)}
            >
              Understood
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
