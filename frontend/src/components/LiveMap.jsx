import { MapContainer, TileLayer, Marker, Popup, useMap, Polyline, CircleMarker, Circle } from "react-leaflet";
import { useEffect } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import routeShapes from "../data/route_shapes.json";
import ktcStops from "../data/stops.json";

const busIcon = new L.DivIcon({
  html: `<div class="bus-marker-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 12 10s-6.7.6-8.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/><path d="M14 17H9"/><path d="m19 17-1.5 4.5c-.3.8-1 1.5-1.9 1.5H8.4c-.9 0-1.6-.7-1.9-1.5L5 17"/><path d="M22 10V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v4"/><path d="M2 14h20"/><path d="M8 8h8"/><path d="M17 19v1"/><path d="M7 19v1"/></svg></div>`,
  className: "custom-leaflet-marker",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

function MapUpdater({ center }) {
  const map = useMap();
  useEffect(() => {
    if (center && center[0] !== undefined) {
      map.setView(center, map.getZoom(), { animate: true });
    }
  }, [center, map]);
  return null;
}

export default function LiveMap({ center, busPosition, destination, stopLabel, passengerPosition, journeySegments }) {
  return (
    <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false}>
      <MapUpdater center={center} />
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      {/* Render official KTC Bus Stops */}
      {ktcStops.map(stop => (
        <CircleMarker 
          key={stop.id} 
          center={[stop.lat, stop.lng]} 
          radius={5} 
          pathOptions={{ color: 'white', fillColor: '#134e4a', fillOpacity: 1, weight: 2 }}
        >
          <Popup>{stop.name}</Popup>
        </CircleMarker>
      ))}

      {/* Render all KML routes only if we don't have active segments */}
      {!journeySegments && Object.entries(routeShapes).map(([name, coords]) => (
        <Polyline 
          key={name} 
          positions={coords} 
          color="#3b82f6" 
          weight={4} 
          opacity={0.6}
        >
          <Popup>{name}</Popup>
        </Polyline>
      ))}

      {/* Render Journey Segments */}
      {journeySegments && journeySegments.map((segment, idx) => (
        segment.path ? (
          <Polyline
            key={`seg-${idx}`}
            positions={segment.path}
            color={segment.type === 'WALK' ? '#6b7280' : '#3b82f6'}
            weight={segment.type === 'WALK' ? 4 : 5}
            dashArray={segment.type === 'WALK' ? '8, 8' : undefined}
            opacity={0.8}
          >
            <Popup>{segment.type === 'WALK' ? `Walk ${segment.duration} min` : `Bus ${segment.routeNumber}`}</Popup>
          </Polyline>
        ) : null
      ))}

      {passengerPosition && (
        <>
          {passengerPosition.accuracy && (
            <Circle 
              center={passengerPosition} 
              radius={passengerPosition.accuracy} 
              pathOptions={{ color: '#3b82f6', fillColor: '#3b82f6', fillOpacity: 0.15, weight: 1 }} 
            />
          )}
          <CircleMarker 
            center={passengerPosition} 
            radius={8} 
            pathOptions={{ color: 'white', fillColor: '#3b82f6', fillOpacity: 1, weight: 3 }}
          >
            <Popup>You are here</Popup>
          </CircleMarker>
        </>
      )}

      {busPosition && (
        <Marker position={busPosition} icon={busIcon}>
          <Popup>Live Bus Position</Popup>
        </Marker>
      )}
      {destination && (
        <Marker position={[destination.lat, destination.lng]}>
          <Popup>{stopLabel || "Destination"}</Popup>
        </Marker>
      )}
    </MapContainer>
  );
}
