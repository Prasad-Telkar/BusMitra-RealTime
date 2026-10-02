import { useState, useEffect, useRef } from "react";
import { Search } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_BASE || "https://busmitra-goa.onrender.com";

export default function StopSearchInput({ value, onChange, placeholder, autoFocus }) {
  const [query, setQuery] = useState(value);
  const [suggestions, setSuggestions] = useState([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const wrapperRef = useRef(null);

  useEffect(() => {
    setQuery(value);
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!query || query === value) {
      setSuggestions([]);
      return;
    }
    
    const fetchStops = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${API_BASE}/api/stops?query=${encodeURIComponent(query)}&limit=10`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
          setIsOpen(true);
        }
      } catch (err) {
        console.error("Failed to fetch stops", err);
      } finally {
        setLoading(false);
      }
    };

    const debounce = setTimeout(fetchStops, 300);
    return () => clearTimeout(debounce);
  }, [query, value]);

  const handleSelect = (stopName) => {
    setQuery(stopName);
    onChange(stopName);
    setIsOpen(false);
  };

  return (
    <div className="stop-search-wrapper" ref={wrapperRef} style={{ position: "relative", width: "100%" }}>
      <input
        type="text"
        className="search-value-input"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onFocus={() => { if (suggestions.length > 0) setIsOpen(true); }}
        placeholder={placeholder}
        autoFocus={autoFocus}
        style={{ width: "100%" }}
      />
      
      {isOpen && suggestions.length > 0 && (
        <div className="suggestions-dropdown" style={{
          position: "absolute",
          top: "100%",
          left: 0,
          right: 0,
          background: "white",
          border: "1px solid var(--border-color)",
          borderRadius: "8px",
          boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
          zIndex: 1000,
          maxHeight: "250px",
          overflowY: "auto",
          marginTop: "4px"
        }}>
          {suggestions.map((stop) => (
            <div 
              key={stop._id} 
              className="suggestion-item"
              onClick={() => handleSelect(stop.name)}
              style={{
                padding: "12px 16px",
                cursor: "pointer",
                borderBottom: "1px solid #f1f5f9",
                display: "flex",
                alignItems: "center",
                gap: "10px"
              }}
            >
              <Search size={14} color="var(--text-light)" />
              <div>
                <div style={{ fontWeight: "600", color: "var(--text-main)", fontSize: "14px" }}>{stop.name}</div>
                {stop.description && <div style={{ fontSize: "11px", color: "var(--text-light)" }}>{stop.description}</div>}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
