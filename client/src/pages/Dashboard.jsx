import { useEffect, useState, useCallback } from 'react'
import SkeletonDashboard from '../components/SkeletonDashboard'
import useCountUp from '../hooks/useCountUp'
import { useNavigate, Link } from 'react-router-dom'
import { useTheme } from '../context/ThemeContext'
import axios from 'axios'
import RevenueChart from '../components/RevenueChart'
import InventoryChart from '../components/InventoryChart'
import ForecastChart from '../components/ForecastChart'
import ForecastPanel from '../components/ForecastPanel'

function apiClient() {
  const token = localStorage.getItem('token')
  return axios.create({
    headers: { Authorization: `Bearer ${token}` }
  })
}

export default function Dashboard() {
  const navigate = useNavigate()
  const user     = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin  = user.role === 'Admin'
  const { dark, toggle, t } = useTheme()

  function exportCSV(data, filename) {
    if (!data.length) return
    const headers = Object.keys(data[0]).join(',')
    const rows    = data.map(r => Object.values(r).join(',')).join('\n')
    const blob    = new Blob([headers + '\n' + rows], { type: 'text/csv' })
    const url     = URL.createObjectURL(blob)
    const a       = document.createElement('a')
    a.href        = url
    a.download    = filename
    a.click()
    URL.revokeObjectURL(url)
  }

  const [revenue,        setRevenue]        = useState([])
  const [inventory,      setInventory]      = useState([])
  const [forecasts,      setForecasts]      = useState([])
  const [businesses,     setBusinesses]     = useState([])
  const [selectedBiz,    setSelectedBiz]    = useState('all')
  const [loading,        setLoading]        = useState(true)
  const [error,          setError]          = useState('')
  const [lastUpdated,    setLastUpdated]    = useState(null)
  const [menuOpen,       setMenuOpen]       = useState(false)

  const fetchData = useCallback(async () => {
    const api = apiClient()
    try {
      const [r1, r2, r3] = await Promise.all([
        api.get('/api/revenue-growth'),
        api.get('/api/inventory-turnover'),
        api.get('/api/forecasts'),
      ])
      setRevenue(r1.data)
      setInventory(r2.data)
      setForecasts(r3.data)

      // Merr listën e bizneseve unike
      const bizList = [...new Set(r1.data.map(r => r.business_name))]
      setBusinesses(bizList)

      // Nëse është BusinessUser, vendos biznesin e tij automatikisht
      if (!isAdmin && bizList.length > 0) {
        setSelectedBiz(bizList[0])
      }

      setLastUpdated(new Date())
      setError('')
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.clear()
        navigate('/login')
      } else {
        setError('Gabim gjatë ngarkimit të të dhënave.')
      }
    } finally {
      setLoading(false)
    }
  }, [navigate, isAdmin])

  // Ngarko të dhënat fillimisht
  useEffect(() => {
    fetchData()
  }, [fetchData])

  // Auto-refresh çdo 30 sekonda
  useEffect(() => {
    const interval = setInterval(() => {
      fetchData()
    }, 30000)
    return () => clearInterval(interval)
  }, [fetchData])

  function handleLogout() {
    localStorage.clear()
    navigate('/login')
  }

  // Filtro të dhënat sipas biznesit të zgjedhur
  const filteredRevenue   = selectedBiz === 'all' ? revenue   : revenue.filter(r => r.business_name === selectedBiz)
  const filteredInventory = selectedBiz === 'all' ? inventory : inventory.filter(r => r.business_name === selectedBiz)
  const filteredForecasts = forecasts

  // KPI totals
  const totalRevenue  = filteredRevenue.reduce((s, r) => s + parseFloat(r.total_revenue), 0)
  const totalProducts = [...new Set(filteredInventory.map(r => r.product_name))].length

  return (
    <div className='themed-page fade-in-fast'>

      {/* Header */}
      <header className='themed-header'>
        <div>
          <h1 style={styles.title}>Analytics Dashboard</h1>
          <span style={styles.subtitle}>Web Analytics Platform</span>
        </div>
        <div style={styles.headerRight}>
          {/* Mobile menu overlay */}
          {menuOpen && <div className='mobile-overlay open' onClick={() => setMenuOpen(false)} />}

          {/* Mobile sidebar */}
          <div className={`mobile-menu ${menuOpen ? 'open' : ''}`}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', paddingBottom: '16px', borderBottom: '1px solid var(--border)' }}>
              <span style={{ fontWeight: 600, color: 'var(--text)' }}>Menu</span>
              <button style={{ background: 'none', border: 'none', color: 'var(--muted)', fontSize: '1.2rem', cursor: 'pointer' }} onClick={() => setMenuOpen(false)}>✕</button>
            </div>
            {isAdmin && (<Link to='/users' style={styles.usersBtn} className='nav-btn' onClick={() => setMenuOpen(false)}>👥 Punonjësit</Link>)}
            {isAdmin && (<Link to='/import' style={styles.importBtn2} className='nav-btn' onClick={() => setMenuOpen(false)}>📂 Importo</Link>)}
            <Link to='/kpis' style={styles.kpisBtn} className='nav-btn' onClick={() => setMenuOpen(false)}>📊 KPIs</Link>
            <Link to='/logs' style={styles.logsBtn} className='nav-btn' onClick={() => setMenuOpen(false)}>📋 Logs</Link>
            <Link to='/model-runs' style={styles.runsBtn} className='nav-btn' onClick={() => setMenuOpen(false)}>🤖 ML Runs</Link>
            <Link to='/settings' style={styles.settingsBtn} className='nav-btn' onClick={() => setMenuOpen(false)}>⚙️ Cilësimet</Link>
            <button style={styles.themeBtn} className='nav-btn' onClick={() => { toggle(); setMenuOpen(false) }}>{dark ? '☀️ Light Mode' : '🌙 Dark Mode'}</button>
            <button style={styles.exportBtn} className='nav-btn' onClick={() => { exportCSV(filteredRevenue, 'revenue.csv'); setMenuOpen(false) }}>⬇ Eksporto CSV</button>
            <button style={styles.logoutBtn} className='nav-btn' onClick={handleLogout}>🚪 Dil</button>
          </div>
          {/* Hamburger button for mobile */}
          <button className='nav-mobile-btn nav-btn' style={{ background: 'transparent', border: '1px solid var(--border)', borderRadius: '8px', padding: '8px 12px', color: 'var(--text)', fontSize: '1.1rem' }} onClick={() => setMenuOpen(true)}>☰</button>

          {/* Desktop nav */}
          <div className='nav-desktop'>
          {/* Auto-refresh indicator */}
          {lastUpdated && (
            <span style={styles.refreshBadge}>
              🔄 {lastUpdated.toLocaleTimeString()}
            </span>
          )}
          <span style={styles.roleBadge(isAdmin)}>
            {isAdmin ? '👑 Admin' : '👤 User'}
          </span>
          <span style={styles.userText}>{user.username}</span>
          {isAdmin && (<Link to="/users" style={styles.usersBtn} className="nav-btn">👥 Punonjësit</Link>)}{isAdmin && (<Link to="/import" style={styles.importBtn2} className="nav-btn">📂 Importo</Link>)}<Link to="/kpis" style={styles.kpisBtn} className="nav-btn">📊 KPIs</Link><Link to="/logs" style={styles.logsBtn} className="nav-btn">📋 Logs</Link><Link to="/model-runs" style={styles.runsBtn} className="nav-btn">🤖 ML Runs</Link><Link to="/settings" style={styles.settingsBtn} className="nav-btn">⚙️ Cilësimet</Link><button style={styles.themeBtn} className="nav-btn" onClick={toggle}>{dark ? '☀️' : '🌙'}</button><button style={styles.exportBtn} className="nav-btn" onClick={() => exportCSV(filteredRevenue, 'revenue.csv')}>⬇ CSV</button><button style={styles.refreshBtn} className="nav-btn" onClick={fetchData}>↻</button>
          <button style={styles.logoutBtn} className="nav-btn" onClick={handleLogout}>Dil</button>
          </div> {/* end nav-desktop */}
        </div>
      </header>

      <main style={styles.main}>
        {loading && <SkeletonDashboard />}
        {error   && <p style={{ ...styles.status, color: '#ff6b6b' }}>{error}</p>}

        {!loading && !error && (<div className='fade-in'>
            {/* Filter bar — vetëm Admin mund të filtrojë */}
            {isAdmin && (
              <div style={styles.filterBar}>
                <span style={styles.filterLabel}>Filtro sipas biznesit:</span>
                <div style={styles.filterBtns}>
                  <button
                    style={styles.filterBtn(selectedBiz === 'all')}
                    onClick={() => setSelectedBiz('all')}
                  >
                    Të gjitha
                  </button>
                  {businesses.map(biz => (
                    <button
                      key={biz}
                      style={styles.filterBtn(selectedBiz === biz)}
                      onClick={() => setSelectedBiz(biz)}
                    >
                      {biz}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Nëse është BusinessUser, trego biznesin e tij */}
            {!isAdmin && (
              <div style={styles.bizBanner}>
                🏢 Duke shfaqur të dhënat për: <strong>{selectedBiz}</strong>
              </div>
            )}

            {/* KPI Cards */}
            <div style={styles.kpiRow}>
              <KpiCard label="Total Revenue"  value={`$${totalRevenue.toLocaleString()}`}  color="#6c63ff" />
              <KpiCard label="Businesses"     value={selectedBiz === 'all' ? businesses.length : 1} color="#00d4aa" />
              <KpiCard label="Forecasts"      value={filteredForecasts.length}              color="#f59e0b" />
              <KpiCard label="Products"       value={totalProducts}                         color="#ec4899" />
            </div>

            {/* Charts */}
            <div style={styles.grid}>
              <div className='themed-card'>
                <p style={styles.cardLabel}>KPI 01</p>
                <p style={styles.cardTitle}>Revenue Growth</p>
                <RevenueChart data={filteredRevenue} />
              </div>

              <div className='themed-card'>
                <p style={styles.cardLabel}>KPI 02</p>
                <p style={styles.cardTitle}>Inventory Turnover</p>
                <InventoryChart data={filteredInventory} />
              </div>

              <div style={{ gridColumn: '1 / -1' }}>
              <ForecastPanel onForecastDone={fetchData} />
            </div>

            <div className='themed-card' style={{ gridColumn: '1 / -1' }}>
                <p style={styles.cardLabel}>KPI 03</p>
                <p style={styles.cardTitle}>Forecasts</p>
                <ForecastChart data={filteredForecasts} />
              </div>
            </div>
        </div>)}
      </main>
    </div>
  )
}

function KpiCard({ label, value, color }) {
  // Extract numeric part for counter animation
  const numMatch = String(value).match(/[\d,\.]+/)
  const numStr   = numMatch ? numMatch[0].replace(/,/g, '') : null
  const numVal   = numStr ? parseFloat(numStr) : null
  const counted  = useCountUp(numVal, 1000)

  // Format the animated value to match original format
  function formatValue() {
    if (numVal === null) return value
    const prefix = String(value).startsWith('$') ? '$' : ''
    return prefix + Math.round(counted).toLocaleString()
  }

  return (
    <div className='themed-kpi-card fade-in' style={{ borderTopColor: color }}>
      <p style={styles.kpiLabel}>{label}</p>
      <p style={{ ...styles.kpiValue, color }}>{formatValue()}</p>
    </div>
  )
}

const styles = {
  page:        { minHeight: '100vh', background: '#0f1117', fontFamily: "'Segoe UI', system-ui, sans-serif", color: '#e8eaf0' },
  header:      { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid #2a2d3a', flexWrap: 'wrap', gap: '12px' },
  title:       { fontSize: '1.4rem', fontWeight: 700, margin: 0 },
  subtitle:    { fontSize: '0.78rem', color: '#7b7f96', textTransform: 'uppercase', letterSpacing: '0.08em' },
  headerRight: { display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' },
  refreshBadge:{ fontSize: '0.75rem', color: '#7b7f96' },
  roleBadge:   (isAdmin) => ({
    fontSize: '0.78rem', padding: '4px 10px', borderRadius: '20px',
    background: isAdmin ? 'rgba(108,99,255,0.15)' : 'rgba(0,212,170,0.15)',
    color: isAdmin ? '#6c63ff' : '#00d4aa',
    border: `1px solid ${isAdmin ? '#6c63ff' : '#00d4aa'}`,
  }),
  userText:    { color: '#7b7f96', fontSize: '0.9rem' },
  refreshBtn:  { padding: '6px 12px', background: 'transparent', border: '1px solid #2a2d3a', borderRadius: '8px', color: '#7b7f96', cursor: 'pointer', fontSize: '1rem' },
  importBtn2: { padding: '8px 16px', background: 'rgba(0,212,170,0.12)', border: '1px solid #00d4aa', borderRadius: '8px', color: '#00d4aa', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 },
  kpisBtn:     { padding: '8px 16px', background: 'rgba(245,158,11,0.12)', border: '1px solid #f59e0b', borderRadius: '8px', color: '#f59e0b', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 },
  themeBtn:    { padding: '8px 12px', background: 'transparent', border: '1px solid #2a2d3a', borderRadius: '8px', cursor: 'pointer', fontSize: '1rem' },
  exportBtn:   { padding: '8px 14px', background: 'transparent', border: '1px solid #00d4aa', borderRadius: '8px', color: '#00d4aa', cursor: 'pointer', fontSize: '0.85rem' },
  logsBtn:     { padding: '8px 16px', background: 'transparent', border: '1px solid #2a2d3a', borderRadius: '8px', color: '#7b7f96', textDecoration: 'none', fontSize: '0.85rem' },
  runsBtn:     { padding: '8px 16px', background: 'rgba(236,72,153,0.12)', border: '1px solid #ec4899', borderRadius: '8px', color: '#ec4899', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 },
  settingsBtn: { padding: '8px 16px', background: 'transparent', border: '1px solid #2a2d3a', borderRadius: '8px', color: '#7b7f96', textDecoration: 'none', fontSize: '0.85rem' },
  usersBtn:    { padding: '8px 16px', background: 'rgba(108,99,255,0.15)', border: '1px solid #6c63ff', borderRadius: '8px', color: '#6c63ff', textDecoration: 'none', fontSize: '0.85rem', fontWeight: 600 },
  logoutBtn:   { padding: '8px 18px', background: 'transparent', border: '1px solid #2a2d3a', borderRadius: '8px', color: '#e8eaf0', cursor: 'pointer', fontSize: '0.85rem' },
  main:        { padding: '24px 32px', background: 'var(--bg)', minHeight: 'calc(100vh - 80px)' },
  status:      { color: '#7b7f96', textAlign: 'center', padding: '60px 0' },
  filterBar:   { display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' },
  filterLabel: { color: '#7b7f96', fontSize: '0.85rem' },
  filterBtns:  { display: 'flex', gap: '8px', flexWrap: 'wrap' },
  filterBtn:   (active) => ({
    padding: '6px 16px', borderRadius: '20px', cursor: 'pointer', fontSize: '0.85rem', fontWeight: active ? 600 : 400,
    background: active ? '#6c63ff' : 'transparent',
    border: `1px solid ${active ? '#6c63ff' : '#2a2d3a'}`,
    color: active ? '#fff' : '#7b7f96',
    transition: 'all 0.2s',
  }),
  bizBanner:   { background: 'rgba(0,212,170,0.08)', border: '1px solid rgba(0,212,170,0.2)', borderRadius: '8px', padding: '10px 16px', marginBottom: '20px', fontSize: '0.9rem', color: '#00d4aa' },
  kpiRow:      { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' },
  kpiCard:     { background: '#1a1d27', border: '1px solid #2a2d3a', borderTop: '3px solid', borderRadius: '12px', padding: '20px' },
  kpiLabel:    { color: '#7b7f96', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 8px' },
  kpiValue:    { fontSize: '1.8rem', fontWeight: 700, margin: 0 },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' },
  card:        { background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: '12px', padding: '24px' },
  cardLabel:   { color: '#7b7f96', fontSize: '0.7rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 4px' },
  cardTitle:   { fontSize: '1rem', fontWeight: 600, margin: '0 0 20px' },
}