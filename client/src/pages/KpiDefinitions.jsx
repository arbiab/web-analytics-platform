import { useEffect, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import axios from 'axios'

function apiClient() {
  const token = localStorage.getItem('token')
  return axios.create({ headers: { Authorization: `Bearer ${token}` } })
}

export default function KpiDefinitions() {
  const navigate  = useNavigate()
  const user      = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin   = user.role === 'Admin'

  const [kpis,    setKpis]    = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [showForm, setShowForm] = useState(false)
  const [form,    setForm]    = useState({ name: '', description: '', formula: '' })
  const [saving,  setSaving]  = useState(false)
  const [formErr, setFormErr] = useState('')

  async function fetchKpis() {
    try {
      const res = await apiClient().get('/api/kpis')
      setKpis(res.data)
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        localStorage.clear(); navigate('/login')
      } else {
        setError('Gabim gjatë ngarkimit.')
      }
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchKpis() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    setFormErr(''); setSaving(true)
    try {
      await apiClient().post('/api/kpis', form)
      setForm({ name: '', description: '', formula: '' })
      setShowForm(false)
      fetchKpis()
    } catch (err) {
      setFormErr(err.response?.data?.error || 'Gabim gjatë shtimit.')
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Fshi këtë KPI?')) return
    try {
      await apiClient().delete(`/api/kpis/${id}`)
      fetchKpis()
    } catch (err) {
      alert(err.response?.data?.error || 'Gabim gjatë fshirjes.')
    }
  }

  return (
    <div style={styles.page}>
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/dashboard" style={styles.backBtn}>← Dashboard</Link>
          <div>
            <h1 style={styles.title}>KPI Definitions</h1>
            <span style={styles.subtitle}>Treguesit Kryesorë të Performancës</span>
          </div>
        </div>
        {isAdmin && (
          <button style={styles.addBtn} onClick={() => setShowForm(s => !s)}>
            {showForm ? '✕ Anulo' : '+ Shto KPI'}
          </button>
        )}
      </header>

      <main style={styles.main}>
        {/* Forma */}
        {showForm && isAdmin && (
          <div style={styles.formCard}>
            <p style={styles.formTitle}>KPI i Ri</p>
            <form onSubmit={handleAdd}>
              <div style={styles.formGrid}>
                <div style={styles.field}>
                  <label style={styles.label}>Emri *</label>
                  <input style={styles.input} value={form.name}
                    onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                    placeholder="p.sh. Revenue Growth" required />
                </div>
                <div style={styles.field}>
                  <label style={styles.label}>Formula</label>
                  <input style={styles.input} value={form.formula}
                    onChange={e => setForm(f => ({ ...f, formula: e.target.value }))}
                    placeholder="p.sh. SUM(amount)" />
                </div>
                <div style={{ ...styles.field, gridColumn: '1 / -1' }}>
                  <label style={styles.label}>Përshkrimi</label>
                  <textarea style={{ ...styles.input, height: '70px', resize: 'vertical' }}
                    value={form.description}
                    onChange={e => setForm(f => ({ ...f, description: e.target.value }))}
                    placeholder="Përshkruaj çfarë mat ky KPI..." />
                </div>
              </div>
              {formErr && <p style={styles.error}>{formErr}</p>}
              <button style={styles.submitBtn} type="submit" disabled={saving}>
                {saving ? 'Duke shtuar...' : 'Shto KPI'}
              </button>
            </form>
          </div>
        )}

        {loading && <p style={styles.status}>Duke ngarkuar...</p>}
        {error   && <p style={{ ...styles.status, color: '#ff6b6b' }}>{error}</p>}

        {!loading && !error && (
          <div style={styles.grid}>
            {kpis.map(kpi => (
              <div key={kpi.kpi_id} style={styles.card}>
                <div style={styles.cardTop}>
                  <p style={styles.kpiName}>{kpi.name}</p>
                  {isAdmin && (
                    <button style={styles.deleteBtn} onClick={() => handleDelete(kpi.kpi_id)}>
                      Fshi
                    </button>
                  )}
                </div>
                {kpi.description && (
                  <p style={styles.kpiDesc}>{kpi.description}</p>
                )}
                {kpi.formula && (
                  <div style={styles.formulaBox}>
                    <span style={styles.formulaLabel}>Formula:</span>
                    <code style={styles.formula}>{kpi.formula}</code>
                  </div>
                )}
                <p style={styles.kpiDate}>
                  Shtuar: {new Date(kpi.created_at).toLocaleDateString('sq-AL')}
                </p>
              </div>
            ))}
            {kpis.length === 0 && (
              <p style={styles.empty}>Nuk ka KPI të definuara. Shto KPI-në e parë!</p>
            )}
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
  addBtn:      { padding: '9px 20px', background: '#6c63ff', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem' },
  main:        { padding: '24px 32px' },
  formCard:    { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '24px' },
  formTitle:   { color: '#6c63ff', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px', fontWeight: 600 },
  formGrid:    { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '12px' },
  field:       { display: 'flex', flexDirection: 'column', gap: '5px' },
  label:       { color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input:       { padding: '9px 12px', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.9rem', outline: 'none', fontFamily: 'inherit' },
  error:       { color: '#ff6b6b', fontSize: '0.85rem', margin: '0 0 10px' },
  submitBtn:   { padding: '9px 24px', background: '#6c63ff', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer' },
  status:      { color: 'var(--muted)', textAlign: 'center', padding: '48px 0' },
  grid:        { display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' },
  card:        { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px' },
  cardTop:     { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' },
  kpiName:     { fontWeight: 600, fontSize: '1rem', margin: 0, color: '#6c63ff' },
  deleteBtn:   { padding: '4px 12px', background: 'transparent', border: '1px solid #ff6b6b', borderRadius: '6px', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.8rem' },
  kpiDesc:     { color: 'var(--muted)', fontSize: '0.88rem', margin: '0 0 10px', lineHeight: 1.5 },
  formulaBox:  { background: '#0f1117', borderRadius: '6px', padding: '8px 12px', marginBottom: '10px', display: 'flex', gap: '8px', alignItems: 'center' },
  formulaLabel:{ color: 'var(--muted)', fontSize: '0.75rem' },
  formula:     { color: '#00d4aa', fontSize: '0.85rem', fontFamily: 'monospace' },
  kpiDate:     { color: 'var(--muted)', fontSize: '0.78rem', margin: 0 },
  empty:       { color: 'var(--muted)', gridColumn: '1 / -1', textAlign: 'center', padding: '48px 0' },
}