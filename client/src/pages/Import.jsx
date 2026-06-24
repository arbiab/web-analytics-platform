import { useState } from 'react'
import { Link } from 'react-router-dom'
import axios from 'axios'

function apiClient() {
  const token = localStorage.getItem('token')
  return axios.create({ headers: { Authorization: `Bearer ${token}` } })
}

function ImportCard({ title, description, endpoint, templateHeaders, templateRows, color }) {
  const [file,    setFile]    = useState(null)
  const [loading, setLoading] = useState(false)
  const [result,  setResult]  = useState(null)
  const [error,   setError]   = useState('')

  async function handleImport() {
    if (!file) return setError('Zgjidh një file CSV.')
    setError(''); setResult(null); setLoading(true)

    const formData = new FormData()
    formData.append('file', file)

    try {
      const res = await apiClient().post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })
      setResult(res.data)
      setFile(null)
    } catch (err) {
      setError(err.response?.data?.error || 'Gabim gjatë importimit.')
    } finally {
      setLoading(false)
    }
  }

  function downloadTemplate() {
    const csvContent = [templateHeaders, ...templateRows].join('\n')
    const blob = new Blob([csvContent], { type: 'text/csv' })
    const url  = URL.createObjectURL(blob)
    const a    = document.createElement('a')
    a.href     = url
    a.download = `template_${title.toLowerCase().replace(' ', '_')}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  return (
    <div style={{ ...styles.card, borderTopColor: color }}>
      <div style={styles.cardHeader}>
        <p style={styles.cardTitle}>{title}</p>
        <button style={styles.templateBtn} onClick={downloadTemplate}>
          ⬇ Shkarko Template
        </button>
      </div>
      <p style={styles.cardDesc}>{description}</p>

      {/* Drag & Drop zone */}
      <label style={styles.dropzone}>
        <input type="file" accept=".csv" style={{ display: 'none' }}
          onChange={e => { setFile(e.target.files[0]); setError(''); setResult(null) }} />
        {file ? (
          <div>
            <p style={styles.fileName}>📄 {file.name}</p>
            <p style={styles.fileSize}>{(file.size / 1024).toFixed(1)} KB</p>
          </div>
        ) : (
          <div>
            <p style={styles.dropIcon}>📂</p>
            <p style={styles.dropText}>Kliko për të zgjedhur CSV</p>
            <p style={styles.dropHint}>ose zvarrit file këtu</p>
          </div>
        )}
      </label>

      {/* Format info */}
      <div style={styles.formatBox}>
        <p style={styles.formatLabel}>Formati i pritshëm:</p>
        <code style={styles.formatCode}>{templateHeaders}</code>
      </div>

      {error  && <p style={styles.error}>{error}</p>}
      {result && (
        <div style={styles.successBox}>
          <p style={styles.successMsg}>✅ {result.message}</p>
          {result.errors?.length > 0 && (
            <p style={styles.warnMsg}>⚠ {result.errors.length} rreshta u anashkaluan</p>
          )}
        </div>
      )}

      <button style={{ ...styles.importBtn, background: loading ? '#444' : color }}
        onClick={handleImport} disabled={loading || !file}>
        {loading ? 'Duke importuar...' : 'Importo'}
      </button>
    </div>
  )
}

export default function Import() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/dashboard" style={styles.backBtn}>← Dashboard</Link>
          <div>
            <h1 style={styles.title}>Importo të Dhëna</h1>
            <span style={styles.subtitle}>Ngarko të dhënat e biznesit nga CSV</span>
          </div>
        </div>
        <span style={styles.userText}>👤 {user.username}</span>
      </header>

      <main style={styles.main}>
        {/* Info banner */}
        <div style={styles.infoBanner}>
          <p>📌 Shkarko template-in, plotëso të dhënat, dhe ngarko CSV-në. Sistemi do të importojë automatikisht të dhënat në dashboard.</p>
        </div>

        <div style={styles.grid}>
          <ImportCard
            title="Transaksionet"
            description="Importo të dhënat e shitjeve dhe transaksioneve financiare."
            endpoint="/api/import/transactions"
            color="#6c63ff"
            templateHeaders="amount,transaction_date"
            templateRows={[
              "1500.00,2026-01-15",
              "2300.50,2026-01-22",
              "980.00,2026-02-03",
              "3200.00,2026-02-18",
            ]}
          />

          <ImportCard
            title="Inventari"
            description="Importo listën e produkteve dhe sasitë e stokut."
            endpoint="/api/import/inventory"
            color="#00d4aa"
            templateHeaders="product_name,quantity"
            templateRows={[
              "Laptop,50",
              "Mouse,200",
              "Keyboard,150",
              "Monitor,75",
            ]}
          />
        </div>
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
  userText:    { color: 'var(--muted)', fontSize: '0.9rem' },
  main:        { padding: '28px 32px' },
  infoBanner:  { background: 'rgba(108,99,255,0.08)', border: '1px solid rgba(108,99,255,0.2)', borderRadius: '10px', padding: '14px 18px', marginBottom: '24px', color: '#a8a4ff', fontSize: '0.9rem' },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' },
  card:        { background: 'var(--surface)', border: '1px solid var(--border)', borderTop: '3px solid', borderRadius: '12px', padding: '24px' },
  cardHeader:  { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' },
  cardTitle:   { fontWeight: 600, fontSize: '1rem', margin: 0 },
  templateBtn: { padding: '5px 12px', background: 'transparent', border: '1px solid #2a2d3a', borderRadius: '6px', color: 'var(--muted)', cursor: 'pointer', fontSize: '0.8rem' },
  cardDesc:    { color: 'var(--muted)', fontSize: '0.85rem', margin: '0 0 16px' },
  dropzone:    { display: 'block', border: '2px dashed #2a2d3a', borderRadius: '10px', padding: '28px', textAlign: 'center', cursor: 'pointer', marginBottom: '14px', transition: 'border-color 0.2s' },
  dropIcon:    { fontSize: '2rem', margin: '0 0 8px' },
  dropText:    { color: 'var(--text)', fontSize: '0.9rem', margin: '0 0 4px' },
  dropHint:    { color: 'var(--muted)', fontSize: '0.8rem', margin: 0 },
  fileName:    { color: 'var(--text)', fontWeight: 500, margin: '0 0 4px' },
  fileSize:    { color: 'var(--muted)', fontSize: '0.8rem', margin: 0 },
  formatBox:   { background: '#0f1117', borderRadius: '8px', padding: '10px 14px', marginBottom: '14px' },
  formatLabel: { color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', margin: '0 0 6px' },
  formatCode:  { color: '#00d4aa', fontSize: '0.85rem', fontFamily: 'monospace' },
  error:       { color: '#ff6b6b', fontSize: '0.85rem', margin: '0 0 12px', padding: '8px 12px', background: 'rgba(255,107,107,0.08)', borderRadius: '6px' },
  successBox:  { margin: '0 0 12px', padding: '10px 14px', background: 'rgba(0,212,170,0.08)', borderRadius: '6px', border: '1px solid rgba(0,212,170,0.2)' },
  successMsg:  { color: '#00d4aa', fontSize: '0.88rem', margin: '0 0 4px' },
  warnMsg:     { color: '#f59e0b', fontSize: '0.82rem', margin: 0 },
  importBtn:   { width: '100%', padding: '11px', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' },
}