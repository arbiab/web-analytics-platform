import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

function apiClient() {
  const token = localStorage.getItem('token')
  return axios.create({ headers: { Authorization: `Bearer ${token}` } })
}

function fmtDate(raw) {
  return new Date(raw).toLocaleString('sq-AL', {
    day: '2-digit', month: '2-digit', year: 'numeric',
    hour: '2-digit', minute: '2-digit'
  })
}

const STATUS_STYLE = {
  Completed: { color: '#00d4aa', bg: 'rgba(0,212,170,0.1)',  icon: '✅' },
  Pending:   { color: '#f59e0b', bg: 'rgba(245,158,11,0.1)', icon: '⏳' },
  Failed:    { color: '#ff6b6b', bg: 'rgba(255,107,107,0.1)',icon: '❌' },
}

export default function ModelRuns() {
  const navigate  = useNavigate()
  const [runs,    setRuns]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [filter,  setFilter]  = useState('all')

  useEffect(() => {
    apiClient().get('/api/model-runs')
      .then(res => setRuns(res.data))
      .catch(err => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.clear(); navigate('/login')
        } else {
          setError('Gabim gjatë ngarkimit.')
        }
      })
      .finally(() => setLoading(false))
  }, [navigate])

  const statuses = ['all', 'Completed', 'Pending', 'Failed']
  const filtered = filter === 'all' ? runs : runs.filter(r => r.status === filter)

  const stats = {
    total:     runs.length,
    completed: runs.filter(r => r.status === 'Completed').length,
    pending:   runs.filter(r => r.status === 'Pending').length,
    failed:    runs.filter(r => r.status === 'Failed').length,
  }

  return (
    <div style={styles.page} className="fade-in-fast">
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/dashboard" style={styles.backBtn}>← Dashboard</Link>
          <div>
            <h1 style={styles.title}>Model Runs History</h1>
            <span style={styles.subtitle}>Historiku i Parashikimeve ML</span>
          </div>
        </div>
      </header>

      <main style={styles.main}>
        {/* Stats row */}
        <div style={styles.statsRow} className="fade-in-children">
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Gjithsej</p>
            <p style={{ ...styles.statVal, color: 'var(--text)' }}>{stats.total}</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Completed</p>
            <p style={{ ...styles.statVal, color: '#00d4aa' }}>{stats.completed}</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Pending</p>
            <p style={{ ...styles.statVal, color: '#f59e0b' }}>{stats.pending}</p>
          </div>
          <div style={styles.statCard}>
            <p style={styles.statLabel}>Failed</p>
            <p style={{ ...styles.statVal, color: '#ff6b6b' }}>{stats.failed}</p>
          </div>
        </div>

        {/* Filter */}
        <div style={styles.filterBar}>
          {statuses.map(s => (
            <button key={s} style={styles.filterBtn(filter === s)} onClick={() => setFilter(s)}>
              {s === 'all' ? 'Të gjitha' : `${STATUS_STYLE[s]?.icon} ${s}`}
            </button>
          ))}
        </div>

        {loading && <p style={styles.status}>Duke ngarkuar...</p>}
        {error   && <p style={{ ...styles.status, color: '#ff6b6b' }}>{error}</p>}

        {!loading && !error && (
          <div style={styles.table} className="fade-in">
            <div style={styles.tableHead}>
              <span>Run ID</span>
              <span>KPI</span>
              <span>Statusi</span>
              <span>Parashikime</span>
              <span>Data</span>
            </div>
            {filtered.map(run => {
              const st = STATUS_STYLE[run.status] || STATUS_STYLE.Pending
              return (
                <div key={run.run_id} style={styles.tableRow}>
                  <span style={styles.runId}>#{run.run_id}</span>
                  <span style={styles.kpiName}>{run.kpi_name}</span>
                  <span>
                    <span style={{ ...styles.statusBadge, color: st.color, background: st.bg }}>
                      {st.icon} {run.status}
                    </span>
                  </span>
                  <span style={styles.count}>{run.forecast_count} muaj</span>
                  <span style={styles.date}>{fmtDate(run.run_date)}</span>
                </div>
              )
            })}
            {filtered.length === 0 && (
              <p style={styles.empty}>Nuk ka parashikime të kaluara.</p>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

const styles = {
  page:        { minHeight: '100vh', background: 'var(--bg)', fontFamily: "'Segoe UI', system-ui, sans-serif", color: 'var(--text)' },
  header:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid var(--border)' },
  backBtn:     { color: 'var(--muted)', textDecoration: 'none', fontSize: '0.88rem', padding: '6px 12px', border: '1px solid #2a2d3a', borderRadius: '8px' },
  title:       { fontSize: '1.3rem', fontWeight: 700, margin: 0 },
  subtitle:    { fontSize: '0.78rem', color: 'var(--muted)' },
  main:        { padding: '24px 32px' },
  statsRow:    { display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '16px', marginBottom: '24px' },
  statCard:    { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '16px 20px' },
  statLabel:   { color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 6px' },
  statVal:     { fontSize: '2rem', fontWeight: 700, margin: 0 },
  filterBar:   { display: 'flex', gap: '8px', marginBottom: '20px' },
  filterBtn:   (active) => ({
    padding: '6px 14px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.82rem',
    background: active ? '#6c63ff' : 'transparent',
    border: `1px solid ${active ? '#6c63ff' : '#2a2d3a'}`,
    color: active ? '#fff' : '#7b7f96',
  }),
  status:      { color: 'var(--muted)', textAlign: 'center', padding: '48px 0' },
  table:       { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' },
  tableHead:   { display: 'grid', gridTemplateColumns: '80px 1fr 140px 120px 180px', padding: '12px 20px', background: '#0f1117', color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' },
  tableRow:    { display: 'grid', gridTemplateColumns: '80px 1fr 140px 120px 180px', padding: '14px 20px', borderTop: '1px solid var(--border)', alignItems: 'center' },
  runId:       { color: 'var(--muted)', fontSize: '0.85rem', fontFamily: 'monospace' },
  kpiName:     { color: 'var(--text)', fontWeight: 500, fontSize: '0.9rem' },
  statusBadge: { display: 'inline-block', padding: '3px 10px', borderRadius: '12px', fontSize: '0.8rem', fontWeight: 500 },
  count:       { color: '#6c63ff', fontSize: '0.88rem' },
  date:        { color: 'var(--muted)', fontSize: '0.82rem' },
  empty:       { color: 'var(--muted)', textAlign: 'center', padding: '40px' },
}