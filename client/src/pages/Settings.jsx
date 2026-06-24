import { useEffect, useState } from 'react'
import { useTheme } from '../context/ThemeContext'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

function apiClient() {
  const token = localStorage.getItem('token')
  return axios.create({ headers: { Authorization: `Bearer ${token}` } })
}

const INDUSTRIES = ['Software', 'Retail', 'Finance', 'Healthcare', 'Education', 'Manufacturing', 'Hospitality', 'Other']

export default function Settings() {
  const navigate = useNavigate()
  const user     = JSON.parse(localStorage.getItem('user') || '{}')
  const isAdmin  = user.role === 'Admin'
  const { dark, toggle } = useTheme()

  const [form, setForm] = useState({
    name: '', industry: '', email: '', phone: '',
    address: '', city: '', website: '', employees: '',
    description: '', logo_url: ''
  })
  const [loading,  setLoading]  = useState(true)
  const [saving,   setSaving]   = useState(false)
  const [pwForm,   setPwForm]   = useState({ current: '', newpw: '', confirm: '' })
  const [pwSaving, setPwSaving] = useState(false)
  const [pwError,  setPwError]  = useState('')
  const [pwOk,     setPwOk]     = useState('')
  const [error,    setError]    = useState('')
  const [success,  setSuccess]  = useState('')

  useEffect(() => {
    apiClient().get('/api/business')
      .then(res => {
        const d = res.data
        setForm({
          name:        d.name        || '',
          industry:    d.industry    || '',
          email:       d.email       || '',
          phone:       d.phone       || '',
          address:     d.address     || '',
          city:        d.city        || '',
          website:     d.website     || '',
          employees:   d.employees   || '',
          description: d.description || '',
          logo_url:    d.logo_url    || '',
        })
      })
      .catch(err => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          localStorage.clear(); navigate('/login')
        }
      })
      .finally(() => setLoading(false))
  }, [navigate])

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSave(e) {
    e.preventDefault()
    setError(''); setSuccess('')
    setSaving(true)
    try {
      await apiClient().put('/api/business', form)
      setSuccess('✅ Profili u përditësua me sukses!')
      setTimeout(() => setSuccess(''), 3000)
    } catch (err) {
      setError(err.response?.data?.error || 'Gabim gjatë ruajtjes.')
    } finally {
      setSaving(false)
    }
  }

  async function handlePasswordChange(e) {
    e.preventDefault()
    setPwError(''); setPwOk('')
    if (pwForm.newpw !== pwForm.confirm) return setPwError('Fjalëkalimet e reja nuk përputhen.')
    setPwSaving(true)
    try {
      await apiClient().put('/api/change-password', {
        current_password: pwForm.current,
        new_password:     pwForm.newpw,
      })
      setPwOk('✅ Fjalëkalimi u ndryshua me sukses!')
      setPwForm({ current: '', newpw: '', confirm: '' })
      setTimeout(() => setPwOk(''), 3000)
    } catch (err) {
      setPwError(err.response?.data?.error || 'Gabim gjatë ndryshimit.')
    } finally {
      setPwSaving(false)
    }
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/dashboard" style={styles.backBtn}>← Dashboard</Link>
          <div>
            <h1 style={styles.title}>Cilësimet e Biznesit</h1>
            <span style={styles.subtitle}>Profili i kompanisë suaj</span>
          </div>
        </div>
        <span style={styles.roleBadge}>
          {isAdmin ? '👑 Admin' : '👤 User'}
        </span>
      </header>

      <main style={{ padding: '24px 32px', width: '100%' }}>
        <div style={{ maxWidth: '1100px', margin: '0 auto' }}>
        {loading ? (
          <p style={styles.status}>Duke ngarkuar...</p>
        ) : (
          <form onSubmit={handleSave}>
            <div style={styles.grid}>

              {/* Informacioni Bazë */}
              <div style={styles.section}>
                <p style={styles.sectionTitle}>🏢 Informacioni Bazë</p>

                <Field label="Emri i Biznesit *" required>
                  <input style={styles.input} name="name" value={form.name}
                    onChange={handleChange} disabled={!isAdmin} required />
                </Field>

                <Field label="Industria">
                  <select style={styles.input} name="industry" value={form.industry}
                    onChange={handleChange} disabled={!isAdmin}>
                    <option value="">Zgjidh...</option>
                    {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                  </select>
                </Field>

                <Field label="Përshkrimi">
                  <textarea style={{ ...styles.input, height: '90px', resize: 'vertical' }}
                    name="description" value={form.description}
                    onChange={handleChange} disabled={!isAdmin}
                    placeholder="Përshkruaj biznesin tënd..." />
                </Field>

                <Field label="Numri i Punëtorëve">
                  <input style={styles.input} type="number" name="employees"
                    value={form.employees} onChange={handleChange}
                    disabled={!isAdmin} placeholder="p.sh. 25" min="1" />
                </Field>
              </div>

              {/* Kontakti */}
              <div style={styles.section}>
                <p style={styles.sectionTitle}>📞 Kontakti & Vendndodhja</p>

                <Field label="Email">
                  <input style={styles.input} type="email" name="email"
                    value={form.email} onChange={handleChange}
                    disabled={!isAdmin} placeholder="info@kompania.com" />
                </Field>

                <Field label="Telefoni">
                  <input style={styles.input} name="phone" value={form.phone}
                    onChange={handleChange} disabled={!isAdmin}
                    placeholder="+383 44 123 456" />
                </Field>

                <Field label="Qyteti">
                  <input style={styles.input} name="city" value={form.city}
                    onChange={handleChange} disabled={!isAdmin}
                    placeholder="p.sh. Prishtinë" />
                </Field>

                <Field label="Adresa">
                  <input style={styles.input} name="address" value={form.address}
                    onChange={handleChange} disabled={!isAdmin}
                    placeholder="Rruga, Nr." />
                </Field>

                <Field label="Website">
                  <input style={styles.input} name="website" value={form.website}
                    onChange={handleChange} disabled={!isAdmin}
                    placeholder="https://kompania.com" />
                </Field>

                <Field label="Logo URL">
                  <input style={styles.input} name="logo_url" value={form.logo_url}
                    onChange={handleChange} disabled={!isAdmin}
                    placeholder="https://..." />
                </Field>

                {/* Preview logo */}
                {form.logo_url && (
                  <div style={styles.logoPreview}>
                    <img src={form.logo_url} alt="Logo"
                      style={{ maxHeight: '60px', maxWidth: '180px', objectFit: 'contain' }}
                      onError={e => e.target.style.display = 'none'} />
                  </div>
                )}
              </div>
            </div>

            {/* Messages */}
            {error   && <p style={styles.error}>{error}</p>}
            {success && <p style={styles.success}>{success}</p>}

            {/* Theme Section */}
            <div style={styles.section}>
              <p style={styles.sectionTitle}>🎨 Pamja e Aplikacionit</p>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '4px 0' }}>
                <div>
                  <p style={{ color: 'var(--text)', fontWeight: 500, margin: '0 0 4px' }}>
                    {dark ? '🌙 Dark Mode' : '☀️ Light Mode'}
                  </p>
                  <p style={{ color: 'var(--muted)', fontSize: '0.85rem', margin: 0 }}>
                    {dark ? 'Tema e errët është aktive' : 'Tema e ndritshme është aktive'}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.preventDefault(); toggle(); }}
                  style={{
                    padding: '10px 24px',
                    background: dark ? 'rgba(108,99,255,0.15)' : 'rgba(108,99,255,0.1)',
                    border: '1px solid #6c63ff',
                    borderRadius: '8px',
                    color: '#6c63ff',
                    cursor: 'pointer',
                    fontWeight: 600,
                    fontSize: '0.9rem',
                  }}
                  className="nav-btn"
                >
                  {dark ? '☀️ Kalo në Light' : '🌙 Kalo në Dark'}
                </button>
              </div>
            </div>

            {/* Password Section */}
            <div style={{ ...styles.section, marginTop: '16px' }}>
              <p style={styles.sectionTitle}>🔐 Ndrysho Fjalëkalimin</p>
              <form onSubmit={handlePasswordChange}>
                <Field label="Fjalëkalimi Aktual">
                  <input style={styles.input} type="password" value={pwForm.current}
                    onChange={e => setPwForm(f => ({ ...f, current: e.target.value }))} required />
                </Field>
                <Field label="Fjalëkalimi i Ri">
                  <input style={styles.input} type="password" value={pwForm.newpw}
                    onChange={e => setPwForm(f => ({ ...f, newpw: e.target.value }))}
                    placeholder="Min. 6 karaktere" required />
                </Field>
                <Field label="Konfirmo Fjalëkalimin e Ri">
                  <input style={styles.input} type="password" value={pwForm.confirm}
                    onChange={e => setPwForm(f => ({ ...f, confirm: e.target.value }))} required />
                </Field>
                {pwError && <p style={styles.error}>{pwError}</p>}
                {pwOk    && <p style={styles.success}>{pwOk}</p>}
                <button style={styles.saveBtn} type="submit" disabled={pwSaving}>
                  {pwSaving ? 'Duke ndryshuar...' : '🔐 Ndrysho Fjalëkalimin'}
                </button>
              </form>
            </div>

            {/* Buttons */}
            {isAdmin && (
              <div style={styles.actions}>
                <Link to="/dashboard" style={styles.cancelBtn}>Anulo</Link>
                <button style={styles.saveBtn} type="submit" disabled={saving}>
                  {saving ? 'Duke ruajtur...' : '💾 Ruaj Ndryshimet'}
                </button>
              </div>
            )}

            {!isAdmin && (
              <p style={styles.readonlyNote}>
                🔒 Vetëm Admin mund të ndryshojë cilësimet e biznesit.
              </p>
            )}
          </form>
        )}
        </div>
      </main>
    </div>
  )
}

