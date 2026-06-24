import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

function apiClient() {
  const token = localStorage.getItem('token')
  return axios.create({ headers: { Authorization: `Bearer ${token}` } })
}

const ACTION_LABELS = {
  login:          { label: 'Hyrje',          color: '#00d4aa', icon: '🔐' },
  logout:         { label: 'Dalje',          color: 'var(--muted)', icon: '🚪' },
  import:         { label: 'Import CSV',     color: '#6c63ff', icon: '📂' },
  update_profile: { label: 'Profili',        color: '#f59e0b', icon: '✏️' },
  forecast:       { label: 'Parashikim',     color: '#ec4899', icon: '🤖' },
  register:       { label: 'Regjistrim',     color: '#00d4aa', icon: '✅' },
}

function getAction(action) {
  return ACTION_LABELS[action] || { label: action, color: 'var(--muted)', icon: '📋' }
}

function fmtDate(raw) {
  const d = new Date(raw)
  return d.toLocaleString('sq-AL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
}

export default function Logs() {
  const navigate  = useNavigate()
  const user      = JSON.parse(localStorage.getItem('user') || '{}')
  const [logs,    setLogs]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    apiClient().get('/api/logs')
      .then(res => setLogs(res.data))
      .catch(err => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.clear(); navigate('/login')
        } else {
          setError('Gabim gjatë ngarkimit të logs.')
        }
      })
      .finally(() => setLoading(false))
  }, [navigate])

  const actions   = ['all', ...new Set(logs.map(l => l.action))]
  const filtered  = filter === 'all' ? logs : logs.filter(l => l.action === filter)

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/dashboard" style={styles.backBtn}>← Dashboard</Link>
          <div>
            <h1 style={styles.title}>Aktiviteti i Sistemit</h1>
            <span style={styles.subtitle}>Logs nga MongoDB · {user.username}</span>
          </div>
        </div>
        <span style={styles.countBadge}>{filtered.length} regjistrime</span>
      </header>

      <main style={styles.main}>
        {/* Filter */}
        <div style={styles.filterBar}>
          {actions.map(a => (
            <button key={a} style={styles.filterBtn(filter === a)} onClick={() => setFilter(a)}>
              {a === 'all' ? 'Të gjitha' : getAction(a).icon + ' ' + getAction(a).label}
            </button>
          ))}
        </div>

        {loading && <p style={styles.status}>Duke ngarkuar...</p>}
        {error   && <p style={{ ...styles.status, color: '#ff6b6b' }}>{error}</p>}
        {!loading && !error && filtered.length === 0 && (
          <p style={styles.status}>Nuk ka aktivitet të regjistruar.</p>
        )}

        {!loading && !error && filtered.length > 0 && (
          <div style={styles.table}>
            <div style={styles.tableHead}>
              <span>Veprimi</span>
              <span>Përdoruesi</span>
              <span>Detaje</span>
              <span>Data & Ora</span>
            </div>
            {filtered.map((log, i) => {
              const act = getAction(log.action)
              return (
                <div key={log._id || i} style={styles.tableRow}>
                  <span>
                    <span style={{ ...styles.actionBadge, borderColor: act.color, color: act.color }}>
                      {act.icon} {act.label}
                    </span>
                  </span>
                  <span style={styles.username}>{log.username}</span>
                  <span style={styles.details}>
                    {log.details ? JSON.stringify(log.details) : '—'}
                  </span>
                  <span style={styles.date}>{fmtDate(log.created_at)}</span>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}

const styles = {
  page:        { minHeight: '100vh', background: 'var(--bg)', fontFamily: "'Segoe UI', system-ui, sans-serif", color: 'var(--text)' },
  header:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '12px' },
  backBtn:     { color: 'var(--muted)', textDecoration: 'none', fontSize: '0.88rem', padding: '6px 12px', border: '1px solid #2a2d3a', borderRadius: '8px' },
  title:       { fontSize: '1.3rem', fontWeight: 700, margin: 0 },
  subtitle:    { fontSize: '0.78rem', color: 'var(--muted)' },
  countBadge:  { fontSize: '0.8rem', color: 'var(--muted)', padding: '4px 12px', border: '1px solid #2a2d3a', borderRadius: '20px' },
  main:        { padding: '24px 32px' },
  filterBar:   { display: 'flex', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' },
  filterBtn:   (active) => ({
    padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.82rem',
    background: active ? '#6c63ff' : 'transparent',
    border: `1px solid ${active ? '#6c63ff' : '#2a2d3a'}`,
    color: active ? '#fff' : '#7b7f96',
  }),
  status:      { color: 'var(--muted)', textAlign: 'center', padding: '48px 0' },
  table:       { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' },
  tableHead:   { display: 'grid', gridTemplateColumns: '160px 140px 1fr 160px', padding: '12px 20px', background: '#0f1117', color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' },
  tableRow:    { display: 'grid', gridTemplateColumns: '160px 140px 1fr 160px', padding: '14px 20px', borderTop: '1px solid var(--border)', alignItems: 'center', fontSize: '0.88rem' },
  actionBadge: { display: 'inline-block', padding: '3px 10px', borderRadius: '12px', border: '1px solid', fontSize: '0.8rem' },
  username:    { color: 'var(--text)', fontWeight: 500 },
  details:     { color: 'var(--muted)', fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  date:        { color: 'var(--muted)', fontSize: '0.82rem' },
}