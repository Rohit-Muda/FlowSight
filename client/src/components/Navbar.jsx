export default function Navbar({ stats, connected, onSimulate }) {
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
        <button className="simulate-btn" onClick={onSimulate}>
          Simulate Disruption
        </button>
      </div>
    </nav>
  );
}