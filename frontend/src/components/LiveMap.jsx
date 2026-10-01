import { MapContainer, TileLayer, Marker, Popup } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const busIcon = new L.DivIcon({
  html: `<div class="bus-marker-icon"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 17h2c.6 0 1-.4 1-1v-3c0-.9-.7-1.7-1.5-1.9C18.7 10.6 16 10 12 10s-6.7.6-8.5 1.1C2.7 11.3 2 12.1 2 13v3c0 .6.4 1 1 1h2"/><path d="M14 17H9"/><path d="m19 17-1.5 4.5c-.3.8-1 1.5-1.9 1.5H8.4c-.9 0-1.6-.7-1.9-1.5L5 17"/><path d="M22 10V6c0-1.1-.9-2-2-2H4c-1.1 0-2 .9-2 2v4"/><path d="M2 14h20"/><path d="M8 8h8"/><path d="M17 19v1"/><path d="M7 19v1"/></svg></div>`,
  className: "custom-leaflet-marker",
  iconSize: [44, 44],
  iconAnchor: [22, 22],
});

export default function LiveMap({ center, busPosition, destination, stopLabel }) {
  return (
    <MapContainer center={center} zoom={13} style={{ height: "100%", width: "100%" }} zoomControl={false}>
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
        url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
      />
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
