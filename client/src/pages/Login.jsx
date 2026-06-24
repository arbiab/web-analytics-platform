import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

export default function Login() {
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)
  const navigate = useNavigate()

  async function handleLogin(e) {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const res = await axios.post('/api/login', { username, password })
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('user', JSON.stringify(res.data.user))
      navigate('/dashboard')
    } catch (err) {
      setError(err.response?.data?.error || 'Gabim gjatë hyrjes.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={styles.page}>
      <div style={styles.card}>
        <div style={styles.logo}>📊</div>
        <h1 style={styles.title}>Analytics Platform</h1>
        <p style={styles.subtitle}>Hyr në llogarinë tënde</p>

        <form onSubmit={handleLogin} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Përdoruesi</label>
            <input style={styles.input} type="text" value={username}
              onChange={e => setUsername(e.target.value)}
              placeholder="username" required />
          </div>
          <div style={styles.field}>
            <label style={styles.label}>Fjalëkalimi</label>
            <input style={styles.input} type="password" value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••" required />
          </div>

          {error && <p style={styles.error}>{error}</p>}

          <button style={styles.btn} type="submit" disabled={loading}>
            {loading ? 'Duke hyrë...' : 'Hyr'}
          </button>
        </form>

        <p style={styles.footer}>
          Nuk ke llogari?{' '}
          <Link to="/register" style={styles.link}>Regjistro biznesin</Link>
        </p>
      </div>
    </div>
  )
}

const styles = {
  page:     { minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: "'Segoe UI', system-ui, sans-serif" },
  card:     { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px', padding: '48px 40px', width: '100%', maxWidth: '400px', textAlign: 'center' },
  logo:     { fontSize: '2.5rem', marginBottom: '12px' },
  title:    { color: 'var(--text)', fontSize: '1.5rem', fontWeight: 700, margin: '0 0 6px' },
  subtitle: { color: 'var(--muted)', fontSize: '0.9rem', margin: '0 0 32px' },
  form:     { textAlign: 'left' },
  field:    { marginBottom: '18px' },
  label:    { display: 'block', color: 'var(--muted)', fontSize: '0.8rem', marginBottom: '6px', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input:    { width: '100%', padding: '10px 14px', background: 'var(--bg)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box' },
  error:    { color: '#ff6b6b', fontSize: '0.85rem', margin: '0 0 14px', textAlign: 'center' },
  btn:      { width: '100%', padding: '12px', background: '#6c63ff', border: 'none', borderRadius: '8px', color: '#fff', fontSize: '1rem', fontWeight: 600, cursor: 'pointer', marginTop: '4px' },
  footer:   { color: 'var(--muted)', fontSize: '0.85rem', marginTop: '24px' },
  link:     { color: '#6c63ff', textDecoration: 'none', fontWeight: 600 },
}