import React from 'react'

const STATUS_MAP = {
  active:      { label: 'Active',      cls: 'badge-red'    },
  created:     { label: 'Created',     cls: 'badge-red'    },
  pending:     { label: 'Pending',     cls: 'badge-yellow' },
  dispatched:  { label: 'In Progress', cls: 'badge-yellow' },
  in_progress: { label: 'In Progress', cls: 'badge-yellow' },
  resolved:    { label: 'Resolved',    cls: 'badge-green'  },
  closed:      { label: 'Closed',      cls: 'badge-green'  },
  available:   { label: 'Available',   cls: 'badge-green'  },
  online:      { label: 'Available',   cls: 'badge-green'  },
  engaged:     { label: 'Engaged',     cls: 'badge-red'    },
  offline:     { label: 'Offline',     cls: 'badge-blue'   },
}

export default function StatusBadge({ status }) {
  const s = STATUS_MAP[status?.toLowerCase()] || { label: status || 'Unknown', cls: 'badge-yellow' }
  return <span className={`badge ${s.cls}`}>{s.label}</span>
}
