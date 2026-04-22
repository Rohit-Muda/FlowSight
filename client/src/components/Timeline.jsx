import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer
} from 'recharts';

const formatTime = (isoString) => {
  const d = new Date(isoString);
  return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const CustomTooltip = ({ active, payload }) => {
  if (!active || !payload?.length) return null;
  const d = payload[0].payload;
  return (
    <div style={{
      background: 'rgba(13,17,32,0.97)',
      border: '0.5px solid rgba(255,255,255,0.12)',
      borderRadius: '8px',
      padding: '10px 12px',
      fontSize: '12px'
    }}>
      <div style={{ color: '#e2e8f0', fontWeight: 600, marginBottom: 4 }}>
        {d.hubName}
      </div>
      <div style={{ color: '#64748b', marginBottom: 2 }}>
        Congestion: <span style={{ color: '#ef4444', fontWeight: 600 }}>
          {d.congestionLevel}%
        </span>
      </div>
      <div style={{ color: '#64748b', marginBottom: 2 }}>
        Affected: <span style={{ color: '#f59e0b', fontWeight: 600 }}>
          {d.totalAffected} shipments
        </span>
      </div>
      <div style={{ color: '#475569', fontSize: 11, marginTop: 4 }}>
        {d.time}
      </div>
    </div>
  );
};

export default function Timeline({ logs }) {
  const chartData = [...logs]
    .reverse()
    .map(log => ({
      time: formatTime(log.createdAt || log.timestamp),
      congestionLevel: log.congestionLevel,
      hubName: log.hubName,
      totalAffected: log.totalAffected,
      createdAt: log.createdAt || log.timestamp
    }));

  return (
    <div className="timeline-container">
      <div className="timeline-header">
        <span className="timeline-title">Disruption Timeline</span>
        <span className="timeline-count">
          {logs.length} event{logs.length !== 1 ? 's' : ''}
        </span>
      </div>

      {chartData.length === 0 ? (
        <div className="timeline-empty">
          No disruptions recorded — system nominal
        </div>
      ) : (
        <div className="timeline-chart">
          <ResponsiveContainer width="100%" height="100%">
            {/* Recharts 3: accessibilityLayer is now true by default.
                We explicitly set false to preserve previous behaviour and
                avoid unexpected DOM changes in our dark-theme chart. */}
            <AreaChart
              data={chartData}
              margin={{ top: 10, right: 20, left: -20, bottom: 0 }}
              accessibilityLayer={false}
            >
              <defs>
                <linearGradient id="congestionGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#ef4444" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#ef4444" stopOpacity={0} />
                </linearGradient>
              </defs>

              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(255,255,255,0.04)"
                vertical={false}
              />

              <XAxis
                dataKey="time"
                tick={{ fill: '#475569', fontSize: 10 }}
                axisLine={{ stroke: 'rgba(255,255,255,0.06)' }}
                tickLine={false}
              />

              <YAxis
                domain={[0, 100]}
                tick={{ fill: '#475569', fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />

              <Tooltip content={<CustomTooltip />} />

              {/* Recharts 3: alwaysShow prop removed from ReferenceLine.
                  Use ifOverflow="extendDomain" if needed. Standard label still works. */}
              <ReferenceLine
                y={70}
                stroke="rgba(245,158,11,0.4)"
                strokeDasharray="4 4"
                label={{
                  value: 'Threshold',
                  fill: '#f59e0b',
                  fontSize: 9,
                  position: 'insideTopRight'
                }}
              />

              <Area
                type="monotone"
                dataKey="congestionLevel"
                stroke="#ef4444"
                strokeWidth={1.5}
                fill="url(#congestionGrad)"
                dot={{ fill: '#ef4444', r: 3, strokeWidth: 0 }}
                activeDot={{ r: 5, fill: '#ef4444', stroke: '#07090f', strokeWidth: 2 }}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}