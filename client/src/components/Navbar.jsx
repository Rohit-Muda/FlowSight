import { useState } from 'react';

export default function Navbar({ stats, connected, onSimulate, onAuction }) {
  const [simulating, setSimulating] = useState(false);
  const [simDone, setSimDone] = useState(false);

  const handleSimulate = async () => {
    if (simulating) return;
    setSimulating(true);
    setSimDone(false);
    try {
      await onSimulate();
      setSimDone(true);
      setTimeout(() => setSimDone(false), 3000);
    } finally {
      setSimulating(false);
    }
  };

  const btnLabel = simulating ? 'Simulating…' : simDone ? '✓ Disruption Fired' : 'Simulate Disruption';
  const btnStyle = simDone ? { background: 'rgba(34,197,94,0.12)', borderColor: 'rgba(34,197,94,0.4)', color: '#22c55e' } : {};

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <div className="brand-icon">
          <svg viewBox="0 0 14 14" strokeWidth="1.5" strokeLinecap="round">
            <path d="M2 7 L5 4 L9 6 L12 3"/>
            <circle cx="12" cy="3" r="1.5" fill="#6366f1"/>
          </svg>
        </div>
        <span className="brand-name">FlowSight</span>
      </div>

      <div className="navbar-divider" />

      <div className="stat-item">
        <span className="stat-label">Total</span>
        <span className="stat-value blue">{stats.total}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">On Time</span>
        <span className="stat-value green">{stats.onTime}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">At Risk</span>
        <span className="stat-value amber">{stats.atRisk}</span>
      </div>
      <div className="stat-item">
        <span className="stat-label">Delayed</span>
        <span className="stat-value red">{stats.delayed}</span>
      </div>

      <div className="navbar-divider" />

      <div className="stat-item">
        <span className="stat-label">Disrupted Hubs</span>
        <span className="stat-value red">{stats.disrupted}</span>
      </div>

      <div className="navbar-right">
        <div className={`live-badge ${connected ? 'connected' : 'disconnected'}`}>
          <div className="live-dot" />
          {connected ? 'Live' : 'Offline'}
        </div>
        <button
          id="simulate-btn"
          className="simulate-btn"
          onClick={handleSimulate}
          disabled={simulating}
          style={btnStyle}
        >
          {btnLabel}
        </button>
        <button
          className="simulate-btn"
          onClick={onAuction}
          style={{ borderColor: 'rgba(245,158,11,0.4)', color: '#f59e0b', background: 'rgba(245,158,11,0.08)' }}
        >
          Port Auctions
        </button>
      </div>
    </nav>
  );
}