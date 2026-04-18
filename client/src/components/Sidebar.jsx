const getRiskColor = (score) => {
  if (score >= 70) return '#ef4444';
  if (score >= 40) return '#f59e0b';
  return '#22c55e';
};

export default function Sidebar({ shipments }) {
  const sorted = [...shipments].sort((a, b) => b.riskScore - a.riskScore);

  return (
    <div className="sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Active Shipments</span>
        <span className="sidebar-count">{shipments.length}</span>
      </div>

      <div className="sidebar-list">
        {sorted.map(s => {
          const color = getRiskColor(s.riskScore);
          return (
            <div key={s.shipmentId} className={`shipment-card ${s.status}`}>
              <div className="card-top">
                <span className="card-id">{s.shipmentId}</span>
                <div className={`status-badge ${s.status}`}>
                  <div className="status-dot" />
                  {s.status === 'on-time' ? 'On Time' : s.status === 'at-risk' ? 'At Risk' : 'Delayed'}
                </div>
              </div>

              <div className="card-route">
                {s.origin?.city} → {s.destination?.city}
              </div>

              <div className="card-bottom">
                <span className="card-carrier">{s.carrier}</span>
                <div className="risk-bar-wrap">
                  <div className="risk-bar-track">
                    <div
                      className="risk-bar-fill"
                      style={{ width: `${s.riskScore}%`, background: color }}
                    />
                  </div>
                </div>
                <span className="risk-score-text" style={{ color }}>
                  {s.riskScore}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}