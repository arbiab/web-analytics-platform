import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

export default function Register() {
  const [form, setForm] = useState({
    business_name: '', industry: '', username: '', password: '', confirm: ''
  })
  const [error,   setError]   = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    if (form.password !== form.confirm) {
      return setError('Fjalëkalimet nuk përputhen.')
    }
    setLoading(true)
    try {
      const res = await axios.post('/api/register', {
        business_name: form.business_name,
        industry:      form.industry,
        username:      form.username,
        password:      form.password,
      })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Gabim gjatë regjistrimit.')
    } finally {
      setLoading(false)
    }
  }

  const industries = ['Software', 'Retail', 'Finance', 'Healthcare', 'Education', 'Manufacturing', 'Other']

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>🏢</div>
        <h1 style={styles.title}>Regjistro Biznesin</h1>
        <p style={styles.subtitle}>Krijo llogarinë e biznesit tënd</p>

        <form onSubmit={handleSubmit} style={styles.form}>

          <p style={styles.sectionLabel}>Informacioni i Biznesit</p>

          <div style={styles.field}>
            <label style={styles.label}>Emri i Biznesit *</label>
            <input style={styles.input} name="business_name"
              value={form.business_name} onChange={handleChange}
              placeholder="p.sh. TechCorp Albania" required />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Industria</label>
            <select style={styles.input} name="industry"
              value={form.industry} onChange={handleChange}>
              <option value="">Zgjidh industrinë...</option>
              {industries.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>

          <p style={{ ...styles.sectionLabel, marginTop: '20px' }}>Llogaria e Adminit</p>

          <div style={styles.field}>
            <label style={styles.label}>Username *</label>
            <input style={styles.input} name="username"
              value={form.username} onChange={handleChange}
              placeholder="p.sh. admin_arb" required />
          </div>

          <div style={styles.row}>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Fjalëkalimi *</label>
              <input style={styles.input} type="password" name="password"
                value={form.password} onChange={handleChange}
                placeholder="Min. 6 karaktere" required />
            </div>
            <div style={{ ...styles.field, flex: 1 }}>
              <label style={styles.label}>Konfirmo *</label>
              <input style={styles.input} type="password" name="confirm"
                value={form.confirm} onChange={handleChange}
                placeholder="Përsërit fjalëkalimin" required />
            </div>
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Duke regjistruar...' : 'Regjistro Biznesin'}
          </button>
        </form>

        <p style={styles.footer}>
          Ke llogari?{' '}
          <Link to="/login" style={styles.link}>Hyr këtu</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page:         { minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '24px', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  card:         { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '40px', width: '100%', maxWidth: '500px' },
  logo:         { fontSize: '2.5rem', textAlign: 'center', marginBottom: '12px' },
  title:        { color: 'var(--text)', fontSize: '1.4rem', fontWeight: 700, margin: '0 0 6px', textAlign: 'center' },
  subtitle:     { color: 'var(--muted)', fontSize: '0.88rem', margin: '0 0 28px', textAlign: 'center' },
  sectionLabel: { color: '#6c63ff', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '0 0 14px', fontWeight: 600 },
  form:         {},
  field:        { marginBottom: '14px' },
  row:          { display: 'flex', gap: '12px' },
  label:        { display: 'block', color: 'var(--muted)', fontSize: '0.78rem', marginBottom: '5px', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input:        { width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.92rem', outline: 'none', boxSizing: 'border-box' },
  error:        { color: '#ff6b6b', fontSize: '0.85rem', margin: '0 0 12px', textAlign: 'center' },
  btn:          { width: '100%', padding: '12px', background: '#6c63ff', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginTop: '8px' },
  footer:       { color: 'var(--muted)', fontSize: '0.85rem', textAlign: 'center', marginTop: '20px' },
  link:         { color: '#6c63ff', textDecoration: 'none', fontWeight: 600 },
}