import { useState, useEffect } from 'react';
import axios from 'axios';

const API = 'http://localhost:5000/api';

export default function AlertPanel({ alert, hubs, onClose }) {
  const [reroutes, setReroutes] = useState([]);

  const hub = hubs.find(h => h.hubId === alert.hubId);
  const time = new Date(alert.timestamp).toLocaleTimeString();

  useEffect(() => {
    if (!alert.hubId) return;
    setReroutes([]);

    axios.get(`${API}/hubs/${alert.hubId}/reroute`)
      .then(res => setReroutes(res.data.recommendations || []))
      .catch(() => setReroutes([]));
  }, [alert.hubId]);

  return (
    <div className="alert-overlay">
      <div className="alert-header">
        <div>
          <div className="alert-title-row">
            <div className="alert-icon">
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none"
                stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round">
                <path d="M8 2L14 13H2L8 2Z"/>
                <path d="M8 7V10M8 12V12.5"/>
              </svg>
            </div>
            <span className="alert-title">Disruption Detected</span>
          </div>
          <div className="alert-hub">{alert.hubName}</div>
          <div className="alert-time">{time}</div>
        </div>
        <button className="close-btn" onClick={onClose}>✕</button>
      </div>

      <div className="alert-body">

        <div className="congestion-section">
          <div className="section-label">Congestion Level</div>
          <div className="congestion-bar-track">
            <div
              className="congestion-bar-fill"
              style={{ width: `${alert.congestionLevel}%` }}
            />
          </div>
          <div className="congestion-label">
            <span>0%</span>
            <span>{alert.congestionLevel}% — Critical</span>
          </div>
        </div>

        {alert.rippleScore !== undefined && (
          <div className="congestion-section">
            <div className="section-label">Ripple Risk Score</div>
            <div className="congestion-bar-track">
              <div
                className="congestion-bar-fill"
                style={{
                  width: `${alert.rippleScore}%`,
                  background: alert.rippleScore >= 70 ? '#ef4444' : '#f59e0b'
                }}
              />
            </div>
            <div className="congestion-label">
              <span>0</span>
              <span style={{ color: alert.rippleScore >= 70 ? '#ef4444' : '#f59e0b' }}>
                {alert.rippleScore} / 100
              </span>
            </div>
          </div>
        )}

        <div className="affected-section">
          <div className="section-label">
            {alert.affectedShipments?.length || 0} Shipments Affected
          </div>
          {(alert.affectedShipments || []).map(s => (
            <div key={s.shipmentId} className="affected-ship">
              <div>
                <div className="affected-ship-id">{s.shipmentId}</div>
                <div className="affected-ship-route">
                  {s.origin?.city} → {s.destination?.city}
                </div>
              </div>
              <div style={{ textAlign: 'right' }}>
                <div style={{ fontSize: '11px', color: '#94a3b8' }}>{s.carrier}</div>
                <div style={{
                  fontSize: '11px', fontWeight: 600, marginTop: 2,
                  color: s.riskScore >= 70 ? '#ef4444' : '#f59e0b'
                }}>
                  Risk {s.riskScore}
                </div>
              </div>
            </div>
          ))}
        </div>

        {reroutes.length > 0 && (
          <div className="reroute-section">
            <div className="section-label">Reroute Options</div>
            {reroutes.map((r, i) => (
              <div key={i} className="reroute-card">
                <div className="reroute-name">{r.name}</div>
                <div className="reroute-meta">
                  <span className="reroute-tag time">
                    +{Math.round(r.extraTimeMins / 60)}h
                  </span>
                  <span className="reroute-tag cost">+${r.extraCostUSD}</span>
                  <span className="reroute-tag reliability">
                    {r.reliabilityScore}% reliable
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="ai-section">
          <div className="ai-label">AI Analysis · Gemini</div>
          {alert.aiMessage ? (
            <div className="ai-text">{alert.aiMessage}</div>
          ) : (
            <div className="ai-loading">
              <div className="spinner" />
              Generating analysis...
            </div>
          )}
        </div>

      </div>
    </div>
  );
}