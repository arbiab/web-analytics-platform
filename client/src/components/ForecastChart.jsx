import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts'

export default function ForecastChart({ data }) {
  // Grupo sipas kpi_name
  const kpis   = [...new Set(data.map(r => r.kpi_name))]
  const dates  = [...new Set(data.map(r => r.forecast_date))].sort()

  const chartData = dates.map(date => {
    const row = { date: new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' }) }
    kpis.forEach(kpi => {
      const match = data.find(r => r.forecast_date === date && r.kpi_name === kpi)
      row[kpi] = match ? parseFloat(match.forecast_value) : null
    })
    return row
  })

  const COLORS = ['#f59e0b', '#ec4899', '#6c63ff', '#00d4aa']

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
        <XAxis dataKey="date" tick={{ fill: '#7b7f96', fontSize: 11 }} />
        <YAxis tick={{ fill: '#7b7f96', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 8 }}
          labelStyle={{ color: '#e8eaf0' }}
        />
        <Legend wrapperStyle={{ color: '#7b7f96', fontSize: 12 }} />
        {kpis.map((kpi, i) => (
          <Line key={kpi} type="monotone" dataKey={kpi} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 4 }} />
        ))}
      </LineChart>
    </ResponsiveContainer>
  )
}
