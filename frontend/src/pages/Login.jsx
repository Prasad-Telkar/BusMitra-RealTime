import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Bus, Shield, ArrowRight, UserCircle, Key, Loader2 } from "lucide-react";
import "./Login.css";

export default function Login() {
  const [activeTab, setActiveTab] = useState("public"); // "public" or "transport"
  const [role, setRole] = useState("driver"); // "driver" or "admin" for transport tab
  
  // Form states
  const [driverId, setDriverId] = useState("");
  const [driverPin, setDriverPin] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  
  // UI states
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  
  const navigate = useNavigate();

  const handlePublicLogin = (e) => {
    e.preventDefault();
    // Simulate login for public user
    localStorage.setItem("isLoggedIn", "true");
    navigate("/passenger");
  };

  const handleTransportLogin = async (e) => {
    e.preventDefault();
    setError("");

    let username = "";
    let password = "";

    if (role === "driver") {
      if (!driverId.trim()) {
        setError("Please enter your Driver ID.");
        return;
      }
      if (!driverPin.trim()) {
        setError("Please enter your PIN.");
        return;
      }
      username = driverId.trim();
      password = driverPin;
    } else {
      if (!adminEmail.trim()) {
        setError("Please enter your Admin Email.");
        return;
      }
      if (!adminPassword.trim()) {
        setError("Please enter your Password.");
        return;
      }
      username = adminEmail.trim();
      password = adminPassword;
    }

    setIsLoading(true);

    try {
      const response = await fetch("http://localhost:5000/api/auth/login", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ username, password }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Authentication failed");
      }

      // Success
      localStorage.setItem("token", data.token);
      localStorage.setItem("role", data.role);
      
      if (data.role === "driver") {
        navigate("/driver", { state: { isLoggedIn: true, driverId: data.username } });
      } else if (data.role === "admin") {
        navigate("/admin");
      } else {
        throw new Error("Invalid role assigned");
      }
      
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-wrapper">
      <div className="login-container">
        
        <div className="login-header">
          <div className="lh-logo">
            <Bus size={32} color="var(--teal-700)" />
          </div>
          <h1>Welcome to BusMitra</h1>
          <p>Please select your login type to continue</p>
        </div>

        <div className="login-tabs">
          <button 
            className={`lt-btn ${activeTab === 'public' ? 'active' : ''}`}
            onClick={() => setActiveTab("public")}
          >
            <UserCircle size={18} /> Public
          </button>
          <button 
            className={`lt-btn ${activeTab === 'transport' ? 'active' : ''}`}
            onClick={() => setActiveTab("transport")}
          >
            <Shield size={18} /> Transport Staff
          </button>
        </div>

        <div className="login-card">
          {activeTab === "public" && (
            <div className="login-section">
              <h3>Passenger Login</h3>
              <p className="login-desc">Sign in to save your favorite routes and stops.</p>
              
              <form onSubmit={handlePublicLogin} className="login-form">
                <div className="form-group">
                  <label>Email Address</label>
                  <input type="email" placeholder="you@example.com" required />
                </div>
                <div className="form-group">
                  <label>Password</label>
                  <input type="password" placeholder="••••••••" required />
                </div>
                <button type="submit" className="login-submit-btn">
                  Sign In
                </button>
              </form>
              
              <div className="login-divider"><span>OR</span></div>
              
              <button 
                className="login-guest-btn"
                onClick={() => navigate("/passenger")}
              >
                Continue as Guest <ArrowRight size={16} />
              </button>
            </div>
          )}

          {activeTab === "transport" && (
            <div className="login-section">
              <h3>Staff Portal</h3>
              <p className="login-desc">Authorized personnel only.</p>
              
              <div className="role-selector">
                <label className={`role-option ${role === 'driver' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="role" 
                    checked={role === 'driver'} 
                    onChange={() => {
                      setRole('driver');
                      setError('');
                    }} 
                  />
                  <span>Driver</span>
                </label>
                <label className={`role-option ${role === 'admin' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="role" 
                    checked={role === 'admin'} 
                    onChange={() => {
                      setRole('admin');
                      setError('');
                    }} 
                  />
                  <span>Administrator</span>
                </label>
              </div>

              {error && <div className="login-error-msg" style={{color: '#ef4444', backgroundColor: '#fef2f2', padding: '10px', borderRadius: '8px', fontSize: '14px', marginBottom: '16px', border: '1px solid #fee2e2'}}>{error}</div>}

              <form onSubmit={handleTransportLogin} className="login-form">
                {role === "driver" ? (
                  <>
                    <div className="form-group">
                      <label>Driver ID</label>
                      <input 
                        type="text" 
                        placeholder="e.g. KTC-DRV-1042" 
                        value={driverId}
                        onChange={(e) => setDriverId(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>PIN Code</label>
                      <input 
                        type="password" 
                        placeholder="****" 
                        value={driverPin}
                        onChange={(e) => setDriverPin(e.target.value)}
                        required 
                      />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Admin Email</label>
                      <input 
                        type="text" 
                        placeholder="admin@ktcl.goa.gov" 
                        value={adminEmail}
                        onChange={(e) => setAdminEmail(e.target.value)}
                        required 
                      />
                    </div>
                    <div className="form-group">
                      <label>Password</label>
                      <input 
                        type="password" 
                        placeholder="••••••••" 
                        value={adminPassword}
                        onChange={(e) => setAdminPassword(e.target.value)}
                        required 
                      />
                    </div>
                  </>
                )}
                
                <button type="submit" className="login-submit-btn transport-btn" disabled={isLoading}>
                  {isLoading ? (
                    <>Signing in... <Loader2 size={16} className="spin-icon" style={{marginLeft: '8px', animation: 'spin 1s linear infinite'}} /></>
                  ) : (
                    <>{role === 'driver' ? 'Login as Driver' : 'Login as Administrator'} <Key size={16} style={{marginLeft: '8px'}}/></>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>
        
        <div className="login-footer">
          <Link to="/">← Back to Home</Link>
        </div>

      </div>
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
