import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

function fmtMonth(raw) {
  return new Date(raw).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })
}

export default function RevenueChart({ data }) {
  const chartData = data.map(row => ({
    name:    `${row.business_name} ${fmtMonth(row.month)}`,
    revenue: parseFloat(row.total_revenue),
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <LineChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
        <XAxis dataKey="name" tick={{ fill: '#7b7f96', fontSize: 11 }} />
        <YAxis tick={{ fill: '#7b7f96', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 8 }}
          labelStyle={{ color: '#e8eaf0' }}
          formatter={v => [`$${v.toLocaleString()}`, 'Revenue']}
        />
        <Line type="monotone" dataKey="revenue" stroke="#6c63ff" strokeWidth={2} dot={{ r: 4 }} />
      </LineChart>
    </ResponsiveContainer>
  )
}
