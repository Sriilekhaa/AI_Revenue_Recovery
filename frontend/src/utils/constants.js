/* Color palette, status mappings, and constants */

export const STATUS_CONFIG = {
  recovered: { label: 'Recovered', color: '#0d9488', bg: '#f0fdfa', border: '#99f6e4' },
  contacted: { label: 'Contacted', color: '#2563eb', bg: '#eff6ff', border: '#bfdbfe' },
  diagnosed: { label: 'Diagnosed', color: '#7c3aed', bg: '#f5f3ff', border: '#ddd6fe' },
  detected: { label: 'Detected', color: '#d97706', bg: '#fffbeb', border: '#fef3c7' },
  fraud_flagged: { label: 'Fraud Flagged', color: '#dc2626', bg: '#fef2f2', border: '#fee2e2' },
  exception: { label: 'Exception', color: '#64748b', bg: '#f8fafc', border: '#e2e8f0' },
  snoozed: { label: 'Snoozed', color: '#94a3b8', bg: '#f8fafc', border: '#e2e8f0' },
  policy_assigned: { label: 'Policy Assigned', color: '#059669', bg: '#ecfdf5', border: '#a7f3d0' },
  ingested: { label: 'Ingested', color: '#6b7280', bg: '#f9fafb', border: '#e5e7eb' },
  hitl_pending: { label: 'HITL Pending', color: '#ea580c', bg: '#fff7ed', border: '#fed7aa' },
  retry_scheduled: { label: 'Retry Scheduled', color: '#0284c7', bg: '#f0f9ff', border: '#bae6fd' },
};

export const ROOT_CAUSE_LABELS = {
  insufficient_funds: 'Insufficient Funds',
  expired_card: 'Expired Card',
  bank_declined: 'Bank Declined',
  gateway_timeout: 'Gateway Timeout',
  customer_abandoned: 'Customer Abandoned',
  mandate_revoked: 'Mandate Revoked',
  fraud_suspected: 'Fraud Suspected',
  '3ds_dropout': '3DS Dropout',
  upi_timeout: 'UPI Timeout',
  vpa_invalid: 'VPA Invalid',
  network_error: 'Network Error',
  unknown: 'Unknown',
};

export const ACTION_LABELS = {
  smart_retry: 'Smart Retry',
  alt_payment_method: 'Alt Payment Method',
  payment_link: 'Payment Link',
  discount_nudge: 'Discount Nudge',
  human_escalation: 'Human Escalation',
  snooze: 'Snooze',
  none: 'None',
};

export const EVENT_TYPE_LABELS = {
  payment_failed: 'Payment Failed',
  checkout_abandoned: 'Checkout Abandoned',
  mandate_failed: 'Mandate Failed',
  invoice_overdue: 'Invoice Overdue',
};

export const PAYMENT_METHOD_LABELS = {
  upi: 'UPI',
  card: 'Card',
  netbanking: 'Netbanking',
  wallet: 'Wallet',
  emandate: 'eMandate',
};

export const CHART_COLORS = [
  '#3b82f6', '#0d9488', '#f59e0b', '#ef4444',
  '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16',
  '#f97316', '#6366f1',
];

export const API_BASE = 'http://localhost:8000';
