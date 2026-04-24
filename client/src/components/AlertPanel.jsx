import { useState, useEffect } from 'react';
import axios from 'axios';
import { API_BASE } from '../config';

const API = API_BASE;

export default function AlertPanel({ alert, hubs, onClose }) {
  const [reroutes, setReroutes] = useState([]);

  useEffect(() => {
    if (!alert.hubId) return;
    setReroutes([]);
    axios.get(`${API}/hubs/${alert.hubId}/reroute`)
      .then(res => setReroutes(res.data.recommendations || []))
      .catch(() => setReroutes([]));
  }, [alert.hubId]);

  const time = new Date(alert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  const riskColor = alert.rippleScore >= 70 ? '#f43f5e' : alert.rippleScore >= 40 ? '#ffb95f' : '#4edea3';

  return (
    <div style={{
      position: 'fixed', top: '56px', right: 0, width: '420px',
      height: 'calc(100% - 56px)', zIndex: 300,
      background: 'rgba(10,13,26,0.97)',
      backdropFilter: 'blur(20px)',
      borderLeft: '1px solid rgba(244,63,94,0.25)',
      display: 'flex', flexDirection: 'column',
      fontFamily: '"Inter", sans-serif',
      animation: 'slideInPanel 0.25s cubic-bezier(0.16,1,0.3,1)',
      boxShadow: '-4px 0 40px rgba(244,63,94,0.08)',
    }}>

      {/* ── Header ── */}
      <div style={{
        padding: '16px 20px',
        background: 'rgba(244,63,94,0.05)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
      }}>
        <div>
          {/* Critical badge */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px', marginBottom: '8px' }}>
            <div style={{
              width: '8px', height: '8px', borderRadius: '50%',
              background: '#f43f5e',
              boxShadow: '0 0 10px #f43f5e',
              animation: 'alertPulse 1.5s infinite',
            }} />
            <span style={{
              fontSize: '10px', fontWeight: 700, letterSpacing: '0.12em',
              textTransform: 'uppercase', color: '#f43f5e',
            }}>
              CRITICAL ALERT
            </span>
          </div>
          {/* Hub name */}
          <div style={{
            fontFamily: '"Space Grotesk", sans-serif',
            fontSize: '20px', fontWeight: 600, color: '#e4e1ed',
            letterSpacing: '-0.01em', marginBottom: '4px',
          }}>
            {alert.hubName}
          </div>
          <div style={{ fontSize: '11px', color: '#908fa0' }}>
            Disruption detected · {time}
          </div>
        </div>
        <button onClick={onClose} style={{
          width: '30px', height: '30px', borderRadius: '6px',
          background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)',
          color: '#908fa0', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontFamily: 'inherit', fontSize: '14px', transition: 'all 0.15s',
        }}>✕</button>
      </div>

      {/* ── Scrollable Body ── */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* Congestion Level */}
        <MetricSection label="Congestion Level">
          <div style={{ marginBottom: '6px' }}>
            <div style={{
              height: '6px', borderRadius: '99px',
              background: 'rgba(255,255,255,0.06)', overflow: 'hidden',
            }}>
              <div style={{
                height: '100%', borderRadius: '99px',
                width: `${alert.congestionLevel}%`,
                background: 'linear-gradient(90deg, #f59e0b, #f43f5e)',
                boxShadow: '0 0 8px rgba(244,63,94,0.4)',
                transition: 'width 0.6s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '6px' }}>
              <span style={{ fontSize: '11px', color: '#464554' }}>0%</span>
              <span style={{ fontSize: '13px', fontFamily: '"Space Grotesk",sans-serif', fontWeight: 700, color: '#f43f5e' }}>
                {alert.congestionLevel}% — Critical
              </span>
            </div>
          </div>
        </MetricSection>

        {/* Ripple Risk Score */}
        {alert.rippleScore !== undefined && (
          <MetricSection label="Ripple Risk Score">
            <div style={{
              display: 'flex', alignItems: 'center', gap: '12px',
            }}>
              <div style={{
                width: '52px', height: '52px', borderRadius: '50%',
                background: `conic-gradient(${riskColor} ${alert.rippleScore * 3.6}deg, rgba(255,255,255,0.06) 0deg)`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                position: 'relative',
                boxShadow: `0 0 16px ${riskColor}40`,
              }}>
                <div style={{
                  width: '38px', height: '38px', borderRadius: '50%',
                  background: '#0d0d15',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <span style={{ fontFamily: '"Space Grotesk",sans-serif', fontSize: '13px', fontWeight: 700, color: riskColor }}>
                    {alert.rippleScore}
                  </span>
                </div>
              </div>
              <div>
                <div style={{ fontSize: '11px', color: '#908fa0' }}>of 100</div>
                <div style={{ fontSize: '12px', fontWeight: 600, color: riskColor, marginTop: '2px' }}>
                  {alert.rippleScore >= 70 ? 'High Risk' : alert.rippleScore >= 40 ? 'Moderate' : 'Low Risk'}
                </div>
              </div>
            </div>
          </MetricSection>
        )}

        {/* Affected Shipments */}
        {(alert.affectedShipments || []).length > 0 && (
          <MetricSection label={`${alert.affectedShipments.length} Shipments Affected`}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {alert.affectedShipments.map(s => {
                const sc = s.riskScore >= 70 ? '#f43f5e' : '#ffb95f';
                return (
                  <div key={s.shipmentId} style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                    padding: '9px 12px', borderRadius: '6px',
                    background: 'rgba(255,255,255,0.02)',
                    border: `1px solid ${sc}22`,
                    borderLeft: `3px solid ${sc}`,
                  }}>
                    <div>
                      <div style={{
                        fontFamily: '"Space Grotesk",sans-serif', fontSize: '12px',
                        fontWeight: 600, color: '#e4e1ed', letterSpacing: '0.02em',
                      }}>{s.shipmentId}</div>
                      <div style={{ fontSize: '11px', color: '#908fa0', marginTop: '2px' }}>
                        {s.origin?.city} → {s.destination?.city} · {s.carrier}
                      </div>
                    </div>
                    <div style={{
                      padding: '3px 9px', borderRadius: '99px', fontSize: '11px', fontWeight: 700,
                      background: `${sc}18`, color: sc,
                    }}>
                      Risk {s.riskScore}
                    </div>
                  </div>
                );
              })}
            </div>
          </MetricSection>
        )}

        {/* Reroute Options */}
        {reroutes.length > 0 && (
          <MetricSection label="Reroute Options">
            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              {reroutes.map((r, i) => (
                <div key={i} style={{
                  padding: '10px 12px', borderRadius: '6px',
                  background: i === 0 ? 'rgba(99,102,241,0.06)' : 'rgba(255,255,255,0.02)',
                  border: `1px solid ${i === 0 ? 'rgba(99,102,241,0.25)' : 'rgba(255,255,255,0.06)'}`,
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '7px' }}>
                    <span style={{ fontSize: '12px', fontWeight: 600, color: i === 0 ? '#c0c1ff' : '#c7c4d7' }}>
                      {i === 0 && <span style={{ color: '#4edea3', marginRight: '5px' }}>★</span>}
                      {r.name}
                    </span>
                    <span style={{ fontSize: '11px', fontWeight: 700, color: '#4edea3' }}>
                      {r.reliabilityScore}%
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                    <Tag color="#ffb95f">+{Math.round(r.extraTimeMins / 60)}h delay</Tag>
                    <Tag color="#908fa0">+${r.extraCostUSD}</Tag>
                    <Tag color="#4edea3">reliable</Tag>
                  </div>
                </div>
              ))}
            </div>
          </MetricSection>
        )}

        {/* AI Analysis */}
        <MetricSection label="AI Analysis · Gemini">
          <div style={{
            padding: '12px', borderRadius: '6px',
            background: 'rgba(99,102,241,0.04)',
            border: '1px solid rgba(99,102,241,0.15)',
          }}>
            {alert.aiMessage ? (
              <p style={{ margin: 0, fontSize: '13px', lineHeight: 1.65, color: '#c7c4d7' }}>
                {alert.aiMessage}
              </p>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', color: '#908fa0', fontSize: '12px' }}>
                <div style={{
                  width: '14px', height: '14px', borderRadius: '50%',
                  border: '2px solid #6366f1', borderTopColor: 'transparent',
                  animation: 'spin 0.8s linear infinite',
                }} />
                Generating analysis…
              </div>
            )}
          </div>
        </MetricSection>

      </div>

      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=Inter:wght@400;500;600;700&display=swap');
        @keyframes slideInPanel { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        @keyframes alertPulse { 0%,100% { opacity:1; box-shadow:0 0 10px #f43f5e; } 50% { opacity:0.5; box-shadow:0 0 18px #f43f5e; } }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

function MetricSection({ label, children }) {
  return (
    <div>
      <div style={{
        fontSize: '10px', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase',
        color: '#464554', marginBottom: '8px',
      }}>{label}</div>
      {children}
    </div>
  );
}

function Tag({ color, children }) {
  return (
    <span style={{
      padding: '2px 8px', borderRadius: '99px', fontSize: '10px', fontWeight: 600,
      background: `${color}18`, color,
    }}>{children}</span>
  );
}