import { useState } from 'react';

export default function Navbar({ stats, connected, onSimulate, onAuction }) {
  const [simulating, setSimulating] = useState(false);
  const [simDone, setSimDone]       = useState(false);
  const [simError, setSimError]     = useState(false);

  const handleSimulate = async () => {
    if (simulating) return;
    setSimulating(true);
    setSimDone(false);
    setSimError(false);
    try {
      await onSimulate();
      setSimDone(true);
      setTimeout(() => setSimDone(false), 3000);
    } catch {
      setSimError(true);
      setTimeout(() => setSimError(false), 3000);
    } finally {
      setSimulating(false);
    }
  };

  const simLabel = simulating ? 'Simulating…' : simError ? 'Offline' : simDone ? 'Fired ✓' : 'Simulate Disruption';

  return (
    <nav style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 200,
      height: '56px',
      background: 'rgba(10, 13, 26, 0.85)',
      backdropFilter: 'blur(20px)',
      WebkitBackdropFilter: 'blur(20px)',
      borderBottom: '1px solid rgba(255,255,255,0.06)',
      display: 'flex', alignItems: 'center',
      padding: '0 24px', gap: '4px',
      fontFamily: '"Inter", sans-serif',
    }}>

      {/* Brand */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginRight: '20px' }}>
        <div style={{
          width: '32px', height: '32px', borderRadius: '8px',
          background: 'linear-gradient(135deg, #6366f1 0%, #4f46e5 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 0 16px rgba(99,102,241,0.4)',
        }}>
          <span className="material-icons" style={{ color: '#fff', fontSize: '16px' }}>bolt</span>
        </div>
        <div>
          <div style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '15px', fontWeight: 700, color: '#e4e1ed', letterSpacing: '-0.01em' }}>
            FlowSight
          </div>
          <div style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.1em', color: '#908fa0', textTransform: 'uppercase' }}>
            Logistics Command
          </div>
        </div>
      </div>

      {/* Divider */}
      <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.06)', margin: '0 12px' }} />

      {/* Stats */}
      <StatPill label="Total" value={stats.total} color="#c0c1ff" />
      <StatPill label="On Time" value={stats.onTime} color="#4edea3" />
      <StatPill label="At Risk" value={stats.atRisk} color="#ffb95f" />
      <StatPill label="Delayed" value={stats.delayed} color="#f43f5e" />

      <div style={{ width: '1px', height: '28px', background: 'rgba(255,255,255,0.06)', margin: '0 12px' }} />

      <StatPill label="Disrupted Hubs" value={stats.disrupted} color="#f43f5e" />

      {/* Spacer */}
      <div style={{ flex: 1 }} />

      {/* Live indicator */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '7px',
        padding: '5px 12px', borderRadius: '99px',
        background: connected ? 'rgba(78,222,163,0.08)' : 'rgba(244,63,94,0.08)',
        border: `1px solid ${connected ? 'rgba(78,222,163,0.2)' : 'rgba(244,63,94,0.2)'}`,
        marginRight: '8px',
      }}>
        <div style={{
          width: '7px', height: '7px', borderRadius: '50%',
          background: connected ? '#4edea3' : '#f43f5e',
          boxShadow: connected ? '0 0 8px #4edea3' : '0 0 8px #f43f5e',
          animation: connected ? 'navPulse 2s infinite' : 'none',
        }} />
        <span style={{ fontSize: '11px', fontWeight: 600, letterSpacing: '0.06em', color: connected ? '#4edea3' : '#f43f5e' }}>
          {connected ? 'LIVE' : 'OFFLINE'}
        </span>
      </div>

      {/* Simulate button */}
      <button
        id="simulate-btn"
        onClick={handleSimulate}
        disabled={simulating}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '7px 14px', borderRadius: '6px',
          fontFamily: '"Inter", sans-serif', fontSize: '12px', fontWeight: 600,
          cursor: simulating ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease',
          border: simError
            ? '1px solid rgba(244,63,94,0.4)'
            : simDone
            ? '1px solid rgba(78,222,163,0.4)'
            : '1px solid rgba(99,102,241,0.35)',
          background: simError
            ? 'rgba(244,63,94,0.1)'
            : simDone
            ? 'rgba(78,222,163,0.1)'
            : 'rgba(99,102,241,0.12)',
          color: simError ? '#f43f5e' : simDone ? '#4edea3' : '#c0c1ff',
          opacity: simulating ? 0.6 : 1,
        }}
      >
        <span className="material-icons" style={{ fontSize: '14px' }}>
          {simError ? 'wifi_off' : simDone ? 'check_circle' : 'warning_amber'}
        </span>
        {simLabel}
      </button>

      {/* Auction button */}
      <button
        onClick={onAuction}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '7px 14px', borderRadius: '6px', marginLeft: '6px',
          fontFamily: '"Inter", sans-serif', fontSize: '12px', fontWeight: 600,
          cursor: 'pointer', transition: 'all 0.2s ease',
          border: '1px solid rgba(255,185,95,0.35)',
          background: 'rgba(255,185,95,0.08)',
          color: '#ffb95f',
        }}
      >
        <span className="material-icons" style={{ fontSize: '14px' }}>gavel</span>
        Port Auctions
      </button>

      <style>{`
        @import url('https://fonts.googleapis.com/icon?family=Material+Icons');
        @keyframes navPulse {
          0%, 100% { opacity: 1; box-shadow: 0 0 8px #4edea3; }
          50%       { opacity: 0.6; box-shadow: 0 0 14px #4edea3; }
        }
      `}</style>
    </nav>
  );
}

function StatPill({ label, value, color }) {
  return (
    <div style={{
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '4px 12px', borderRadius: '6px',
      background: 'rgba(255,255,255,0.02)',
    }}>
      <span style={{ fontFamily: '"Space Grotesk", sans-serif', fontSize: '16px', fontWeight: 700, color, lineHeight: 1.1 }}>
        {value ?? '—'}
      </span>
      <span style={{ fontSize: '10px', fontWeight: 600, letterSpacing: '0.08em', color: '#908fa0', textTransform: 'uppercase', marginTop: '2px' }}>
        {label}
      </span>
    </div>
  );
}