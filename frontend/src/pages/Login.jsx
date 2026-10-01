import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { User, Bus, Shield, ArrowRight, UserCircle, Key } from "lucide-react";
import "./Login.css";

export default function Login() {
  const [activeTab, setActiveTab] = useState("public"); // "public" or "transport"
  const [role, setRole] = useState("driver"); // "driver" or "admin" for transport tab
  const navigate = useNavigate();

  const handlePublicLogin = (e) => {
    e.preventDefault();
    // Simulate login for public user
    localStorage.setItem("isLoggedIn", "true");
    navigate("/passenger");
  };

  const handleTransportLogin = (e) => {
    e.preventDefault();
    if (role === "driver") {
      navigate("/driver", { state: { isLoggedIn: true, driverId: "KTC-DRV-1042" } });
    } else {
      navigate("/admin");
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
                    onChange={() => setRole('driver')} 
                  />
                  <span>Driver</span>
                </label>
                <label className={`role-option ${role === 'admin' ? 'selected' : ''}`}>
                  <input 
                    type="radio" 
                    name="role" 
                    checked={role === 'admin'} 
                    onChange={() => setRole('admin')} 
                  />
                  <span>Administrator</span>
                </label>
              </div>

              <form onSubmit={handleTransportLogin} className="login-form">
                {role === "driver" ? (
                  <>
                    <div className="form-group">
                      <label>Driver ID</label>
                      <input type="text" placeholder="e.g. KTC-DRV-1042" required />
                    </div>
                    <div className="form-group">
                      <label>PIN Code</label>
                      <input type="password" placeholder="****" required />
                    </div>
                  </>
                ) : (
                  <>
                    <div className="form-group">
                      <label>Admin Email</label>
                      <input type="email" placeholder="admin@ktcl.goa.gov" required />
                    </div>
                    <div className="form-group">
                      <label>Password</label>
                      <input type="password" placeholder="••••••••" required />
                    </div>
                  </>
                )}
                
                <button type="submit" className="login-submit-btn transport-btn">
                  Secure Login <Key size={16} style={{marginLeft: '8px'}}/>
                </button>
              </form>
            </div>
          )}
        </div>
        
        <div className="login-footer">
          <Link to="/">← Back to Home</Link>
        </div>

      </div>
    </div>
  );
}
