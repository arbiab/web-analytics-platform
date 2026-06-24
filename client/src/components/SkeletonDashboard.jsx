export default function SkeletonDashboard() {
  return (
    <div style={styles.wrapper} className="fade-in-fast">
      {/* KPI Row skeletons */}
      <div style={styles.kpiRow} className="fade-in-children">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="skeleton-card" style={styles.kpiCard}>
            <div className="skeleton skeleton-line" style={{ width: '50%' }} />
            <div className="skeleton skeleton-kpi" />
          </div>
        ))}
      </div>

      {/* Chart skeletons */}
      <div style={styles.grid} className="fade-in-children">
        <div className="skeleton-card">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-chart" />
        </div>
        <div className="skeleton-card">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-chart" />
        </div>
        <div className="skeleton-card" style={{ gridColumn: '1 / -1' }}>
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-chart" style={{ height: '200px' }} />
        </div>
      </div>
    </div>
  )
}

const styles = {
  wrapper: { padding: '24px 32px' },
  kpiRow:  { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginBottom: '24px' },
  kpiCard: { minHeight: '100px' },
  grid:    { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '24px' },
}