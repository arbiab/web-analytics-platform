import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

export default function InventoryChart({ data }) {
  const chartData = data.map(row => ({
    name:  `${row.business_name} - ${row.product_name}`,
    ratio: parseFloat(row.turnover_ratio),
  }))

  return (
    <ResponsiveContainer width="100%" height={240}>
      <BarChart data={chartData}>
        <CartesianGrid strokeDasharray="3 3" stroke="#2a2d3a" />
        <XAxis dataKey="name" tick={{ fill: '#7b7f96', fontSize: 11 }} />
        <YAxis tick={{ fill: '#7b7f96', fontSize: 11 }} />
        <Tooltip
          contentStyle={{ background: '#1a1d27', border: '1px solid #2a2d3a', borderRadius: 8 }}
          labelStyle={{ color: '#e8eaf0' }}
          formatter={v => [`${v.toFixed(2)}×`, 'Turnover']}
        />
        <Bar dataKey="ratio" fill="#00d4aa" radius={[4, 4, 0, 0]} />
      </BarChart>
    </ResponsiveContainer>
  )
}
