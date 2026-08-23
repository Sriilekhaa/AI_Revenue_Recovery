import { formatINR, formatTime } from '../utils/formatters';
import { STATUS_CONFIG, ROOT_CAUSE_LABELS, ACTION_LABELS } from '../utils/constants';
import './LivePipeline.css';

export default function LivePipeline({ events = [] }) {
  // Take most recent 6 events
  const recent = events
    .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
    .slice(0, 6);

  if (recent.length === 0) {
    return (
      <div className="card live-pipeline">
        <div className="card-header">
          <h3 className="card-title">Live Pipeline: Recent Interventions</h3>
        </div>
        <div className="pipeline-empty">
          <p>No events yet. Generate a batch to start the pipeline.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="card live-pipeline">
      <div className="card-header">
        <h3 className="card-title">Live Pipeline: Recent Interventions</h3>
      </div>
      <div className="pipeline-list stagger-children">
        {recent.map((event, i) => {
          const isRecovered = event.status === 'recovered';
          const isSmartRetry = event.assigned_action === 'smart_retry' || event.status === 'retry_scheduled';
          const rootCause = ROOT_CAUSE_LABELS[event.root_cause] || event.root_cause || 'Bank Timeout';
          const action = ACTION_LABELS[event.assigned_action] || event.assigned_action || 'Smart Retry';

          let badgeText = 'Queued';
          let badgeClass = 'badge-queued';
          let boxClass = 'box-queued';
          let dotType = 'dot-queued';

          if (isRecovered) {
            badgeText = 'Recovered';
            badgeClass = 'badge-recovered';
            boxClass = 'box-recovered';
            dotType = 'dot-recovered';
          } else if (isSmartRetry || event.status === 'contacted') {
            badgeText = 'Smart-Retry Initiated';
            badgeClass = 'badge-retry';
            boxClass = 'box-retry';
            dotType = 'dot-retry';
          }

          let eventTitle = '';
          if (event.event_type === 'payment_failed') {
            eventTitle = `Payment Failed (${(event.payment_method || 'UPI').toUpperCase()})`;
          } else if (event.event_type === 'mandate_failed') {
            eventTitle = 'Auto-Debit Failed (eNACH)';
          } else if (event.root_cause === 'insufficient_funds') {
            eventTitle = 'Card Decline (Insufficient Funds)';
          } else {
            eventTitle = `${event.event_type?.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())} (${(event.payment_method || '').toUpperCase()})`;
          }

          return (
            <div className="pipeline-item" key={event.transaction_id}>
              <div className="pipeline-dot-wrapper">
                <div className={`pipeline-dot ${dotType}`}>
                  {isRecovered ? (
                    <svg width="12" height="12" viewBox="0 0 12 12">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="2" fill="none" strokeLinecap="round" />
                    </svg>
                  ) : (
                    <div className="inner-dot" />
                  )}
                </div>
                {i < recent.length - 1 && <div className="pipeline-line"></div>}
              </div>

              <div className="pipeline-content">
                <div className="pipeline-row">
                  <div className="pipeline-event-info">
                    <span className="pipeline-event-type">{eventTitle}</span>
                    <span className="pipeline-meta">
                      {formatTime(event.timestamp)} — {formatINR(event.amount)}
                    </span>
                  </div>
                  <span className={`badge-pill ${badgeClass}`}>
                    {badgeText}
                  </span>
                </div>

                <div className={`pipeline-detail-card ${boxClass}`}>
                  {isRecovered ? (
                    <span>
                      <strong>Action:</strong> Sent payment recovery link & split offer via WhatsApp. Customer completed transaction.
                    </span>
                  ) : isSmartRetry ? (
                    <span>
                      <strong>Diagnosis:</strong> {rootCause}. <strong>Policy:</strong> Wait {event.assigned_action === 'smart_retry' ? '300s' : 'cooldown'}, then retry via Payment Link.
                    </span>
                  ) : (
                    <span>
                      <strong>Status:</strong> Waiting for optimal contact window (AI historical response model).
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
