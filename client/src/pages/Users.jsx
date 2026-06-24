import { useEffect, useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import axios from 'axios'

function apiClient() {
  const token = localStorage.getItem('token')
  return axios.create({ headers: { Authorization: `Bearer ${token}` } })
}

export default function Users() {
  const navigate = useNavigate()
  const user     = JSON.parse(localStorage.getItem('user') || '{}')

  const [users,   setUsers]   = useState([])
  const [loading, setLoading] = useState(true)
  const [error,   setError]   = useState('')
  const [form,    setForm]    = useState({ username: '', password: '', role: 'BusinessUser' })
  const [formErr, setFormErr] = useState('')
  const [adding,  setAdding]  = useState(false)
  const [showForm, setShowForm] = useState(false)

  async function fetchUsers() {
    try {
      const res = await apiClient().get('/api/users')
      setUsers(res.data)
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

  useEffect(() => { fetchUsers() }, [])

  async function handleAdd(e) {
    e.preventDefault()
    setFormErr('')
    setAdding(true)
    try {
      await apiClient().post('/api/users', form)
      setForm({ username: '', password: '', role: 'BusinessUser' })
      setShowForm(false)
      fetchUsers()
    } catch (err) {
      setFormErr(err.response?.data?.error || 'Gabim gjatë shtimit.')
    } finally {
      setAdding(false)
    }
  }

  async function handleDelete(id, username) {
    if (!window.confirm(`Fshi "${username}"?`)) return
    try {
      await apiClient().delete(`/api/users/${id}`)
      fetchUsers()
    } catch (err) {
      alert(err.response?.data?.error || 'Gabim gjatë fshirjes.')
    }
  }

  return (
    <div style={styles.page}>
      {/* Header */}
      <header style={styles.header}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <Link to="/dashboard" style={styles.backBtn}>← Dashboard</Link>
          <div>
            <h1 style={styles.title}>Menaxhimi i Përdoruesve</h1>
            <span style={styles.subtitle}>Biznesi yt · {user.username}</span>
          </div>
        </div>
        <button style={styles.addBtn} onClick={() => setShowForm(s => !s)}>
          {showForm ? '✕ Anulo' : '+ Shto Punonjës'}
        </button>
      </header>

      <main style={styles.main}>

        {/* Forma për shtimin e punonjësit */}
        {showForm && (
          <div style={styles.formCard}>
            <p style={styles.formTitle}>Punonjës i Ri</p>
            <form onSubmit={handleAdd} style={styles.formRow}>
              <div style={styles.field}>
                <label style={styles.label}>Username</label>
                <input style={styles.input} value={form.username}
                  onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  placeholder="username" required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Fjalëkalimi</label>
                <input style={styles.input} type="password" value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  placeholder="min. 6 karaktere" required />
              </div>
              <div style={styles.field}>
                <label style={styles.label}>Roli</label>
                <select style={styles.input} value={form.role}
                  onChange={e => setForm(f => ({ ...f, role: e.target.value }))}>
                  <option value="BusinessUser">BusinessUser</option>
                  <option value="Admin">Admin</option>
                </select>
              </div>
              <button style={styles.submitBtn} type="submit" disabled={adding}>
                {adding ? 'Duke shtuar...' : 'Shto'}
              </button>
            </form>
            {formErr && <p style={styles.error}>{formErr}</p>}
          </div>
        )}

        {/* Lista e përdoruesve */}
        {loading && <p style={styles.status}>Duke ngarkuar...</p>}
        {error   && <p style={{ ...styles.status, color: '#ff6b6b' }}>{error}</p>}

        {!loading && !error && (
          <div style={styles.table}>
            <div style={styles.tableHeader}>
              <span>Username</span>
              <span>Roli</span>
              <span>Regjistruar</span>
              <span>Veprime</span>
            </div>
            {users.map(u => (
              <div key={u.user_id} style={styles.tableRow}>
                <span style={styles.username}>
                  {u.username}
                  {u.username === user.username && <span style={styles.youBadge}>Ti</span>}
                </span>
                <span>
                  <span style={styles.roleBadge(u.role === 'Admin')}>
                    {u.role === 'Admin' ? '👑 Admin' : '👤 User'}
                  </span>
                </span>
                <span style={styles.date}>
                  {new Date(u.created_at).toLocaleDateString('sq-AL')}
                </span>
                <span>
                  {u.username !== user.username && (
                    <button style={styles.deleteBtn} onClick={() => handleDelete(u.user_id, u.username)}>
                      Fshi
                    </button>
                  )}
                </span>
              </div>
            ))}
            {users.length === 0 && (
              <p style={styles.empty}>Nuk ka punonjës të tjerë.</p>
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
  main:        { padding: '28px 32px' },
  formCard:    { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px', marginBottom: '24px' },
  formTitle:   { color: '#6c63ff', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.08em', margin: '0 0 16px', fontWeight: 600 },
  formRow:     { display: 'flex', gap: '12px', flexWrap: 'wrap', alignItems: 'flex-end' },
  field:       { display: 'flex', flexDirection: 'column', gap: '5px', flex: 1, minWidth: '160px' },
  label:       { color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' },
  input:       { padding: '9px 12px', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.9rem', outline: 'none' },
  submitBtn:   { padding: '9px 24px', background: '#6c63ff', border: 'none', borderRadius: '8px', color: '#fff', fontWeight: 600, cursor: 'pointer', fontSize: '0.9rem', alignSelf: 'flex-end' },
  error:       { color: '#ff6b6b', fontSize: '0.85rem', marginTop: '10px' },
  status:      { color: 'var(--muted)', textAlign: 'center', padding: '40px 0' },
  table:       { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden' },
  tableHeader: { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 120px', padding: '12px 20px', background: '#0f1117', color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.08em' },
  tableRow:    { display: 'grid', gridTemplateColumns: '1fr 1fr 1fr 120px', padding: '14px 20px', borderTop: '1px solid var(--border)', alignItems: 'center' },
  username:    { fontWeight: 500, display: 'flex', alignItems: 'center', gap: '8px' },
  youBadge:    { fontSize: '0.7rem', background: 'rgba(108,99,255,0.15)', color: '#6c63ff', padding: '2px 8px', borderRadius: '10px' },
  roleBadge:   (isAdmin) => ({ fontSize: '0.8rem', padding: '3px 10px', borderRadius: '12px', background: isAdmin ? 'rgba(108,99,255,0.15)' : 'rgba(0,212,170,0.12)', color: isAdmin ? '#6c63ff' : '#00d4aa' }),
  date:        { color: 'var(--muted)', fontSize: '0.85rem' },
  deleteBtn:   { padding: '5px 14px', background: 'transparent', border: '1px solid #ff6b6b', borderRadius: '6px', color: '#ff6b6b', cursor: 'pointer', fontSize: '0.82rem' },
  empty:       { color: 'var(--muted)', textAlign: 'center', padding: '32px' },
}