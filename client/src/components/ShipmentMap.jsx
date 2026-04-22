import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// react-leaflet v5: MapConsumer and useMapElement removed. We use hooks directly.
// Circle component from react-leaflet is still valid but not needed here — we use CSS via divIcon.

const getRiskColor = (score) => {
  if (score >= 70) return '#ef4444';
  if (score >= 40) return '#f59e0b';
  return '#22c55e';
};

const getStatusColor = (status) => {
  if (status === 'delayed') return '#ef4444';
  if (status === 'at-risk') return '#f59e0b';
  return '#22c55e';
};

const createShipmentIcon = (status) => {
  const color = getStatusColor(status);
  return L.divIcon({
    html: `
      <div style="
        width:14px;height:14px;border-radius:50%;
        background:${color};
        border:2px solid rgba(255,255,255,0.85);
        box-shadow:0 0 10px ${color}88, 0 0 0 4px ${color}22;
      "></div>`,
    className: '',
    iconSize: [14, 14],
    iconAnchor: [7, 7],
    popupAnchor: [0, -10]
  });
};

const createHubIcon = (isDisrupted) => {
  const color = isDisrupted ? '#ef4444' : '#6366f1';

  // Pulsing ring for disrupted hubs using @keyframes hubPulse defined in index.css
  const pulsingRing = isDisrupted
    ? `<div style="
        position:absolute;
        top:50%;left:50%;
        width:30px;height:30px;
        border-radius:50%;
        border:1.5px solid ${color};
        animation:hubPulse 1.5s ease-out infinite;
      "></div>`
    : '';

  return L.divIcon({
    html: `
      <div style="position:relative;width:32px;height:32px;display:flex;align-items:center;justify-content:center;">
        ${pulsingRing}
        <div style="
          width:18px;height:18px;border-radius:50%;
          background:${color}22;
          border:2px solid ${color};
          box-shadow:0 0 14px ${color}66;
          display:flex;align-items:center;justify-content:center;
          position:relative;z-index:1;
        ">
          <div style="width:6px;height:6px;border-radius:50%;background:${color};"></div>
        </div>
      </div>`,
    className: '',
    iconSize: [32, 32],
    iconAnchor: [16, 16],
    popupAnchor: [0, -18]
  });
};

export default function ShipmentMap({ shipments, hubs }) {
  return (
    <div className="map-container">
      {/* react-leaflet v5: MapContainer — whenCreated prop removed, use ref callback instead if needed */}
      <MapContainer
        center={[20, 20]}
        zoom={2}
        minZoom={2}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; CartoDB'
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
        />

        {hubs.map(hub => (
          <Marker
            key={hub.hubId}
            position={[hub.location.lat, hub.location.lng]}
            icon={createHubIcon(hub.isDisrupted)}
          >
            <Popup>
              <div>
                <div className="popup-id">PORT / HUB</div>
                <div className="popup-route">{hub.name}</div>
                <div className="popup-carrier">
                  {hub.isDisrupted ? '⚠ DISRUPTED' : '✓ Operational'}
                </div>
                <div className="popup-row">
                  <div>
                    <div className="popup-risk" style={{ color: hub.isDisrupted ? '#ef4444' : '#22c55e' }}>
                      {hub.congestionLevel}%
                    </div>
                    <div className="popup-risk-label">Congestion</div>
                  </div>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}

        {shipments.map(s => (
          <Marker
            key={s.shipmentId}
            position={[s.currentLocation.lat, s.currentLocation.lng]}
            icon={createShipmentIcon(s.status)}
          >
            <Popup>
              <div>
                <div className="popup-id">{s.shipmentId} · {s.carrier}</div>
                <div className="popup-route">
                  {s.origin?.city} → {s.destination?.city}
                </div>
                <div className="popup-carrier">
                  {s.origin?.country} → {s.destination?.country}
                </div>
                <div className="popup-row">
                  <div>
                    <div className="popup-risk" style={{ color: getRiskColor(s.riskScore) }}>
                      {s.riskScore}
                    </div>
                    <div className="popup-risk-label">Risk Score</div>
                  </div>
                  <span style={{
                    fontSize: '10px', fontWeight: 700,
                    padding: '3px 8px', borderRadius: '20px',
                    background: s.status === 'delayed' ? '#ef444422' : s.status === 'at-risk' ? '#f59e0b22' : '#22c55e22',
                    color: s.status === 'delayed' ? '#ef4444' : s.status === 'at-risk' ? '#f59e0b' : '#22c55e',
                    textTransform: 'uppercase', letterSpacing: '0.05em'
                  }}>
                    {s.status}
                  </span>
                </div>
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}