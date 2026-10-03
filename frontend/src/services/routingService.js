import ktcStops from "../data/stops.json";

const API_BASE = import.meta.env.VITE_API_BASE || "https://busmitra-goa.onrender.com";

/**
 * Calculates a walking route using OSRM public API.
 */
export async function getWalkingRoute(originLatLng, destLatLng) {
  try {
    // OSRM expects coordinates in lon,lat format
    const url = `https://router.project-osrm.org/route/v1/foot/${originLatLng[1]},${originLatLng[0]};${destLatLng[1]},${destLatLng[0]}?geometries=geojson`;
    const res = await fetch(url);
    if (!res.ok) throw new Error("OSRM request failed");
    const data = await res.json();
    
    if (data.routes && data.routes.length > 0) {
      const route = data.routes[0];
      // Convert GeoJSON coords (lon, lat) to Leaflet (lat, lon)
      const coordinates = route.geometry.coordinates.map(coord => [coord[1], coord[0]]);
      return {
        distance: route.distance, // in meters
        duration: route.duration, // in seconds
        path: coordinates,
      };
    }
  } catch (error) {
    console.error("Error fetching walking route:", error);
  }
  return null;
}

/**
 * Finds nearest KTC stops given a coordinate, sorted by distance.
 */
function getNearbyStops(lat, lng, maxStops = 3) {
  const distance = (lat1, lon1, lat2, lon2) => {
    const R = 6371e3; // metres
    const p1 = lat1 * Math.PI/180; 
    const p2 = lat2 * Math.PI/180;
    const dp = (lat2-lat1) * Math.PI/180;
    const dl = (lon2-lon1) * Math.PI/180;
    const a = Math.sin(dp/2) * Math.sin(dp/2) +
              Math.cos(p1) * Math.cos(p2) *
              Math.sin(dl/2) * Math.sin(dl/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };

  const stopsWithDist = ktcStops.map(s => ({
    ...s,
    dist: distance(lat, lng, s.lat, s.lng)
  }));
  
  stopsWithDist.sort((a, b) => a.dist - b.dist);
  return stopsWithDist.slice(0, maxStops);
}

export async function getTransitJourney(origin, destination) {
  // Origin: { lat, lng } or stop name string
  // Destination: { name, lat, lng } or stop name string

  let destLat, destLng;
  if (destination && destination.lat && destination.lng) {
    destLat = destination.lat;
    destLng = destination.lng;
  } else {
    // If it's just a name, search backend stops
    try {
      const q = typeof destination === 'string' ? destination : destination.name;
      const res = await fetch(`${API_BASE}/api/search/stops?q=${encodeURIComponent(q)}`);
      const stops = await res.json();
      if (stops.length > 0) {
        destLat = stops[0].lat || (ktcStops.find(s => s.id === stops[0].stopId)?.lat);
        destLng = stops[0].lng || (ktcStops.find(s => s.id === stops[0].stopId)?.lng);
      } else {
        throw new Error("Destination not found");
      }
    } catch (e) {
      console.error(e);
      return { error: "Destination not found" };
    }
  }

  let origLat, origLng;
  if (origin && origin.lat && origin.lng) {
    origLat = origin.lat;
    origLng = origin.lng;
  } else {
    try {
      const q = typeof origin === 'string' ? origin : origin.name;
      const res = await fetch(`${API_BASE}/api/search/stops?q=${encodeURIComponent(q)}`);
      const stops = await res.json();
      if (stops.length > 0) {
        origLat = stops[0].lat || (ktcStops.find(s => s.id === stops[0].stopId)?.lat);
        origLng = stops[0].lng || (ktcStops.find(s => s.id === stops[0].stopId)?.lng);
      } else {
        throw new Error("Origin not found");
      }
    } catch (e) {
      console.error(e);
      return { error: "Origin not found" };
    }
  }

  try {
    const res = await fetch(`${API_BASE}/api/journey/plan`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        origin: { lat: origLat, lng: origLng },
        destination: { lat: destLat, lng: destLng }
      })
    });
    
    if (!res.ok) return { error: "SERVER_ERROR" };
    const data = await res.json();
    if (!data.success || !data.journeys) {
      if (data.reason === "NO_CURRENT_SCHEDULE_DATA") {
        return { error: "NO_CURRENT_SCHEDULE_DATA" };
      }
      return [];
    }
    
    // Map backend 'legs' to frontend 'segments'
    const mappedJourneys = data.journeys.map(j => ({
      ...j,
      totalDuration: j.totalDurationMinutes,
      segments: j.legs.map(leg => ({
        ...leg,
        duration: leg.durationMinutes,
        distance: leg.distanceMeters
      }))
    }));
    
    return {
      journeys: mappedJourneys,
      isScheduleExpired: data.isScheduleExpired,
      message: data.message
    };
  } catch (error) {
    console.error("Journey plan error:", error);
    return { journeys: [] };
  }
}
