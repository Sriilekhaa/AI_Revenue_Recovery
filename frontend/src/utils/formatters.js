/* Formatting utilities */

export function formatINR(amount) {
  if (amount === null || amount === undefined) return '₹0';
  
  // Indian number formatting (lakhs, crores)
  const absAmount = Math.abs(amount);
  let formatted;
  
  if (absAmount >= 10000000) {
    formatted = (absAmount / 10000000).toFixed(2) + ' Cr';
  } else if (absAmount >= 100000) {
    formatted = (absAmount / 100000).toFixed(2) + ' L';
  } else {
    formatted = absAmount.toLocaleString('en-IN', { 
      maximumFractionDigits: 0 
    });
  }
  
  return `₹${amount < 0 ? '-' : ''}${formatted}`;
}

export function formatINRFull(amount) {
  if (amount === null || amount === undefined) return '₹0';
  return '₹' + amount.toLocaleString('en-IN', { 
    maximumFractionDigits: 2,
    minimumFractionDigits: 0,
  });
}

export function formatPercent(value) {
  if (value === null || value === undefined) return '0%';
  return `${value.toFixed(1)}%`;
}

export function formatDateTime(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    day: '2-digit',
    month: 'short',
    hour12: true,
  });
}

export function formatTime(dateStr) {
  if (!dateStr) return '—';
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-IN', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function formatDuration(minutes) {
  if (!minutes) return '—';
  if (minutes < 60) return `${Math.round(minutes)}m`;
  if (minutes < 1440) return `${(minutes / 60).toFixed(1)}h`;
  return `${(minutes / 1440).toFixed(1)}d`;
}

export function truncateId(id) {
  if (!id) return '—';
  return id.length > 16 ? id.slice(0, 8) + '...' + id.slice(-4) : id;
}
