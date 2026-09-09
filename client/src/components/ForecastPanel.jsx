import { useState } from 'react'
import Notification from './Notification'
import axios from 'axios'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

function apiClient() {
  const token = localStorage.getItem('token')
  return axios.create({ headers: { Authorization: `Bearer ${token}` } })
}

export default function ForecastPanel({ onForecastDone }) {
  const [model,    setModel]    = useState('prophet')
  const [periods,  setPeriods]  = useState(6)
  const [loading,  setLoading]  = useState(false)
  const [notif,    setNotif]    = useState(null)
  const [result,   setResult]   = useState(null)
  const [error,    setError]    = useState('')

  async function handleForecast() {
    setLoading(true); setError(''); setResult(null)
    try {
      const res = await apiClient().post(`/api/ml/${model}`, { periods })
      setResult(res.data)
      if (onForecastDone) onForecastDone()
    } catch (err) {
      setError(err.response?.data?.error || 'Gabim gjatë parashikimit.')
    } finally {
      setLoading(false)
    }
  }

  const chartData = result?.forecasts?.map(f => ({
    date:  f.ds,
    value: Math.round(f.yhat),
    lower: f.yhat_lower ? Math.round(f.yhat_lower) : undefined,
    upper: f.yhat_upper ? Math.round(f.yhat_upper) : undefined,
  }))

  return (
    <>
    {notif && <Notification message={notif.message} type={notif.type} onClose={() => setNotif(null)} />}
    <div style={styles.panel}>
      <p style={styles.title}>🤖 Parashiko me ML</p>

      {/* Kontrollet */}
      <div style={styles.controls}>
        <div style={styles.field}>
          <label style={styles.label}>Modeli</label>
          <div style={styles.modelBtns}>
            <button style={styles.modelBtn(model === 'prophet')} onClick={() => setModel('prophet')}>
              Prophet
            </button>
            <button style={styles.modelBtn(model === 'lstm')} onClick={() => setModel('lstm')}>
              LSTM
            </button>
          </div>
        </div>

        <div style={styles.field}>
          <label style={styles.label}>Muajt e parashikimit</label>
          <select style={styles.select} value={periods} onChange={e => setPeriods(parseInt(e.target.value))}>
            <option value={3}>3 muaj</option>
            <option value={6}>6 muaj</option>
            <option value={12}>12 muaj</option>
          </select>
        </div>

        <button style={styles.forecastBtn} onClick={handleForecast} disabled={loading}>
          {loading ? '⏳ Duke parashikuar...' : '🔮 Parashiko'}
        </button>
      </div>

      {error && <p style={styles.error}>{error}</p>}

      {/* Rezultatet */}
      {result && (
        <div style={styles.results}>
                    <p style={styles.successMsg}>
            ✅ {result.model} — {result.forecasts.length} muaj parashikime u ruajtën!
          </p>

          {/* Metrakat e Modelit */}
          {result.metrics && (
            <div style={styles.metricsBox}>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>MAE</span>
                <span style={styles.metricValue}>${Math.round(result.metrics.MAE).toLocaleString()}</span>
              </div>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>RMSE</span>
                <span style={styles.metricValue}>${Math.round(result.metrics.RMSE).toLocaleString()}</span>
              </div>
              <div style={styles.metricItem}>
                <span style={styles.metricLabel}>MAPE</span>
                <span style={styles.metricValue}>{result.metrics.MAPE.toFixed(2)}%</span>
              </div>
            </div>
          )}

        

          <ResponsiveContainer width="100%" height={220}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
              <XAxis dataKey="date" tick={{ fill: '#7b7f96', fontSize: 11 }} />
              <YAxis tick={{ fill: '#7b7f96', fontSize: 11 }} />
              <Tooltip
                contentStyle={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 8 }}
                formatter={v => [`$${v?.toLocaleString()}`, '']}
              />
              <Legend wrapperStyle={{ color: 'var(--muted)', fontSize: 12 }} />
              <Line type="monotone" dataKey="value" name="Parashikim" stroke="#f59e0b" strokeWidth={2} dot={{ r: 4 }} />
              {chartData[0]?.lower !== undefined && (
                <Line type="monotone" dataKey="lower" name="Min" stroke="#7b7f96" strokeWidth={1} strokeDasharray="3 3" dot={false} />
              )}
              {chartData[0]?.upper !== undefined && (
                <Line type="monotone" dataKey="upper" name="Max" stroke="#7b7f96" strokeWidth={1} strokeDasharray="3 3" dot={false} />
              )}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
    </>
  )
}

const styles = {
  panel:      { background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '12px', padding: '24px' },
  title:      { fontWeight: 600, fontSize: '1rem', margin: '0 0 20px' },
  controls:   { display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap', marginBottom: '16px' },
  field:      { display: 'flex', flexDirection: 'column', gap: '6px' },
  label:      { color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.06em' },
  modelBtns:  { display: 'flex', gap: '8px' },
  modelBtn:   (active) => ({
    padding: '8px 18px', borderRadius: '8px', cursor: 'pointer', fontSize: '0.88rem', fontWeight: active ? 600 : 400,
    background: active ? '#6c63ff' : 'transparent',
    border: `1px solid ${active ? '#6c63ff' : '#2a2d3a'}`,
    color: active ? '#fff' : '#7b7f96',
  }),
  select:     { padding: '8px 12px', background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '8px', color: 'var(--text)', fontSize: '0.9rem', outline: 'none' },
  forecastBtn:{ padding: '9px 24px', background: '#f59e0b', border: 'none', borderRadius: '8px', color: '#000', fontWeight: 700, cursor: 'pointer', fontSize: '0.95rem' },
  error:      { color: '#ff6b6b', fontSize: '0.85rem', padding: '8px 12px', background: 'rgba(255,107,107,0.08)', borderRadius: '6px' },
  results:    { marginTop: '16px' },
  successMsg: { color: '#00d4aa', fontSize: '0.88rem', margin: '0 0 16px' },
    metricsBox:  { display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', marginBottom: '16px' },
  metricItem: { background: 'var(--input)', border: '1px solid var(--border)', borderRadius: '8px', padding: '12px', textAlign: 'center' },
  metricLabel:{ display: 'block', color: 'var(--muted)', fontSize: '0.75rem', textTransform: 'uppercase', marginBottom: '4px' },
  metricValue:{ display: 'block', color: '#00d4aa', fontSize: '1.1rem', fontWeight: 700 },
}