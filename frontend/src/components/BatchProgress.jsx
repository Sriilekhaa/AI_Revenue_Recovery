import './BatchProgress.css';

export default function BatchProgress({ funnel = {} }) {
  const stages = [
    { key: 'ingested', label: 'Ingested', color: 'var(--neutral-400)' },
    { key: 'diagnosed', label: 'Diagnosed', color: 'var(--primary-400)' },
    { key: 'contacted', label: 'Contacted', color: 'var(--primary-500)' },
    { key: 'recovered', label: 'Recovered', color: 'var(--success-500)' },
  ];

  const maxCount = Math.max(...stages.map(s => funnel[s.key] || 0), 1);

  return (
    <div className="card batch-progress">
      <div className="card-header">
        <h3 className="card-title">Batch Progress</h3>
      </div>
      <div className="progress-bars">
        {stages.map((stage, i) => {
          const count = funnel[stage.key] || 0;
          const pct = (count / maxCount) * 100;
          return (
            <div className="progress-row" key={stage.key}>
              <span className="progress-label">{stage.label}</span>
              <div className="progress-track">
                <div
                  className="progress-fill"
                  style={{
                    width: `${pct}%`,
                    backgroundColor: stage.color,
                    animationDelay: `${i * 150}ms`,
                  }}
                />
              </div>
              <span className="progress-count">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