function Field({ label, required, children }) {
  return (
    <div style={{ marginBottom: '14px' }}>
      <label style={{ display: 'block', color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '5px' }}>
        {label}{required && <span style={{ color: '#ff6b6b' }}> *</span>}
      </label>
      {children}
    </div>
  )
}

const styles = {
  page:         { minHeight: '100vh', background: 'var(--bg)', fontFamily: "'Segoe UI', system-ui, sans-serif", color: 'var(--text)' },
  header:       { display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px 32px', borderBottom: '1px solid var(--border)', flexWrap: 'wrap', gap: '12px' },
  backBtn:      { color: 'var(--muted)', textDecoration: 'none', fontSize: '0.88rem', padding: '6px 12px', border: '1px solid #2a2d3a', borderRadius: '8px' },
  title:        { fontSize: '1.3rem', fontWeight: 700, margin: 0 },
  subtitle:     { fontSize: '0.78rem', color: 'var(--muted)' },
  roleBadge:    { fontSize: '0.78rem', padding: '4px 12px', borderRadius: '20px', background: 'rgba(108,99,255,0.15)', color: '#6c63ff', border: '1px solid #6c63ff' },
  main:         { padding: '28px 32px', maxWidth: '1200px', margin: '0 auto', width: '100%' },
  status:       { color: 'var(--muted)', textAlign: 'center', padding: '60px 0' },
  grid:         { display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px', marginBottom: '20px' },
  section:      { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '20px 24px' },
  sectionTitle: { color: 'var(--text)', fontWeight: 600, fontSize: '0.95rem', margin: '0 0 20px', paddingBottom: '12px', borderBottom: '1px solid var(--border)' },
  input:        { width: '100%', padding: '9px 12px', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.9rem', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' },
  logoPreview:  { marginTop: '10px', padding: '12px', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' },
  error:        { color: '#ff6b6b', fontSize: '0.88rem', marginBottom: '16px', padding: '10px 16px', background: 'rgba(255,107,107,0.08)', borderRadius: '8px', border: '1px solid rgba(255,107,107,0.2)' },
  success:      { color: '#00d4aa', fontSize: '0.88rem', marginBottom: '16px', padding: '10px 16px', background: 'rgba(0,212,170,0.08)', borderRadius: '8px', border: '1px solid rgba(0,212,170,0.2)' },
  actions:      { display: 'flex', gap: '12px', justifyContent: 'flex-end' },
  cancelBtn:    { padding: '10px 24px', background: 'transparent', border: '1px solid #2a2d3a', borderRadius: '8px', color: 'var(--muted)', textDecoration: 'none', fontSize: '0.9rem' },
  saveBtn:      { padding: '10px 28px', background: '#6c63ff', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '0.95rem', fontWeight: 600, cursor: 'pointer' },
  readonlyNote: { color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', padding: '16px', background: 'rgba(123,127,150,0.08)', borderRadius: '8px', border: '1px solid #2a2d3a' },
}