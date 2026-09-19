import { useEffect, useState } from 'react'
import { api } from '../api/client.js'

const LEVEL_BADGE = {
  ERROR: 'badge-red',
  WARN:  'badge-amber',
  INFO:  'badge-blue',
}

function fmt(ts) {
  if (!ts) return '—'
  const d = new Date(ts)
  return d.toLocaleString('en-AU', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit', second: '2-digit',
  })
}

export default function SystemLog() {
  const [logs, setLogs] = useState([])
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api.getSystemLogs()
      .then(setLogs)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return (
    <div className="loading">
      <div className="loading-dots">
        <div className="loading-dot" /><div className="loading-dot" /><div className="loading-dot" />
      </div>
    </div>
  )

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>System Log</h1>
          <p className="muted small">{logs.length} event{logs.length !== 1 ? 's' : ''} recorded</p>
        </div>
      </div>

      {error && <div className="error-banner">{error}</div>}

      <table>
        <thead>
          <tr>
            <th>Timestamp</th>
            <th>Level</th>
            <th>Message</th>
            <th>Context</th>
            <th>Triggered By</th>
          </tr>
        </thead>
        <tbody>
          {logs.length === 0 && (
            <tr><td colSpan={5} className="empty-state">No events logged yet.</td></tr>
          )}
          {logs.map((l) => (
            <tr key={l.id}>
              <td className="muted small" style={{ whiteSpace: 'nowrap' }}>{fmt(l.timestamp)}</td>
              <td>
                <span className={`badge ${LEVEL_BADGE[l.level] ?? 'badge-gray'}`}>{l.level}</span>
              </td>
              <td style={{ maxWidth: 380, wordBreak: 'break-word' }}>{l.message}</td>
              <td className="muted small">{l.context ?? '—'}</td>
              <td className="muted small">{l.triggeredBy ?? 'system'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
